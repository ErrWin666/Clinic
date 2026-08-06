const AuditLogController = require("../../../src/controllers/AuditLogController");

describe("AuditLogController", () => {
  let controller;
  let req, res, next;

  beforeEach(() => {
    controller = new AuditLogController();
    next = jest.fn();
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    req = { query: {} };
  });

  describe("list", () => {
    it("should return paginated audit logs", async () => {
      jest.spyOn(controller.auditLogService, "list").mockResolvedValue({
        rows: [{ id: 1, action: "CREATE" }],
        pagination: { totalItems: 1, currentPage: 1, totalPages: 1 },
      });
      await controller.list(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });

    it("should call next on error", async () => {
      jest.spyOn(controller.auditLogService, "list").mockRejectedValue(new Error("DB error"));
      await controller.list(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
