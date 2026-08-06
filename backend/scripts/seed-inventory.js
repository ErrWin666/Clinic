/**
 * Seed script — inserts inventory, supplier, stock, and report test data.
 *
 * Usage:
 *   node scripts/seed-inventory.js          # seed everything
 *   node scripts/seed-inventory.js --clean  # remove only seeded inventory data
 *
 * Prerequisites:
 *   Run scripts/seed-patients.js first (creates admin user + patients + invoices).
 *
 * Scenarios covered:
 *  - Suppliers: active/inactive, with/without opening balance, all fields
 *  - Products: all categories (frames, frames-luxury, contact-lenses, drops, supplies, equipment, other)
 *  - Variants: all costing methods (fifo/fefo/average), low stock, out of stock, serial/barcode, discount
 *  - Packaging units: base, box, carton with barcode
 *  - Batches: expiring soon, expired, multi-batch average cost, dead stock, all aging buckets
 *  - Stock movements: all types (in/out/adjust), all reasons, all reference types
 *  - Purchase orders: all statuses (draft/ordered/received/cancelled)
 *  - Supplier payments: all methods, linked/unlinked to PO, partial payment
 *  - Exam consumable rules: active/inactive, multiple per exam type
 *  - Product bundles: multi-component
 *  - Stocktaking: completed + in_progress, positive/negative/zero differences
 *  - InvoiceItem linking: productVariantId + batchId + costAmount for P&L report
 *  - Inventory notifications: low_stock, out_of_stock, expiring_soon, expired, overstock, supplier_payment_due
 */

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const {
  sequelize,
  User, Patient, Invoice, InvoiceItem, Notification,
  Product, ProductVariant, Batch, StockMovement,
  Supplier, PurchaseOrder, PurchaseOrderItem, SupplierPayment,
  ExamConsumableRule, ProductBundle, ProductBundleItem,
  PackagingUnit, Stocktaking, StocktakingItem,
} = require("../src/models");
const { generateDisplayId } = require("../src/utils/displayId");
const { Op } = require("sequelize");

const TAG = "[SEED-INV]";
const TEST_TAG = "__SEED_INV__";

function logOk(msg) { console.log(`\x1b[32m  \u2713 ${msg}\x1b[0m`); }
function logErr(msg) { console.log(`\x1b[31m  \u2717 ${msg}\x1b[0m`); }
function logInfo(msg) { console.log(`\x1b[36m  \u2139 ${msg}\x1b[0m`); }
function logSection(title) { console.log(`\n\x1b[1m\x1b[35m\u2500\u2500 ${title} \u2500\u2500\x1b[0m`); }

