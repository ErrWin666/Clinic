import { describe, it, expect } from "vitest";
import { getErrorI18nKey } from "@/lib/errorCodes";

describe("getErrorI18nKey", () => {
  it("returns correct key for INVALID_CREDENTIALS", () => {
    expect(getErrorI18nKey("INVALID_CREDENTIALS")).toBe(
      "errors.INVALID_CREDENTIALS"
    );
  });

  it("returns correct key for FORBIDDEN", () => {
    expect(getErrorI18nKey("FORBIDDEN")).toBe("errors.FORBIDDEN");
  });

  it("returns NETWORK_ERROR for undefined code", () => {
    expect(getErrorI18nKey(undefined)).toBe("errors.NETWORK_ERROR");
  });

  it("returns UNKNOWN_ERROR for unknown code", () => {
    expect(getErrorI18nKey("UNKNOWN_CODE")).toBe("errors.UNKNOWN_ERROR");
  });

  it("returns correct key for CHILD_TO_CHILD_RELATIONSHIP", () => {
    expect(getErrorI18nKey("CHILD_TO_CHILD_RELATIONSHIP")).toBe(
      "relationships.errors.childToChild"
    );
  });

  it("returns correct key for PATIENT_HAS_UNPAID_INVOICES", () => {
    expect(getErrorI18nKey("PATIENT_HAS_UNPAID_INVOICES")).toBe(
      "errors.PATIENT_HAS_UNPAID_INVOICES"
    );
  });

  it("returns correct key for DISPLAY_ID_GENERATION_FAILED", () => {
    expect(getErrorI18nKey("DISPLAY_ID_GENERATION_FAILED")).toBe(
      "errors.DISPLAY_ID_GENERATION_FAILED"
    );
  });

  it("returns correct key for PAYMENT_EXCEEDS_TOTAL", () => {
    expect(getErrorI18nKey("PAYMENT_EXCEEDS_TOTAL")).toBe(
      "errors.PAYMENT_EXCEEDS_TOTAL"
    );
  });

  it("returns correct key for DUPLICATE_USERNAME", () => {
    expect(getErrorI18nKey("DUPLICATE_USERNAME")).toBe(
      "errors.DUPLICATE_USERNAME"
    );
  });

  it("returns correct key for SELF_DELETE_FORBIDDEN", () => {
    expect(getErrorI18nKey("SELF_DELETE_FORBIDDEN")).toBe(
      "errors.SELF_DELETE_FORBIDDEN"
    );
  });

  it("returns correct key for LAST_ADMIN_FORBIDDEN", () => {
    expect(getErrorI18nKey("LAST_ADMIN_FORBIDDEN")).toBe(
      "errors.LAST_ADMIN_FORBIDDEN"
    );
  });

  it("returns correct key for OUTSIDE_WORKING_HOURS", () => {
    expect(getErrorI18nKey("OUTSIDE_WORKING_HOURS")).toBe(
      "errors.OUTSIDE_WORKING_HOURS"
    );
  });

  it("returns correct key for END_TIME_AFTER_START", () => {
    expect(getErrorI18nKey("END_TIME_AFTER_START")).toBe(
      "errors.END_TIME_AFTER_START"
    );
  });

  it("returns correct key for INVOICE_NOT_FOUND", () => {
    expect(getErrorI18nKey("INVOICE_NOT_FOUND")).toBe(
      "errors.INVOICE_NOT_FOUND"
    );
  });

  it("returns correct key for GUARDIAN_MINOR", () => {
    expect(getErrorI18nKey("GUARDIAN_MINOR")).toBe(
      "relationships.errors.guardianMinor"
    );
  });

  it("returns correct key for INVALID_STATUS_TRANSITION", () => {
    expect(getErrorI18nKey("INVALID_STATUS_TRANSITION")).toBe(
      "errors.INVALID_STATUS_TRANSITION"
    );
  });

  it("returns correct key for BACKUP_FAILED", () => {
    expect(getErrorI18nKey("BACKUP_FAILED")).toBe(
      "errors.BACKUP_FAILED"
    );
  });

  it("returns correct key for RESTORE_FAILED", () => {
    expect(getErrorI18nKey("RESTORE_FAILED")).toBe(
      "errors.RESTORE_FAILED"
    );
  });

  it("returns correct key for NO_SLOTS_AVAILABLE", () => {
    expect(getErrorI18nKey("NO_SLOTS_AVAILABLE")).toBe(
      "errors.NO_SLOTS_AVAILABLE"
    );
  });

  it("returns correct key for PATIENT_OR_QUICK_REQUIRED", () => {
    expect(getErrorI18nKey("PATIENT_OR_QUICK_REQUIRED")).toBe(
      "errors.PATIENT_OR_QUICK_REQUIRED"
    );
  });
});
