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

describe("Money Utils Edge Cases", () => {
  describe("roundTo2", () => {
    it("should round 1.005 to 1.01 (floating-point fix)", () => {
      expect(roundTo2(1.005)).toBe(1.01);
    });

    it("should round 2.675 to 2.68", () => {
      expect(roundTo2(2.675)).toBe(2.68);
    });

    it("should handle 0", () => {
      expect(roundTo2(0)).toBe(0);
    });

    it("should handle negative numbers", () => {
      expect(roundTo2(-1.005)).toBe(-1);
      expect(roundTo2(-10.555)).toBe(-10.55);
      expect(roundTo2(-10.556)).toBe(-10.56);
    });

    it("should handle undefined/null/NaN as 0", () => {
      expect(roundTo2(undefined)).toBe(0);
      expect(roundTo2(null)).toBe(0);
      expect(roundTo2(NaN)).toBe(0);
      expect(roundTo2("abc")).toBe(0);
    });

    it("should handle very large numbers", () => {
      expect(roundTo2(999999999.999)).toBe(1000000000.0);
    });

    it("should handle very small numbers", () => {
      expect(roundTo2(0.001)).toBe(0);
      expect(roundTo2(0.005)).toBe(0.01);
    });

    it("should handle string numbers", () => {
      expect(roundTo2("10.555")).toBe(10.56);
      expect(roundTo2("0.1")).toBe(0.1);
    });
  });

  describe("multiplyQtyPrice", () => {
    it("should multiply without floating-point drift", () => {
      expect(multiplyQtyPrice(0.1, 0.2)).toBe(0.02);
      expect(multiplyQtyPrice(3, 2.5)).toBe(7.5);
    });

    it("should handle zero quantity", () => {
      expect(multiplyQtyPrice(0, 100)).toBe(0);
    });

    it("should handle zero price", () => {
      expect(multiplyQtyPrice(10, 0)).toBe(0);
    });

    it("should handle fractional quantities", () => {
      expect(multiplyQtyPrice(1.5, 10)).toBe(15);
      expect(multiplyQtyPrice(0.25, 4)).toBe(1);
    });

    it("should handle large quantities and prices", () => {
      expect(multiplyQtyPrice(10000, 999.99)).toBe(9999900);
    });

    it("should handle negative values", () => {
      expect(multiplyQtyPrice(-5, 10)).toBe(-50);
    });
  });

  describe("sumMoney", () => {
    it("should sum without floating-point drift", () => {
      expect(sumMoney([0.1, 0.2, 0.3])).toBe(0.6);
    });

    it("should handle empty array", () => {
      expect(sumMoney([])).toBe(0);
    });

    it("should handle single value", () => {
      expect(sumMoney([42.5])).toBe(42.5);
    });

    it("should handle many small values", () => {
      const values = Array(100).fill(0.01);
      expect(sumMoney(values)).toBe(1);
    });

    it("should handle mixed positive and negative", () => {
      expect(sumMoney([100, -50, 25, -10])).toBe(65);
    });

    it("should handle string numbers", () => {
      expect(sumMoney(["10.5", "20.5"])).toBe(31);
    });
  });

  describe("applyTax", () => {
    it("should calculate 0% tax", () => {
      expect(applyTax(100, 0)).toBe(0);
    });

    it("should calculate 15% tax", () => {
      expect(applyTax(100, 15)).toBe(15);
    });

    it("should calculate tax on fractional amount", () => {
      expect(applyTax(33.33, 15)).toBe(5);
    });

    it("should handle 0 amount", () => {
      expect(applyTax(0, 15)).toBe(0);
    });

    it("should handle negative tax rate (discount scenario)", () => {
      expect(applyTax(100, -10)).toBe(-10);
    });
  });

  describe("applyDiscount", () => {
    it("should subtract discount from amount", () => {
      expect(applyDiscount(100, 20)).toBe(80);
    });

    it("should handle zero discount", () => {
      expect(applyDiscount(100, 0)).toBe(100);
    });

    it("should handle undefined discount as 0", () => {
      expect(applyDiscount(100, undefined)).toBe(100);
    });

    it("should handle full discount (100%)", () => {
      expect(applyDiscount(100, 100)).toBe(0);
    });

    it("should allow negative result (discount > amount)", () => {
      expect(applyDiscount(50, 100)).toBe(-50);
    });
  });

  describe("calculateMargin", () => {
    it("should calculate positive margin", () => {
      expect(calculateMargin(100, 60)).toBe(40);
    });

    it("should return 0 for zero revenue", () => {
      expect(calculateMargin(0, 0)).toBe(0);
      expect(calculateMargin(0, 50)).toBe(0);
    });

    it("should calculate negative margin (loss)", () => {
      expect(calculateMargin(100, 150)).toBe(-50);
    });

    it("should calculate 100% margin when cost is 0", () => {
      expect(calculateMargin(100, 0)).toBe(100);
    });
  });

  describe("computeInvoiceTotal", () => {
    it("should compute total with tax and discount", () => {
      const items = [100, 50, 25];
      const total = computeInvoiceTotal(items, 17.5, 10);
      // subtotal = 175, +tax 17.5 = 192.5, -discount 10 = 182.5
      expect(total).toBe(182.5);
    });

    it("should handle zero tax and discount", () => {
      const total = computeInvoiceTotal([100, 200], 0, 0);
      expect(total).toBe(300);
    });

    it("should handle empty items", () => {
      const total = computeInvoiceTotal([], 0, 0);
      expect(total).toBe(0);
    });

    it("should handle undefined tax/discount", () => {
      const total = computeInvoiceTotal([100], undefined, undefined);
      expect(total).toBe(100);
    });

    it("should handle discount larger than subtotal+tax", () => {
      const total = computeInvoiceTotal([50], 5, 100);
      expect(total).toBe(-45);
    });
  });

  describe("convertToBase", () => {
    it("should convert using factor", () => {
      expect(convertToBase(5, 12)).toBe(60);
    });

    it("should handle factor of 1 (base unit)", () => {
      expect(convertToBase(10, 1)).toBe(10);
    });

    it("should handle zero quantity", () => {
      expect(convertToBase(0, 12)).toBe(0);
    });

    it("should handle fractional quantity", () => {
      expect(convertToBase(0.5, 10)).toBe(5);
    });
  });
});
