# Security Audit Report v2 — Full Frontend & Backend Review

**Date:** 2026-08-12  
**Scope:** `backend/` (Express + Sequelize), `frontend/` (React + TypeScript + Vite), `newapp/backend/`  
**Methodology:** OWASP API Top 10, Express Security Spec, React Security Spec, AWS Secrets Best Practices skill, Exa web search for latest 2024-2026 advisories  
**Previous fixes:** VULN-001 through VULN-007 (all implemented and verified)

---

## Executive Summary

After implementing the 7 security fixes from the first audit, a comprehensive second-pass review of both frontend and backend was conducted. **3 new findings** were identified — 1 High, 1 Medium, 1 Low. The codebase overall has strong security posture: Helmet, CORS allowlist, rate limiting, Joi validation with `stripUnknown`, RBAC, CSRF protection, credential masking, secure cookies, and no secrets in frontend bundles.

---

## New Findings

### VULN-008: `jwt.verify` does not pin algorithms array (High)

**Severity:** High  
**Rule:** EXPRESS-AUTH-001 / OWASP API2:2023  
**Location:** `backend/src/middlewares/auth.js:17`, `backend/src/services/AuthService.js:42,79`

**Evidence:**
```js
// auth.js:17
decoded = jwt.verify(token, authConfig.jwtSecret);

// AuthService.js:42
decoded = jwt.verify(refreshToken, authConfig.jwtRefreshSecret);
```

**Impact:** Without an explicit `algorithms` array, the `jsonwebtoken` library may accept tokens with `alg: none` or fall victim to RS256/HS256 confusion attacks. An attacker could forge tokens with an alternative algorithm and bypass authentication entirely.

**Fix:** Add `algorithms: ["HS256"]` to all `jwt.verify()` calls:
```js
jwt.verify(token, authConfig.jwtSecret, { algorithms: ["HS256"] });
```

**Mitigation:** The app uses HS256 for signing, so pinning to `["HS256"]` is the correct fix.

---

### VULN-009: `resolveUrl` in MarkdownDisplay allows `javascript:` and unsafe `data:` URLs (Medium)

**Severity:** Medium  
**Rule:** REACT-URL-001 / REACT-XSS-001  
**Location:** `frontend/src/components/common/MarkdownDisplay.tsx:19-31,135`

**Evidence:**
```tsx
// Line 20: data: URLs are allowed through
function resolveUrl(src: string): string {
  if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("data:")) {
    return src;
  }
  // ...
}

// Line 135: href rendered directly without scheme validation
<a href={href} target="_blank" rel="noopener noreferrer">
```

**Impact:** Markdown content (e.g., patient notes, clinic notes) can contain `[click me](javascript:alert(document.cookie))`. The `resolveUrl` function does not block `javascript:` scheme. While `react-markdown` by default strips `javascript:` URLs in its `urlTransform`, the custom `a` component renderer at line 135 passes `href` directly without sanitization. Additionally, `data:text/html,...` URLs could be used for XSS in the `href` attribute.

**Fix:** 
1. Add `javascript:`, `vbscript:`, and `data:text/html` scheme blocking in `resolveUrl`
2. Validate URL scheme before rendering in the `a` component
3. Only allow `http:`, `https:`, `mailto:`, relative paths, and `data:image/*` (for inline images)

---

### VULN-010: Telegram webhook secret comparison uses non-constant-time comparison (Low)

**Severity:** Low (defense-in-depth)  
**Rule:** EXPRESS-AUTH-001  
**Location:** `backend/src/routes/telegramRoutes.js:54`

**Evidence:**
```js
const received = req.headers["x-telegram-bot-api-secret-token"];
if (received !== secret) {
```

**Impact:** The `!==` operator is not constant-time, which could theoretically allow timing attacks to discover the webhook secret byte-by-byte. In practice, this is very difficult to exploit over network, but it's a best-practice violation.

**Fix:** Use `crypto.timingSafeEqual` for constant-time comparison:
```js
const crypto = require("crypto");
const received = Buffer.from(req.headers["x-telegram-bot-api-secret-token"] || "");
const expected = Buffer.from(secret);
if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) {
```

---

## Verified Secure (No Issues Found)

### Backend
- **SQL Injection:** No raw queries, no `sequelize.literal()`, no string concatenation in queries. All database access via Sequelize ORM with parameterized queries.
- **Mass Assignment:** `validate()` middleware uses `stripUnknown: true` — extra fields are stripped before reaching controllers.
- **Open Redirects:** No `res.redirect()` with user input found.
- **Rate Limiting:** Login (5 attempts/15min), refresh token (30/hour), API (200/min), recovery (3/hour) — all properly configured.
- **Error Handling:** Custom error handler does not leak stack traces in production (`isDev ? err.message : "Internal server error"`).
- **Cookie Security:** `httpOnly: true`, `secure` in production, `sameSite: strict` in production / `lax` in dev.
- **File Upload:** Magic bytes verification, filename sanitization (UUID-based), path traversal protection in backup download/restore.
- **CSRF Protection:** Origin/Referer validation with exceptions for safe methods, Electron, test env, and Telegram webhook.
- **Credential Masking:** All 4 messaging services mask secrets in API responses.
- **Per-Patient File Access:** RBAC-based `uploadAuth` middleware checks `files:read` / `notes:read` permissions.
- **Setup Endpoint:** Restricted to localhost with Electron exception.
- **Helmet:** Enabled with CSP (disabled for Electron same-origin), `x-powered-by` disabled.
- **`trust proxy`:** Configurable via env var, defaults to `false`.
- **Body Limits:** `express.json({ limit: serverConfig.bodyLimit })` configured.
- **Dependencies:** `package-lock.json` committed, `npm audit` available.

### Frontend
- **No secrets in bundle:** Only public config vars (`VITE_API_URL`, `VITE_APP_NAME`, etc.) — no API keys, tokens, or passwords.
- **Token storage:** Auth uses `withCredentials: true` (httpOnly cookies) — no tokens in `localStorage` or `sessionStorage`.
- **`dangerouslySetInnerHTML`:** Only 2 occurrences:
  1. `chart.tsx:95` — content from internal `THEMES` config, not user input. **Safe.**
  2. `editor/index.tsx:388` — `innerHTML` used for clipboard serialization, not rendering. **Safe.**
- **`innerHTML`:** Only in editor clipboard handler, not for rendering untrusted content. **Safe.**
- **`eval` / `new Function`:** No occurrences. **Safe.**
- **`document.write`:** No occurrences. **Safe.**
- **i18n `escapeValue: false`:** Safe in React — React escapes JSX interpolation by default.
- **URL navigation:** `window.location.reload()` only — no user-controlled redirects.
- **`localStorage`:** Only used for UI preferences (inventory guide progress), not for sensitive data.

### newapp/backend
- Only contains `uploadAuth.js`, `generalUploadRoutes.js`, and `routes/index.js` — all follow same security patterns as main backend.
- `generalUploadRoutes.js` has auth, RBAC (`notes:write`), magic bytes verification. **Safe.**

---

## Fix Priority

| ID | Severity | Effort | Description |
|---|---|---|---|
| VULN-008 | High | 3 lines | Pin JWT algorithms to `["HS256"]` |
| VULN-009 | Medium | ~15 lines | Block `javascript:`/`data:text/html` in markdown URL resolver |
| VULN-010 | Low | ~5 lines | Use `crypto.timingSafeEqual` for webhook secret |
