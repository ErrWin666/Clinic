import i18n from "@/lib/i18n";

/**
 * Translate a Zod error message that may be an i18n key.
 * If the message looks like an i18n key (contains a dot and no spaces),
 * treat it as an i18n key and translate it. Otherwise return as-is.
 */
export function translateZodError(message: string | undefined): string {
  if (!message) return "";
  if (message.includes(".") && !message.includes(" ")) {
    return i18n.t(message);
  }
  return message;
}
