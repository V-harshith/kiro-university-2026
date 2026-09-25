import type { JsonLdInput, JsonLdBlock } from "./types.js";

/**
 * Validates that a required JsonLdInput field is a non-empty, non-whitespace string.
 * Throws an Error identifying the field if the check fails.
 */
function requireString(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(
      `buildJsonLd: "${fieldName}" must be a non-empty, non-whitespace string`,
    );
  }
  return value;
}

/**
 * Builds a schema.org LocalBusiness JSON-LD object from business details.
 *
 * Inputs:  JsonLdInput — businessName, city, primaryService, phone (all required),
 *          optional reviews array (max 100 Review objects)
 * Outputs: JsonLdBlock — plain, JSON-serialisable object conforming to schema.org LocalBusiness
 * Throws:  Error when any required field is absent/empty, or a Review is missing author/text
 */
export function buildJsonLd(input: JsonLdInput): JsonLdBlock {
  const name = requireString(input?.businessName, "businessName");
  const areaServed = requireString(input?.city, "city");
  const description = requireString(input?.primaryService, "primaryService");
  const telephone = requireString(input?.phone, "phone");

  const block: JsonLdBlock = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name,
    telephone,
    areaServed,
    description,
  };

  if (input.reviews !== undefined) {
    // Validate and map each review
    const reviewArray = input.reviews.map((r, i) => {
      if (typeof r?.author !== "string" || r.author.trim() === "") {
        throw new Error(
          `buildJsonLd: review at index ${i} is missing a valid "author" field`,
        );
      }
      if (typeof r?.text !== "string" || r.text.trim() === "") {
        throw new Error(
          `buildJsonLd: review at index ${i} is missing a valid "text" field`,
        );
      }
      return {
        "@type": "Review" as const,
        author: { "@type": "Person" as const, name: r.author },
        reviewBody: r.text,
      };
    });

    if (reviewArray.length > 0) {
      block.review = reviewArray;
    }
  }

  return block;
}
