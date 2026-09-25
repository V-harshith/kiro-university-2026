import { ValidationError } from "./types.js";
import type { BusinessInput, Tone, Review } from "./types.js";

const VALID_TONES = new Set<string>(["professional", "friendly", "casual"]);

/**
 * Validates and parses an unknown value as a BusinessInput.
 *
 * Inputs:  raw — the result of JSON.parse (unknown type)
 * Outputs: a fully typed BusinessInput when all required fields are valid
 * Throws:  ValidationError (field, message) for each missing/invalid required field;
 *          errors are collected and thrown together so the caller sees all failures at once.
 *          Also throws ValidationError for invalid optional fields (tone, reviews).
 */
export function validate(raw: unknown): BusinessInput {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    throw new ValidationError(
      "(root)",
      "Input must be a JSON object, not null, array, or primitive.",
    );
  }

  const obj = raw as Record<string, unknown>;
  const errors: ValidationError[] = [];

  /** Check that a required string field is present and non-empty. */
  function requireField(fieldName: string): string | undefined {
    const val = obj[fieldName];
    if (typeof val !== "string" || val.trim() === "") {
      errors.push(
        new ValidationError(
          fieldName,
          `"${fieldName}" is required and must be a non-empty string (got ${
            val === undefined ? "undefined" : JSON.stringify(val)
          })`,
        ),
      );
      return undefined;
    }
    return val;
  }

  const businessName = requireField("businessName");
  const city = requireField("city");
  const primaryService = requireField("primaryService");
  const phone = requireField("phone");

  if (errors.length > 0) {
    // Throw the first validation error (it names the offending field in its message).
    // The error message lists all failures so the caller sees the full picture.
    const combinedMessage = errors.map((e) => e.message).join("; ");
    const first = errors[0];
    const err = new ValidationError(first.field, combinedMessage);
    throw err;
  }

  // --- Optional: tone ---
  let tone: Tone | undefined;
  if (obj.tone !== undefined) {
    if (typeof obj.tone !== "string" || !VALID_TONES.has(obj.tone)) {
      throw new ValidationError(
        "tone",
        `"tone" must be one of "professional", "friendly", or "casual" (got ${JSON.stringify(
          obj.tone,
        )})`,
      );
    }
    tone = obj.tone as Tone;
  }

  // --- Optional: reviews ---
  let reviews: Review[] | undefined;
  if (obj.reviews !== undefined) {
    if (!Array.isArray(obj.reviews)) {
      throw new ValidationError(
        "reviews",
        `"reviews" must be an array (got ${typeof obj.reviews})`,
      );
    }
    if (obj.reviews.length > 100) {
      throw new ValidationError(
        "reviews",
        `"reviews" must contain at most 100 items (got ${obj.reviews.length})`,
      );
    }
    reviews = (obj.reviews as unknown[]).map((r, i) => {
      if (r === null || typeof r !== "object" || Array.isArray(r)) {
        throw new ValidationError(
          "reviews",
          `"reviews[${i}]" must be an object`,
        );
      }
      const rev = r as Record<string, unknown>;
      if (typeof rev.author !== "string" || (rev.author as string).trim() === "") {
        throw new ValidationError(
          "reviews",
          `"reviews[${i}].author" must be a non-empty string`,
        );
      }
      if (typeof rev.text !== "string" || (rev.text as string).trim() === "") {
        throw new ValidationError(
          "reviews",
          `"reviews[${i}].text" must be a non-empty string`,
        );
      }
      return { author: rev.author as string, text: rev.text as string };
    });
  }

  return {
    businessName: businessName!,
    city: city!,
    primaryService: primaryService!,
    phone: phone!,
    ...(tone !== undefined ? { tone } : {}),
    ...(reviews !== undefined ? { reviews } : {}),
  };
}
