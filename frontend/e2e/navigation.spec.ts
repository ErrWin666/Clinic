import { test, expect } from "@playwright/test";

test.describe("Navigation Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
  });

  test("navigate via sidebar to each page", async ({ page }) => {
    await page.getByRole("link", { name: /patients/i }).click();
    await page.waitForURL("/patients");
    await expect(page).toHaveURL("/patients");

    await page.getByRole("link", { name: /appointments/i }).click();
    await page.waitForURL("/appointments");
    await expect(page).toHaveURL("/appointments");

    await page.getByRole("link", { name: /invoices/i }).click();
    await page.waitForURL("/invoices");
    await expect(page).toHaveURL("/invoices");

    await page.getByRole("link", { name: /dashboard/i }).click();
    await page.waitForURL("/dashboard");
    await expect(page).toHaveURL("/dashboard");
  });

  test("active nav item highlighted", async ({ page }) => {
    await page.getByRole("link", { name: /patients/i }).click();
    await page.waitForURL("/patients");
    const patientsLink = page.getByRole("link", { name: /patients/i }).first();
    await expect(patientsLink).toHaveAttribute(/data-active|aria-current/i, /.*/);
  });

  test("navigate back via browser back button", async ({ page }) => {
    await page.getByRole("link", { name: /patients/i }).click();
    await page.waitForURL("/patients");
    await page.getByRole("link", { name: /dashboard/i }).click();
    await page.waitForURL("/dashboard");
    await page.goBack();
    await expect(page).toHaveURL("/patients");
  });

  test("direct URL access to patient profile", async ({ page }) => {
    await page.goto("/patients/1");
    await expect(page).toHaveURL("/patients/1");
    await expect(page.getByText(/overview|examinations|invoices/i)).toBeVisible({ timeout: 10000 });
  });
});
