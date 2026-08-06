import { chromium, type FullConfig } from "@playwright/test";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default async function globalSetup(_config: FullConfig) {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto("http://localhost:5173/login");
  await page.getByLabel(/username/i).fill("admin");
  await page.getByLabel(/password/i).fill("Admin@123");
  await page.getByRole("button", { name: /login/i }).click();
  await page.waitForURL("/dashboard");

  const authDir = path.join(__dirname, ".auth");
  if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });
  await page.context().storageState({ path: path.join(authDir, "user.json") });

  await browser.close();
}
