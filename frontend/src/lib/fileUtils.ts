/**
 * Shared file utility functions used across file-related components.
 * Extracted to avoid duplication (DRY) across FileManager, NotesTab,
 * ExaminationAttachments, FilePreviewDialog, and BackupTab.
 */

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp"];

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Check if a file type (MIME type or extension) represents an image.
 * Handles both `"image/png"` and `"png"` formats.
 */
export function isImageType(type: string): boolean {
  const lower = type.toLowerCase();
  if (lower.startsWith("image/")) return true;
  const ext = lower.split(".").pop() ?? "";
  return IMAGE_EXTENSIONS.includes(ext);
}

/**
 * Check if a file type (MIME type or extension) represents a PDF.
 * Handles both `"application/pdf"` and `"pdf"` formats.
 */
export function isPdfType(type: string): boolean {
  const lower = type.toLowerCase();
  if (lower === "application/pdf") return true;
  const ext = lower.split(".").pop() ?? "";
  return ext === "pdf";
}

export function truncateFileName(name: string, maxLen = 28): string {
  if (name.length <= maxLen) return name;
  const ext = name.includes(".") ? name.split(".").pop() : "";
  const base = ext ? name.slice(0, name.length - ext.length - 1) : name;
  const keepStart = Math.min(base.length, Math.floor((maxLen - (ext ? ext.length + 4 : 3)) / 2));
  const keepEnd = Math.min(base.length, Math.ceil((maxLen - (ext ? ext.length + 4 : 3)) / 2));
  const shortened = base.slice(0, keepStart) + "…" + base.slice(base.length - keepEnd);
  return ext ? `${shortened}.${ext}` : shortened;
}
