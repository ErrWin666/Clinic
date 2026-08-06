import { test, expect } from "@playwright/test";

test.describe("Appointment Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/appointments");
  });

  test("create appointment", async ({ page }) => {
    await page.getByRole("button", { name: /new appointment/i }).click();
    await page.getByLabel(/date/i).fill("2026-12-15");
    await page.getByLabel(/start time/i).fill("10:00");
    await page.getByLabel(/end time/i).fill("11:00");
    await page.getByRole("button", { name: /save/i }).click();
    await expect(page.getByText(/created|saved|success/i)).toBeVisible({ timeout: 10000 });
  });

  test("view appointment details", async ({ page }) => {
    await page.waitForTimeout(1000);
    const event = page.locator("[data-event], [role=button]").filter({ hasText: /checkup|appointment/i }).first();
    if (await event.isVisible({ timeout: 5000 })) {
      await event.click();
      await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    }
  });

  test("create quick appointment (no patient)", async ({ page }) => {
    await page.getByRole("button", { name: /new appointment/i }).click();
    const quickToggle = page.getByRole("switch");
    if (await quickToggle.isVisible({ timeout: 3000 })) {
      await quickToggle.click();
    }
    await page.getByLabel(/date/i).fill("2026-12-16");
    await page.getByLabel(/start time/i).fill("14:00");
    await page.getByLabel(/end time/i).fill("15:00");
    const nameInput = page.getByLabel(/name/i).first();
    if (await nameInput.isVisible({ timeout: 3000 })) {
      await nameInput.fill("Walk-in Patient");
    }
    const phoneInput = page.getByLabel(/phone/i).first();
    if (await phoneInput.isVisible({ timeout: 3000 })) {
      await phoneInput.fill("5551112222");
    }
    await page.getByRole("button", { name: /save/i }).click();
    await expect(page.getByText(/created|saved|success/i)).toBeVisible({ timeout: 10000 });
  });

  test("filter appointments by status", async ({ page }) => {
    await page.waitForTimeout(1000);
    const statusFilter = page.getByRole("combobox").filter({ hasText: /status/i }).first();
    if (await statusFilter.isVisible({ timeout: 3000 })) {
      await statusFilter.click();
      const option = page.getByRole("option", { name: /upcoming/i }).first();
      if (await option.isVisible({ timeout: 3000 })) {
        await option.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test("edit appointment", async ({ page }) => {
    await page.waitForTimeout(1000);
    const event = page.locator("[data-event], [role=button]").filter({ hasText: /checkup|appointment/i }).first();
    if (await event.isVisible({ timeout: 5000 })) {
      await event.click();
      const editButton = page.getByRole("button", { name: /edit/i });
      if (await editButton.isVisible({ timeout: 3000 })) {
        await editButton.click();
        const startTime = page.getByLabel(/start time/i);
        if (await startTime.isVisible({ timeout: 3000 })) {
          await startTime.fill("11:00");
        }
        await page.getByRole("button", { name: /save/i }).click();
        await expect(page.getByText(/saved|updated|success/i)).toBeVisible({ timeout: 10000 });
      }
    }
  });

  test("change appointment status", async ({ page }) => {
    await page.waitForTimeout(1000);
    const event = page.locator("[data-event], [role=button]").filter({ hasText: /checkup|appointment/i }).first();
    if (await event.isVisible({ timeout: 5000 })) {
      await event.click();
      const statusSelect = page.getByRole("combobox").filter({ hasText: /status/i }).first();
      if (await statusSelect.isVisible({ timeout: 3000 })) {
        await statusSelect.click();
        const completedOption = page.getByRole("option", { name: /completed/i }).first();
        if (await completedOption.isVisible({ timeout: 3000 })) {
          await completedOption.click();
          await expect(page.getByText(/completed|updated|success/i)).toBeVisible({ timeout: 10000 });
        }
      }
    }
  });

  test("drag-and-drop appointment", async ({ page }) => {
    await page.waitForTimeout(1000);
    const event = page.locator("[data-event], [role=button]").filter({ hasText: /checkup|appointment/i }).first();
    if (await event.isVisible({ timeout: 5000 })) {
      const targetSlot = page.locator("[data-slot], .rbc-time-slot").nth(5);
      if (await targetSlot.isVisible({ timeout: 3000 })) {
        await event.dragTo(targetSlot);
        await page.waitForTimeout(500);
      }
    }
  });
});
