/**
 * Seed script — inserts test data covering ALL backend business-logic scenarios.
 *
 * Usage:
 *   node scripts/seed-patients.js          # seed everything
 *   node scripts/seed-patients.js --clean  # remove only seeded test data
 *
 * Admin credentials:
 *   username: admin   password: Admin@123
 *
 * Scenarios covered:
 *  - Admin user + default settings (clinic, backup, notification, ui)
 *  - Regular adults (male / female)
 *  - Guardians (adults with children linked)
 *  - Children (minors linked to guardians)
 *  - Age boundary: exactly 17, exactly 18, exactly 19
 *  - All relation types: father, mother, guardian, single-father, single-mother
 *  - Auto direction detection: adult→child, child→adult
 *  - Self-link / duplicate / child-to-child / guardian minor rejection
 *  - patientType auto-update on relationship create
 *  - patientType auto-revert on relationship delete
 *  - Age transition (child → regular at 18)
 *  - Pagination (50+ patients to trigger multiple pages)
 *  - Eye examinations: all statuses (pending, completed, cancelled), full fields, follow-up
 *  - Appointments: all statuses (upcoming, confirmed, completed, cancelled, no-show, rescheduled), all types, patient-linked & quick, conflict detection, calendar, confirm flow, linked examination/invoice
 *  - Invoices: all statuses, with items, tax/discount, paid protection, patient & walk-in customer
 *  - Folders: nested hierarchy (root → sub → sub-sub)
 *  - Files: in folders and root, various types (images, PDF, docx)
 *  - Notifications: all types (appointment_reminder, overdue_invoice, follow_up_due, disk, backup, welcome, age_transition), read & unread
 *  - Audit logs: all actions (CREATE, UPDATE, DELETE, LOGIN, LOGOUT)
 *  - Backups: manual, auto, restore (success & failed)
 *  - Duplicate email prevention
 *  - Patient delete with unpaid invoice protection
 */

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const {
  sequelize, Patient, PatientRelationship, Notification, User, Settings,
  Appointment, EyeExamination, Invoice, InvoiceItem, Folder, File,
  AuditLog, Backup,
} = require("../src/models");
const PatientService = require("../src/services/PatientService");
const PatientRelationshipService = require("../src/services/PatientRelationshipService");
const AppointmentService = require("../src/services/AppointmentService");
const EyeExaminationService = require("../src/services/EyeExaminationService");
const InvoiceService = require("../src/services/InvoiceService");
const SetupService = require("../src/services/SetupService");
const { generateDisplayId, generateInvoiceDisplayId } = require("../src/utils/displayId");
const { Op, DataTypes } = require("sequelize");

const TAG = "[SEED]";
const TEST_TAG = "__SEED_TEST__";

function logOk(msg) { console.log(`\x1b[32m  ✓ ${msg}\x1b[0m`); }
function logErr(msg) { console.log(`\x1b[31m  ✗ ${msg}\x1b[0m`); }
function logInfo(msg) { console.log(`\x1b[36m  ℹ ${msg}\x1b[0m`); }
function logSection(title) { console.log(`\n\x1b[1m\x1b[35m── ${title} ──\x1b[0m`); }

function yearsAgoDate(years) {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  return d.toISOString().split("T")[0];
}

function daysAgoDate(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

function workingDate(daysFromNow) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  // DB working hours setting: days [0,1,2,3,4] = Sun–Thu; skip Fri(5) and Sat(6)
  while (d.getDay() === 5 || d.getDay() === 6) {
    d.setDate(d.getDate() + 1);
  }
  return d.toISOString().split("T")[0];
}

const RELATION_TYPES = ["father", "mother", "guardian", "single-father", "single-mother"];

async function createPatient(data) {
  const displayId = await generateDisplayId(Patient, "P");
  const patient = await Patient.create({
    ...data,
    displayId,
    notes: (data.notes || "") + " " + TEST_TAG,
  });
  return patient;
}

async function cleanSeedData() {
  logSection("Cleaning previous seed data");

  // Delete seeded admin user
  const admin = await User.findOne({ where: { username: "admin" }, paranoid: false });
  if (admin) {
    await User.destroy({ where: { username: "admin" }, force: true });
    logInfo("Deleted seeded admin user.");
  }

  // Find seeded patient IDs — use broad patterns to catch markdown-escaped variants
  const seedPatients = await Patient.findAll({
    where: {
      [Op.or]: [
        { notes: { [Op.like]: `%${TEST_TAG}%` } },
        { notes: { [Op.like]: `%SEED%TEST%` } },
        { email: { [Op.like]: `%@seed.test` } },
        { fullName: { [Op.like]: "Test%" } },
      ],
    },
    attributes: ["id"],
    paranoid: false,
  });
  const seedIds = seedPatients.map((p) => p.id);

  if (seedIds.length > 0) {
    // Delete files for seeded patients
    const delFiles = await File.destroy({ where: { patientId: seedIds }, force: true });
    if (delFiles) logInfo(`Deleted ${delFiles} files.`);

    // Delete folders for seeded patients
    const delFolders = await Folder.destroy({ where: { patientId: seedIds }, force: true });
    if (delFolders) logInfo(`Deleted ${delFolders} folders.`);

    // Delete invoice items for seeded invoices
    const seedInvoices = await Invoice.findAll({ where: { patientId: seedIds }, attributes: ["id"], paranoid: false });
    const seedInvoiceIds = seedInvoices.map((i) => i.id);
    if (seedInvoiceIds.length > 0) {
      await InvoiceItem.destroy({ where: { invoiceId: seedInvoiceIds } });
      logInfo(`Deleted invoice items for ${seedInvoiceIds.length} invoices.`);
    }

    // Also delete walk-in invoices (no patientId) by customerName prefix
    const walkInInvoices = await Invoice.findAll({ where: { patientId: null, customerName: { [Op.like]: "%SEED%" } }, attributes: ["id"], paranoid: false });
    const walkInInvoiceIds = walkInInvoices.map((i) => i.id);
    if (walkInInvoiceIds.length > 0) {
      await InvoiceItem.destroy({ where: { invoiceId: walkInInvoiceIds } });
    }

    // Delete all seeded invoices (patient + walk-in)
    const delInvoices = await Invoice.destroy({ where: { [Op.or]: [{ patientId: seedIds }, { customerName: { [Op.like]: "%SEED%" } }] }, force: true });
    if (delInvoices) logInfo(`Deleted ${delInvoices} invoices.`);

    // Null out linked examination/invoice on appointments before deleting exams/invoices
    await Appointment.update({ examinationId: null, invoiceId: null }, { where: { [Op.or]: [{ patientId: seedIds }, { quickName: { [Op.like]: "%SEED%" } }, { notes: { [Op.like]: `%${TEST_TAG}%` } }] } });

    // Delete ALL seeded appointments (including orphaned from previous runs)
    const delAppts = await Appointment.destroy({ where: { [Op.or]: [{ patientId: seedIds }, { quickName: { [Op.like]: "%SEED%" } }, { notes: { [Op.like]: `%${TEST_TAG}%` } }] }, force: true });
    if (delAppts) logInfo(`Deleted ${delAppts} appointments.`);

    // Delete eye examinations for seeded patients
    const delExams = await EyeExamination.destroy({ where: { patientId: seedIds }, force: true });
    if (delExams) logInfo(`Deleted ${delExams} eye examinations.`);

    // Delete relationships
    const delRels = await PatientRelationship.destroy({
      where: { [Op.or]: [{ guardianId: seedIds }, { childId: seedIds }] },
      force: true,
    });
    if (delRels) logInfo(`Deleted ${delRels} relationships.`);

    // Delete notifications for seeded patients
    await Notification.destroy({ where: { entityId: seedIds, entityType: "Patient" }, force: true });

    // Delete patients (hard delete)
    const delPats = await Patient.destroy({ where: { id: seedIds }, force: true });
    logInfo(`Deleted ${delPats} patients.`);
  } else {
    logInfo("No previous seed patients found.");
  }

  // Delete all remaining seeded notifications (system-level: disk, backup, welcome)
  const delNotifs = await Notification.destroy({ where: { message: { [Op.like]: `%${TEST_TAG}%` } }, force: true });
  if (delNotifs) logInfo(`Deleted ${delNotifs} system notifications.`);

  // Delete seeded audit logs
  const delAudits = await AuditLog.destroy({ where: { changes: { [Op.like]: `%${TEST_TAG}%` } }, force: true });
  if (delAudits) logInfo(`Deleted ${delAudits} audit logs.`);

  // Delete seeded backups
  const delBackups = await Backup.destroy({ where: { filename: { [Op.like]: "SEED_%" } } });
  if (delBackups) logInfo(`Deleted ${delBackups} backup records.`);

  // Delete seeded settings
  const seedSettings = await Settings.findAll({ where: { key: { [Op.like]: "seed.%" } } });
  if (seedSettings.length > 0) {
    await Settings.destroy({ where: { key: { [Op.like]: "seed.%" } } });
    logInfo(`Deleted ${seedSettings.length} seeded settings.`);
  }
}

