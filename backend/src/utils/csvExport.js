/**
 * Escape a single CSV field to prevent formula injection and quote-breakage.
 * Prefixes dangerous leading chars (=, +, -, @, tab, CR) with a single quote,
 * and wraps the value in double quotes, escaping inner double quotes.
 */
function escapeCsvField(value) {
  if (value == null) return '""';
  let str = String(value);
  if (/^[=+\-@\t\r]/.test(str)) {
    str = "'" + str;
  }
  str = str.replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Build a full CSV string from headers and rows arrays.
 * Every cell is escaped via escapeCsvField to prevent formula injection.
 */
function buildCSV(headers, rows) {
  const headerLine = headers.map(escapeCsvField).join(",");
  const dataLines = rows.map((row) => row.map(escapeCsvField).join(","));
  return [headerLine, ...dataLines].join("\n");
}

/**
 * Send a CSV response with BOM and proper headers.
 */
function sendCSV(res, csv, filename) {
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
  return res.send("\uFEFF" + csv);
}

module.exports = { escapeCsvField, buildCSV, sendCSV };
