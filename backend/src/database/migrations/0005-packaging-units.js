/**
 * Creates the `packaging_units` table and `stocktakings` + `stocktaking_items` tables,
 * and adds `unit` + `baseQuantity` columns to `invoice_items` and `receivedUnit` to
 * `purchase_order_items`. Also backfills a base packaging unit for each existing
 * ProductVariant that has a barcode, so legacy barcode lookups keep working.
 */

async function up({ sequelize }) {
  const queryInterface = sequelize.getQueryInterface();
  const tables = await queryInterface.showAllTables();

  // --- packaging_units ---
  if (!tables.includes("packaging_units")) {
    await queryInterface.createTable("packaging_units", {
      id: { type: sequelize.Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      productVariantId: {
        type: sequelize.Sequelize.INTEGER,
        allowNull: false,
        references: { model: "product_variants", key: "id" },
        onDelete: "CASCADE",
      },
      name: { type: sequelize.Sequelize.STRING(50), allowNull: false },
      shortName: { type: sequelize.Sequelize.STRING(20), allowNull: false },
      factor: { type: sequelize.Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
      isBaseUnit: { type: sequelize.Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      barcode: { type: sequelize.Sequelize.STRING(100), allowNull: true, unique: true },
      sellPrice: { type: sequelize.Sequelize.DECIMAL(10, 2), allowNull: true },
      isActive: { type: sequelize.Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      createdAt: { type: sequelize.Sequelize.DATE, allowNull: false },
      updatedAt: { type: sequelize.Sequelize.DATE, allowNull: false },
      deletedAt: { type: sequelize.Sequelize.DATE, allowNull: true },
    });
  }

  // --- stocktakings ---
  if (!tables.includes("stocktakings")) {
    await queryInterface.createTable("stocktakings", {
      id: { type: sequelize.Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      displayId: { type: sequelize.Sequelize.STRING, allowNull: false, unique: true },
      status: {
        type: sequelize.Sequelize.ENUM("draft", "in_progress", "completed", "cancelled"),
        allowNull: false,
        defaultValue: "draft",
      },
      startedAt: { type: sequelize.Sequelize.DATE, allowNull: true },
      completedAt: { type: sequelize.Sequelize.DATE, allowNull: true },
      userId: { type: sequelize.Sequelize.INTEGER, allowNull: true, references: { model: "users", key: "id" } },
      note: { type: sequelize.Sequelize.TEXT, allowNull: true },
      createdAt: { type: sequelize.Sequelize.DATE, allowNull: false },
      updatedAt: { type: sequelize.Sequelize.DATE, allowNull: false },
      deletedAt: { type: sequelize.Sequelize.DATE, allowNull: true },
    });
  }

  // --- stocktaking_items ---
  if (!tables.includes("stocktaking_items")) {
    await queryInterface.createTable("stocktaking_items", {
      id: { type: sequelize.Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      stocktakingId: {
        type: sequelize.Sequelize.INTEGER,
        allowNull: false,
        references: { model: "stocktakings", key: "id" },
        onDelete: "CASCADE",
      },
      productVariantId: {
        type: sequelize.Sequelize.INTEGER,
        allowNull: false,
        references: { model: "product_variants", key: "id" },
      },
      batchId: {
        type: sequelize.Sequelize.INTEGER,
        allowNull: true,
        references: { model: "batches", key: "id" },
      },
      systemQuantity: { type: sequelize.Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      countedQuantity: { type: sequelize.Sequelize.INTEGER, allowNull: true },
      difference: { type: sequelize.Sequelize.INTEGER, allowNull: true },
      note: { type: sequelize.Sequelize.TEXT, allowNull: true },
      createdAt: { type: sequelize.Sequelize.DATE, allowNull: false },
      updatedAt: { type: sequelize.Sequelize.DATE, allowNull: false },
    });
  }

  // --- invoice_items: add unit + baseQuantity ---
  if (tables.includes("invoice_items")) {
    const invoiceDesc = await queryInterface.describeTable("invoice_items");
    if (!invoiceDesc.unit) {
      await queryInterface.addColumn("invoice_items", "unit", {
        type: sequelize.Sequelize.STRING(50),
        allowNull: true,
        defaultValue: "piece",
      });
    }
    if (!invoiceDesc.baseQuantity) {
      await queryInterface.addColumn("invoice_items", "baseQuantity", {
        type: sequelize.Sequelize.INTEGER,
        allowNull: true,
      });
    }
  }

  // --- purchase_order_items: add receivedUnit ---
  if (tables.includes("purchase_order_items")) {
    const poDesc = await queryInterface.describeTable("purchase_order_items");
    if (!poDesc.receivedUnit) {
      await queryInterface.addColumn("purchase_order_items", "receivedUnit", {
        type: sequelize.Sequelize.STRING(50),
        allowNull: true,
        defaultValue: "piece",
      });
    }
  }

  // --- Backfill base packaging units for variants with existing barcodes ---
  if (tables.includes("packaging_units") && tables.includes("product_variants")) {
    const [variants] = await sequelize.query(
      "SELECT id, barcode, sellPrice FROM product_variants WHERE barcode IS NOT NULL AND barcode != '' AND isActive = 1"
    );
    for (const v of variants) {
      const [existing] = await sequelize.query(
        "SELECT id FROM packaging_units WHERE productVariantId = ? AND name = 'piece'",
        { replacements: [v.id] }
      );
      if (existing.length === 0) {
        await sequelize.query(
          "INSERT INTO packaging_units (productVariantId, name, shortName, factor, isBaseUnit, barcode, sellPrice, isActive, createdAt, updatedAt) VALUES (?, 'piece', 'pcs', 1, 1, ?, ?, 1, datetime('now'), datetime('now'))",
          { replacements: [v.id, v.barcode, v.sellPrice] }
        );
      }
    }
  }
}

async function down({ sequelize }) {
  const queryInterface = sequelize.getQueryInterface();
  const tables = await queryInterface.showAllTables();

  if (tables.includes("invoice_items")) {
    const desc = await queryInterface.describeTable("invoice_items");
    if (desc.baseQuantity) await queryInterface.removeColumn("invoice_items", "baseQuantity");
    if (desc.unit) await queryInterface.removeColumn("invoice_items", "unit");
  }
  if (tables.includes("purchase_order_items")) {
    const desc = await queryInterface.describeTable("purchase_order_items");
    if (desc.receivedUnit) await queryInterface.removeColumn("purchase_order_items", "receivedUnit");
  }
  if (tables.includes("stocktaking_items")) await queryInterface.dropTable("stocktaking_items");
  if (tables.includes("stocktakings")) {
    await queryInterface.dropTable("stocktakings");
  }
  if (tables.includes("packaging_units")) await queryInterface.dropTable("packaging_units");
}

module.exports = { up, down };
