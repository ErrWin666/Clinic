import { describe, it, expect } from "vitest";
import { config } from "@/lib/config";

describe("config", () => {
  it("has apiUrl", () => {
    expect(config.apiUrl).toBeDefined();
    expect(typeof config.apiUrl).toBe("string");
  });

  it("has uploadsUrl", () => {
    expect(config.uploadsUrl).toBeDefined();
    expect(typeof config.uploadsUrl).toBe("string");
  });

  it("has appName", () => {
    expect(config.appName).toBeDefined();
    expect(typeof config.appName).toBe("string");
  });

  it("has defaultLanguage", () => {
    expect(config.defaultLanguage).toBeDefined();
    expect(["ar", "en"]).toContain(config.defaultLanguage);
  });

  it("has defaultCurrency", () => {
    expect(config.defaultCurrency).toBeDefined();
    expect(typeof config.defaultCurrency).toBe("string");
  });

  it("has defaultTheme", () => {
    expect(config.defaultTheme).toBeDefined();
    expect(["light", "dark"]).toContain(config.defaultTheme);
  });
});
