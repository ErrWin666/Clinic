const config = {
  apiUrl: import.meta.env.VITE_API_URL || "/api",
  uploadsUrl: import.meta.env.VITE_UPLOADS_URL || "/uploads",
  appName: import.meta.env.VITE_APP_NAME || "Clinic Eye",
  defaultLanguage: (import.meta.env.VITE_DEFAULT_LANGUAGE as "ar" | "en") || "en",
  defaultCurrency: import.meta.env.VITE_DEFAULT_CURRENCY || "USD",
  defaultTheme: (import.meta.env.VITE_DEFAULT_THEME as "light" | "dark") || "light",
} as const;

// Dynamic URL overrides for Electron (set via IPC at bootstrap)
let resolvedApiUrl: string | null = null;
let resolvedUploadsUrl: string | null = null;

function setApiUrl(apiUrl: string): void {
  resolvedApiUrl = apiUrl;
}

function setUploadsUrl(uploadsUrl: string): void {
  resolvedUploadsUrl = uploadsUrl;
}

function getApiUrl(): string {
  return resolvedApiUrl ?? config.apiUrl;
}

function getUploadsUrl(): string {
  return resolvedUploadsUrl ?? config.uploadsUrl;
}

export { config, setApiUrl, setUploadsUrl, getApiUrl, getUploadsUrl };
