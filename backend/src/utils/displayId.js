const { Op } = require("sequelize");
const CustomError = require("./CustomError");
const { likeOp } = require("./queryHelpers");

const MAX_RETRIES = 3;

async function generateDisplayId(model, prefix, options = {}) {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const where = { ...options.where };
    where.displayId = { [likeOp()]: `${prefix}-%` };
    const records = await model.findAll({
      ...options,
      where,
      attributes: ["displayId"],
      paranoid: false,
      raw: true,
    });
    let maxSeq = 0;
    for (const r of records) {
      const parts = r.displayId.split("-");
      const seq = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
    }
    const sequence = maxSeq + 1;
    const displayId = `${prefix}-${String(sequence).padStart(4, "0")}`;
    const existing = await model.findOne({ where: { displayId }, paranoid: false, transaction: options.transaction });
    if (!existing) return displayId;
  }
  throw new CustomError("Failed to generate unique displayId after retries", "DISPLAY_ID_GENERATION_FAILED", 500);
}

async function generateInvoiceDisplayId(model, options = {}) {
  const year = new Date().getFullYear();
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const where = { ...options.where };
    where.displayId = { [likeOp()]: `INV-${year}-%` };
    const records = await model.findAll({
      ...options,
      where,
      attributes: ["displayId"],
      paranoid: false,
      raw: true,
    });
    let maxSeq = 0;
    for (const r of records) {
      const parts = r.displayId.split("-");
      const seq = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
    }
    const sequence = maxSeq + 1;
    const displayId = `INV-${year}-${String(sequence).padStart(4, "0")}`;
    const existing = await model.findOne({ where: { displayId }, paranoid: false, transaction: options.transaction });
    if (!existing) return displayId;
  }
  throw new CustomError("Failed to generate unique invoice displayId after retries", "DISPLAY_ID_GENERATION_FAILED", 500);
}

module.exports = { generateDisplayId, generateInvoiceDisplayId };
