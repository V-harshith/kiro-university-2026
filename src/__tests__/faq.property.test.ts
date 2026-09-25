import { describe, it } from "vitest";
import * as fc from "fast-check";
import { buildFaq } from "../faq.js";

/** Valid primaryService or city: 1–100 characters, non-empty. */
const serviceOrCityArb = fc.string({ minLength: 1, maxLength: 100 });

/** Valid Tone values. */
const toneArb = fc.constantFrom(
  "professional" as const,
  "friendly" as const,
  "casual" as const,
);

/** Valid FaqInput — optional tone included. */
const faqInputArb = fc.record({
  primaryService: serviceOrCityArb,
  city: serviceOrCityArb,
  tone: fc.option(toneArb, { nil: undefined }),
});

describe("buildFaq — property tests", () => {
  // Feature: localpage-factory, Property 16: FAQ count is always between 3 and 5
  // Validates: Requirements R6.2, R6.3
  it("Property 16 — result length is always in [3, 5]", () => {
    fc.assert(
      fc.property(faqInputArb, (input) => {
        const result = buildFaq(input);
        return result.length >= 3 && result.length <= 5;
      }),
      { numRuns: 200 },
    );
  });

  // Feature: localpage-factory, Property 17: FAQ pairs have non-empty, length-bounded content
  // Validates: Requirement R6.4
  it("Property 17 — every pair has question 1–200 chars and answer 1–500 chars", () => {
    fc.assert(
      fc.property(faqInputArb, (input) => {
        const result = buildFaq(input);
        return result.every(
          ({ question, answer }) =>
            question.length >= 1 &&
            question.length <= 200 &&
            answer.length >= 1 &&
            answer.length <= 500,
        );
      }),
      { numRuns: 200 },
    );
  });

  // Feature: localpage-factory, Property 18: FAQ tone routing — friendly/casual uses second-person
  // Validates: Requirement R6.6
  it("Property 18 — friendly/casual tone: every answer contains 'you' or 'your'", () => {
    const secondPersonInputArb = fc.record({
      primaryService: serviceOrCityArb,
      city: serviceOrCityArb,
      tone: fc.constantFrom("friendly" as const, "casual" as const),
    });

    fc.assert(
      fc.property(secondPersonInputArb, (input) => {
        const result = buildFaq(input);
        return result.every(({ answer }) => /\byou\b|\byour\b/i.test(answer));
      }),
      { numRuns: 200 },
    );
  });

  // Feature: localpage-factory, Property 19: FAQ tone routing — professional/absent avoids second-person
  // Validates: Requirement R6.7
  it("Property 19 — professional/absent tone: no answer contains 'you' or 'your'", () => {
    const thirdPersonInputArb = fc.record({
      primaryService: serviceOrCityArb,
      city: serviceOrCityArb,
      tone: fc.option(fc.constant("professional" as const), { nil: undefined }),
    });

    fc.assert(
      fc.property(thirdPersonInputArb, (input) => {
        const result = buildFaq(input);
        return result.every(
          ({ answer }) => !/\byou\b|\byour\b/i.test(answer),
        );
      }),
      { numRuns: 200 },
    );
  });

  // Feature: localpage-factory, Property 20: FAQ output is deterministic
  // Validates: Requirement R6.5
  it("Property 20 — identical inputs always produce deeply equal output", () => {
    fc.assert(
      fc.property(faqInputArb, (input) => {
        const a = buildFaq(input);
        const b = buildFaq(input);
        if (a.length !== b.length) return false;
        return a.every(
          (pair, i) =>
            pair.question === b[i].question && pair.answer === b[i].answer,
        );
      }),
      { numRuns: 100 },
    );
  });
});
