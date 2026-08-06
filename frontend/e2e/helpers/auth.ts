import { test as base, expect, type Page } from "@playwright/test";

export const test = base.extend<{ authenticatedPage: Page }>({
  authenticatedPage: async ({ page }, use) => {
    await page.goto("/login");
    await page.getByLabel(/username/i).fill("admin");
    await page.getByLabel(/password/i).fill("Admin@123");
    await page.getByRole("button", { name: /login/i }).click();
    await page.waitForURL("/dashboard");
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(page);
  },
});

export { expect };
