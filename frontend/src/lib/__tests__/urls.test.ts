import { describe, it, expect } from "vitest";
import { getUploadsUrl } from "@/lib/urls";

describe("getUploadsUrl", () => {
  it("returns empty string for null", () => {
    expect(getUploadsUrl(null)).toBe("");
  });

  it("returns empty string for undefined", () => {
    expect(getUploadsUrl(undefined)).toBe("");
  });

  it("returns empty string for empty string", () => {
    expect(getUploadsUrl("")).toBe("");
  });

  it("returns http URL as-is", () => {
    expect(getUploadsUrl("http://example.com/img.jpg")).toBe(
      "http://example.com/img.jpg"
    );
  });

  it("returns https URL as-is", () => {
    expect(getUploadsUrl("https://example.com/img.jpg")).toBe(
      "https://example.com/img.jpg"
    );
  });

  it("prepends uploadsUrl for relative path without leading slash", () => {
    expect(getUploadsUrl("admin/img.jpg")).toBe("/uploads/admin/img.jpg");
  });

  it("prepends uploadsUrl for relative path with leading slash", () => {
    expect(getUploadsUrl("/admin/img.jpg")).toBe("/uploads/admin/img.jpg");
  });

  it("handles patients path", () => {
    expect(getUploadsUrl("patients/1/img.jpg")).toBe(
      "/uploads/patients/1/img.jpg"
    );
  });
});
