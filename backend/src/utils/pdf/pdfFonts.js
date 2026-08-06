const fs = require("fs");
const path = require("path");

// Load Amiri Arabic fonts once at module level (skip in test mode to avoid
// reading 750KB from disk on every worker — jspdf is mocked in tests anyway)
const isTest = process.env.NODE_ENV === "test";
let amiriFontBase64 = null;
let amiriBoldFontBase64 = null;
if (!isTest) {
  try {
    const fontPath = path.join(__dirname, "..", "..", "assets", "fonts", "Amiri-Regular.ttf");
    const fontBuffer = fs.readFileSync(fontPath);
    amiriFontBase64 = fontBuffer.toString("base64");
  } catch (_e) {
    // Font file not found — Arabic won't render properly but English will work
  }
  try {
    const boldPath = path.join(__dirname, "..", "..", "assets", "fonts", "Amiri-Bold.ttf");
    const boldBuffer = fs.readFileSync(boldPath);
    amiriBoldFontBase64 = boldBuffer.toString("base64");
  } catch (_e) {
    // Bold font not found — will fall back to regular
  }
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getMonth()] || ""} ${String(d.getDate()).padStart(2, "0")}, ${d.getFullYear()}`;
}

module.exports = {
  amiriFontBase64,
  amiriBoldFontBase64,
  formatDate,
};
