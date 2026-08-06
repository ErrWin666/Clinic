import { describe, it, expect } from "vitest";
import { sanitizeEditorHTML } from "@/lib/sanitize";

describe("sanitizeEditorHTML", () => {
  it("allows basic formatting tags", () => {
    const input = "<p>Hello <strong>world</strong></p>";
    expect(sanitizeEditorHTML(input)).toBe(input);
  });

  it("strips script tags", () => {
    const input = "<p>safe</p><script>alert('xss')</script>";
    const result = sanitizeEditorHTML(input);
    expect(result).not.toContain("<script>");
    expect(result).toContain("safe");
  });

  it("strips event handler attributes", () => {
    const input = '<p onclick="alert(1)">text</p>';
    const result = sanitizeEditorHTML(input);
    expect(result).not.toContain("onclick");
  });

  it("strips javascript: URIs", () => {
    const input = '<a href="javascript:alert(1)">link</a>';
    const result = sanitizeEditorHTML(input);
    expect(result).not.toContain("javascript:");
  });

  it("allows https URLs", () => {
    const input = '<a href="https://example.com">link</a>';
    expect(sanitizeEditorHTML(input)).toBe(input);
  });

  it("allows mailto URLs", () => {
    const input = '<a href="mailto:test@example.com">email</a>';
    expect(sanitizeEditorHTML(input)).toBe(input);
  });

  it("allows data: image URLs", () => {
    const input = '<img src="data:image/png;base64,iVBOR=" alt="test">';
    const result = sanitizeEditorHTML(input);
    expect(result).toContain("data:image/png;base64,");
  });

  it("strips non-image data: URLs", () => {
    const input = '<a href="data:text/html,<script>alert(1)</script>">link</a>';
    const result = sanitizeEditorHTML(input);
    expect(result).not.toContain("data:text/html");
  });

  it("strips style attributes", () => {
    const input = '<p style="color: red">text</p>';
    const result = sanitizeEditorHTML(input);
    expect(result).not.toContain("style");
  });

  it("allows table elements", () => {
    const input = '<table><thead><tr><th>A</th></tr></thead><tbody><tr><td>1</td></tr></tbody></table>';
    expect(sanitizeEditorHTML(input)).toBe(input);
  });

  it("strips data attributes", () => {
    const input = '<p data-foo="bar">text</p>';
    const result = sanitizeEditorHTML(input);
    expect(result).not.toContain("data-foo");
  });

  it("allows class attribute", () => {
    const input = '<p class="highlight">text</p>';
    expect(sanitizeEditorHTML(input)).toBe(input);
  });

  it("strips iframe tags", () => {
    const input = '<iframe src="https://evil.com"></iframe><p>safe</p>';
    const result = sanitizeEditorHTML(input);
    expect(result).not.toContain("<iframe");
    expect(result).toContain("safe");
  });

  it("handles empty input", () => {
    expect(sanitizeEditorHTML("")).toBe("");
  });

  it("strips onerror on img tags", () => {
    const input = '<img src="x" onerror="alert(1)" alt="test">';
    const result = sanitizeEditorHTML(input);
    expect(result).not.toContain("onerror");
  });
});
