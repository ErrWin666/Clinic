/**
 * Financial calculation utilities.
 *
 * All money values are stored as DECIMAL(10,2) in the database.
 * In JavaScript, we use Number but always round to 2 decimals after
 * every multiplication or summation to avoid floating-point drift.
 *
 * Usage rules (per CODING_STANDARDS.md):
 * - NEVER do `qty * price` directly — use `multiplyQtyPrice(qty, price)`.
 * - NEVER do `arr.reduce((s, v) => s + v, 0)` for money — use `sumMoney(arr)`.
 * - ALWAYS round the final result with `roundTo2()` before returning to the client.
 *
 * @module utils/money
 */

/**
 * Round a value to 2 decimal places.
 *
 * Uses a small epsilon to counteract floating-point representation issues
 * (e.g., 1.005 * 100 = 100.49999... in raw JS).
 *
 * @param {number} value
 * @returns {number}
 */
function roundTo2(value) {
  const n = Number(value) || 0;
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Multiply a quantity by a unit price and round to 2 decimals.
 *
 * @example
 * multiplyQtyPrice(3, 2.5) // 7.5
 * multiplyQtyPrice(0.1, 0.2) // 0.02 (not 0.020000000000000004)
 *
 * @param {number} quantity
 * @param {number} unitPrice
 * @returns {number}
 */
function multiplyQtyPrice(quantity, unitPrice) {
  return roundTo2(Number(quantity) * Number(unitPrice));
}

/**
 * Sum an array of money values, accumulating in integer cents to avoid drift.
 *
 * @example
 * sumMoney([0.1, 0.2, 0.3]) // 0.6 (not 0.6000000000000001)
 *
 * @param {number[]} values
 * @returns {number}
 */
function sumMoney(values) {
  const totalCents = values.reduce(
    (sum, v) => sum + Math.round(Number(v) * 100),
    0
  );
  return totalCents / 100;
}

/**
 * Apply a tax rate (percentage) to an amount and round to 2 decimals.
 *
 * @example
 * applyTax(100, 15) // 15 (15% tax on 100)
 *
 * @param {number} amount - The base amount.
 * @param {number} taxRate - Tax rate as a percentage (e.g., 15 for 15%).
 * @returns {number}
 */
function applyTax(amount, taxRate) {
  return roundTo2((Number(amount) * Number(taxRate)) / 100);
}

/**
 * Subtract a discount from an amount and round to 2 decimals.
 *
 * @param {number} amount
 * @param {number} discountAmount
 * @returns {number}
 */
function applyDiscount(amount, discountAmount) {
  return roundTo2(Number(amount) - (Number(discountAmount) || 0));
}

/**
 * Calculate the gross margin percentage.
 *
 * @example
 * calculateMargin(100, 60) // 40 (40% margin)
 * calculateMargin(0, 0) // 0 (avoid division by zero)
 *
 * @param {number} revenue
 * @param {number} cost
 * @returns {number} Margin as a percentage, rounded to 2 decimals.
 */
function calculateMargin(revenue, cost) {
  if (Number(revenue) === 0) return 0;
  return roundTo2(((Number(revenue) - Number(cost)) / Number(revenue)) * 100);
}

/**
 * Compute the invoice total from its components.
 *
 * totalAmount = sum(itemTotals) + taxAmount - discountAmount
 *
 * @param {number[]} itemTotals - Array of line totals (quantity × unitPrice).
 * @param {number} taxAmount
 * @param {number} discountAmount
 * @returns {number}
 */
function computeInvoiceTotal(itemTotals, taxAmount, discountAmount) {
  const subtotal = sumMoney(itemTotals);
  return applyDiscount(subtotal + (Number(taxAmount) || 0), discountAmount);
}

/**
 * Convert a quantity from a packaging unit to base units (pieces).
 * Both values are integers, so the result is always an integer.
 *
 * @param {number} quantity - Quantity in the chosen unit.
 * @param {number} factor - Conversion factor (base units per chosen unit).
 * @returns {number} Quantity in base units.
 */
function convertToBase(quantity, factor) {
  return Number(quantity) * Number(factor);
}

module.exports = {
  roundTo2,
  multiplyQtyPrice,
  sumMoney,
  applyTax,
  applyDiscount,
  calculateMargin,
  computeInvoiceTotal,
  convertToBase,
};
