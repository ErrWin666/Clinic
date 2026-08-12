const SENSITIVE_KEYS = [
  "authToken",
  "accessToken",
  "apiKey",
  "botToken",
  "password",
  "secret",
  "clientSecret",
];

const MASKED_VALUE = "***";

function maskSecrets(settings) {
  if (!settings || typeof settings !== "object") return settings;
  const masked = { ...settings };
  for (const key of Object.keys(masked)) {
    if (SENSITIVE_KEYS.includes(key)) {
      masked[key] = masked[key] ? MASKED_VALUE : "";
    }
  }
  return masked;
}

module.exports = { maskSecrets, SENSITIVE_KEYS, MASKED_VALUE };
