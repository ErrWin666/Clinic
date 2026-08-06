/**
 * Adds `examType` column to `eye_examinations` table.
 * Used by ExamConsumableRule to auto-deduct consumables per exam type.
 */

async function up({ sequelize }) {
  const queryInterface = sequelize.getQueryInterface();
  const tables = await queryInterface.showAllTables();

  if (tables.includes("eye_examinations")) {
    const desc = await queryInterface.describeTable("eye_examinations");
    if (!desc.examType) {
      await queryInterface.addColumn("eye_examinations", "examType", {
        type: sequelize.Sequelize.STRING,
        allowNull: true,
        defaultValue: "general",
      });
    }
  }
}

async function down({ sequelize }) {
  const queryInterface = sequelize.getQueryInterface();
  const tables = await queryInterface.showAllTables();

  if (tables.includes("eye_examinations")) {
    const desc = await queryInterface.describeTable("eye_examinations");
    if (desc.examType) {
      await queryInterface.removeColumn("eye_examinations", "examType");
    }
  }
}

module.exports = { up, down };
