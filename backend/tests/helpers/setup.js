const { sequelize } = require("../../src/database");
const { connectDatabase, syncDatabase, closeDatabase } = require("../../src/database");

async function setupTestDB() {
  // Ensure connection is alive (previous suite may have closed it)
  try {
    await sequelize.authenticate();
  } catch {
    await connectDatabase();
  }
  // force: true drops and recreates all tables in dependency order
  await sequelize.sync({ force: true });
}

async function teardownTestDB() {
  // Close connection so next suite can reconnect cleanly
  await closeDatabase();
}

async function createTestAdmin() {
  const { User } = require("../../src/models");
  return User.create({
    username: "admin",
    password: "admin123",
    role: "admin",
    isAdmin: true,
  });
}

async function getAuthCookie(app) {
  const supertest = require("supertest");
  const agent = supertest.agent(app);
  await agent
    .post("/api/auth/login")
    .send({ username: "admin", password: "admin123" })
    .expect(200);
  return agent;
}

module.exports = { setupTestDB, teardownTestDB, createTestAdmin, getAuthCookie };
