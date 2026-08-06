import { test, expect } from "@playwright/test";

test.describe("Dashboard Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
  });

  test("view dashboard stats", async ({ page }) => {
    await expect(page.getByText(/total patients/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/today.?s? appointments/i)).toBeVisible();
    await expect(page.getByText(/unpaid invoices/i)).toBeVisible();
    await expect(page.getByText(/monthly revenue/i)).toBeVisible();
  });

  test("charts render", async ({ page }) => {
    await page.waitForTimeout(2000);
    const chartCanvas = page.locator("canvas").or(page.locator("[data-chart]"));
    await expect(chartCanvas.first()).toBeVisible({ timeout: 10000 });
  });

  test("recent appointments section visible", async ({ page }) => {
    await expect(page.getByText(/recent appointments/i)).toBeVisible({ timeout: 10000 });
  });

  test("recent examinations section visible", async ({ page }) => {
    await expect(page.getByText(/recent examinations/i)).toBeVisible({ timeout: 10000 });
  });
});
