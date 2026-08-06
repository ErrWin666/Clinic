/**
 * Adds `recoveryCodeHash` column to `users` for the admin password-recovery
 * feature. The column is nullable so existing rows are unaffected.
 */

async function up({ sequelize }) {
  const queryInterface = sequelize.getQueryInterface();
  const tables = await queryInterface.showAllTables();
  if (!tables.includes("users")) {
    // Table doesn't exist yet — baseline sync will create it with the column
    // already present (from the model definition). Nothing to do here.
    return;
  }
  const tableDesc = await queryInterface.describeTable("users");
  if (!tableDesc.recoveryCodeHash) {
    await queryInterface.addColumn("users", "recoveryCodeHash", {
      type: sequelize.Sequelize.STRING,
      allowNull: true,
    });
  }
}

async function down({ sequelize }) {
  const queryInterface = sequelize.getQueryInterface();
  const tableDesc = await queryInterface.describeTable("users");
  if (tableDesc.recoveryCodeHash) {
    await queryInterface.removeColumn("users", "recoveryCodeHash");
  }
}

module.exports = { up, down };