async function seedAdmin() {
  logSection("0. Admin user + default settings");

  const setupService = new SetupService();

  // Check if admin already exists
  const check = await setupService.checkAdminExists();
  if (check.adminExists) {
    logInfo("Admin user already exists — skipping.");
    return;
  }

  try {
    const admin = await setupService.createAdmin({
      username: "admin",
      password: "Admin@123",
      clinicName: "Test Eye Clinic",
      currency: "USD",
      language: "ar",
    });
    logOk(`Admin created: username=${admin.username}, role=${admin.role}`);
    logOk(`Credentials: admin / Admin@123`);
  } catch (err) {
    logErr(`Admin creation failed: ${err.message}`);
  }
}

async function seedRegularPatients() {
  logSection("1. Regular adult patients (male & female)");

  const patients = [];

  // Male adults — various ages
  for (let i = 0; i < 10; i++) {
    const age = 25 + i * 3;
    const p = await createPatient({
      fullName: `Test Male ${age} #${i + 1}`,
      birthDate: yearsAgoDate(age),
      gender: "male",
      phoneNumber: `5550001${String(i).padStart(2, "0")}`,
      email: `testmale${i + 1}@seed.test`,
      address: `Test Street ${i + 1}`,
      patientType: "regular",
    });
    patients.push(p);
    logOk(`Created: ${p.fullName} (${p.displayId}), age=${p.age}, type=${p.patientType}`);
  }

  // Female adults — various ages
  for (let i = 0; i < 10; i++) {
    const age = 22 + i * 4;
    const p = await createPatient({
      fullName: `Test Female ${age} #${i + 1}`,
      birthDate: yearsAgoDate(age),
      gender: "female",
      phoneNumber: `5550002${String(i).padStart(2, "0")}`,
      email: `testfemale${i + 1}@seed.test`,
      address: `Test Avenue ${i + 1}`,
      patientType: "regular",
    });
    patients.push(p);
    logOk(`Created: ${p.fullName} (${p.displayId}), age=${p.age}, type=${p.patientType}`);
  }

  return patients;
}

async function seedAgeBoundaryPatients() {
  logSection("2. Age boundary patients (17, 18, 19 years)");

  const boundary = [];

  // Exactly 17 (child)
  const p17 = await createPatient({
    fullName: "Test Boundary Age17",
    birthDate: yearsAgoDate(17),
    gender: "male",
    phoneNumber: "55500100",
    patientType: "regular",
  });
  boundary.push(p17);
  logOk(`Created: ${p17.fullName} (${p17.displayId}), age=${p17.age} → should be treated as child`);

  // Exactly 18 (adult boundary)
  const p18 = await createPatient({
    fullName: "Test Boundary Age18",
    birthDate: yearsAgoDate(18),
    gender: "female",
    phoneNumber: "55500101",
    patientType: "regular",
  });
  boundary.push(p18);
  logOk(`Created: ${p18.fullName} (${p18.displayId}), age=${p18.age} → should be treated as adult`);

  // Exactly 19 (adult)
  const p19 = await createPatient({
    fullName: "Test Boundary Age19",
    birthDate: yearsAgoDate(19),
    gender: "male",
    phoneNumber: "55500102",
    patientType: "regular",
  });
  boundary.push(p19);
  logOk(`Created: ${p19.fullName} (${p19.displayId}), age=${p19.age} → should be treated as adult`);

  // Born yesterday (infant)
  const infant = await createPatient({
    fullName: "Test Newborn Infant",
    birthDate: daysAgoDate(1),
    gender: "female",
    phoneNumber: "55500103",
    patientType: "regular",
  });
  boundary.push(infant);
  logOk(`Created: ${infant.fullName} (${infant.displayId}), age=${infant.age} → infant`);

  return boundary;
}

async function seedFamilyRelationships() {
  logSection("3. Family relationships — all relation types & auto direction detection");

  const relationshipService = new PatientRelationshipService();

  // Create guardian + child pairs for each relation type
  const results = [];

  for (const relType of RELATION_TYPES) {
    // Guardian (adult, 35)
    const guardian = await createPatient({
      fullName: `Test Guardian (${relType})`,
      birthDate: yearsAgoDate(35),
      gender: relType.includes("mother") || relType === "single-mother" ? "female" : "male",
      phoneNumber: `555002${String(RELATION_TYPES.indexOf(relType)).padStart(2, "0")}`,
      patientType: "regular",
    });

    // Child (10 years old)
    const child = await createPatient({
      fullName: `Test Child of (${relType})`,
      birthDate: yearsAgoDate(10),
      gender: "male",
      phoneNumber: `555003${String(RELATION_TYPES.indexOf(relType)).padStart(2, "0")}`,
      patientType: "regular",
    });

    // Create relationship: guardian → child (adult links child)
    try {
      const rel = await relationshipService.create(guardian.id, {
        relatedPatientId: child.id,
        relationType: relType,
      });
      logOk(`Relation "${relType}": ${guardian.fullName} → ${child.fullName} (guardianId=${rel.guardianId}, childId=${rel.childId})`);

      // Verify auto patientType update
      const updatedGuardian = await Patient.findByPk(guardian.id);
      const updatedChild = await Patient.findByPk(child.id);
      if (updatedGuardian.patientType === "guardian" && updatedChild.patientType === "child") {
        logOk(`  Auto-type: guardian=${updatedGuardian.patientType}, child=${updatedChild.patientType} ✓`);
      } else {
        logErr(`  Auto-type: guardian=${updatedGuardian.patientType}, child=${updatedChild.patientType} ✗`);
      }
      results.push({ rel, guardian, child });
    } catch (err) {
      logErr(`Relation "${relType}" failed: ${err.message}`);
    }
  }

  return results;
}

async function seedAutoDirectionDetection() {
  logSection("4. Auto direction detection (child links adult → should flip)");

  const relationshipService = new PatientRelationshipService();

  // Child (15) tries to link adult (40) — should auto-detect: adult=guardian, child=child
  const child = await createPatient({
    fullName: "Test Child Linking Adult",
    birthDate: yearsAgoDate(15),
    gender: "female",
    phoneNumber: "55500400",
    patientType: "regular",
  });

  const adult = await createPatient({
    fullName: "Test Adult Linked By Child",
    birthDate: yearsAgoDate(40),
    gender: "male",
    phoneNumber: "55500401",
    patientType: "regular",
  });

  try {
    const rel = await relationshipService.create(child.id, {
      relatedPatientId: adult.id,
      relationType: "father",
    });
    logOk(`Child linked adult: guardianId=${rel.guardianId} (should be adult=${adult.id}), childId=${rel.childId} (should be child=${child.id})`);

    if (rel.guardianId === adult.id && rel.childId === child.id) {
      logOk("  Direction auto-flipped correctly ✓");
    } else {
      logErr("  Direction NOT flipped ✗");
    }
  } catch (err) {
    logErr(`Auto direction test failed: ${err.message}`);
  }
}

