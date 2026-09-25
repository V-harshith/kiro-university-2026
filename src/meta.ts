import type { MetaInput, MetaResult } from "./types.js";

const TITLE_MAX = 60;
const DESC_MAX = 155;

/**
 * Truncates `text` to at most `max` characters at the nearest word boundary
 * at or before `max`. Never cuts mid-word. Strips trailing whitespace/hyphens
 * from the result.
 *
 * Inputs:  text — any string, max — positive integer
 * Outputs: string of length ≤ max
 */
function truncateAtWord(text: string, max: number): string {
  if (text.length <= max) return text;
  // Slice to max then walk back to the last space
  const sliced = text.slice(0, max);
  const lastSpace = sliced.lastIndexOf(" ");
  if (lastSpace <= 0) {
    // No space found — hard-cut at max (only happens when a single token > max)
    return sliced.trimEnd();
  }
  return sliced.slice(0, lastSpace).trimEnd();
}

/**
 * Validates that a required MetaInput field is a non-empty, non-whitespace string.
 * Throws an Error identifying the field if the check fails.
 */
function requireString(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(
      `buildMeta: "${fieldName}" must be a non-empty, non-whitespace string`,
    );
  }
  return value;
}

/**
 * Generates an HTML title tag string and meta description from business details.
 *
 * Title template:  "<businessName> – <primaryService> in <city>"
 * - At most 60 characters; truncates at nearest word boundary.
 * - City is always preserved verbatim; businessName is truncated first when needed.
 *
 * Description template: "<businessName> offers <primaryService> in <city>. Contact us today."
 * - At most 155 characters; truncates at nearest word boundary.
 *
 * Inputs:  MetaInput — businessName, city, primaryService (all required), optional tone
 * Outputs: MetaResult — { title, description }
 * Throws:  Error when any required field is absent, empty, or not a string
 */
export function buildMeta(input: MetaInput): MetaResult {
  const businessName = requireString(input?.businessName, "businessName");
  const city = requireString(input?.city, "city");
  const primaryService = requireString(input?.primaryService, "primaryService");

  // --- Build title ---
  // Template: "<businessName> – <primaryService> in <city>"
  // City must always be preserved verbatim (R3.5, R3.11).
  // The fixed suffix around city is " in <city>" — we need to know how much
  // budget remains for the "<businessName> – <primaryService>" prefix.
  const citySuffix = ` in ${city}`;                // e.g. " in Austin"
  const budgetForPrefix = TITLE_MAX - citySuffix.length;

  let title: string;

  if (budgetForPrefix <= 0) {
    // City alone (with " in ") already exceeds budget — just use what fits.
    title = truncateAtWord(`in ${city}`, TITLE_MAX);
  } else {
    // Try fitting "<businessName> – <primaryService>"
    const fullPrefix = `${businessName} \u2013 ${primaryService}`;
    const prefix = truncateAtWord(fullPrefix, budgetForPrefix);

    if (prefix.length === 0) {
      // Even truncated prefix is empty — just use city
      title = truncateAtWord(`in ${city}`, TITLE_MAX);
    } else {
      title = `${prefix}${citySuffix}`;
    }
  }

  // Final safety clamp (should never be needed given the math above, but guards edge cases)
  if (title.length > TITLE_MAX) {
    title = truncateAtWord(title, TITLE_MAX);
  }

  // --- Build description ---
  const naturalDesc =
    `${businessName} offers ${primaryService} in ${city}. ` +
    `Contact us today for professional ${primaryService} services.`;
  const description = truncateAtWord(naturalDesc, DESC_MAX);

  return { title, description };
}
