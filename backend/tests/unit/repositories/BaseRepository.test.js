const BaseRepository = require("../../../src/repositories/BaseRepository");
const CustomError = require("../../../src/utils/CustomError");

describe("BaseRepository", () => {
  let repo, mockModel;

  beforeEach(() => {
    mockModel = {
      findByPk: jest.fn(),
      findAll: jest.fn(),
      findAndCountAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    };
    repo = new BaseRepository(mockModel);
  });

  describe("findById", () => {
    it("should return record when found", async () => {
      mockModel.findByPk.mockResolvedValue({ id: 1, name: "Test" });
      const result = await repo.findById(1);
      expect(result).toEqual({ id: 1, name: "Test" });
    });

    it("should throw CustomError when not found", async () => {
      mockModel.findByPk.mockResolvedValue(null);
      await expect(repo.findById(999)).rejects.toThrow(CustomError);
    });

    it("should pass options to findByPk", async () => {
      mockModel.findByPk.mockResolvedValue({ id: 1 });
      const opts = { include: ["assoc"] };
      await repo.findById(1, opts);
      expect(mockModel.findByPk).toHaveBeenCalledWith(1, opts);
    });
  });

  describe("findByIdOrNull", () => {
    it("should return record when found", async () => {
      mockModel.findByPk.mockResolvedValue({ id: 1 });
      const result = await repo.findByIdOrNull(1);
      expect(result).toEqual({ id: 1 });
    });

    it("should return null when not found", async () => {
      mockModel.findByPk.mockResolvedValue(null);
      const result = await repo.findByIdOrNull(999);
      expect(result).toBeNull();
    });

    it("should pass options", async () => {
      mockModel.findByPk.mockResolvedValue({ id: 1 });
      const opts = { include: ["assoc"] };
      await repo.findByIdOrNull(1, opts);
      expect(mockModel.findByPk).toHaveBeenCalledWith(1, opts);
    });
  });

  describe("findAll", () => {
    it("should call findAll with where and options", async () => {
      mockModel.findAll.mockResolvedValue([{ id: 1 }]);
      const result = await repo.findAll({ where: { active: true }, limit: 10 });
      expect(mockModel.findAll).toHaveBeenCalledWith({ where: { active: true }, limit: 10 });
      expect(result).toHaveLength(1);
    });

    it("should default where to empty object", async () => {
      mockModel.findAll.mockResolvedValue([]);
      await repo.findAll({});
      expect(mockModel.findAll).toHaveBeenCalledWith({ where: {} });
    });

    it("should handle no query at all", async () => {
      mockModel.findAll.mockResolvedValue([]);
      await repo.findAll();
      expect(mockModel.findAll).toHaveBeenCalledWith({ where: {} });
    });
  });

  describe("findAndCountAll", () => {
    it("should call findAndCountAll with where and options", async () => {
      mockModel.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });
      await repo.findAndCountAll({ where: { active: true }, offset: 0, limit: 10 });
      expect(mockModel.findAndCountAll).toHaveBeenCalledWith({ where: { active: true }, offset: 0, limit: 10 });
    });

    it("should default where to empty object", async () => {
      mockModel.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });
      await repo.findAndCountAll({});
      expect(mockModel.findAndCountAll).toHaveBeenCalledWith({ where: {} });
    });
  });

  describe("findOne", () => {
    it("should call findOne with options", async () => {
      mockModel.findOne.mockResolvedValue({ id: 1 });
      const result = await repo.findOne({ where: { name: "Test" } });
      expect(mockModel.findOne).toHaveBeenCalledWith({ where: { name: "Test" } });
      expect(result).toEqual({ id: 1 });
    });

    it("should handle default empty options", async () => {
      mockModel.findOne.mockResolvedValue(null);
      const result = await repo.findOne();
      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    it("should call model.create with data and options", async () => {
      mockModel.create.mockResolvedValue({ id: 1, name: "Created" });
      const result = await repo.create({ name: "Created" }, { transaction: {} });
      expect(mockModel.create).toHaveBeenCalledWith({ name: "Created" }, { transaction: {} });
      expect(result).toEqual({ id: 1, name: "Created" });
    });

    it("should handle default empty options", async () => {
      mockModel.create.mockResolvedValue({ id: 1 });
      await repo.create({ name: "Test" });
      expect(mockModel.create).toHaveBeenCalledWith({ name: "Test" }, {});
    });
  });

  describe("update", () => {
    it("should update record when found", async () => {
      const mockRecord = { update: jest.fn().mockResolvedValue({ id: 1, name: "Updated" }) };
      mockModel.findByPk.mockResolvedValue(mockRecord);
      const result = await repo.update(1, { name: "Updated" });
      expect(mockRecord.update).toHaveBeenCalledWith({ name: "Updated" }, {});
      expect(result).toEqual({ id: 1, name: "Updated" });
    });

    it("should throw when record not found", async () => {
      mockModel.findByPk.mockResolvedValue(null);
      await expect(repo.update(999, { name: "Updated" })).rejects.toThrow(CustomError);
    });

    it("should pass options to update", async () => {
      const mockRecord = { update: jest.fn().mockResolvedValue({ id: 1 }) };
      mockModel.findByPk.mockResolvedValue(mockRecord);
      const opts = { transaction: {} };
      await repo.update(1, { name: "X" }, opts);
      expect(mockModel.findByPk).toHaveBeenCalledWith(1, opts);
      expect(mockRecord.update).toHaveBeenCalledWith({ name: "X" }, opts);
    });
  });

  describe("delete", () => {
    it("should delete record when found", async () => {
      const mockRecord = { destroy: jest.fn().mockResolvedValue() };
      mockModel.findByPk.mockResolvedValue(mockRecord);
      const result = await repo.delete(1);
      expect(mockRecord.destroy).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it("should throw when record not found", async () => {
      mockModel.findByPk.mockResolvedValue(null);
      await expect(repo.delete(999)).rejects.toThrow(CustomError);
    });
  });

  describe("count", () => {
    it("should call model.count with where", async () => {
      mockModel.count.mockResolvedValue(5);
      const result = await repo.count({ active: true });
      expect(mockModel.count).toHaveBeenCalledWith({ where: { active: true } });
      expect(result).toBe(5);
    });

    it("should default where to empty object", async () => {
      mockModel.count.mockResolvedValue(0);
      await repo.count();
      expect(mockModel.count).toHaveBeenCalledWith({ where: {} });
    });
  });
});