async function seedEdgeCases() {
  logSection("5. Edge cases — rejection scenarios");

  const relationshipService = new PatientRelationshipService();

  // 5a. Self-link
  const p = await createPatient({
    fullName: "Test Self Link Patient",
    birthDate: yearsAgoDate(30),
    gender: "male",
    phoneNumber: "55500500",
    patientType: "regular",
  });

  try {
    await relationshipService.create(p.id, { relatedPatientId: p.id, relationType: "father" });
    logErr("Self-link should have been rejected ✗");
  } catch (err) {
    logOk(`Self-link rejected: ${err.code || err.message} ✓`);
  }

  // 5b. Duplicate relationship
  const adult1 = await createPatient({
    fullName: "Test Dup Adult",
    birthDate: yearsAgoDate(40),
    gender: "male",
    phoneNumber: "55500501",
    patientType: "regular",
  });
  const child1 = await createPatient({
    fullName: "Test Dup Child",
    birthDate: yearsAgoDate(12),
    gender: "female",
    phoneNumber: "55500502",
    patientType: "regular",
  });

  await relationshipService.create(adult1.id, { relatedPatientId: child1.id, relationType: "father" });
  logOk("First relationship created ✓");

  try {
    await relationshipService.create(adult1.id, { relatedPatientId: child1.id, relationType: "mother" });
    logErr("Duplicate relationship should have been rejected ✗");
  } catch (err) {
    logOk(`Duplicate rejected: ${err.code || err.message} ✓`);
  }

  // 5c. Child-to-child
  const childA = await createPatient({
    fullName: "Test Child A",
    birthDate: yearsAgoDate(10),
    gender: "male",
    phoneNumber: "55500503",
    patientType: "regular",
  });
  const childB = await createPatient({
    fullName: "Test Child B",
    birthDate: yearsAgoDate(8),
    gender: "female",
    phoneNumber: "55500504",
    patientType: "regular",
  });

  try {
    await relationshipService.create(childA.id, { relatedPatientId: childB.id, relationType: "guardian" });
    logErr("Child-to-child should have been rejected ✗");
  } catch (err) {
    logOk(`Child-to-child rejected: ${err.code || err.message} ✓`);
  }

  // 5d. Guardian minor (two adults where "guardian" ends up < 18 — shouldn't happen with auto-detect, but test the guard)
  // This is implicitly tested — if both are adults, direction is current→related, and guardian age check passes
  const adultA = await createPatient({
    fullName: "Test Two Adults A",
    birthDate: yearsAgoDate(25),
    gender: "male",
    phoneNumber: "55500505",
    patientType: "regular",
  });
  const adultB = await createPatient({
    fullName: "Test Two Adults B",
    birthDate: yearsAgoDate(28),
    gender: "female",
    phoneNumber: "55500506",
    patientType: "regular",
  });

  try {
    const rel = await relationshipService.create(adultA.id, { relatedPatientId: adultB.id, relationType: "guardian" });
    logOk(`Two adults linked: guardianId=${rel.guardianId}, childId=${rel.childId} (both adults, no flip needed) ✓`);
  } catch (err) {
    logErr(`Two adults link failed unexpectedly: ${err.message} ✗`);
  }
}

async function seedRelationshipDeleteAndRevert() {
  logSection("6. Relationship delete → patientType auto-revert");

  const relationshipService = new PatientRelationshipService();

  const guardian = await createPatient({
    fullName: "Test Revert Guardian",
    birthDate: yearsAgoDate(40),
    gender: "male",
    phoneNumber: "55500600",
    patientType: "regular",
  });
  const child = await createPatient({
    fullName: "Test Revert Child",
    birthDate: yearsAgoDate(14),
    gender: "female",
    phoneNumber: "55500601",
    patientType: "regular",
  });

  const rel = await relationshipService.create(guardian.id, { relatedPatientId: child.id, relationType: "father" });
  logOk(`Created: guardian=${guardian.fullName} (type=guardian), child=${child.fullName} (type=child)`);

  // Delete relationship
  await relationshipService.delete(rel.id);
  logOk("Relationship deleted ✓");

  // Check revert
  const afterGuardian = await Patient.findByPk(guardian.id);
  const afterChild = await Patient.findByPk(child.id);
  logInfo(`After delete: guardian type=${afterGuardian.patientType} (expect regular), child type=${afterChild.patientType} (expect regular)`);

  if (afterGuardian.patientType === "regular" && afterChild.patientType === "regular") {
    logOk("patientType reverted correctly ✓");
  } else {
    logErr("patientType NOT reverted ✗");
  }
}

async function seedAgeTransition() {
  logSection("7. Age transition (child → regular at 18)");

  // Create a child patient who is exactly 18 (should transition)
  const turning18 = await createPatient({
    fullName: "Test Turning 18 Patient",
    birthDate: yearsAgoDate(18),
    gender: "male",
    phoneNumber: "55500700",
    patientType: "child",
  });
  logOk(`Created: ${turning18.fullName} (${turning18.displayId}), age=${turning18.age}, type=${turning18.patientType}`);

  // Create a child patient who is 17 (should NOT transition)
  const staying17 = await createPatient({
    fullName: "Test Staying 17 Patient",
    birthDate: yearsAgoDate(17),
    gender: "female",
    phoneNumber: "55500701",
    patientType: "child",
  });
  logOk(`Created: ${staying17.fullName} (${staying17.displayId}), age=${staying17.age}, type=${staying17.patientType}`);

  // Run transition
  const relationshipService = new PatientRelationshipService();
  const transitioned = await relationshipService.checkAndTransitionAdults();
  logInfo(`Transition function returned: ${transitioned} patients transitioned`);

  const after18 = await Patient.findByPk(turning18.id);
  const after17 = await Patient.findByPk(staying17.id);

  if (after18.patientType === "regular") {
    logOk(`18-year-old transitioned to regular ✓`);
  } else {
    logErr(`18-year-old NOT transitioned (type=${after18.patientType}) ✗`);
  }

  if (after17.patientType === "child") {
    logOk(`17-year-old stayed as child ✓`);
  } else {
    logErr(`17-year-old changed unexpectedly (type=${after17.patientType}) ✗`);
  }

  // Check notification was created
  const notif = await Notification.findOne({
    where: { entityId: turning18.id, type: "age_transition" },
  });
  if (notif) {
    logOk(`Age transition notification created ✓`);
  } else {
    logErr(`Age transition notification NOT created ✗`);
  }
}

async function seedPaginationData() {
  logSection("8. Pagination — 50 extra patients to trigger multiple pages");

  const batch = [];
  for (let i = 0; i < 50; i++) {
    const age = 20 + (i % 50);
    const gender = i % 2 === 0 ? "male" : "female";
    batch.push({
      fullName: `Test Pagination Patient #${i + 1}`,
      birthDate: yearsAgoDate(age),
      gender,
      phoneNumber: `555100${String(i).padStart(2, "0")}`,
      patientType: "regular",
      notes: TEST_TAG,
    });
  }

  // Generate displayIds and create
  let created = 0;
  for (const data of batch) {
    const displayId = await generateDisplayId(Patient, "P");
    try {
      await Patient.create({ ...data, displayId });
      created++;
    } catch (err) {
      logErr(`Pagination patient #${created + 1} failed: ${err.message}`);
    }
  }
  logOk(`Created ${created} pagination patients`);

  // Verify total count
  const totalSeed = await Patient.count({ where: { notes: { [Op.like]: `%${TEST_TAG}%` } } });
  logInfo(`Total seeded patients: ${totalSeed} (should be > 50 for pagination testing)`);
}

async function seedPatientsWithNotes() {
  logSection("9. Patients with notes (for NotesTab testing)");

  const withNotes = await createPatient({
    fullName: "Test Patient With Long Notes",
    birthDate: yearsAgoDate(45),
    gender: "male",
    phoneNumber: "55500800",
    patientType: "regular",
    notes: "This is a test patient with detailed notes for testing the NotesTab component. " + TEST_TAG,
  });
  logOk(`Created: ${withNotes.fullName} with notes`);

  const emptyNotes = await createPatient({
    fullName: "Test Patient With Empty Notes",
    birthDate: yearsAgoDate(30),
    gender: "female",
    phoneNumber: "55500801",
    patientType: "regular",
    notes: null,
  });
  logOk(`Created: ${emptyNotes.fullName} with null notes`);
}

async function seedDuplicateEmailTest() {
  logSection("10. Duplicate email prevention");

  const patientService = new PatientService();

  const p1 = await createPatient({
    fullName: "Test Email Patient 1",
    birthDate: yearsAgoDate(30),
    gender: "male",
    phoneNumber: "55500900",
    email: "duplicate@seed.test",
    patientType: "regular",
  });
  logOk(`Created: ${p1.fullName} with email=${p1.email}`);

  try {
    await patientService.create({
      fullName: "Test Email Patient 2",
      birthDate: yearsAgoDate(25),
      gender: "female",
      phoneNumber: "55500901",
      email: "duplicate@seed.test",
      patientType: "regular",
    });
    logErr("Duplicate email should have been rejected ✗");
  } catch (err) {
    logOk(`Duplicate email rejected: ${err.code || err.message} ✓`);
  }
}

