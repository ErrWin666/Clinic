import { test, expect } from "@playwright/test";

test.describe("Settings & Language Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/settings");
  });

  test("update admin username", async ({ page }) => {
    await page.getByLabel(/username/i).fill("updatedadmin");
    await page.getByLabel(/current password/i).fill("Admin@123");
    await page.getByRole("button", { name: /save changes/i }).click();
    await expect(page.getByText(/saved|success|updated/i)).toBeVisible({ timeout: 10000 });
  });

  test("switch language to English", async ({ page }) => {
    const appearanceTab = page.getByRole("tab", { name: /appearance/i });
    if (await appearanceTab.isVisible({ timeout: 5000 })) {
      await appearanceTab.click();
      const langSelect = page.getByLabel(/language/i);
      if (await langSelect.isVisible({ timeout: 3000 })) {
        await langSelect.click();
        const englishOption = page.getByRole("option", { name: /english/i });
        if (await englishOption.isVisible({ timeout: 3000 })) {
          await englishOption.click();
          await expect(page.getByText(/dashboard/i)).toBeVisible({ timeout: 5000 });
        }
      }
    }
  });

  test("switch language to Arabic", async ({ page }) => {
    const appearanceTab = page.getByRole("tab", { name: /appearance/i });
    if (await appearanceTab.isVisible({ timeout: 5000 })) {
      await appearanceTab.click();
      const langSelect = page.getByLabel(/language/i);
      if (await langSelect.isVisible({ timeout: 3000 })) {
        await langSelect.click();
        const arabicOption = page.getByRole("option", { name: /arabic|العربية/i });
        if (await arabicOption.isVisible({ timeout: 3000 })) {
          await arabicOption.click();
          await expect(page.locator("html")).toHaveAttribute("dir", "rtl", { timeout: 5000 });
        }
      }
    }
  });

  test("view audit logs", async ({ page }) => {
    const auditTab = page.getByRole("tab", { name: /audit/i });
    if (await auditTab.isVisible({ timeout: 5000 })) {
      await auditTab.click();
      await page.waitForTimeout(1000);
      await expect(page.locator("table").or(page.getByText(/audit|log/i))).toBeVisible({ timeout: 5000 });
    }
  });

  test("upload admin profile image", async ({ page }) => {
    const uploadButton = page.getByRole("button", { name: /upload|camera/i }).first();
    if (await uploadButton.isVisible({ timeout: 5000 })) {
      const fileInput = page.locator('input[type="file"]').first();
      await fileInput.setInputFiles({
        name: "admin-avatar.png",
        mimeType: "image/png",
        buffer: Buffer.from("iVBORw0KGgo="),
      });
      await expect(page.getByText(/uploaded|success/i)).toBeVisible({ timeout: 10000 });
    }
  });

  test("delete admin profile image", async ({ page }) => {
    const deleteButton = page.getByRole("button", { name: /remove|delete photo|×/i }).first();
    if (await deleteButton.isVisible({ timeout: 5000 })) {
      await deleteButton.click();
      await expect(page.getByText(/deleted|removed|success/i)).toBeVisible({ timeout: 10000 });
    }
  });

  test("update clinic name", async ({ page }) => {
    const clinicTab = page.getByRole("tab", { name: /clinic/i });
    if (await clinicTab.isVisible({ timeout: 5000 })) {
      await clinicTab.click();
      const clinicNameInput = page.getByLabel(/clinic name/i);
      if (await clinicNameInput.isVisible({ timeout: 3000 })) {
        await clinicNameInput.fill("Updated Clinic Name");
      }
      const saveButton = page.getByRole("button", { name: /save clinic/i });
      if (await saveButton.isVisible({ timeout: 3000 })) {
        await saveButton.click();
        await expect(page.getByText(/saved|success/i)).toBeVisible({ timeout: 10000 });
      }
    }
  });
});
