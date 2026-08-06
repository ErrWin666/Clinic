const {
  roundTo2,
  multiplyQtyPrice,
  sumMoney,
  applyTax,
  applyDiscount,
  calculateMargin,
  computeInvoiceTotal,
  convertToBase,
} = require("../../../src/utils/money");

describe("money utility", () => {
  describe("roundTo2", () => {
    it("rounds to 2 decimal places", () => {
      expect(roundTo2(1.005)).toBe(1.01);
      expect(roundTo2(1.004)).toBe(1);
      expect(roundTo2(2.345)).toBe(2.35);
      expect(roundTo2(2.344)).toBe(2.34);
    });

    it("handles string inputs", () => {
      expect(roundTo2("10.256")).toBe(10.26);
      expect(roundTo2("0.1")).toBe(0.1);
    });

    it("handles null/undefined gracefully", () => {
      expect(roundTo2(null)).toBe(0);
      expect(roundTo2(undefined)).toBe(0);
    });
  });

  describe("multiplyQtyPrice", () => {
    it("multiplies quantity by price correctly", () => {
      expect(multiplyQtyPrice(3, 2.5)).toBe(7.5);
      expect(multiplyQtyPrice(10, 0.99)).toBe(9.9);
    });

    it("avoids floating-point drift", () => {
      // 0.1 * 0.2 = 0.020000000000000004 in raw JS
      expect(multiplyQtyPrice(0.1, 0.2)).toBe(0.02);
      // 3 * 0.017 = 0.051 in raw JS
      expect(multiplyQtyPrice(3, 0.017)).toBe(0.05);
    });

    it("handles large quantities", () => {
      expect(multiplyQtyPrice(1000, 99.99)).toBe(99990);
      expect(multiplyQtyPrice(144, 2.5)).toBe(360);
    });
  });

  describe("sumMoney", () => {
    it("sums money values without drift", () => {
      expect(sumMoney([0.1, 0.2, 0.3])).toBe(0.6);
      expect(sumMoney([1.99, 2.99, 3.99])).toBe(8.97);
    });

    it("handles empty array", () => {
      expect(sumMoney([])).toBe(0);
    });

    it("handles single value", () => {
      expect(sumMoney([42.5])).toBe(42.5);
    });

    it("handles negative values", () => {
      expect(sumMoney([100, -30, -20])).toBe(50);
    });
  });

  describe("applyTax", () => {
    it("calculates tax amount from percentage", () => {
      expect(applyTax(100, 15)).toBe(15);
      expect(applyTax(50, 10)).toBe(5);
    });

    it("handles zero tax rate", () => {
      expect(applyTax(100, 0)).toBe(0);
    });

    it("rounds correctly", () => {
      expect(applyTax(33.33, 15)).toBe(5);
    });
  });

  describe("applyDiscount", () => {
    it("subtracts discount from amount", () => {
      expect(applyDiscount(100, 20)).toBe(80);
      expect(applyDiscount(50.5, 10.25)).toBe(40.25);
    });

    it("handles zero discount", () => {
      expect(applyDiscount(100, 0)).toBe(100);
    });
  });

  describe("calculateMargin", () => {
    it("calculates margin percentage", () => {
      expect(calculateMargin(100, 60)).toBe(40);
      expect(calculateMargin(200, 150)).toBe(25);
    });

    it("returns 0 for zero revenue", () => {
      expect(calculateMargin(0, 50)).toBe(0);
    });

    it("handles negative profit (loss)", () => {
      expect(calculateMargin(100, 120)).toBe(-20);
    });
  });

  describe("computeInvoiceTotal", () => {
    it("computes total = sum(items) + tax - discount", () => {
      const items = [10, 20, 30];
      expect(computeInvoiceTotal(items, 9, 5)).toBe(64); // 60 + 9 - 5
    });

    it("handles zero tax and discount", () => {
      expect(computeInvoiceTotal([100], 0, 0)).toBe(100);
    });

    it("handles undefined tax/discount", () => {
      expect(computeInvoiceTotal([50, 50], undefined, undefined)).toBe(100);
    });

    it("avoids floating-point drift in sum", () => {
      const items = [0.1, 0.1, 0.1];
      expect(computeInvoiceTotal(items, 0, 0)).toBe(0.3);
    });
  });

  describe("convertToBase", () => {
    it("converts quantity using factor", () => {
      expect(convertToBase(10, 12)).toBe(120); // 10 boxes × 12 = 120 pieces
      expect(convertToBase(5, 1)).toBe(5); // 5 pieces × 1 = 5 pieces
    });

    it("handles zero quantity", () => {
      expect(convertToBase(0, 144)).toBe(0);
    });
  });
});