async function seedEyeExaminations() {
  logSection("11. Eye examinations — all statuses, full fields, follow-up + ALL patients");

  const examService = new EyeExaminationService();

  // Get ALL seeded patients
  const patients = await Patient.findAll({
    where: { notes: { [Op.like]: `%${TEST_TAG}%` } },
    order: [["id", "ASC"]],
  });

  if (patients.length < 3) {
    logErr("Not enough patients for eye exam seeding");
    return;
  }

  // 11a. Pending exam with minimal data
  const exam1 = await examService.create(patients[0].id, {
    examDate: daysAgoDate(1),
    examStatus: "pending",
  });
  logOk(`Pending exam: ${exam1.displayId} for ${patients[0].fullName}`);

  // 11b. Completed exam with full vision + pressure data
  const exam2 = await examService.create(patients[1].id, {
    examDate: daysAgoDate(7),
    examStatus: "completed",
    rightEyeWithoutCorrection: "20/40",
    rightEyeWithCorrection: "20/20",
    rightEyePressure: "16 mmHg",
    leftEyeWithoutCorrection: "20/50",
    leftEyeWithCorrection: "20/25",
    leftEyePressure: "18 mmHg",
    cornealShapeRightEye: "normal",
    cornealSurfaceRightEye: "clear",
    rightEyeRetinaExamination: "normal",
    presenceOfCataractRightEye: "none",
    lensClarityRightEye: "clear",
    rightEyeFundusExamination: "healthy",
    cornealShapeLeftEye: "normal",
    cornealSurfaceLeftEye: "clear",
    leftEyeRetinaExamination: "mild DR",
    presenceOfCataractLeftEye: "early",
    lensClarityLeftEye: "slightly cloudy",
    leftEyeFundusExamination: "microaneurysms",
    rightEyeRefraction: "myopia",
    rightEyeSphericalPower: "-2.50",
    rightEyeCylindricalPower: "-0.75",
    rightEyeAxis: "180",
    rightEyeAdditionForReading: "+1.00",
    leftEyeRefraction: "myopia",
    leftEyeSphericalPower: "-3.00",
    leftEyeCylindricalPower: "-1.00",
    leftEyeAxis: "175",
    leftEyeAdditionForReading: "+1.25",
    eyeglassesPrescription: "OD: -2.50/-0.75x180, OS: -3.00/-1.00x175",
    additionalTreatments: "Lubricating drops for dry eyes",
    followUpInstructions: "Follow up in 6 months",
    generalNotes: "Patient reports occasional headaches " + TEST_TAG,
  });
  logOk(`Completed exam (full vision): ${exam2.displayId} for ${patients[1].fullName}`);

  // 11c. Completed exam with contact lens + frame data
  const exam3 = await examService.create(patients[2].id, {
    examDate: daysAgoDate(14),
    examStatus: "completed",
    rightEyeWithoutCorrection: "20/100",
    rightEyeWithCorrection: "20/20",
    rightEyePressure: "14 mmHg",
    leftEyeWithoutCorrection: "20/80",
    leftEyeWithCorrection: "20/20",
    leftEyePressure: "15 mmHg",
    rightEyeLensType: "soft toric",
    rightEyeLensDiameter: "14.5",
    rightEyeBaseCurve: "8.6",
    leftEyeLensType: "soft toric",
    leftEyeLensDiameter: "14.5",
    leftEyeBaseCurve: "8.6",
    frameType: "full rim",
    frameManufacturer: "Ray-Ban",
    frameModel: "RB5154",
    frameSize: "M",
    frameLensWidth: "50",
    frameBridgeWidth: "21",
    frameTempleLength: "145",
    frameMaterial: "acetate",
    frameColor: "tortoise",
    frameShape: "rectangle",
    frameLensType: "progressive",
    frameLensIndex: "1.67",
    frameLensCoating: "anti-reflective",
    frameLensUVProtection: "yes",
    frameLensColor: "clear",
    contactLensesPrescription: "OD: -4.00 BC 8.6 DIA 14.5, OS: -3.50 BC 8.6 DIA 14.5",
    generalNotes: "First-time contact lens wearer " + TEST_TAG,
  });
  logOk(`Completed exam (contact lens + frame): ${exam3.displayId} for ${patients[2].fullName}`);

  // 11d. Cancelled exam
  const exam4 = await examService.create(patients[0].id, {
    examDate: daysAgoDate(30),
    examStatus: "cancelled",
    generalNotes: "Patient no-show " + TEST_TAG,
  });
  logOk(`Cancelled exam: ${exam4.displayId} for ${patients[0].fullName}`);

  // 11e. Follow-up exam from exam2
  try {
    const followUp = await examService.createFollowUp(exam2.id);
    logOk(`Follow-up exam: ${followUp.displayId} (copied from ${exam2.displayId})`);
  } catch (err) {
    logErr(`Follow-up creation failed: ${err.message}`);
  }

  // 11f. Exams for ALL remaining patients (patients[3] onwards)
  const examStatuses = ["pending", "completed", "cancelled"];
  const examTemplates = [
    {
      rightEyeWithoutCorrection: "20/30", rightEyeWithCorrection: "20/20", rightEyePressure: "15 mmHg",
      leftEyeWithoutCorrection: "20/25", leftEyeWithCorrection: "20/20", leftEyePressure: "16 mmHg",
      rightEyeRefraction: "myopia", rightEyeSphericalPower: "-1.50", rightEyeCylindricalPower: "-0.50", rightEyeAxis: "180",
      leftEyeRefraction: "myopia", leftEyeSphericalPower: "-1.75", leftEyeCylindricalPower: "-0.25", leftEyeAxis: "175",
      eyeglassesPrescription: "OD: -1.50/-0.50x180, OS: -1.75/-0.25x175",
    },
    {
      rightEyeWithoutCorrection: "20/60", rightEyeWithCorrection: "20/25", rightEyePressure: "19 mmHg",
      leftEyeWithoutCorrection: "20/50", leftEyeWithCorrection: "20/20", leftEyePressure: "20 mmHg",
      cornealShapeRightEye: "normal", cornealSurfaceRightEye: "clear",
      rightEyeRetinaExamination: "normal", presenceOfCataractRightEye: "none", lensClarityRightEye: "clear",
      rightEyeFundusExamination: "healthy",
      cornealShapeLeftEye: "normal", cornealSurfaceLeftEye: "clear",
      leftEyeRetinaExamination: "normal", presenceOfCataractLeftEye: "none", lensClarityLeftEye: "clear",
      leftEyeFundusExamination: "healthy",
      rightEyeRefraction: "hyperopia", rightEyeSphericalPower: "+2.00", rightEyeCylindricalPower: "0", rightEyeAxis: "0",
      leftEyeRefraction: "hyperopia", leftEyeSphericalPower: "+2.25", leftEyeCylindricalPower: "-0.50", leftEyeAxis: "90",
      eyeglassesPrescription: "OD: +2.00, OS: +2.25/-0.50x90",
      additionalTreatments: "Artificial tears for dry eyes",
      followUpInstructions: "Follow up in 3 months",
    },
    {
      rightEyeWithoutCorrection: "20/200", rightEyeWithCorrection: "20/40", rightEyePressure: "22 mmHg",
      leftEyeWithoutCorrection: "20/200", leftEyeWithCorrection: "20/40", leftEyePressure: "24 mmHg",
      cornealShapeRightEye: "steep", cornealSurfaceRightEye: "clear",
      rightEyeRetinaExamination: "moderate DR", presenceOfCataractRightEye: "early", lensClarityRightEye: "slightly cloudy",
      rightEyeFundusExamination: "dot-blot hemorrhages",
      cornealShapeLeftEye: "steep", cornealSurfaceLeftEye: "clear",
      leftEyeRetinaExamination: "moderate DR", presenceOfCataractLeftEye: "early", lensClarityLeftEye: "slightly cloudy",
      leftEyeFundusExamination: "dot-blot hemorrhages",
      rightEyeRefraction: "myopia", rightEyeSphericalPower: "-5.00", rightEyeCylindricalPower: "-1.50", rightEyeAxis: "170",
      leftEyeRefraction: "myopia", leftEyeSphericalPower: "-5.50", leftEyeCylindricalPower: "-1.75", leftEyeAxis: "165",
      eyeglassesPrescription: "OD: -5.00/-1.50x170, OS: -5.50/-1.75x165",
      frameType: "half rim", frameManufacturer: "Oakley", frameModel: "OX8046", frameSize: "L",
      frameLensWidth: "54", frameBridgeWidth: "18", frameTempleLength: "140",
      frameMaterial: "metal", frameColor: "gunmetal", frameShape: "rectangle",
      frameLensType: "single vision", frameLensIndex: "1.50", frameLensCoating: "anti-reflective",
      frameLensUVProtection: "yes", frameLensColor: "clear",
      additionalTreatments: "Glaucoma suspect — refer to specialist",
      followUpInstructions: "Follow up in 1 month",
    },
  ];

  let extraCount = 0;
  for (let i = 3; i < patients.length; i++) {
    const template = examTemplates[i % examTemplates.length];
    const status = examStatuses[i % examStatuses.length];
    try {
      const exam = await examService.create(patients[i].id, {
        examDate: daysAgoDate(7 + i),
        examStatus: status,
        ...template,
        generalNotes: `SEED exam for ${patients[i].fullName} ${TEST_TAG}`,
      });
      extraCount++;
    } catch (err) {
      logErr(`Exam for ${patients[i].fullName} failed: ${err.message}`);
    }
  }
  logOk(`Created ${extraCount} additional exams for remaining patients (total: ${patients.length} patients covered)`);
}

