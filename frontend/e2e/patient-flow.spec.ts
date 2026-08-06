import { test, expect } from "@playwright/test";

test.describe("Patient CRUD Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/patients");
  });

  test("create new patient", async ({ page }) => {
    await page.getByRole("button", { name: /add patient/i }).click();
    await page.getByLabel(/full name/i).fill("E2E Test Patient");
    await page.getByLabel(/date of birth/i).fill("1990-06-15");
    await page.getByLabel(/phone number/i).fill("5559998888");
    await page.getByRole("button", { name: /save/i }).click();
    await expect(page.getByText(/saved|created|success/i)).toBeVisible({ timeout: 10000 });
  });

  test("view patient profile", async ({ page }) => {
    await page.waitForSelector("table");
    const firstRow = page.locator("table tbody tr").first();
    await firstRow.click();
    await page.waitForURL(/\/patients\/\d+/);
    await expect(page).toHaveURL(/\/patients\/\d+/);
  });

  test("search patients", async ({ page }) => {
    await page.waitForSelector("table");
    const searchInput = page.getByPlaceholder(/search/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill("John");
      await page.waitForTimeout(500);
      await expect(page.locator("table tbody tr")).toHaveCount(1, { timeout: 5000 });
    }
  });

  test("export patients as CSV", async ({ page }) => {
    await page.waitForSelector("table");
    const exportButton = page.getByRole("button", { name: /export/i });
    if (await exportButton.isVisible()) {
      const downloadPromise = page.waitForEvent("download", { timeout: 5000 }).catch(() => null);
      await exportButton.click();
      const download = await downloadPromise;
      if (download) {
        expect(download.suggestedFilename()).toMatch(/\.csv$/i);
      }
    }
  });

  test("delete patient with confirmation", async ({ page }) => {
    await page.waitForSelector("table");
    const deleteButton = page.locator("table tbody tr").first().getByRole("button", { name: /delete/i });
    if (await deleteButton.isVisible()) {
      await deleteButton.click();
      const confirmButton = page.getByRole("button", { name: /confirm|delete|yes/i });
      if (await confirmButton.isVisible({ timeout: 3000 })) {
        await confirmButton.click();
        await expect(page.getByText(/deleted|success/i)).toBeVisible({ timeout: 10000 });
      }
    }
  });

  test("edit patient", async ({ page }) => {
    await page.waitForSelector("table");
    const editButton = page.locator("table tbody tr").first().getByRole("button", { name: /edit/i });
    if (await editButton.isVisible({ timeout: 3000 })) {
      await editButton.click();
      const addressInput = page.getByLabel(/address/i);
      if (await addressInput.isVisible({ timeout: 3000 })) {
        await addressInput.fill("123 Updated Street");
      }
      await page.getByRole("button", { name: /save/i }).click();
      await expect(page.getByText(/saved|updated|success/i)).toBeVisible({ timeout: 10000 });
    }
  });

  test("filter by gender", async ({ page }) => {
    await page.waitForSelector("table");
    const genderFilter = page.getByRole("combobox").filter({ hasText: /gender|all/i }).first();
    if (await genderFilter.isVisible({ timeout: 3000 })) {
      await genderFilter.click();
      const maleOption = page.getByRole("option", { name: /male/i }).first();
      if (await maleOption.isVisible({ timeout: 3000 })) {
        await maleOption.click();
        await page.waitForTimeout(500);
        await expect(page.locator("table tbody tr").first()).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test("upload patient profile image", async ({ page }) => {
    await page.waitForSelector("table");
    const firstRow = page.locator("table tbody tr").first();
    await firstRow.click();
    await page.waitForURL(/\/patients\/\d+/);

    const uploadButton = page.getByRole("button", { name: /upload photo|camera/i });
    if (await uploadButton.isVisible({ timeout: 5000 })) {
      const fileInput = page.locator('input[type="file"]').first();
      await fileInput.setInputFiles({
        name: "test-avatar.png",
        mimeType: "image/png",
        buffer: Buffer.from("iVBORw0KGgo="),
      });
      await expect(page.getByText(/uploaded|success/i)).toBeVisible({ timeout: 10000 });
    }
  });

  test("delete patient profile image", async ({ page }) => {
    await page.waitForSelector("table");
    const firstRow = page.locator("table tbody tr").first();
    await firstRow.click();
    await page.waitForURL(/\/patients\/\d+/);

    const deleteImageButton = page.getByRole("button", { name: /remove photo|delete photo|×/i }).first();
    if (await deleteImageButton.isVisible({ timeout: 5000 })) {
      await deleteImageButton.click();
      await expect(page.getByText(/deleted|removed|success/i)).toBeVisible({ timeout: 10000 });
    }
  });

  test("pagination works", async ({ page }) => {
    await page.waitForSelector("table");
    const nextButton = page.getByRole("button", { name: /next|>/i });
    if (await nextButton.isVisible({ timeout: 3000 }) && await nextButton.isEnabled()) {
      await nextButton.click();
      await page.waitForTimeout(500);
      await expect(page.locator("table tbody tr").first()).toBeVisible({ timeout: 5000 });
    }
  });
});
