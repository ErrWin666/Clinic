module.exports = {
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.js"],
  maxWorkers: 1,
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/server.js",
    "!src/app.js",
    "!src/database/**",
  ],
  coverageDirectory: "coverage",
  forceExit: true,
  setupFiles: ["<rootDir>/tests/helpers/jest-setup.js"],
  coverageThreshold: {
    global: {
      statements: 90,
      branches: 90,
      functions: 90,
      lines: 90,
    },
  },
};
