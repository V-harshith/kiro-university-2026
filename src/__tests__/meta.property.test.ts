import { describe, it } from "vitest";
import * as fc from "fast-check";
import { buildMeta } from "../meta.js";

/** Non-empty, non-whitespace string of 1–100 characters. */
const fieldArb = fc
  .string({ minLength: 1, maxLength: 100 })
  .filter((s) => s.trim().length > 0);

/** Valid MetaInput arbitrary. */
const metaInputArb = fc.record({
  businessName: fieldArb,
  city: fieldArb,
  primaryService: fieldArb,
  tone: fc.option(
    fc.constantFrom("professional" as const, "friendly" as const, "casual" as const),
    { nil: undefined },
  ),
});

describe("buildMeta — property tests", () => {
  // Feature: localpage-factory, Property 6: Title tag length is always within budget
  // Validates: Requirement R3.2
  it("Property 6 — title is always ≤ 60 characters", () => {
    fc.assert(
      fc.property(metaInputArb, (input) => {
        const result = buildMeta(input);
        return result.title.length <= 60;
      }),
      { numRuns: 200 },
    );
  });

  // Feature: localpage-factory, Property 7: Meta description length is always within budget
  // Validates: Requirement R3.3
  it("Property 7 — description is always ≤ 155 characters", () => {
    fc.assert(
      fc.property(metaInputArb, (input) => {
        const result = buildMeta(input);
        return result.description.length <= 155;
      }),
      { numRuns: 200 },
    );
  });

  // Feature: localpage-factory, Property 8: City is always preserved verbatim in the title tag
  // Validates: Requirements R3.5, R3.11
  // Condition from design: city is at most 55 characters (leaving room for " in " + minimal name)
  it("Property 8 — city is preserved verbatim in title when city ≤ 55 chars", () => {
    const shortCityInputArb = fc.record({
      businessName: fieldArb,
      city: fc.string({ minLength: 1, maxLength: 55 }).filter((s) => s.trim().length > 0),
      primaryService: fieldArb,
    });

    fc.assert(
      fc.property(shortCityInputArb, (input) => {
        const result = buildMeta(input);
        return result.title.includes(input.city);
      }),
      { numRuns: 200 },
    );
  });

  // Feature: localpage-factory, Property 9: Meta output is deterministic
  // Validates: Requirement R3.7
  it("Property 9 — identical inputs always return identical outputs", () => {
    fc.assert(
      fc.property(metaInputArb, (input) => {
        const a = buildMeta(input);
        const b = buildMeta(input);
        return a.title === b.title && a.description === b.description;
      }),
      { numRuns: 100 },
    );
  });
});
