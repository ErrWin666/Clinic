/**
 * Adds inventory columns to `invoice_items` (productVariantId, batchId, costAmount)
 * to link invoice line items to inventory variants and batches.
 *
 * The new inventory tables (products, product_variants, batches, etc.) are
 * created automatically by sequelize.sync() — this migration only handles
 * the additive columns on the existing invoice_items table.
 */

async function up({ sequelize }) {
  const queryInterface = sequelize.getQueryInterface();
  const tables = await queryInterface.showAllTables();

  if (tables.includes("invoice_items")) {
    const desc = await queryInterface.describeTable("invoice_items");

    if (!desc.productVariantId) {
      await queryInterface.addColumn("invoice_items", "productVariantId", {
        type: sequelize.Sequelize.INTEGER,
        allowNull: true,
        references: { model: "product_variants", key: "id" },
      });
    }
    if (!desc.batchId) {
      await queryInterface.addColumn("invoice_items", "batchId", {
        type: sequelize.Sequelize.INTEGER,
        allowNull: true,
        references: { model: "batches", key: "id" },
      });
    }
    if (!desc.costAmount) {
      await queryInterface.addColumn("invoice_items", "costAmount", {
        type: sequelize.Sequelize.DECIMAL(10, 2),
        allowNull: true,
      });
    }
  }
}

async function down({ sequelize }) {
  const queryInterface = sequelize.getQueryInterface();
  const tables = await queryInterface.showAllTables();

  if (tables.includes("invoice_items")) {
    const desc = await queryInterface.describeTable("invoice_items");
    if (desc.costAmount) {
      await queryInterface.removeColumn("invoice_items", "costAmount");
    }
    if (desc.batchId) {
      await queryInterface.removeColumn("invoice_items", "batchId");
    }
    if (desc.productVariantId) {
      await queryInterface.removeColumn("invoice_items", "productVariantId");
    }
  }
}

module.exports = { up, down };
