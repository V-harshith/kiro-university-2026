import { describe, it } from "vitest";
import * as fc from "fast-check";
import { buildJsonLd } from "../jsonld.js";

/** Non-empty, non-whitespace string of 1–500 characters. */
const fieldArb = fc
  .string({ minLength: 1, maxLength: 500 })
  .filter((s) => s.trim().length > 0);

/** Valid Review arbitrary. */
const reviewArb = fc.record({
  author: fieldArb,
  text: fieldArb,
});

/** Valid JsonLdInput arbitrary (no reviews). */
const baseInputArb = fc.record({
  businessName: fieldArb,
  city: fieldArb,
  primaryService: fieldArb,
  phone: fieldArb,
});

/** Valid JsonLdInput with optional reviews (1–100). */
const inputWithReviewsArb = fc.record({
  businessName: fieldArb,
  city: fieldArb,
  primaryService: fieldArb,
  phone: fieldArb,
  reviews: fc.array(reviewArb, { minLength: 1, maxLength: 100 }),
});

describe("buildJsonLd — property tests", () => {
  // Feature: localpage-factory, Property 10: JSON-LD output has correct schema.org fields
  // Validates: Requirements R4.2, R4.3, R4.4, R4.5, R4.6, R4.7
  it("Property 10 — output has correct schema.org fields matching inputs", () => {
    fc.assert(
      fc.property(baseInputArb, (input) => {
        const result = buildJsonLd(input);
        return (
          result["@context"] === "https://schema.org" &&
          result["@type"] === "LocalBusiness" &&
          result.name === input.businessName &&
          result.telephone === input.phone &&
          result.areaServed === input.city &&
          result.description === input.primaryService
        );
      }),
      { numRuns: 200 },
    );
  });

  // Feature: localpage-factory, Property 11: JSON-LD review array mirrors input reviews
  // Validates: Requirement R4.8
  it("Property 11 — review array length and content mirrors input reviews (Google rich-result shape)", () => {
    fc.assert(
      fc.property(inputWithReviewsArb, (input) => {
        const result = buildJsonLd(input);
        if (!result.review) return false;
        if (result.review.length !== input.reviews!.length) return false;
        return input.reviews!.every(
          (r, i) => {
            const entry = result.review![i];
            return (
              entry["@type"] === "Review" &&
              entry.author["@type"] === "Person" &&
              entry.author.name === r.author &&
              entry.reviewBody === r.text
            );
          },
        );
      }),
      { numRuns: 200 },
    );
  });

  // Feature: localpage-factory, Property 12: JSON-LD serialisation is stable (round-trip)
  // Validates: Requirements R4.11, R9.1
  it("Property 12 — serialisation is stable across two calls and round-trips through JSON", () => {
    fc.assert(
      fc.property(inputWithReviewsArb, (input) => {
        const a = buildJsonLd(input);
        const b = buildJsonLd(input);
        const strA = JSON.stringify(a);
        const strB = JSON.stringify(b);
        // Same string both times
        if (strA !== strB) return false;
        // Round-trip: parse back and re-stringify equals original
        const parsed = JSON.parse(strA);
        return JSON.stringify(parsed) === strA;
      }),
      { numRuns: 100 },
    );
  });
});
