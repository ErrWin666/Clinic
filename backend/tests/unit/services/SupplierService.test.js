const { setupTestDB, teardownTestDB } = require("../../helpers/setup");
const { createTestSupplier } = require("../../helpers/factories");
const SupplierService = require("../../../src/services/SupplierService");
const CustomError = require("../../../src/utils/CustomError");

describe("SupplierService", () => {
  let service;

  beforeAll(async () => {
    await setupTestDB();
    service = new SupplierService();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe("create", () => {
    it("should create a supplier with valid data", async () => {
      const supplier = await service.create({
        name: "Acme Medical Supplies",
        phone: "5550000001",
        email: "contact@acme.com",
        address: "123 Industrial Blvd",
        contactPerson: "John Doe",
        taxNumber: "TAX-001",
        openingBalance: 1000,
      });
      expect(supplier).toBeDefined();
      expect(supplier.displayId).toMatch(/^SUP-/);
      expect(supplier.name).toBe("Acme Medical Supplies");
      expect(supplier.isActive).toBe(true);
    });

    it("should auto-generate displayId", async () => {
      const supplier = await service.create({ name: "Another Supplier" });
      expect(supplier.displayId).toMatch(/^SUP-/);
    });
  });

  describe("getById", () => {
    it("should return supplier by id with balance", async () => {
      const supplier = await createTestSupplier({ name: "GetById Supplier" });
      const found = await service.getById(supplier.id);
      expect(found.id).toBe(supplier.id);
      expect(found.balance).toBeDefined();
    });

    it("should throw 404 for non-existent supplier", async () => {
      await expect(service.getById(99999)).rejects.toThrow();
      try {
        await service.getById(99999);
      } catch (err) {
        expect(err.statusCode).toBe(404);
      }
    });
  });

  describe("list", () => {
    it("should list suppliers with pagination", async () => {
      await createTestSupplier({ name: "List Supplier 1" });
      await createTestSupplier({ name: "List Supplier 2" });
      const result = await service.list({ page: 1, pageSize: 10 });
      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.pagination).toBeDefined();
    });

    it("should filter by search term", async () => {
      await createTestSupplier({ name: "UniqueSearchName" });
      const result = await service.list({ search: "UniqueSearchName" });
      expect(result.rows.length).toBe(1);
      expect(result.rows[0].name).toBe("UniqueSearchName");
    });
  });

  describe("update", () => {
    it("should update supplier fields", async () => {
      const supplier = await createTestSupplier({ name: "Update Me" });
      const updated = await service.update(supplier.id, { address: "New Address" });
      expect(updated.address).toBe("New Address");
    });
  });

  describe("delete", () => {
    it("should soft delete supplier with zero balance", async () => {
      const supplier = await createTestSupplier({ name: "Delete Me", openingBalance: 0 });
      const result = await service.delete(supplier.id);
      expect(result.isActive).toBe(false);
    });

    it("should reject deletion when supplier has outstanding balance", async () => {
      const supplier = await createTestSupplier({ name: "Has Balance", openingBalance: 500 });
      await expect(service.delete(supplier.id)).rejects.toThrow();
    });
  });

  describe("getBalance", () => {
    it("should return opening balance for new supplier with no POs or payments", async () => {
      const supplier = await createTestSupplier({ openingBalance: 250 });
      const balance = await service.getBalance(supplier.id);
      expect(balance).toBe(250);
    });

    it("should throw for non-existent supplier", async () => {
      await expect(service.getBalance(99999)).rejects.toThrow();
    });
  });

  describe("getStatement", () => {
    it("should return statement for supplier", async () => {
      const supplier = await createTestSupplier({ name: "Statement Supplier", openingBalance: 100 });
      const statement = await service.getStatement(supplier.id);
      expect(statement.supplier).toBeDefined();
      expect(statement.openingBalance).toBe(100);
      expect(statement.currentBalance).toBeDefined();
      expect(statement.transactions).toBeDefined();
      expect(Array.isArray(statement.transactions)).toBe(true);
    });

    it("should throw 404 for non-existent supplier", async () => {
      await expect(service.getStatement(99999)).rejects.toThrow();
    });

    it("should throw 404 when findById returns null", async () => {
      jest.spyOn(service.repository, "findById").mockResolvedValueOnce(null);
      await expect(service.getStatement(1)).rejects.toThrow();
    });

    it("should return statement with date range filter", async () => {
      const supplier = await createTestSupplier({ name: "Date Range Supplier", openingBalance: 50 });
      const statement = await service.getStatement(supplier.id, "2026-01-01", "2026-12-31");
      expect(statement.supplier).toBeDefined();
      expect(statement.transactions).toBeDefined();
    });
  });
});
