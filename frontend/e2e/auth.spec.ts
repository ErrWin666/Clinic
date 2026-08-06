import { test, expect } from "@playwright/test";

test.describe("Auth Flow", () => {
  test("login with valid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/username/i).fill("admin");
    await page.getByLabel(/password/i).fill("Admin@123");
    await page.getByRole("button", { name: /login/i }).click();
    await page.waitForURL("/dashboard");
    await expect(page).toHaveURL("/dashboard");
    await expect(page.getByRole("link", { name: /dashboard/i })).toBeVisible();
  });

  test("login with invalid credentials shows error", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/username/i).fill("admin");
    await page.getByLabel(/password/i).fill("wrongpassword");
    await page.getByRole("button", { name: /login/i }).click();
    await expect(page).toHaveURL("/login");
    await expect(page.getByText(/invalid username or password/i)).toBeVisible({ timeout: 10000 });
  });

  test("unauthenticated access redirects to login", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL("/login");
    await expect(page).toHaveURL("/login");
  });

  test("logout redirects to login", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/username/i).fill("admin");
    await page.getByLabel(/password/i).fill("Admin@123");
    await page.getByRole("button", { name: /login/i }).click();
    await page.waitForURL("/dashboard");

    await page.getByRole("button", { name: /logout/i }).click();
    await page.waitForURL("/login");
    await expect(page).toHaveURL("/login");
  });

  test("session persists on refresh", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/username/i).fill("admin");
    await page.getByLabel(/password/i).fill("Admin@123");
    await page.getByRole("button", { name: /login/i }).click();
    await page.waitForURL("/dashboard");

    await page.reload();
    await expect(page).toHaveURL("/dashboard");
  });

  test("authenticated user can't access /login", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/username/i).fill("admin");
    await page.getByLabel(/password/i).fill("Admin@123");
    await page.getByRole("button", { name: /login/i }).click();
    await page.waitForURL("/dashboard");

    await page.goto("/login");
    await page.waitForURL("/dashboard");
    await expect(page).toHaveURL("/dashboard");
  });
});