async function seedAppointments() {
  logSection("12. Appointments — all statuses, types, patient-linked & quick, conflict detection + ALL patients");

  const appointmentService = new AppointmentService();
  const patients = await Patient.findAll({
    where: { notes: { [Op.like]: `%${TEST_TAG}%` } },
    order: [["id", "ASC"]],
  });

  if (patients.length < 3) {
    logErr("Not enough patients for appointment seeding");
    return;
  }

  const today = workingDate(0);
  const tomorrow = workingDate(1);
  const nextWeek = workingDate(7);
  const pastWeek = workingDate(-7);
  const pastMonth = workingDate(-30);

  // 12a. Upcoming appointment linked to patient
  const apt1 = await appointmentService.create({
    appointmentDate: tomorrow,
    startTime: "10:00",
    endTime: "10:30",
    appointmentType: "consultation",
    status: "upcoming",
    reason: "Routine eye check",
    notes: TEST_TAG,
    patientId: patients[0].id,
  });
  logOk(`Upcoming (patient-linked): ${apt1.displayId} for ${patients[0].fullName}`);

  // 12b. Upcoming quick appointment (no patient)
  const apt2 = await appointmentService.create({
    appointmentDate: tomorrow,
    startTime: "11:00",
    endTime: "11:30",
    appointmentType: "follow-up",
    status: "upcoming",
    quickName: "SEED Walk-in John",
    quickPhone: "55511111",
    notes: TEST_TAG,
  });
  logOk(`Upcoming (quick): ${apt2.displayId} for ${apt2.quickName}`);

  // 12c. Completed appointment
  const apt3 = await appointmentService.create({
    appointmentDate: pastWeek,
    startTime: "09:00",
    endTime: "09:45",
    appointmentType: "examination",
    status: "completed",
    reason: "Full eye examination",
    notes: TEST_TAG,
    patientId: patients[1].id,
  });
  logOk(`Completed: ${apt3.displayId} for ${patients[1].fullName}`);

  // 12d. Cancelled appointment
  const apt4 = await appointmentService.create({
    appointmentDate: pastMonth,
    startTime: "14:00",
    endTime: "14:30",
    appointmentType: "consultation",
    status: "cancelled",
    reason: "Patient cancelled",
    notes: TEST_TAG,
    patientId: patients[2].id,
  });
  logOk(`Cancelled: ${apt4.displayId} for ${patients[2].fullName}`);

  // 12e. No-show appointment
  const apt5 = await appointmentService.create({
    appointmentDate: pastWeek,
    startTime: "15:00",
    endTime: "15:30",
    appointmentType: "follow-up",
    status: "no-show",
    notes: TEST_TAG,
    patientId: patients[0].id,
  });
  logOk(`No-show: ${apt5.displayId} for ${patients[0].fullName}`);

  // 12f. Conflict detection — same date/time as apt1
  try {
    await appointmentService.create({
      appointmentDate: tomorrow,
      startTime: "10:00",
      endTime: "10:30",
      appointmentType: "consultation",
      patientId: patients[1].id,
      notes: TEST_TAG,
    });
    logErr("Conflict should have been rejected ✗");
  } catch (err) {
    logOk(`Conflict rejected: ${err.code || err.message} ✓`);
  }

  // 12g. Link patient to quick appointment
  await appointmentService.linkPatient(apt2.id, patients[3].id);
  const linkedApt = await Appointment.findByPk(apt2.id);
  if (linkedApt.patientId === patients[3].id && !linkedApt.quickName) {
    logOk(`Link patient: quick → patient ${patients[3].fullName} ✓`);
  } else {
    logErr("Link patient failed ✗");
  }

  // 12h. Calendar appointment (next week)
  await appointmentService.create({
    appointmentDate: nextWeek,
    startTime: "13:00",
    endTime: "13:30",
    appointmentType: "examination",
    status: "upcoming",
    patientId: patients[4].id,
    notes: TEST_TAG,
  });
  logOk(`Calendar (next week): for ${patients[4].fullName}`);

  // 12i. Confirmed appointment — create upcoming then confirm via service
  const aptConfirmed = await appointmentService.create({
    appointmentDate: tomorrow,
    startTime: "16:00",
    endTime: "16:30",
    appointmentType: "consultation",
    status: "upcoming",
    reason: "Confirmed eye check",
    notes: TEST_TAG,
    patientId: patients[1].id,
  });
  const confirmedApt = await appointmentService.confirm(aptConfirmed.id);
  logOk(`Confirmed: ${confirmedApt.displayId} for ${patients[1].fullName} (confirmedAt=${confirmedApt.confirmedAt?.toISOString().split("T")[0]})`);

  // 12j. Appointment with linked examination
  const examService = new EyeExaminationService();
  const aptWithExam = await appointmentService.create({
    appointmentDate: pastWeek,
    startTime: "11:00",
    endTime: "11:30",
    appointmentType: "examination",
    status: "completed",
    reason: "Exam linked to appointment",
    notes: TEST_TAG,
    patientId: patients[2].id,
  });
  const examForLink = await examService.create(patients[2].id, {
    examDate: pastWeek,
    examStatus: "completed",
    rightEyeWithoutCorrection: "20/40",
    leftEyeWithoutCorrection: "20/50",
    generalNotes: "SEED linked exam " + TEST_TAG,
  });
  await appointmentService.linkExamination(aptWithExam.id, examForLink.id);
  logOk(`Linked examination: ${examForLink.displayId} → appointment ${aptWithExam.displayId}`);

  // 12k. Appointment with linked invoice
  const invoiceService = new InvoiceService();
  const aptWithInv = await appointmentService.create({
    appointmentDate: pastWeek,
    startTime: "12:00",
    endTime: "12:30",
    appointmentType: "consultation",
    status: "completed",
    reason: "Invoice linked to appointment",
    notes: TEST_TAG,
    patientId: patients[3].id,
  });
  const invForLink = await invoiceService.create({
    patientId: patients[3].id,
    invoiceDate: pastWeek,
    invoiceStatus: "paid",
    items: [{ description: "SEED linked consultation", quantity: 1, unitPrice: 50.0 }],
  });
  await appointmentService.linkInvoice(aptWithInv.id, invForLink.id);
  logOk(`Linked invoice: ${invForLink.displayId} → appointment ${aptWithInv.displayId}`);

  // 12l. Appointments for ALL remaining patients (patients[5] onwards)
  const apptStatuses = ["upcoming", "confirmed", "completed", "cancelled", "no-show"];
  const apptTypes = ["consultation", "examination", "follow-up"];
  const reasons = ["Routine eye check", "Full eye examination", "Follow-up after treatment", "Contact lens fitting", "Vision test", "Glaucoma screening"];
  const timeSlots = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"];

  // Pre-generate unique working dates to avoid slot collisions when workingDate compresses days
  const usedDates = new Set([tomorrow, pastWeek, nextWeek, pastMonth]);
  const uniqueDates = [];
  let dayOff = 1;
  while (uniqueDates.length < Math.ceil((patients.length - 5) / timeSlots.length) + 2) {
    const wd = workingDate(dayOff);
    if (!usedDates.has(wd)) {
      usedDates.add(wd);
      uniqueDates.push(wd);
    }
    dayOff++;
  }

  let extraCount = 0;
  for (let i = 5; i < patients.length; i++) {
    const slotIdx = (i - 5) % timeSlots.length;
    const dateIdx = Math.floor((i - 5) / timeSlots.length);
    const apptDate = uniqueDates[dateIdx] || workingDate(dateIdx + 10);
    const startTime = timeSlots[slotIdx];
    const endTimeMin = parseInt(startTime.split(":")[0]) * 60 + parseInt(startTime.split(":")[1]) + 30;
    const endTime = `${String(Math.floor(endTimeMin / 60)).padStart(2, "0")}:${String(endTimeMin % 60).padStart(2, "0")}`;

    try {
      const apt = await appointmentService.create({
        appointmentDate: apptDate,
        startTime,
        endTime,
        appointmentType: apptTypes[i % apptTypes.length],
        status: apptStatuses[i % apptStatuses.length],
        reason: reasons[i % reasons.length],
        notes: TEST_TAG,
        patientId: patients[i].id,
      });
      extraCount++;
    } catch (err) {
      logErr(`Appointment for ${patients[i].fullName} failed: ${err.message}`);
    }
  }
  logOk(`Created ${extraCount} additional appointments for remaining patients (total: ${patients.length} patients covered)`);
}

