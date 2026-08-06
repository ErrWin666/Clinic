const { setupTestDB, teardownTestDB, createTestAdmin } = require("../../helpers/setup");
const auditLog = require("../../../src/middlewares/audit");
const { AuditLog } = require("../../../src/models");

async function waitForAuditLog(where, maxAttempts = 20) {
  for (let i = 0; i < maxAttempts; i++) {
    const log = await AuditLog.findOne({ where });
    if (log) return log;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  return null;
}

describe("audit middleware", () => {
  let req, res, next;

  beforeAll(async () => {
    await setupTestDB();
    await createTestAdmin();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(() => {
    next = jest.fn();
    req = {
      baseUrl: "/api/patients",
      method: "POST",
      body: { fullName: "Test" },
      params: {},
      ip: "127.0.0.1",
      user: { id: 1 },
    };
    res = {
      statusCode: 201,
      send: jest.fn(function (body) {
        return body;
      }),
    };
  });

  it("should create audit log on successful response", async () => {
    const middleware = auditLog("CREATE");
    middleware(req, res, next);

    expect(next).toHaveBeenCalled();

    // Simulate response
    res.send("response body");

    // Wait for async audit log creation (polls until it appears)
    const log = await waitForAuditLog({ action: "CREATE" });
    expect(log).not.toBeNull();
    expect(log.entity).toBe("patients");
    expect(log.action).toBe("CREATE");
  });

  it("should not create audit log on error response (status >= 300)", async () => {
    const countBefore = await AuditLog.count();
    const middleware = auditLog("UPDATE");
    res.statusCode = 400;
    middleware(req, res, next);
    res.send("error body");

    // Negative case: wait briefly to confirm no log was created
    await new Promise((resolve) => setTimeout(resolve, 30));

    const countAfter = await AuditLog.count();
    expect(countAfter).toBe(countBefore);
  });

  it("should handle req.params.id for entityId", async () => {
    req.params = { id: "42" };
    const middleware = auditLog("UPDATE");
    middleware(req, res, next);
    res.send("ok");

    const log = await waitForAuditLog({ action: "UPDATE", entityId: 42 });
    expect(log).toBeDefined();
  });

  it("should handle GET requests without changes", async () => {
    req.method = "GET";
    const middleware = auditLog("LIST");
    middleware(req, res, next);
    res.send("ok");

    const log = await waitForAuditLog({ action: "LIST" });
    expect(log).toBeDefined();
    expect(log.changes).toBeNull();
  });

  it("should handle requests without user", async () => {
    req.user = null;
    const middleware = auditLog("DELETE");
    req.params = { id: "5" };
    const middlewareFn = middleware(req, res, next);
    res.send("ok");

    const log = await waitForAuditLog({ action: "DELETE", entityId: 5 });
    expect(log).toBeDefined();
    expect(log.userId).toBeNull();
  });
});
