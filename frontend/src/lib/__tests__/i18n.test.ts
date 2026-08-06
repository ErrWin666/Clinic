import { describe, it, expect } from "vitest";
import en from "@/locales/en/common.json";
import ar from "@/locales/ar/common.json";

function getKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      return getKeys(value as Record<string, unknown>, fullKey);
    }
    return [fullKey];
  });
}

describe("i18n locale symmetry", () => {
  const enKeys = getKeys(en);
  const arKeys = getKeys(ar);

  it("should have the same number of keys", () => {
    expect(enKeys.length).toBe(arKeys.length);
  });

  it("should have matching keys between en and ar", () => {
    const enSet = new Set(enKeys);
    const arSet = new Set(arKeys);
    const missingInAr = enKeys.filter((k) => !arSet.has(k));
    const missingInEn = arKeys.filter((k) => !enSet.has(k));
    expect(missingInAr).toEqual([]);
    expect(missingInEn).toEqual([]);
  });
});