async function seedInvoices() {
  logSection("13. Invoices — all statuses, items, tax/discount, paid protection, walk-in + ALL patients");

  const invoiceService = new InvoiceService();
  const patients = await Patient.findAll({
    where: { notes: { [Op.like]: `%${TEST_TAG}%` } },
    order: [["id", "ASC"]],
  });

  if (patients.length < 3) {
    logErr("Not enough patients for invoice seeding");
    return;
  }

  const today = new Date().toISOString().split("T")[0];
  const pastWeek = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
  const pastMonth = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];

  // 13a. Unpaid invoice linked to patient with items + tax + discount
  const inv1 = await invoiceService.create({
    patientId: patients[0].id,
    invoiceDate: today,
    dueDate: nextWeek,
    invoiceStatus: "unpaid",
    taxAmount: 5.00,
    discountAmount: 10.00,
    noteMessage: "Thank you for your visit",
    noteContactLine: "Test Eye Clinic",
    notePhone: "5550000",
    noteEmail: "info@test.test",
    items: [
      { description: "Eye examination", quantity: 1, unitPrice: 50.00 },
      { description: "Contact lens fitting", quantity: 1, unitPrice: 30.00 },
    ],
  });
  logOk(`Unpaid (patient): ${inv1.displayId}, total=$${inv1.totalAmount} for ${patients[0].fullName}`);

  // 13b. Paid invoice
  const inv2 = await invoiceService.create({
    patientId: patients[1].id,
    invoiceDate: pastWeek,
    invoiceStatus: "paid",
    items: [
      { description: "Frame purchase", quantity: 1, unitPrice: 120.00 },
      { description: "Progressive lenses", quantity: 2, unitPrice: 80.00 },
    ],
  });
  logOk(`Paid (patient): ${inv2.displayId}, total=$${inv2.totalAmount} for ${patients[1].fullName}`);

  // 13c. Partially paid invoice
  const inv3 = await invoiceService.create({
    patientId: patients[2].id,
    invoiceDate: pastMonth,
    invoiceStatus: "partially-paid",
    items: [
      { description: "Eye examination", quantity: 1, unitPrice: 50.00 },
    ],
  });
  logOk(`Partially paid: ${inv3.displayId}, total=$${inv3.totalAmount}`);

  // 13d. Walk-in invoice (no patient, customer name/phone)
  const inv4 = await invoiceService.create({
    customerName: "SEED Walk-in Customer",
    customerPhone: "55599999",
    invoiceDate: today,
    invoiceStatus: "unpaid",
    items: [
      { description: "Consultation fee", quantity: 1, unitPrice: 40.00 },
    ],
  });
  logOk(`Walk-in (no patient): ${inv4.displayId}, customer=${inv4.customerName}`);

  // 13e. Overdue invoice
  const inv5 = await invoiceService.create({
    patientId: patients[3].id,
    invoiceDate: pastMonth,
    dueDate: pastWeek,
    invoiceStatus: "overdue",
    items: [
      { description: "Contact lenses (monthly)", quantity: 6, unitPrice: 25.00 },
    ],
  });
  logOk(`Overdue: ${inv5.displayId}, total=$${inv5.totalAmount}`);

  // 13f. Paid invoice protection — cannot update or delete
  try {
    await invoiceService.update(inv2.id, { invoiceStatus: "unpaid" });
    logErr("Paid invoice update should have been rejected ✗");
  } catch (err) {
    logOk(`Paid invoice update rejected: ${err.code || err.message} ✓`);
  }

  try {
    await invoiceService.delete(inv2.id);
    logErr("Paid invoice delete should have been rejected ✗");
  } catch (err) {
    logOk(`Paid invoice delete rejected: ${err.code || err.message} ✓`);
  }

  // 13g. Change status from unpaid to paid
  await invoiceService.changeStatus(inv1.id, "paid");
  const changedInv = await Invoice.findByPk(inv1.id);
  if (changedInv.invoiceStatus === "paid") {
    logOk(`Status change: unpaid → paid ✓`);
  } else {
    logErr(`Status change failed (got ${changedInv.invoiceStatus}) ✗`);
  }

  // 13h. Invoices for ALL remaining patients (patients[4] onwards)
  const invoiceStatuses = ["unpaid", "paid", "partially-paid", "overdue"];
  const itemSets = [
    [{ description: "Eye examination", quantity: 1, unitPrice: 50.00 }],
    [{ description: "Frame purchase", quantity: 1, unitPrice: 100.00 }, { description: "Single vision lenses", quantity: 2, unitPrice: 40.00 }],
    [{ description: "Contact lens fitting", quantity: 1, unitPrice: 30.00 }, { description: "Contact lenses (3-month supply)", quantity: 2, unitPrice: 35.00 }],
    [{ description: "Full eye examination", quantity: 1, unitPrice: 60.00 }, { description: "Retinal photo", quantity: 1, unitPrice: 25.00 }],
    [{ description: "Glaucoma screening", quantity: 1, unitPrice: 45.00 }, { description: "Visual field test", quantity: 1, unitPrice: 55.00 }],
    [{ description: "Progressive lenses", quantity: 2, unitPrice: 80.00 }, { description: "Anti-reflective coating", quantity: 1, unitPrice: 50.00 }],
  ];

  let extraCount = 0;
  for (let i = 4; i < patients.length; i++) {
    const status = invoiceStatuses[i % invoiceStatuses.length];
    const items = itemSets[i % itemSets.length];
    const dayOffset = (i - 3) * 5;
    const invDate = new Date(Date.now() - dayOffset * 86400000).toISOString().split("T")[0];
    const dueDate = new Date(Date.now() + (7 - dayOffset) * 86400000).toISOString().split("T")[0];

    try {
      const inv = await invoiceService.create({
        patientId: patients[i].id,
        invoiceDate: invDate,
        dueDate: status === "overdue" ? new Date(Date.now() - 86400000).toISOString().split("T")[0] : dueDate,
        invoiceStatus: status,
        taxAmount: i % 3 === 0 ? 5.00 : 0,
        discountAmount: i % 4 === 0 ? 10.00 : 0,
        items,
      });
      extraCount++;
    } catch (err) {
      logErr(`Invoice for ${patients[i].fullName} failed: ${err.message}`);
    }
  }
  logOk(`Created ${extraCount} additional invoices for remaining patients (total: ${patients.length} patients covered)`);
}

async function seedFoldersAndFiles() {
  logSection("14. Folders (nested) & Files (various types) + ALL patients");

  const patients = await Patient.findAll({
    where: { notes: { [Op.like]: `%${TEST_TAG}%` } },
    order: [["id", "ASC"]],
  });

  if (patients.length < 2) {
    logErr("Not enough patients for folder/file seeding");
    return;
  }

  const config = require("../src/config");
  const path = require("path");
  const fs = require("fs");

  // 14a. Create root folder for patient 1
  const rootFolder = await Folder.create({
    name: "SEED Documents",
    patientId: patients[0].id,
    parentFolderId: null,
    path: `patients/${patients[0].id}/SEED Documents`,
  });
  fs.mkdirSync(path.resolve(config.upload.dir, rootFolder.path), { recursive: true });
  logOk(`Root folder: ${rootFolder.name} for ${patients[0].fullName}`);

  // 14b. Create sub folder inside root
  const subFolder = await Folder.create({
    name: "SEED Reports",
    patientId: patients[0].id,
    parentFolderId: rootFolder.id,
    path: `${rootFolder.path}/SEED Reports`,
  });
  fs.mkdirSync(path.resolve(config.upload.dir, subFolder.path), { recursive: true });
  logOk(`Sub folder: ${subFolder.name} inside ${rootFolder.name}`);

  // 14c. Create sub-sub folder
  const subSubFolder = await Folder.create({
    name: "SEED Lab Results",
    patientId: patients[0].id,
    parentFolderId: subFolder.id,
    path: `${subFolder.path}/SEED Lab Results`,
  });
  fs.mkdirSync(path.resolve(config.upload.dir, subSubFolder.path), { recursive: true });
  logOk(`Sub-sub folder: ${subSubFolder.name} inside ${subFolder.name}`);

  // 14d. Create files in various locations
  const fileData = [
    { name: "SEED_retinal_photo.jpg", folderId: rootFolder.id, type: "image/jpeg", size: 2048000, patientId: patients[0].id },
    { name: "SEED_oct_scan.pdf", folderId: subFolder.id, type: "application/pdf", size: 512000, patientId: patients[0].id },
    { name: "SEED_prescription.docx", folderId: subSubFolder.id, type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", size: 102400, patientId: patients[0].id },
    { name: "SEED_profile.png", folderId: null, type: "image/png", size: 512000, patientId: patients[0].id },
    { name: "SEED_visual_field_test.pdf", folderId: null, type: "application/pdf", size: 1024000, patientId: patients[1].id },
  ];

  for (const fd of fileData) {
    const folderPath = fd.folderId ? (await Folder.findByPk(fd.folderId)).path : `patients/${fd.patientId}`;
    const filePath = `${folderPath}/${fd.name}`;
    const fullPath = path.resolve(config.upload.dir, filePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, `SEED TEST FILE: ${fd.name}`);

    await File.create({
      name: fd.name,
      patientId: fd.patientId,
      folderId: fd.folderId,
      type: fd.type,
      size: fd.size,
      path: filePath,
    });
    logOk(`File: ${fd.name} (${fd.type}, ${fd.size}B) ${fd.folderId ? "in folder" : "root"}`);
  }

  // 14e. Folders + Files for ALL remaining patients (patients[2] onwards)
  const folderNames = ["SEED Medical Records", "SEED Prescriptions", "SEED Scans", "SEED Invoices", "SEED Photos"];
  const fileTemplates = [
    { name: "SEED_eye_exam_report.pdf", type: "application/pdf", size: 256000 },
    { name: "SEED_retinal_image.jpg", type: "image/jpeg", size: 1024000 },
    { name: "SEED_prescription.pdf", type: "application/pdf", size: 128000 },
    { name: "SEED_oct_scan.png", type: "image/png", size: 512000 },
    { name: "SEED_contact_lens_fit.pdf", type: "application/pdf", size: 96000 },
  ];

  let extraFolders = 0;
  let extraFiles = 0;
  for (let i = 2; i < patients.length; i++) {
    const patient = patients[i];
    const folderName = folderNames[i % folderNames.length];
    const folderPath = `patients/${patient.id}/${folderName}`;

    // Create root folder
    const folder = await Folder.create({
      name: folderName,
      patientId: patient.id,
      parentFolderId: null,
      path: folderPath,
    });
    fs.mkdirSync(path.resolve(config.upload.dir, folderPath), { recursive: true });
    extraFolders++;

    // Create 2 files: one in folder, one in root
    const fileTpl1 = fileTemplates[i % fileTemplates.length];
    const fileTpl2 = fileTemplates[(i + 1) % fileTemplates.length];

    for (const [tpl, folderId] of [[fileTpl1, folder.id], [fileTpl2, null]]) {
      const baseDir = folderId ? folderPath : `patients/${patient.id}`;
      const filePath = `${baseDir}/${tpl.name}`;
      const fullPath = path.resolve(config.upload.dir, filePath);
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, `SEED TEST FILE: ${tpl.name}`);

      await File.create({
        name: tpl.name,
        patientId: patient.id,
        folderId,
        type: tpl.type,
        size: tpl.size,
        path: filePath,
      });
      extraFiles++;
    }
  }
  logOk(`Created ${extraFolders} folders + ${extraFiles} files for remaining patients (total: ${patients.length} patients covered)`);
}

