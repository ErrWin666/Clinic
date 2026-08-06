import DOMPurify from "dompurify";

/**
 * Allowed HTML tags for rich-text content produced by the TipTap editor.
 * Mirrors the TipTap extensions enabled in `components/ui/editor`.
 */
const ALLOWED_TAGS = [
  "p", "br", "strong", "b", "em", "i", "u", "s", "del", "mark",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li",
  "blockquote", "pre", "code",
  "a", "img",
  "table", "thead", "tbody", "tr", "th", "td",
  "hr",
  "span", "div",
];

/**
 * Allowed HTML attributes. `class` is needed for TipTap's table/placeholder styling.
 */
const ALLOWED_ATTR = ["href", "target", "rel", "src", "alt", "title", "class", "colspan", "rowspan"];

/**
 * Sanitize HTML produced by the TipTap editor before it is persisted or rendered.
 * Strips event handlers (`onerror`, `onclick`, ...), `javascript:` URLs, and any
 * tag/attribute not in the allowlist.
 */
export function sanitizeEditorHTML(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    FORBID_ATTR: ["style", "onerror", "onclick", "onload", "onmouseover"],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|data:image\/(?:png|jpeg|jpg|gif|webp);base64,)/i,
  });
}
