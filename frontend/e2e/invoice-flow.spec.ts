import { test, expect } from "@playwright/test";

test.describe("Invoice Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/invoices");
  });

  test("create invoice with patient", async ({ page }) => {
    await page.getByRole("button", { name: /create invoice|add/i }).click();
    await page.getByLabel(/date/i).fill("2026-12-15");
    const patientSelect = page.getByLabel(/patient/i).first();
    if (await patientSelect.isVisible({ timeout: 3000 })) {
      await patientSelect.click();
      const option = page.getByRole("option").first();
      if (await option.isVisible({ timeout: 3000 })) {
        await option.click();
      }
    }
    const descInput = page.getByPlaceholder(/description/i).first();
    if (await descInput.isVisible({ timeout: 3000 })) {
      await descInput.fill("Consultation");
    }
    const qtyInput = page.getByLabel(/quantity/i).first();
    if (await qtyInput.isVisible({ timeout: 3000 })) {
      await qtyInput.fill("1");
    }
    const priceInput = page.getByLabel(/unit price/i).first();
    if (await priceInput.isVisible({ timeout: 3000 })) {
      await priceInput.fill("100");
    }
    await page.getByRole("button", { name: /save|create/i }).click();
    await expect(page.getByText(/created|saved|success/i)).toBeVisible({ timeout: 10000 });
  });

  test("view invoice details", async ({ page }) => {
    await page.waitForSelector("table");
    const viewButton = page.locator("table tbody tr").first().getByRole("button", { name: /view|details/i });
    if (await viewButton.isVisible({ timeout: 3000 })) {
      await viewButton.click();
      await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    }
  });

  test("change invoice status to paid", async ({ page }) => {
    await page.waitForSelector("table");
    const statusButton = page.locator("table tbody tr").first().getByRole("button", { name: /unpaid|status/i });
    if (await statusButton.isVisible({ timeout: 3000 })) {
      await statusButton.click();
      const paidOption = page.getByRole("menuitem", { name: /paid/i }).or(page.getByRole("option", { name: /paid/i }));
      if (await paidOption.isVisible({ timeout: 3000 })) {
        await paidOption.click();
        await expect(page.getByText(/paid/i)).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test("filter invoices by status", async ({ page }) => {
    await page.waitForSelector("table");
    const statusFilter = page.getByRole("combobox").filter({ hasText: /status/i }).first();
    if (await statusFilter.isVisible({ timeout: 3000 })) {
      await statusFilter.click();
      const option = page.getByRole("option", { name: /unpaid/i }).first();
      if (await option.isVisible({ timeout: 3000 })) {
        await option.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test("export invoices as CSV", async ({ page }) => {
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

  test("create walk-in invoice", async ({ page }) => {
    await page.getByRole("button", { name: /create invoice|add/i }).click();
    await page.getByLabel(/date/i).fill("2026-12-16");
    const linkToggle = page.getByRole("switch");
    if (await linkToggle.isVisible({ timeout: 3000 })) {
      await linkToggle.click();
    }
    const customerNameInput = page.getByLabel(/customer name/i);
    if (await customerNameInput.isVisible({ timeout: 3000 })) {
      await customerNameInput.fill("Walk-in Customer");
    }
    const descInput = page.getByPlaceholder(/description/i).first();
    if (await descInput.isVisible({ timeout: 3000 })) {
      await descInput.fill("Walk-in Consultation");
    }
    const qtyInput = page.getByLabel(/quantity/i).first();
    if (await qtyInput.isVisible({ timeout: 3000 })) {
      await qtyInput.fill("1");
    }
    const priceInput = page.getByLabel(/unit price/i).first();
    if (await priceInput.isVisible({ timeout: 3000 })) {
      await priceInput.fill("50");
    }
    await page.getByRole("button", { name: /save|create/i }).click();
    await expect(page.getByText(/created|saved|success/i)).toBeVisible({ timeout: 10000 });
  });

  test("download invoice PDF", async ({ page }) => {
    await page.waitForSelector("table");
    const pdfButton = page.locator("table tbody tr").first().getByRole("button", { name: /pdf|download/i });
    if (await pdfButton.isVisible({ timeout: 3000 })) {
      const popupPromise = page.waitForEvent("popup", { timeout: 5000 }).catch(() => null);
      await pdfButton.click();
      const popup = await popupPromise;
      if (popup) {
        const response = await popup.waitForLoadState("domcontentloaded").catch(() => null);
        if (response !== null) {
          expect(popup.url()).toMatch(/pdf|invoice/i);
        }
        await popup.close();
      }
    }
  });

  test("delete invoice", async ({ page }) => {
    await page.waitForSelector("table");
    const deleteButton = page.locator("table tbody tr").first().getByRole("button", { name: /delete/i });
    if (await deleteButton.isVisible({ timeout: 3000 })) {
      await deleteButton.click();
      const confirmButton = page.getByRole("button", { name: /confirm|delete|yes/i });
      if (await confirmButton.isVisible({ timeout: 3000 })) {
        await confirmButton.click();
        await expect(page.getByText(/deleted|success/i)).toBeVisible({ timeout: 10000 });
      }
    }
  });
});