async function seedNotifications() {
  logSection("15. Notifications — all types, read & unread + ALL patients");

  const patients = await Patient.findAll({
    where: { notes: { [Op.like]: `%${TEST_TAG}%` } },
    order: [["id", "ASC"]],
  });

  const notifs = [
    { type: "appointment_reminder", title: "Upcoming appointment", message: "Appointment tomorrow at 10:00 " + TEST_TAG, isRead: false, entityId: patients[0]?.id, entityType: "Patient" },
    { type: "age_transition", title: "Patient turned 18", message: "Patient is now an adult " + TEST_TAG, isRead: false, entityId: patients[1]?.id, entityType: "Patient" },
    { type: "overdue_invoice", title: "Invoice overdue", message: "Invoice INV-SEED-001 is overdue " + TEST_TAG, isRead: true, entityId: patients[2]?.id, entityType: "Patient" },
    { type: "backup", title: "Backup completed", message: "Daily backup completed successfully " + TEST_TAG, isRead: true, entityId: null, entityType: null },
    { type: "disk", title: "Disk space warning", message: "Disk usage above 70% " + TEST_TAG, isRead: false, entityId: null, entityType: null },
    { type: "disk", title: "Disk space critical", message: "Disk usage above 90% " + TEST_TAG, isRead: false, entityId: null, entityType: null },
    { type: "welcome", title: "Welcome", message: "Welcome to the Eye Examination Clinic " + TEST_TAG, isRead: true, entityId: null, entityType: null },
  ];

  for (const n of notifs) {
    await Notification.create(n);
    logOk(`Notification: ${n.type} (${n.isRead ? "read" : "unread"}) — ${n.title}`);
  }

  // 15b. Notifications for ALL remaining patients (patients[3] onwards)
  const notifTypes = [
    { type: "appointment_reminder", title: "Upcoming appointment", message: "You have an appointment soon " },
    { type: "overdue_invoice", title: "Invoice overdue", message: "Your invoice is overdue " },
    { type: "follow_up_due", title: "Follow-up due", message: "Your follow-up examination is due " },
    { type: "age_transition", title: "Patient turned 18", message: "Patient is now an adult " },
    { type: "disk", title: "Disk space warning", message: "Disk usage is high " },
    { type: "backup", title: "Backup completed", message: "Backup completed successfully " },
  ];

  let extraCount = 0;
  for (let i = 3; i < patients.length; i++) {
    const tmpl = notifTypes[i % notifTypes.length];
    await Notification.create({
      type: tmpl.type,
      title: tmpl.title,
      message: tmpl.message + TEST_TAG,
      isRead: i % 3 === 0,
      entityId: patients[i].id,
      entityType: "Patient",
    });
    extraCount++;
  }
  logOk(`Created ${extraCount} additional notifications for remaining patients (total: ${patients.length} patients covered)`);
}

async function seedAuditLogs() {
  logSection("16. Audit logs — all actions (CREATE, UPDATE, DELETE, LOGIN, LOGOUT)");

  const adminUser = await User.findOne({ where: { username: "admin" } });
  if (!adminUser) {
    logErr("Admin user not found for audit log seeding");
    return;
  }

  const patients = await Patient.findAll({
    where: { notes: { [Op.like]: `%${TEST_TAG}%` } },
    order: [["id", "ASC"]],
    limit: 10,
  });

  const auditActions = [
    { action: "LOGIN", entity: "User", entityId: adminUser.id, changes: JSON.stringify({ username: "admin", tag: TEST_TAG }) },
    { action: "CREATE", entity: "Patient", entityId: patients[0]?.id, changes: JSON.stringify({ fullName: patients[0]?.fullName, tag: TEST_TAG }) },
    { action: "UPDATE", entity: "Patient", entityId: patients[1]?.id, changes: JSON.stringify({ field: "notes", oldValue: null, newValue: TEST_TAG, tag: TEST_TAG }) },
    { action: "DELETE", entity: "Patient", entityId: patients[2]?.id, changes: JSON.stringify({ fullName: patients[2]?.fullName, tag: TEST_TAG }) },
    { action: "LOGOUT", entity: "User", entityId: adminUser.id, changes: JSON.stringify({ tag: TEST_TAG }) },
    { action: "CREATE", entity: "Appointment", entityId: patients[0]?.id, changes: JSON.stringify({ appointmentDate: "2026-07-27", tag: TEST_TAG }) },
    { action: "CREATE", entity: "Invoice", entityId: patients[1]?.id, changes: JSON.stringify({ invoiceStatus: "unpaid", tag: TEST_TAG }) },
    { action: "UPDATE", entity: "Invoice", entityId: patients[2]?.id, changes: JSON.stringify({ field: "invoiceStatus", oldValue: "unpaid", newValue: "paid", tag: TEST_TAG }) },
    { action: "CREATE", entity: "EyeExamination", entityId: patients[3]?.id, changes: JSON.stringify({ examStatus: "completed", tag: TEST_TAG }) },
    { action: "DELETE", entity: "File", entityId: patients[4]?.id, changes: JSON.stringify({ name: "SEED_old_file.pdf", tag: TEST_TAG }) },
  ];

  for (const log of auditActions) {
    await AuditLog.create({
      userId: adminUser.id,
      action: log.action,
      entity: log.entity,
      entityId: log.entityId || null,
      changes: log.changes,
      ipAddress: "127.0.0.1",
    });
  }
  logOk(`Created ${auditActions.length} audit logs covering all action types`);
}

async function seedBackups() {
  logSection("17. Backups — manual, auto, restore (success & failed)");

  const backups = [
    { filename: "SEED_backup_manual_2026-07-20.zip", fileSize: 1024000, type: "manual", status: "success" },
    { filename: "SEED_backup_auto_2026-07-21.zip", fileSize: 1025000, type: "auto", status: "success" },
    { filename: "SEED_backup_auto_2026-07-22.zip", fileSize: 1030000, type: "auto", status: "success" },
    { filename: "SEED_backup_manual_2026-07-23.zip", fileSize: 0, type: "manual", status: "failed" },
    { filename: "SEED_backup_restore_2026-07-24.zip", fileSize: 1028000, type: "restore", status: "success" },
  ];

  for (const b of backups) {
    await Backup.create(b);
  }
  logOk(`Created ${backups.length} backup records (manual, auto, restore — success & failed)`);
}