function daysAgoDate(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

function daysFromNowDate(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

// ============================================================
// CLEAN
// ============================================================

async function cleanSeedData() {
  logSection("Cleaning previous inventory seed data");

  // 1. StocktakingItems → Stocktakings (use displayId prefix)
  const seedStocktakings = await Stocktaking.findAll({
    where: { displayId: { [Op.like]: "SEED-STK-%" } },
    attributes: ["id"], paranoid: false,
  });
  const stkIds = seedStocktakings.map((s) => s.id);
  if (stkIds.length > 0) {
    await StocktakingItem.destroy({ where: { stocktakingId: stkIds }, force: true });
    logInfo(`Deleted StocktakingItems for ${stkIds.length} stocktakings.`);
    await Stocktaking.destroy({ where: { id: stkIds }, force: true });
    logInfo(`Deleted ${stkIds.length} stocktakings.`);
  }

  // 2. SupplierPayments (use displayId prefix — underscores in TEST_TAG break LIKE)
  const delPayments = await SupplierPayment.destroy({
    where: { displayId: { [Op.like]: "SEED-PAY-%" } }, force: true,
  });
  if (delPayments) logInfo(`Deleted ${delPayments} supplier payments.`);

  // 3. PurchaseOrderItems → PurchaseOrders (use displayId prefix)
  const seedPOs = await PurchaseOrder.findAll({
    where: { displayId: { [Op.like]: "SEED-PO-%" } },
    attributes: ["id"], paranoid: false,
  });
  const poIds = seedPOs.map((p) => p.id);
  if (poIds.length > 0) {
    await PurchaseOrderItem.destroy({ where: { purchaseOrderId: poIds }, force: true });
    logInfo(`Deleted PurchaseOrderItems for ${poIds.length} POs.`);
    await PurchaseOrder.destroy({ where: { id: poIds }, force: true });
    logInfo(`Deleted ${poIds.length} purchase orders.`);
  }

  // 4. Unlink InvoiceItems from inventory (MUST happen before batch/variant deletion)
  // Find seeded variant IDs first, then unlink by either unit prefix or productVariantId
  const seedVariantIdsForUnlink = (await ProductVariant.findAll({
    where: { sku: { [Op.like]: "SEED-%" } },
    attributes: ["id"], paranoid: false,
  })).map((v) => v.id);
  if (seedVariantIdsForUnlink.length > 0) {
    const [updatedItems] = await InvoiceItem.update(
      { productVariantId: null, batchId: null, costAmount: null, unit: "piece" },
      { where: { [Op.or]: [
        { unit: { [Op.like]: "SEED-%" } },
        { productVariantId: { [Op.in]: seedVariantIdsForUnlink } },
      ] } }
    );
    if (updatedItems) logInfo(`Unlinked ${updatedItems} invoice items from inventory.`);
  }

  // 5. StockMovements (no paranoid — hard delete, use displayId prefix not note LIKE)
  const delMovements = await StockMovement.destroy({
    where: { displayId: { [Op.like]: "SEED-MOV-%" } },
  });
  if (delMovements) logInfo(`Deleted ${delMovements} stock movements.`);

  // 5b. StocktakingItems referencing seeded batches (orphaned items from previous runs)
  const seedBatchIds = (await Batch.findAll({
    where: { batchNumber: { [Op.like]: "SEED-%" } },
    attributes: ["id"], paranoid: false,
  })).map((b) => b.id);
  if (seedBatchIds.length > 0) {
    const delStkItems = await StocktakingItem.destroy({
      where: { batchId: { [Op.in]: seedBatchIds } },
      force: true,
    });
    if (delStkItems) logInfo(`Deleted ${delStkItems} orphaned stocktaking items.`);
  }

  // 6. Batches
  const delBatches = await Batch.destroy({
    where: { batchNumber: { [Op.like]: "SEED-%" } },
    force: true,
  });
  if (delBatches) logInfo(`Deleted ${delBatches} batches.`);

  // 6. ExamConsumableRules (no note field — delete by seeded variant IDs)
  const seedVariantIds = (await ProductVariant.findAll({
    where: { sku: { [Op.like]: "SEED-%" } },
    attributes: ["id"], paranoid: false,
  })).map((v) => v.id);
  if (seedVariantIds.length > 0) {
    const delRules = await ExamConsumableRule.destroy({
      where: { productVariantId: { [Op.in]: seedVariantIds } },
      force: true,
    });
    if (delRules) logInfo(`Deleted ${delRules} exam consumable rules.`);
  }

  // 7. ProductBundleItems → ProductBundles (find by seeded product IDs)
  const seedProductIds = (await Product.findAll({
    where: { displayId: { [Op.like]: "SEED-PRD-%" } },
    attributes: ["id"], paranoid: false,
  })).map((p) => p.id);
  if (seedProductIds.length > 0) {
    const seedBundles = await ProductBundle.findAll({
      where: { productId: { [Op.in]: seedProductIds } },
      attributes: ["id"], paranoid: false,
    });
    const bundleIds = seedBundles.map((b) => b.id);
    if (bundleIds.length > 0) {
      await ProductBundleItem.destroy({ where: { bundleId: bundleIds }, force: true });
      await ProductBundle.destroy({ where: { id: bundleIds }, force: true });
      logInfo(`Deleted ${bundleIds.length} product bundles.`);
    }
  }

  // 8. PackagingUnits
  const delPackaging = await PackagingUnit.destroy({
    where: { name: { [Op.like]: "SEED-%" } },
    force: true,
  });
  if (delPackaging) logInfo(`Deleted ${delPackaging} packaging units.`);

  // 9. ProductVariants
  const delVariants = await ProductVariant.destroy({
    where: { sku: { [Op.like]: "SEED-%" } },
    force: true,
  });
  if (delVariants) logInfo(`Deleted ${delVariants} product variants.`);

  // 10. Products
  const delProducts = await Product.destroy({
    where: { displayId: { [Op.like]: "SEED-PRD-%" } },
    force: true,
  });
  if (delProducts) logInfo(`Deleted ${delProducts} products.`);

  // 11. Suppliers
  const delSuppliers = await Supplier.destroy({
    where: { displayId: { [Op.like]: "SEED-SUP-%" } },
    force: true,
  });
  if (delSuppliers) logInfo(`Deleted ${delSuppliers} suppliers.`);

  // 12. Delete inventory notifications (use SEED- prefix in message to avoid underscore wildcard issue)
  const delNotifs = await Notification.destroy({
    where: { message: { [Op.like]: "%SEED-%" }, type: { [Op.in]: ["low_stock", "out_of_stock", "expiring_soon", "expired", "overstock", "supplier_payment_due"] } },
    force: true,
  });
  if (delNotifs) logInfo(`Deleted ${delNotifs} inventory notifications.`);
}

// ============================================================
// PHASE 1: SUPPLIERS
// ============================================================

async function seedSuppliers() {
  logSection("1. Suppliers");

  const suppliers = [
    { displayId: "SEED-SUP-001", name: "Optical Vision Co.", phone: "55510001", email: "sales@opticalvision.test", address: "123 Lens St", contactPerson: "John Smith", taxNumber: "TAX001", openingBalance: 500, notes: TEST_TAG, isActive: true },
    { displayId: "SEED-SUP-002", name: "LensPro Ltd.", phone: "55510002", email: "info@lenspro.test", address: "456 Contact Ave", contactPerson: "Sarah Lee", taxNumber: "TAX002", openingBalance: 0, notes: TEST_TAG, isActive: true },
    { displayId: "SEED-SUP-003", name: "MedSupply Inc.", phone: "55510003", email: "orders@medsupply.test", address: "789 Medical Blvd", contactPerson: "Mike Brown", taxNumber: "TAX003", openingBalance: 1200, notes: TEST_TAG, isActive: true },
    { displayId: "SEED-SUP-004", name: "EquipTech", phone: "55510004", email: "support@equiptech.test", address: "321 Tech Park", contactPerson: "Lisa Wang", taxNumber: "TAX004", openingBalance: 0, notes: TEST_TAG, isActive: true },
    { displayId: "SEED-SUP-005", name: "PharmaDistrib", phone: "55510005", email: "contact@pharmadist.test", address: "654 Pharma Rd", contactPerson: "Ahmed Ali", taxNumber: "TAX005", openingBalance: 300, notes: TEST_TAG, isActive: false },
  ];

  const created = [];
  for (const s of suppliers) {
    const supplier = await Supplier.create(s);
    logOk(`Supplier: ${supplier.displayId} — ${supplier.name} (${supplier.isActive ? "active" : "inactive"}, balance: ${supplier.openingBalance})`);
    created.push(supplier);
  }

  return created;
}

// ============================================================
// PHASE 2: PRODUCTS + VARIANTS
// ============================================================

async function seedProductsAndVariants() {
  logSection("2. Products + Variants");

  const products = [
    { displayId: "SEED-PRD-001", name: "Classic Frame", category: "frames", costingMethod: "fifo", description: "Standard frame " + TEST_TAG, isActive: true },
    { displayId: "SEED-PRD-002", name: "Designer Gold Edition", category: "frames-luxury", costingMethod: "fifo", description: "Luxury frame " + TEST_TAG, isActive: true },
    { displayId: "SEED-PRD-003", name: "Daily Soft Lens", category: "contact-lenses", costingMethod: "fefo", description: "Daily disposable contact lenses " + TEST_TAG, isActive: true },
    { displayId: "SEED-PRD-004", name: "Refresh Plus", category: "drops", costingMethod: "average", description: "Lubricating eye drops " + TEST_TAG, isActive: true },
    { displayId: "SEED-PRD-005", name: "Examination Paper", category: "supplies", costingMethod: "fifo", description: "Disposable exam paper " + TEST_TAG, isActive: true },
    { displayId: "SEED-PRD-006", name: "Tonometer Probe", category: "equipment", costingMethod: "fifo", description: "Tonometer probe " + TEST_TAG, isActive: true },
    { displayId: "SEED-PRD-007", name: "Cleaning Cloth", category: "other", costingMethod: "fifo", description: "Microfiber cleaning cloth " + TEST_TAG, isActive: true },
    { displayId: "SEED-PRD-008", name: "Starter Kit", category: "other", costingMethod: "fifo", description: "Complete starter kit bundle " + TEST_TAG, isActive: true },
  ];

  const createdProducts = [];
  for (const p of products) {
    const product = await Product.create(p);
    logOk(`Product: ${product.displayId} — ${product.name} (${product.category}, ${product.costingMethod})`);
    createdProducts.push(product);
  }

  const variants = [
    // PRD-001 Classic Frame
    { productId: createdProducts[0].id, name: "Black/Medium", sku: "SEED-FRM-BLK-MD", sellPrice: 80, costPrice: 30, quantity: 25, minQuantity: 10, maxQuantity: 100, location: "Shelf A1", isActive: true },
    { productId: createdProducts[0].id, name: "Brown/Large", sku: "SEED-FRM-BRN-LG", sellPrice: 85, costPrice: 32, quantity: 5, minQuantity: 10, maxQuantity: 50, location: "Shelf A2", isActive: true },
    // PRD-002 Luxury Frame
    { productId: createdProducts[1].id, name: "Gold/Small", sku: "SEED-LUX-GLD-SM", sellPrice: 350, costPrice: 150, quantity: 3, minQuantity: 2, maxQuantity: 20, location: "Display Case", serialNumber: "SN-SEED-LUX-001", barcode: "1234567890123", isActive: true },
    // PRD-003 Contact Lenses
    { productId: createdProducts[2].id, name: "-2.00", sku: "SEED-CL-D-200", sellPrice: 30, costPrice: 12, quantity: 200, minQuantity: 50, maxQuantity: 500, location: "Drawer B1", isActive: true },
    { productId: createdProducts[2].id, name: "-3.00", sku: "SEED-CL-D-300", sellPrice: 30, costPrice: 12, quantity: 100, minQuantity: 50, maxQuantity: 500, location: "Drawer B2", isActive: true },
    { productId: createdProducts[2].id, name: "-4.00", sku: "SEED-CL-D-400", sellPrice: 30, costPrice: 12, quantity: 0, minQuantity: 50, maxQuantity: 500, location: "Drawer B3", isActive: true },
    // PRD-004 Eye Drops
    { productId: createdProducts[3].id, name: "15ml bottle", sku: "SEED-RP-15ML", sellPrice: 15, costPrice: 5, quantity: 60, minQuantity: 20, maxQuantity: 200, location: "Cabinet C1", discountPercentage: 10, discountValidUntil: daysFromNowDate(30), isActive: true },
    // PRD-005 Supplies
    { productId: createdProducts[4].id, name: "Box of 500", sku: "SEED-SUP-PAPER-500", sellPrice: 8, costPrice: 2, quantity: 40, minQuantity: 15, maxQuantity: 100, location: "Storage D1", isActive: true },
    // PRD-006 Equipment
    { productId: createdProducts[5].id, name: "Standard", sku: "SEED-EQP-TON-STD", sellPrice: 200, costPrice: 90, quantity: 8, minQuantity: 3, maxQuantity: 20, location: "Equipment Room", isActive: true },
    // PRD-007 Other
    { productId: createdProducts[6].id, name: "Microfiber", sku: "SEED-OTH-CLTH-MF", sellPrice: 3, costPrice: 0.50, quantity: 100, minQuantity: 30, maxQuantity: 300, location: "Shelf E1", isActive: true },
    // PRD-008 Bundle Product
    { productId: createdProducts[7].id, name: "Kit", sku: "SEED-BND-START-001", sellPrice: 120, costPrice: 50, quantity: 15, minQuantity: 5, maxQuantity: 50, location: "Shelf F1", isActive: true },
  ];

  const createdVariants = [];
  for (const v of variants) {
    const variant = await ProductVariant.create(v);
    logOk(`Variant: ${variant.sku} — ${variant.name} (qty: ${variant.quantity}, min: ${variant.minQuantity}, sell: $${variant.sellPrice})`);
    createdVariants.push(variant);
  }

  return { products: createdProducts, variants: createdVariants };
}

// ============================================================
// PHASE 3: PACKAGING UNITS
// ============================================================

async function seedPackagingUnits(variants) {
  logSection("3. Packaging Units");

  // Find variants by SKU
  const findBySku = (sku) => variants.find((v) => v.sku === sku);

  const units = [
    { productVariantId: findBySku("SEED-FRM-BLK-MD").id, name: "SEED-Piece", shortName: "pc", factor: 1, isBaseUnit: true, barcode: null, sellPrice: 80, isActive: true },
    { productVariantId: findBySku("SEED-CL-D-200").id, name: "SEED-Piece", shortName: "pc", factor: 1, isBaseUnit: true, barcode: null, sellPrice: 30, isActive: true },
    { productVariantId: findBySku("SEED-CL-D-200").id, name: "SEED-Box-10", shortName: "box", factor: 10, isBaseUnit: false, barcode: "BC-SEED-CL-BOX10", sellPrice: 280, isActive: true },
    { productVariantId: findBySku("SEED-CL-D-300").id, name: "SEED-Piece", shortName: "pc", factor: 1, isBaseUnit: true, barcode: null, sellPrice: 30, isActive: true },
    { productVariantId: findBySku("SEED-SUP-PAPER-500").id, name: "SEED-Piece", shortName: "pc", factor: 1, isBaseUnit: true, barcode: null, sellPrice: 8, isActive: true },
    { productVariantId: findBySku("SEED-SUP-PAPER-500").id, name: "SEED-Carton-50", shortName: "ctn", factor: 50, isBaseUnit: false, barcode: "BC-SEED-PAPER-CTN", sellPrice: 350, isActive: true },
    { productVariantId: findBySku("SEED-RP-15ML").id, name: "SEED-Piece", shortName: "pc", factor: 1, isBaseUnit: true, barcode: "BC-SEED-RP-15ML", sellPrice: 15, isActive: true },
  ];

  for (const u of units) {
    await PackagingUnit.create(u);
    logOk(`PackagingUnit: ${u.name} (factor: ${u.factor}, base: ${u.isBaseUnit}) for variantId: ${u.productVariantId}`);
  }
}

// ============================================================
// PHASE 4: BATCHES
// ============================================================

async function seedBatches(variants, suppliers) {
  logSection("4. Batches");

  const findBySku = (sku) => variants.find((v) => v.sku === sku);
  const supId = (idx) => suppliers[idx].id;

  const batches = [
    { productVariantId: findBySku("SEED-FRM-BLK-MD").id, batchNumber: "SEED-BATCH-A", quantity: 25, initialQuantity: 25, unitCost: 30, expiryDate: null, receivedDate: daysAgoDate(60), supplierId: supId(0), isActive: true },
    { productVariantId: findBySku("SEED-FRM-BRN-LG").id, batchNumber: "SEED-BATCH-B", quantity: 5, initialQuantity: 10, unitCost: 32, expiryDate: null, receivedDate: daysAgoDate(45), supplierId: supId(0), isActive: true },
    { productVariantId: findBySku("SEED-CL-D-200").id, batchNumber: "SEED-BATCH-C", quantity: 100, initialQuantity: 100, unitCost: 12, expiryDate: daysFromNowDate(20), receivedDate: daysAgoDate(10), supplierId: supId(1), isActive: true },
    { productVariantId: findBySku("SEED-CL-D-200").id, batchNumber: "SEED-BATCH-D", quantity: 100, initialQuantity: 100, unitCost: 11, expiryDate: daysAgoDate(5), receivedDate: daysAgoDate(90), supplierId: supId(1), isActive: true },
    { productVariantId: findBySku("SEED-CL-D-300").id, batchNumber: "SEED-BATCH-E", quantity: 100, initialQuantity: 100, unitCost: 12, expiryDate: daysFromNowDate(60), receivedDate: daysAgoDate(15), supplierId: supId(1), isActive: true },
    { productVariantId: findBySku("SEED-RP-15ML").id, batchNumber: "SEED-BATCH-F", quantity: 30, initialQuantity: 30, unitCost: 5, expiryDate: daysFromNowDate(200), receivedDate: daysAgoDate(120), supplierId: supId(2), isActive: true },
    { productVariantId: findBySku("SEED-RP-15ML").id, batchNumber: "SEED-BATCH-G", quantity: 30, initialQuantity: 30, unitCost: 4.5, expiryDate: daysFromNowDate(200), receivedDate: daysAgoDate(150), supplierId: supId(2), isActive: true },
    { productVariantId: findBySku("SEED-SUP-PAPER-500").id, batchNumber: "SEED-BATCH-H", quantity: 40, initialQuantity: 40, unitCost: 2, expiryDate: null, receivedDate: daysAgoDate(200), supplierId: supId(2), isActive: true },
    { productVariantId: findBySku("SEED-EQP-TON-STD").id, batchNumber: "SEED-BATCH-I", quantity: 8, initialQuantity: 8, unitCost: 90, expiryDate: null, receivedDate: daysAgoDate(35), supplierId: supId(3), isActive: true },
    { productVariantId: findBySku("SEED-OTH-CLTH-MF").id, batchNumber: "SEED-BATCH-J", quantity: 100, initialQuantity: 100, unitCost: 0.50, expiryDate: null, receivedDate: daysAgoDate(10), supplierId: supId(0), isActive: true },
    { productVariantId: findBySku("SEED-LUX-GLD-SM").id, batchNumber: "SEED-BATCH-K", quantity: 3, initialQuantity: 3, unitCost: 150, expiryDate: null, receivedDate: daysAgoDate(5), supplierId: supId(0), isActive: true },
    { productVariantId: findBySku("SEED-BND-START-001").id, batchNumber: "SEED-BATCH-L", quantity: 15, initialQuantity: 15, unitCost: 50, expiryDate: null, receivedDate: daysAgoDate(20), supplierId: supId(0), isActive: true },
  ];

  const createdBatches = [];
  for (const b of batches) {
    const batch = await Batch.create(b);
    const expiryInfo = b.expiryDate ? `expiry: ${b.expiryDate}` : "no expiry";
    logOk(`Batch: ${batch.batchNumber} (qty: ${batch.quantity}, cost: $${batch.unitCost}, ${expiryInfo})`);
    createdBatches.push(batch);
  }

  return createdBatches;
}

// ============================================================
// PHASE 5: STOCK MOVEMENTS
// ============================================================

async function seedStockMovements(variants, batches, adminUser) {
  logSection("5. Stock Movements");

  const findBySku = (sku) => variants.find((v) => v.sku === sku);
  const findByBatch = (bn) => batches.find((b) => b.batchNumber === bn);
  const userId = adminUser?.id || null;

  let movCounter = 0;
  async function makeMovement(variantId, batchId, type, reason, quantity, unitCost, referenceType, referenceId, note, movementDate) {
    movCounter++;
    const displayId = `SEED-MOV-${String(movCounter).padStart(4, "0")}`;
    await StockMovement.create({
      displayId, productVariantId: variantId, batchId, type, reason,
      quantity, unitCost, referenceType, referenceId, userId,
      note: (note || "") + " " + TEST_TAG, movementDate,
    });
    logOk(`Movement: ${displayId} (${type}/${reason}) qty:${quantity} ${note || ""}`);
  }

  // Opening stock (in/opening_stock) for each batch
  for (const b of batches) {
    await makeMovement(b.productVariantId, b.id, "in", "opening_stock",
      b.initialQuantity, Number(b.unitCost), "Manual", null,
      `Opening stock ${b.batchNumber}`, b.receivedDate);
  }

  // Sales (out/sale) — FRM-BLK-MD sold over time
  const frmBlkMd = findBySku("SEED-FRM-BLK-MD");
  const batchA = findByBatch("SEED-BATCH-A");
  await makeMovement(frmBlkMd.id, batchA.id, "out", "sale", 5, 30, "Invoice", null, "Sale batch A", daysAgoDate(30));
  await makeMovement(frmBlkMd.id, batchA.id, "out", "sale", 3, 30, "Invoice", null, "Sale batch A", daysAgoDate(20));
  await makeMovement(frmBlkMd.id, batchA.id, "out", "sale", 2, 30, "Invoice", null, "Sale batch A", daysAgoDate(10));

  // Sales — CL-D-200
  const clD200 = findBySku("SEED-CL-D-200");
  const batchC = findByBatch("SEED-BATCH-C");
  await makeMovement(clD200.id, batchC.id, "out", "sale", 10, 12, "Invoice", null, "Sale batch C", daysAgoDate(7));

  // Sales — RP-15ML
  const rp15ml = findBySku("SEED-RP-15ML");
  const batchF = findByBatch("SEED-BATCH-F");
  await makeMovement(rp15ml.id, batchF.id, "out", "sale", 5, 5, "Invoice", null, "Sale batch F", daysAgoDate(15));

  // Dispensing (out/dispensing) — RP-15ML used in exams
  await makeMovement(rp15ml.id, batchF.id, "out", "dispensing", 3, 5, "EyeExamination", null, "Exam dispensing batch F", daysAgoDate(5));

  // Damage (out/damage) — SUP-PAPER-500
  const supPaper = findBySku("SEED-SUP-PAPER-500");
  const batchH = findByBatch("SEED-BATCH-H");
  await makeMovement(supPaper.id, batchH.id, "out", "damage", 2, 2, "Manual", null, "Damaged box", daysAgoDate(3));

  // Adjustments (adjust/adjustment)
  await makeMovement(frmBlkMd.id, batchA.id, "adjust", "adjustment", 2, 30, "Manual", null, "Found extra stock", daysAgoDate(2));
  await makeMovement(clD200.id, batchC.id, "adjust", "adjustment", -1, 12, "Manual", null, "Correction -1", daysAgoDate(1));

  // Return (in/return)
  await makeMovement(frmBlkMd.id, batchA.id, "in", "return", 1, 30, "Invoice", null, "Customer return", daysAgoDate(4));

  // Recall (out/recall) — CL-D-200 batch D (expired)
  const batchD = findByBatch("SEED-BATCH-D");
  await makeMovement(clD200.id, batchD.id, "out", "recall", 5, 11, "Manual", null, "Recalled expired batch", daysAgoDate(2));
}

// ============================================================
// PHASE 6: PURCHASE ORDERS
// ============================================================

async function seedPurchaseOrders(variants, suppliers, adminUser) {
  logSection("6. Purchase Orders");

  const findBySku = (sku) => variants.find((v) => v.sku === sku);
  const userId = adminUser?.id || null;

  let poCounter = 0;
  async function createPO(supplierId, status, orderDate, receivedDate, items, note) {
    poCounter++;
    const displayId = `SEED-PO-${String(poCounter).padStart(3, "0")}`;
    let totalAmount = 0;
    for (const item of items) {
      totalAmount += item.quantity * item.unitCost;
    }
    const po = await PurchaseOrder.create({
      displayId, supplierId, status, totalAmount, orderDate, receivedDate,
      userId, note: (note || "") + " " + TEST_TAG,
    });
    for (const item of items) {
      await PurchaseOrderItem.create({
        purchaseOrderId: po.id,
        productVariantId: item.productVariantId,
        quantity: item.quantity,
        unitCost: item.unitCost,
        receivedQuantity: item.receivedQuantity || 0,
        receivedUnit: item.receivedUnit || "piece",
        batchNumber: item.batchNumber || null,
        expiryDate: item.expiryDate || null,
      });
    }
    logOk(`PO: ${displayId} (${status}, $${totalAmount}, ${items.length} items) — ${note || ""}`);
    return po;
  }

  // PO-001: Received — frames
  await createPO(suppliers[0].id, "received", daysAgoDate(60), daysAgoDate(58), [
    { productVariantId: findBySku("SEED-FRM-BLK-MD").id, quantity: 25, unitCost: 30, receivedQuantity: 25 },
    { productVariantId: findBySku("SEED-FRM-BRN-LG").id, quantity: 10, unitCost: 32, receivedQuantity: 10 },
  ], "Frames order from Optical Vision");

  // PO-002: Received — contact lenses
  await createPO(suppliers[1].id, "received", daysAgoDate(15), daysAgoDate(12), [
    { productVariantId: findBySku("SEED-CL-D-200").id, quantity: 200, unitCost: 12, receivedQuantity: 200, batchNumber: "SEED-BATCH-C", expiryDate: daysFromNowDate(20) },
    { productVariantId: findBySku("SEED-CL-D-300").id, quantity: 100, unitCost: 12, receivedQuantity: 100, batchNumber: "SEED-BATCH-E", expiryDate: daysFromNowDate(60) },
  ], "Contact lenses from LensPro");

  // PO-003: Received — drops + supplies
  await createPO(suppliers[2].id, "received", daysAgoDate(150), daysAgoDate(148), [
    { productVariantId: findBySku("SEED-RP-15ML").id, quantity: 60, unitCost: 5, receivedQuantity: 60 },
    { productVariantId: findBySku("SEED-SUP-PAPER-500").id, quantity: 40, unitCost: 2, receivedQuantity: 40 },
  ], "Drops and supplies from MedSupply");

  // PO-004: Ordered — equipment (not yet received)
  await createPO(suppliers[3].id, "ordered", daysAgoDate(3), null, [
    { productVariantId: findBySku("SEED-EQP-TON-STD").id, quantity: 10, unitCost: 90, receivedQuantity: 0 },
  ], "Equipment order from EquipTech — pending");

  // PO-005: Draft — luxury frame
  await createPO(suppliers[0].id, "draft", daysAgoDate(0), null, [
    { productVariantId: findBySku("SEED-LUX-GLD-SM").id, quantity: 5, unitCost: 150, receivedQuantity: 0 },
  ], "Draft order for luxury frames");

  // PO-006: Cancelled
  await createPO(suppliers[4].id, "cancelled", daysAgoDate(10), null, [
    { productVariantId: findBySku("SEED-OTH-CLTH-MF").id, quantity: 50, unitCost: 0.50, receivedQuantity: 0 },
  ], "Cancelled order from PharmaDistrib");
}

// ============================================================
// PHASE 7: SUPPLIER PAYMENTS
// ============================================================

async function seedSupplierPayments(suppliers, adminUser) {
  logSection("7. Supplier Payments");

  const userId = adminUser?.id || null;
  let payCounter = 0;
  async function createPayment(supplierId, amount, paymentDate, paymentMethod, reference, purchaseOrderId, note) {
    payCounter++;
    const displayId = `SEED-PAY-${String(payCounter).padStart(3, "0")}`;
    await SupplierPayment.create({
      displayId, supplierId, amount, paymentDate, paymentMethod,
      reference, purchaseOrderId, userId, note: (note || "") + " " + TEST_TAG,
    });
    logOk(`Payment: ${displayId} ($${amount}, ${paymentMethod}) — ${note || ""}`);
  }

  // PAY-001: Cash, linked to PO-001
  const po1 = await PurchaseOrder.findOne({ where: { displayId: "SEED-PO-001" } });
  await createPayment(suppliers[0].id, 750, daysAgoDate(55), "cash", "CASH-001", po1.id, "Payment for frames order");

  // PAY-002: Bank transfer, linked to PO-002
  const po2 = await PurchaseOrder.findOne({ where: { displayId: "SEED-PO-002" } });
  await createPayment(suppliers[1].id, 2400, daysAgoDate(10), "bank_transfer", "TRF-002", po2.id, "Payment for contact lenses");

  // PAY-003: Cash, partial payment for PO-003
  const po3 = await PurchaseOrder.findOne({ where: { displayId: "SEED-PO-003" } });
  await createPayment(suppliers[2].id, 500, daysAgoDate(145), "cash", "CASH-003", po3.id, "Partial payment for MedSupply");

  // PAY-004: Cheque, general payment (no PO)
  await createPayment(suppliers[0].id, 500, daysAgoDate(5), "cheque", "CHQ-004", null, "General payment to Optical Vision");

  // PAY-005: Bank transfer, another supplier
  await createPayment(suppliers[3].id, 200, daysAgoDate(2), "bank_transfer", "TRF-005", null, "Advance to EquipTech");
}

// ============================================================
// PHASE 8: EXAM CONSUMABLE RULES
// ============================================================

async function seedExamConsumableRules(variants) {
  logSection("8. Exam Consumable Rules");

  const findBySku = (sku) => variants.find((v) => v.sku === sku);

  const rules = [
    { examType: "examination", productVariantId: findBySku("SEED-RP-15ML").id, quantity: 1, isActive: true },
    { examType: "examination", productVariantId: findBySku("SEED-SUP-PAPER-500").id, quantity: 2, isActive: true },
    { examType: "consultation", productVariantId: findBySku("SEED-RP-15ML").id, quantity: 1, isActive: true },
    { examType: "follow-up", productVariantId: findBySku("SEED-OTH-CLTH-MF").id, quantity: 1, isActive: false },
  ];

  for (const r of rules) {
    await ExamConsumableRule.create(r);
    logOk(`Rule: examType=${r.examType}, variant=${r.productVariantId}, qty=${r.quantity} (${r.isActive ? "active" : "inactive"})`);
  }
}

// ============================================================
// PHASE 9: PRODUCT BUNDLES
// ============================================================

async function seedProductBundles(products, variants) {
  logSection("9. Product Bundles");

  const findBySku = (sku) => variants.find((v) => v.sku === sku);
  const starterKitProduct = products.find((p) => p.displayId === "SEED-PRD-008");

  const bundle = await ProductBundle.create({
    productId: starterKitProduct.id,
    description: "Complete starter kit: frame + lenses + cloth + drops " + TEST_TAG,
  });

  const bundleItems = [
    { bundleId: bundle.id, productVariantId: findBySku("SEED-FRM-BLK-MD").id, quantity: 1 },
    { bundleId: bundle.id, productVariantId: findBySku("SEED-CL-D-200").id, quantity: 2 },
    { bundleId: bundle.id, productVariantId: findBySku("SEED-OTH-CLTH-MF").id, quantity: 1 },
    { bundleId: bundle.id, productVariantId: findBySku("SEED-RP-15ML").id, quantity: 1 },
  ];

  for (const item of bundleItems) {
    await ProductBundleItem.create(item);
  }
  logOk(`Bundle: ${bundle.id} for product ${starterKitProduct.displayId} with ${bundleItems.length} items`);
}

// ============================================================
// PHASE 10: STOCKTAKING
// ============================================================

async function seedStocktaking(variants, batches, adminUser) {
  logSection("10. Stocktaking");

  const findBySku = (sku) => variants.find((v) => v.sku === sku);
  const findByBatch = (bn) => batches.find((b) => b.batchNumber === bn);
  const userId = adminUser?.id || null;

  // STK-001: Completed stocktaking
  const stk1 = await Stocktaking.create({
    displayId: "SEED-STK-001",
    status: "completed",
    startedAt: new Date(Date.now() - 30 * 86400000),
    completedAt: new Date(Date.now() - 29 * 86400000),
    userId,
    note: "Monthly stocktaking " + TEST_TAG,
  });

  const stk1Items = [
    // Exact match
    { stocktakingId: stk1.id, productVariantId: findBySku("SEED-FRM-BLK-MD").id, batchId: findByBatch("SEED-BATCH-A").id, systemQuantity: 25, countedQuantity: 25, difference: 0, note: "Exact match" },
    // Found extra (+2)
    { stocktakingId: stk1.id, productVariantId: findBySku("SEED-CL-D-200").id, batchId: findByBatch("SEED-BATCH-C").id, systemQuantity: 100, countedQuantity: 102, difference: 2, note: "Found 2 extra" },
    // Missing (-1)
    { stocktakingId: stk1.id, productVariantId: findBySku("SEED-RP-15ML").id, batchId: findByBatch("SEED-BATCH-F").id, systemQuantity: 30, countedQuantity: 29, difference: -1, note: "1 missing" },
    // Exact match
    { stocktakingId: stk1.id, productVariantId: findBySku("SEED-OTH-CLTH-MF").id, batchId: findByBatch("SEED-BATCH-J").id, systemQuantity: 100, countedQuantity: 100, difference: 0, note: "Exact match" },
    // Missing (-3)
    { stocktakingId: stk1.id, productVariantId: findBySku("SEED-SUP-PAPER-500").id, batchId: findByBatch("SEED-BATCH-H").id, systemQuantity: 40, countedQuantity: 37, difference: -3, note: "3 damaged" },
    // Exact match
    { stocktakingId: stk1.id, productVariantId: findBySku("SEED-EQP-TON-STD").id, batchId: findByBatch("SEED-BATCH-I").id, systemQuantity: 8, countedQuantity: 8, difference: 0, note: "Exact match" },
  ];

  for (const item of stk1Items) {
    await StocktakingItem.create(item);
  }
  logOk(`Stocktaking STK-001: completed with ${stk1Items.length} items (positive/negative/zero differences)`);

  // STK-002: In-progress stocktaking
  const stk2 = await Stocktaking.create({
    displayId: "SEED-STK-002",
    status: "in_progress",
    startedAt: new Date(Date.now() - 3600000),
    completedAt: null,
    userId,
    note: "Current stocktaking in progress " + TEST_TAG,
  });

  const stk2Items = [
    { stocktakingId: stk2.id, productVariantId: findBySku("SEED-FRM-BRN-LG").id, batchId: findByBatch("SEED-BATCH-B").id, systemQuantity: 5, countedQuantity: null, difference: null, note: null },
    { stocktakingId: stk2.id, productVariantId: findBySku("SEED-CL-D-300").id, batchId: findByBatch("SEED-BATCH-E").id, systemQuantity: 100, countedQuantity: null, difference: null, note: null },
    { stocktakingId: stk2.id, productVariantId: findBySku("SEED-LUX-GLD-SM").id, batchId: findByBatch("SEED-BATCH-K").id, systemQuantity: 3, countedQuantity: null, difference: null, note: null },
  ];

  for (const item of stk2Items) {
    await StocktakingItem.create(item);
  }
  logOk(`Stocktaking STK-002: in_progress with ${stk2Items.length} items (not yet counted)`);
}

// ============================================================
// PHASE 11: LINK INVOICE ITEMS TO INVENTORY
// ============================================================

async function seedInvoiceItemLinks(variants, batches) {
  logSection("11. Link InvoiceItems to Inventory (for P&L report)");

  const findBySku = (sku) => variants.find((v) => v.sku === sku);
  const findByBatch = (bn) => batches.find((b) => b.batchNumber === bn);

  // Find paid invoices from seed-patients.js (search all, not just 5)
  const paidInvoices = await Invoice.findAll({
    where: { invoiceStatus: "paid" },
    include: [{ association: "items" }],
    limit: 50,
  });

  if (paidInvoices.length === 0) {
    logErr("No paid invoices found — run seed-patients.js first");
    return;
  }

  let linkCount = 0;
  const linkMap = [
    { matchDesc: "Eye examination", variantSku: "SEED-RP-15ML", batchNumber: "SEED-BATCH-F", costAmount: 5 },
    { matchDesc: "Frame purchase", variantSku: "SEED-FRM-BLK-MD", batchNumber: "SEED-BATCH-A", costAmount: 30 },
    { matchDesc: "Contact lens", variantSku: "SEED-CL-D-200", batchNumber: "SEED-BATCH-C", costAmount: 12 },
    { matchDesc: "Consultation", variantSku: "SEED-RP-15ML", batchNumber: "SEED-BATCH-F", costAmount: 5 },
    { matchDesc: "Full eye examination", variantSku: "SEED-RP-15ML", batchNumber: "SEED-BATCH-F", costAmount: 5 },
  ];

  for (const inv of paidInvoices) {
    for (const item of inv.items) {
      const link = linkMap.find((m) =>
        item.description && item.description.toLowerCase().includes(m.matchDesc.toLowerCase())
      );
      if (link) {
        const variant = findBySku(link.variantSku);
        const batch = findByBatch(link.batchNumber);
        if (variant && batch) {
          await item.update({
            productVariantId: variant.id,
            batchId: batch.id,
            costAmount: link.costAmount,
            unit: "SEED-piece",
          });
          linkCount++;
          logOk(`Linked InvoiceItem #${item.id} (${item.description}) → variant ${variant.sku}, batch ${batch.batchNumber}, cost: $${link.costAmount}`);
        }
      }
    }
  }

  if (linkCount === 0) {
    // Fallback: link first item of first 3 paid invoices to a default variant
    const defaultVariant = findBySku("SEED-RP-15ML");
    const defaultBatch = findByBatch("SEED-BATCH-F");
    for (let i = 0; i < Math.min(3, paidInvoices.length); i++) {
      const items = paidInvoices[i].items;
      if (items && items.length > 0) {
        await items[0].update({
          productVariantId: defaultVariant.id,
          batchId: defaultBatch.id,
          costAmount: 5,
          unit: "SEED-piece",
        });
        linkCount++;
        logOk(`Linked InvoiceItem #${items[0].id} (fallback) → variant ${defaultVariant.sku}, cost: $5`);
      }
    }
  }

  logInfo(`Total linked invoice items: ${linkCount}`);
}

// ============================================================
// PHASE 12: INVENTORY NOTIFICATIONS
// ============================================================

async function seedInventoryNotifications() {
  logSection("12. Inventory Notifications");

  const notifs = [
    { type: "low_stock", title: "Low stock alert", message: "SEED-FRM-BRN-LG is below minimum quantity (5/10) " + TEST_TAG, isRead: false, entityId: null, entityType: null },
    { type: "out_of_stock", title: "Out of stock", message: "SEED-CL-D-400 is out of stock " + TEST_TAG, isRead: false, entityId: null, entityType: null },
    { type: "expiring_soon", title: "Expiring soon", message: "SEED-BATCH-C expires in 20 days " + TEST_TAG, isRead: false, entityId: null, entityType: null },
    { type: "expired", title: "Expired stock", message: "SEED-BATCH-D expired 5 days ago " + TEST_TAG, isRead: true, entityId: null, entityType: null },
    { type: "overstock", title: "Overstock detected", message: "SEED-SUP-PAPER-500 has no movement in 200 days " + TEST_TAG, isRead: false, entityId: null, entityType: null },
    { type: "supplier_payment_due", title: "Supplier payment due", message: "MedSupply Inc. has outstanding balance " + TEST_TAG, isRead: false, entityId: null, entityType: null },
  ];

  for (const n of notifs) {
    await Notification.create(n);
    logOk(`Notification: ${n.type} — ${n.title}`);
  }
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  console.log(`\n\x1b[1m\x1b[36m\u2550\u2550\u2550 Inventory Seed Script (Suppliers + Products + Batches + Movements + POs + Stocktaking) \u2550\u2550\u2550\x1b[0m\n`);

  const isClean = process.argv.includes("--clean");

  await sequelize.authenticate();
  logInfo("Database connected.");

  await sequelize.sync();
  logInfo("Database synced.");

  if (isClean) {
    await cleanSeedData();
    await sequelize.close();
    console.log(`\n\x1b[32mDone. Inventory seed data cleaned.\x1b[0m\n`);
    return;
  }

  // Clean first to avoid duplicates on re-run
  await cleanSeedData();

  // Get admin user (created by seed-patients.js)
  const adminUser = await User.findOne({ where: { username: "admin" } });
  if (!adminUser) {
    logErr("Admin user not found. Run seed-patients.js first.");
    await sequelize.close();
    process.exit(1);
  }

  // Run all phases in order
  const suppliers = await seedSuppliers();
  const { products, variants } = await seedProductsAndVariants();
  await seedPackagingUnits(variants);
  const batches = await seedBatches(variants, suppliers);
  await seedStockMovements(variants, batches, adminUser);
  await seedPurchaseOrders(variants, suppliers, adminUser);
  await seedSupplierPayments(suppliers, adminUser);
  await seedExamConsumableRules(variants);
  await seedProductBundles(products, variants);
  await seedStocktaking(variants, batches, adminUser);
  await seedInvoiceItemLinks(variants, batches);
  await seedInventoryNotifications();

  // Summary
  logSection("Summary");
  const totalSuppliers = await Supplier.count({ where: { displayId: { [Op.like]: "SEED-SUP-%" } }, paranoid: false });
  const totalProducts = await Product.count({ where: { displayId: { [Op.like]: "SEED-PRD-%" } }, paranoid: false });
  const totalVariants = await ProductVariant.count({ where: { sku: { [Op.like]: "SEED-%" } }, paranoid: false });
  const totalBatches = await Batch.count({ where: { batchNumber: { [Op.like]: "SEED-%" } }, paranoid: false });
  const totalMovements = await StockMovement.count({ where: { displayId: { [Op.like]: "SEED-MOV-%" } } });
  const totalPOs = await PurchaseOrder.count({ where: { displayId: { [Op.like]: "SEED-PO-%" } }, paranoid: false });
  const totalPOItems = await PurchaseOrderItem.count({ paranoid: false });
  const totalPayments = await SupplierPayment.count({ where: { displayId: { [Op.like]: "SEED-PAY-%" } }, paranoid: false });
  const totalRules = await ExamConsumableRule.count({ paranoid: false });
  const totalBundles = await ProductBundle.count({
    where: { productId: { [Op.in]: (await Product.findAll({ where: { displayId: { [Op.like]: "SEED-PRD-%" } }, attributes: ["id"], paranoid: false })).map(p => p.id) } },
    paranoid: false,
  });
  const totalPackaging = await PackagingUnit.count({ where: { name: { [Op.like]: "SEED-%" } }, paranoid: false });
  const totalStocktakings = await Stocktaking.count({ where: { displayId: { [Op.like]: "SEED-STK-%" } }, paranoid: false });
  const totalNotifs = await Notification.count({ where: { message: { [Op.like]: "%SEED-%" } } });

  logInfo(`Suppliers: ${totalSuppliers}`);
  logInfo(`Products: ${totalProducts}`);
  logInfo(`Product variants: ${totalVariants}`);
  logInfo(`Batches: ${totalBatches}`);
  logInfo(`Stock movements: ${totalMovements}`);
  logInfo(`Purchase orders: ${totalPOs}`);
  logInfo(`Supplier payments: ${totalPayments}`);
  logInfo(`Exam consumable rules: ${totalRules}`);
  logInfo(`Product bundles: ${totalBundles}`);
  logInfo(`Packaging units: ${totalPackaging}`);
  logInfo(`Stocktakings: ${totalStocktakings}`);
  logInfo(`Inventory notifications: ${totalNotifs}`);
  logInfo(`Test tag: "${TEST_TAG}" (use --clean to remove)`);

  await sequelize.close();
  console.log(`\n\x1b[32m\u2550\u2550\u2550 Inventory seed complete \u2550\u2550\u2550\x1b[0m\n`);
}

main().catch((err) => {
  console.error(`\n\x1b[31mSeed failed: ${err.message}\x1b[0m\n`);
  console.error(err.stack);
  process.exit(1);
});
