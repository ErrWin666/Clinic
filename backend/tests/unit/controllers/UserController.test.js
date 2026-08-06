const UserController = require("../../../src/controllers/UserController");

jest.mock("../../../src/models", () => ({
  User: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
  },
}));

const { User } = require("../../../src/models");

describe("UserController", () => {
  let controller, req, res, next;

  beforeEach(() => {
    controller = new UserController();
    next = jest.fn();
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    req = { params: {}, query: {}, body: {} };
  });

  describe("list", () => {
    it("should return all users", async () => {
      User.findAll.mockResolvedValue([
        { id: 1, username: "admin", role: "admin", isAdmin: true },
      ]);
      await controller.list(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: expect.any(Array) })
      );
    });

    it("should call next on error", async () => {
      User.findAll.mockRejectedValue(new Error("DB error"));
      await controller.list(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("getById", () => {
    it("should return user by id", async () => {
      req.params.id = "1";
      User.findByPk.mockResolvedValue({ id: 1, username: "admin", role: "admin" });
      await controller.getById(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: expect.objectContaining({ id: 1 }) })
      );
    });

    it("should call next for non-existent user", async () => {
      req.params.id = "999";
      User.findByPk.mockResolvedValue(null);
      await controller.getById(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should call next for invalid id", async () => {
      req.params.id = "invalid";
      await controller.getById(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("create", () => {
    it("should create a new user", async () => {
      req.body = { username: "newuser", password: "pass123", role: "doctor" };
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue({ id: 2, username: "newuser", role: "doctor", isAdmin: false });
      await controller.create(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: expect.objectContaining({ id: 2 }) })
      );
    });

    it("should reject duplicate username", async () => {
      req.body = { username: "admin", password: "pass123", role: "admin" };
      User.findOne.mockResolvedValue({ id: 1, username: "admin" });
      await controller.create(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should reject invalid role", async () => {
      req.body = { username: "newuser", password: "pass123", role: "superadmin" };
      User.findOne.mockResolvedValue(null);
      await controller.create(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("update", () => {
    it("should update user", async () => {
      req.params.id = "1";
      req.body = { username: "updated", role: "doctor" };
      const mockUser = {
        id: 1, username: "admin", role: "admin", isAdmin: true,
        save: jest.fn(),
      };
      User.findByPk.mockResolvedValue(mockUser);
      await controller.update(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockUser.save).toHaveBeenCalled();
    });

    it("should update password when provided", async () => {
      req.params.id = "1";
      req.body = { password: "newpass123" };
      const mockUser = {
        id: 1, username: "admin", role: "admin", isAdmin: true,
        save: jest.fn(),
      };
      User.findByPk.mockResolvedValue(mockUser);
      await controller.update(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockUser.password).toBe("newpass123");
    });

    it("should not update role when role is invalid", async () => {
      req.params.id = "1";
      req.body = { role: "superadmin" };
      const mockUser = {
        id: 1, username: "admin", role: "admin", isAdmin: true,
        save: jest.fn(),
      };
      User.findByPk.mockResolvedValue(mockUser);
      await controller.update(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockUser.role).toBe("admin");
    });

    it("should update with no fields provided", async () => {
      req.params.id = "1";
      req.body = {};
      const mockUser = {
        id: 1, username: "admin", role: "admin", isAdmin: true,
        save: jest.fn(),
      };
      User.findByPk.mockResolvedValue(mockUser);
      await controller.update(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next for non-existent user", async () => {
      req.params.id = "999";
      req.body = { username: "updated" };
      User.findByPk.mockResolvedValue(null);
      await controller.update(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("delete", () => {
    it("should delete a user", async () => {
      req.params.id = "2";
      req.user = { id: 1 };
      User.findByPk.mockResolvedValue({
        id: 2, isAdmin: false, destroy: jest.fn(),
      });
      await controller.delete(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should reject self-deletion", async () => {
      req.params.id = "1";
      req.user = { id: 1 };
      await controller.delete(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should reject deleting last admin", async () => {
      req.params.id = "2";
      req.user = { id: 1 };
      User.findByPk.mockResolvedValue({ id: 2, isAdmin: true, destroy: jest.fn() });
      User.count.mockResolvedValue(1);
      await controller.delete(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should allow deleting admin when there are multiple admins", async () => {
      req.params.id = "2";
      req.user = { id: 1 };
      const mockDestroy = jest.fn();
      User.findByPk.mockResolvedValue({ id: 2, isAdmin: true, destroy: mockDestroy });
      User.count.mockResolvedValue(3);
      await controller.delete(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockDestroy).toHaveBeenCalled();
    });

    it("should call next for non-existent user", async () => {
      req.params.id = "999";
      req.user = { id: 1 };
      User.findByPk.mockResolvedValue(null);
      await controller.delete(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
