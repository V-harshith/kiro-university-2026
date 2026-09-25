/**
 * Escapes a string for safe insertion into HTML markup.
 *
 * Inputs:  any string `s`
 * Outputs: a new string with &, <, >, ", ' replaced by their HTML entities
 * Throws:  TypeError when `s` is not a string
 */
export function escapeHtml(s: string): string {
  if (typeof s !== "string") {
    throw new TypeError(
      `escapeHtml expects a string, received ${typeof s}`,
    );
  }

  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
