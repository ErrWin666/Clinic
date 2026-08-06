"use strict";

async function up({ sequelize }) {
  const queryInterface = sequelize.getQueryInterface();
  const tables = await queryInterface.showAllTables();
  if (!tables.includes("stock_movements")) return;

  // SQLite doesn't support IF NOT EXISTS on addIndex reliably — check first
  const indexes = await queryInterface.showIndex("stock_movements");
  const exists = indexes.some((idx) => idx.name === "stock_movements_type");
  if (!exists) {
    await queryInterface.addIndex("stock_movements", ["type"], {
      name: "stock_movements_type",
    });
  }
}

async function down({ sequelize }) {
  const queryInterface = sequelize.getQueryInterface();
  const tables = await queryInterface.showAllTables();
  if (!tables.includes("stock_movements")) return;
  const indexes = await queryInterface.showIndex("stock_movements");
  const exists = indexes.some((idx) => idx.name === "stock_movements_type");
  if (exists) {
    await queryInterface.removeIndex("stock_movements", "stock_movements_type");
  }
}

module.exports = { up, down };
