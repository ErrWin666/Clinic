const { setupTestDB, teardownTestDB } = require("../../helpers/setup");
const { withLock, acquire, SchedulerLock } = require("../../../src/utils/schedulerLock");

describe("schedulerLock", () => {
  beforeAll(async () => {
    await setupTestDB();
    await SchedulerLock.sync();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  afterEach(async () => {
    try {
      await SchedulerLock.destroy({ where: {}, truncate: true });
    } catch {
      // Table may already be dropped during teardown.
    }
  });

  it("acquires a lock and releases it", async () => {
    const handle = await acquire("test-job", 5000);
    expect(handle).not.toBeNull();
    const row = await SchedulerLock.findByPk("test-job");
    expect(row).not.toBeNull();
    await handle.release();
    expect(await SchedulerLock.findByPk("test-job")).toBeNull();
  });

  it("prevents a second concurrent acquisition", async () => {
    const first = await acquire("concurrent-job", 5000);
    expect(first).not.toBeNull();
    const second = await acquire("concurrent-job", 5000);
    expect(second).toBeNull();
    await first.release();
  });

  it("runs fn when the lock is available", async () => {
    const fn = jest.fn().mockResolvedValue(undefined);
    const ran = await withLock("withlock-job", fn, 5000);
    expect(ran).toBe(true);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(await SchedulerLock.findByPk("withlock-job")).toBeNull();
  });

  it("does not run fn when the lock is held", async () => {
    const first = await acquire("held-job", 5000);
    const fn = jest.fn().mockResolvedValue(undefined);
    const ran = await withLock("held-job", fn, 5000);
    expect(ran).toBe(false);
    expect(fn).not.toHaveBeenCalled();
    await first.release();
  });

  it("releases the lock even when fn throws", async () => {
    const fn = jest.fn().mockRejectedValue(new Error("boom"));
    await expect(withLock("throwing-job", fn, 5000)).rejects.toThrow("boom");
    expect(await SchedulerLock.findByPk("throwing-job")).toBeNull();
  });

  it("reclaims an expired lock", async () => {
    // Insert an expired lock manually.
    const past = new Date(Date.now() - 10000);
    await SchedulerLock.create({
      jobName: "expired-job",
      lockedAt: past,
      expiresAt: past,
      owner: "old-owner",
    });
    const handle = await acquire("expired-job", 5000);
    expect(handle).not.toBeNull();
    await handle.release();
  });

  it("should log warning when release fails", async () => {
    const handle = await acquire("release-error-job", 5000);
    expect(handle).not.toBeNull();
    const originalDestroy = SchedulerLock.destroy;
    SchedulerLock.destroy = jest.fn().mockRejectedValue(new Error("Release failed"));
    await handle.release();
    SchedulerLock.destroy = originalDestroy;
  });

  it("should use default ttlMs when not provided", async () => {
    const handle = await acquire("default-ttl-job");
    expect(handle).not.toBeNull();
    await handle.release();
  });
});