async function seedRescheduledAppointment() {
  logSection("18. Rescheduled appointment status");

  const appointmentService = new AppointmentService();
  const patients = await Patient.findAll({
    where: { notes: { [Op.like]: `%${TEST_TAG}%` } },
    order: [["id", "ASC"]],
    limit: 3,
  });

  if (patients.length < 1) {
    logErr("Not enough patients for rescheduled appointment");
    return;
  }

  const pastWeek = workingDate(-7);
  const nextWeek = workingDate(7);

  // Create an appointment then reschedule it
  const apt = await appointmentService.create({
    appointmentDate: pastWeek,
    startTime: "10:00",
    endTime: "10:30",
    appointmentType: "consultation",
    status: "rescheduled",
    reason: "Patient requested new time",
    notes: TEST_TAG,
    patientId: patients[0].id,
  });
  logOk(`Rescheduled appointment: ${apt.displayId} for ${patients[0].fullName}`);

  // Create a new upcoming appointment as the rescheduled version
  const apt2 = await appointmentService.create({
    appointmentDate: nextWeek,
    startTime: "14:00",
    endTime: "14:30",
    appointmentType: "consultation",
    status: "upcoming",
    reason: "Rescheduled from previous appointment",
    notes: TEST_TAG,
    patientId: patients[0].id,
  });
  logOk(`New appointment after reschedule: ${apt2.displayId} for ${patients[0].fullName}`);
}

async function seedPatientDeleteProtection() {
  logSection("19. Patient delete protection (unpaid invoices)");

  const patientService = new PatientService();

  // Create a patient with an unpaid invoice
  const patient = await createPatient({
    fullName: "Test Delete Protection Patient",
    birthDate: yearsAgoDate(30),
    gender: "male",
    phoneNumber: "55501000",
    patientType: "regular",
  });

  const invoiceService = new InvoiceService();
  await invoiceService.create({
    patientId: patient.id,
    invoiceDate: new Date().toISOString().split("T")[0],
    invoiceStatus: "unpaid",
    items: [{ description: "Eye exam", quantity: 1, unitPrice: 50.00 }],
  });
  logOk(`Created patient ${patient.fullName} with unpaid invoice`);

  // Try to delete — should fail
  try {
    await patientService.delete(patient.id);
    logErr("Delete with unpaid invoice should have been rejected ✗");
  } catch (err) {
    logOk(`Delete rejected: ${err.code || err.message} ✓`);
  }
}

async function ensureColumns() {
  const queryInterface = sequelize.getQueryInterface();
  const columnsToAdd = [
    { table: "files", column: "examinationId", config: { type: DataTypes.INTEGER, allowNull: true } },
    { table: "invoices", column: "customerName", config: { type: DataTypes.STRING, allowNull: true } },
    { table: "invoices", column: "customerPhone", config: { type: DataTypes.STRING, allowNull: true } },
    { table: "invoices", column: "logo", config: { type: DataTypes.TEXT, allowNull: true } },
    { table: "invoices", column: "noteMessage", config: { type: DataTypes.TEXT, allowNull: true } },
    { table: "invoices", column: "noteContactLine", config: { type: DataTypes.STRING, allowNull: true } },
    { table: "invoices", column: "notePhone", config: { type: DataTypes.STRING, allowNull: true } },
    { table: "invoices", column: "noteEmail", config: { type: DataTypes.STRING, allowNull: true } },
    { table: "patients", column: "profileImage", config: { type: DataTypes.STRING, allowNull: true } },
    { table: "patients", column: "patientType", config: { type: DataTypes.TEXT, allowNull: false, defaultValue: "regular" } },
    { table: "appointments", column: "duration", config: { type: DataTypes.INTEGER, allowNull: true } },
    { table: "appointments", column: "confirmedAt", config: { type: DataTypes.DATE, allowNull: true } },
    { table: "appointments", column: "examinationId", config: { type: DataTypes.INTEGER, allowNull: true } },
    { table: "appointments", column: "invoiceId", config: { type: DataTypes.INTEGER, allowNull: true } },
  ];

  for (const { table, column, config } of columnsToAdd) {
    try {
      const tableDesc = await queryInterface.describeTable(table);
      if (!tableDesc[column]) {
        await queryInterface.addColumn(table, column, config);
        logInfo(`Added missing column: ${table}.${column}`);
      }
    } catch (e) {
      // Table doesn't exist yet — sync will create it
    }
  }
}

async function main() {
  console.log(`\n\x1b[1m\x1b[36m═══ Full Seed Script (Admin + Patients + Exams + Appointments + Invoices + Files) ═══\x1b[0m\n`);

  const isClean = process.argv.includes("--clean");

  await sequelize.authenticate();
  logInfo("Database connected.");

  // Ensure tables exist and schema is up-to-date
  await ensureColumns();
  await sequelize.sync();
  logInfo("Database synced.");

  if (isClean) {
    await cleanSeedData();
    await sequelize.close();
    console.log(`\n\x1b[32mDone. Test data cleaned.\x1b[0m\n`);
    return;
  }

  // Clean first to avoid duplicates on re-run
  await cleanSeedData();

  // 0. Seed admin user + settings
  await seedAdmin();

  // Run all scenarios
  await seedRegularPatients();
  await seedAgeBoundaryPatients();
  await seedFamilyRelationships();
  await seedAutoDirectionDetection();
  await seedEdgeCases();
  await seedRelationshipDeleteAndRevert();
  await seedAgeTransition();
  await seedPaginationData();
  await seedPatientsWithNotes();
  await seedDuplicateEmailTest();

  // Entity-level scenarios
  await seedEyeExaminations();
  await seedAppointments();
  await seedRescheduledAppointment();
  await seedInvoices();
  await seedFoldersAndFiles();
  await seedNotifications();
  await seedAuditLogs();
  await seedBackups();
  await seedPatientDeleteProtection();

  // Summary
  logSection("Summary");
  const totalPatients = await Patient.count({ where: { notes: { [Op.like]: `%${TEST_TAG}%` } } });
  const totalRels = await PatientRelationship.count({
    include: [
      { association: "guardian", where: { notes: { [Op.like]: `%${TEST_TAG}%` } }, required: true },
    ],
  });
  const totalExams = await EyeExamination.count({ include: [{ association: "patient", where: { notes: { [Op.like]: `%${TEST_TAG}%` } }, required: true }] });
  const totalAppts = await Appointment.count({ where: { [Op.or]: [{ notes: { [Op.like]: `%${TEST_TAG}%` } }, { quickName: { [Op.like]: "%SEED%" } }] } });
  const seedPatients = await Patient.findAll({ where: { notes: { [Op.like]: `%${TEST_TAG}%` } }, attributes: ["id"], paranoid: false });
  const seedPatientIds = seedPatients.map((p) => p.id);
  const totalInvoices = await Invoice.count({ where: { [Op.or]: [{ patientId: seedPatientIds }, { customerName: { [Op.like]: "%SEED%" } }] }, paranoid: false });
  const totalFolders = await Folder.count({ where: { name: { [Op.like]: "SEED%" } } });
  const totalFiles = await File.count({ where: { name: { [Op.like]: "SEED%" } } });
  const totalNotifs = await Notification.count({ where: { message: { [Op.like]: `%${TEST_TAG}%` } } });
  const adminExists = await User.findOne({ where: { username: "admin" } });

  logInfo(`Admin user: ${adminExists ? "admin / Admin@123" : "NOT created"}`);
  logInfo(`Patients: ${totalPatients}`);
  logInfo(`Relationships: ${totalRels}`);
  logInfo(`Eye examinations: ${totalExams}`);
  logInfo(`Appointments: ${totalAppts}`);
  logInfo(`Invoices: ${totalInvoices}`);
  logInfo(`Folders: ${totalFolders}`);
  logInfo(`Files: ${totalFiles}`);
  const totalAuditLogs = await AuditLog.count();
  const totalBackups = await Backup.count();
  logInfo(`Notifications: ${totalNotifs}`);
  logInfo(`Audit logs: ${totalAuditLogs}`);
  logInfo(`Backups: ${totalBackups}`);
  logInfo(`Test tag: "${TEST_TAG}" (use --clean to remove)`);

  await sequelize.close();
  console.log(`\n\x1b[32m═══ Seed complete ═══\x1b[0m\n`);
}

main().catch((err) => {
  console.error(`\n\x1b[31mSeed failed: ${err.message}\x1b[0m\n`);
  console.error(err.stack);
  process.exit(1);
});
