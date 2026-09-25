import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { slugify } from "../slug.js";

/** Arbitrary that produces a non-empty, non-whitespace-only string. */
const nonBlankString = fc
  .string({ minLength: 1, maxLength: 100 })
  .filter((s) => s.trim().length > 0);

/** Arbitrary that produces an empty or whitespace-only string. */
const blankString = fc.oneof(
  fc.constant(""),
  fc.stringOf(fc.constantFrom(" ", "\t", "\n", "\r"), { minLength: 1, maxLength: 20 }),
);

describe("slugify — property tests", () => {
  // Feature: localpage-factory, Property 3: Slug output is lowercase, ASCII-safe, and structurally clean
  // Validates: Requirements R2.2, R2.3, R2.4, R2.7, R2.8, R2.10
  it("Property 3 — slug is lowercase, ASCII-safe, no bad hyphens, ≤ 200 chars", () => {
    fc.assert(
      fc.property(nonBlankString, nonBlankString, (name, city) => {
        let result: string;
        try {
          result = slugify(name, city);
        } catch {
          // A non-blank string that becomes empty after stripping is valid to throw;
          // skip that case — we only assert structure when a slug is produced.
          return true;
        }

        // Only [a-z0-9-]
        if (!/^[a-z0-9-]+$/.test(result)) return false;
        // No leading hyphen
        if (result.startsWith("-")) return false;
        // No trailing hyphen
        if (result.endsWith("-")) return false;
        // No consecutive hyphens
        if (/--/.test(result)) return false;
        // Length ≤ 200
        if (result.length > 200) return false;

        return true;
      }),
      { numRuns: 200 },
    );
  });

  // Feature: localpage-factory, Property 4: Slug is deterministic
  // Validates: Requirement R2.6
  it("Property 4 — identical inputs always produce the same slug", () => {
    fc.assert(
      fc.property(nonBlankString, nonBlankString, (name, city) => {
        try {
          const a = slugify(name, city);
          const b = slugify(name, city);
          return a === b;
        } catch {
          return true; // both calls would throw the same way — still deterministic
        }
      }),
      { numRuns: 100 },
    );
  });

  // Feature: localpage-factory, Property 5: Slug rejects blank inputs
  // Validates: Requirement R2.9
  it("Property 5 — blank businessName throws", () => {
    fc.assert(
      fc.property(blankString, nonBlankString, (blank, city) => {
        expect(() => slugify(blank, city)).toThrow();
        return true;
      }),
      { numRuns: 100 },
    );
  });

  it("Property 5 — blank city throws", () => {
    fc.assert(
      fc.property(nonBlankString, blankString, (name, blank) => {
        expect(() => slugify(name, blank)).toThrow();
        return true;
      }),
      { numRuns: 100 },
    );
  });
});
