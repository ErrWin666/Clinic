"use strict";

async function up({ sequelize }) {
  const queryInterface = sequelize.getQueryInterface();
  const tables = await queryInterface.showAllTables();

  // Create clinic_notes table
  if (!tables.includes("clinic_notes")) {
    await queryInterface.createTable("clinic_notes", {
      id: { type: sequelize.Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      title: { type: sequelize.Sequelize.STRING(255), allowNull: true },
      content: { type: sequelize.Sequelize.TEXT, allowNull: false },
      userId: {
        type: sequelize.Sequelize.INTEGER,
        allowNull: false,
        references: { model: "users", key: "id" },
      },
      createdAt: { type: sequelize.Sequelize.DATE, allowNull: false },
      updatedAt: { type: sequelize.Sequelize.DATE, allowNull: false },
      deletedAt: { type: sequelize.Sequelize.DATE, allowNull: true },
    });
    await queryInterface.addIndex("clinic_notes", ["userId"]);
    await queryInterface.addIndex("clinic_notes", ["createdAt"]);
  }

  // Create patient_notes table
  if (!tables.includes("patient_notes")) {
    await queryInterface.createTable("patient_notes", {
      id: { type: sequelize.Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      patientId: {
        type: sequelize.Sequelize.INTEGER,
        allowNull: false,
        references: { model: "patients", key: "id" },
      },
      title: { type: sequelize.Sequelize.STRING(255), allowNull: true },
      content: { type: sequelize.Sequelize.TEXT, allowNull: false },
      userId: {
        type: sequelize.Sequelize.INTEGER,
        allowNull: false,
        references: { model: "users", key: "id" },
      },
      createdAt: { type: sequelize.Sequelize.DATE, allowNull: false },
      updatedAt: { type: sequelize.Sequelize.DATE, allowNull: false },
      deletedAt: { type: sequelize.Sequelize.DATE, allowNull: true },
    });
    await queryInterface.addIndex("patient_notes", ["patientId"]);
    await queryInterface.addIndex("patient_notes", ["userId"]);
    await queryInterface.addIndex("patient_notes", ["createdAt"]);
  }

  // Add clinicNoteId and patientNoteId columns to files table
  if (tables.includes("files")) {
  const fileCols = await queryInterface.describeTable("files");
    if (!fileCols.clinicNoteId) {
      await queryInterface.addColumn("files", "clinicNoteId", {
        type: sequelize.Sequelize.INTEGER,
        allowNull: true,
        references: { model: "clinic_notes", key: "id" },
      });
      await queryInterface.addIndex("files", ["clinicNoteId"]);
    }
    if (!fileCols.patientNoteId) {
      await queryInterface.addColumn("files", "patientNoteId", {
        type: sequelize.Sequelize.INTEGER,
        allowNull: true,
        references: { model: "patient_notes", key: "id" },
      });
      await queryInterface.addIndex("files", ["patientNoteId"]);
    }
  }
}

async function down({ sequelize }) {
  const queryInterface = sequelize.getQueryInterface();
  const tables = await queryInterface.showAllTables();

  if (tables.includes("files")) {
    const fileCols = await queryInterface.describeTable("files");
    if (fileCols.patientNoteId) {
      await queryInterface.removeColumn("files", "patientNoteId");
    }
    if (fileCols.clinicNoteId) {
      await queryInterface.removeColumn("files", "clinicNoteId");
    }
  }
  if (tables.includes("patient_notes")) {
    await queryInterface.dropTable("patient_notes");
  }
  if (tables.includes("clinic_notes")) {
    await queryInterface.dropTable("clinic_notes");
  }
}

module.exports = { up, down };
