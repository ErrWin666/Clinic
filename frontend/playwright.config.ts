import { defineConfig, devices } from "@playwright/test";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: "list",
  timeout: 60000,
  globalSetup: path.resolve(__dirname, "e2e/global-setup.ts"),
  globalSetupTimeout: 30000,
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "auth",
      testMatch: /auth\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], storageState: undefined },
    },
    {
      name: "authenticated",
      testIgnore: /auth\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/user.json",
      },
    },
  ],
  webServer: [
    {
      command: "node src/index.js",
      port: 3001,
      timeout: 15000,
      reuseExistingServer: true,
      cwd: path.resolve(__dirname, "../backend"),
      env: {
        NODE_ENV: "development",
        PORT: "3001",
        ACCESS_TOKEN_SECRET: "e2e-test-access-secret",
        REFRESH_TOKEN_SECRET: "e2e-test-refresh-secret",
        TOKEN_EXPIRATION: "1h",
        REFRESH_TOKEN_EXPIRATION: "7d",
      },
    },
    {
      command: "npm run dev",
      port: 5173,
      timeout: 30000,
      reuseExistingServer: true,
    },
  ],
});
