"use strict";

async function up({ sequelize }) {
  const queryInterface = sequelize.getQueryInterface();
  const tables = await queryInterface.showAllTables();
  if (tables.includes("files")) {
    const fileCols = await queryInterface.describeTable("files");
    if (fileCols.patientId && fileCols.patientId.allowNull === false) {
      await queryInterface.changeColumn("files", "patientId", {
        type: sequelize.Sequelize.INTEGER,
        allowNull: true,
        references: { model: "patients", key: "id" },
      });
    }
  }
}

async function down({ sequelize }) {
  const queryInterface = sequelize.getQueryInterface();
  const tables = await queryInterface.showAllTables();
  if (tables.includes("files")) {
    await queryInterface.changeColumn("files", "patientId", {
      type: sequelize.Sequelize.INTEGER,
      allowNull: false,
      references: { model: "patients", key: "id" },
    });
  }
}

module.exports = { up, down };
