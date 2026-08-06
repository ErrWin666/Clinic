import { getUploadsUrl as getUploadsBaseUrl } from "./config";

export function getUploadsUrl(path?: string | null): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${getUploadsBaseUrl()}${cleanPath}`;
}
