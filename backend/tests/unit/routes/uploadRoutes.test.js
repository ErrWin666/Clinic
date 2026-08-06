const request = require("supertest");
const express = require("express");

jest.mock("../../../src/middlewares/auth", () => (req, res, next) => {
  req.user = { id: 1, role: "admin" };
  next();
});

jest.mock("../../../src/utils/fileUpload", () => ({
  uploadImage: {
    single: jest.fn(() => (req, res, next) => {
      req.file = req.body._hasFile ? { filename: "test-img.png" } : undefined;
      delete req.body._hasFile;
      next();
    }),
  },
  verifyMagicBytes: (req, res, next) => next(),
}));

const uploadRoutes = require("../../../src/routes/uploadRoutes");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/upload", uploadRoutes);
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: { code: err.code || "INTERNAL_ERROR", message: err.message },
    message: err.isOperational ? err.message : "Internal server error",
  });
});

describe("uploadRoutes", () => {
  it("should return 400 when no file is provided", async () => {
    const res = await request(app).post("/upload/image").send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("should return image URL when file is uploaded", async () => {
    const res = await request(app)
      .post("/upload/image")
      .send({ _hasFile: true });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.src).toContain("/uploads/");
    expect(res.body.data.src).toContain("test-img.png");
  });

  it("should return admin path when no patientId in params", async () => {
    const res = await request(app)
      .post("/upload/image")
      .send({ _hasFile: true });
    expect(res.body.data.src).toContain("/uploads/admin/");
  });

  it("should return patient path when patientId is in params", async () => {
    const app2 = express();
    app2.use(express.json());
    app2.use(express.urlencoded({ extended: true }));
    app2.use("/patients/:patientId/upload", uploadRoutes);

    const res = await request(app2)
      .post("/patients/5/upload/image")
      .send({ _hasFile: true });
    expect(res.status).toBe(200);
    expect(res.body.data.src).toContain("/uploads/patients/5/");
  });
});
