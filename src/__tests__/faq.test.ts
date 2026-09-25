import { describe, it, expect } from "vitest";
import { buildFaq } from "../faq.js";

describe("buildFaq — example-based tests", () => {
  const base = { primaryService: "plumbing", city: "Austin" };

  it("returns between 3 and 5 pairs for minimal valid input (R6.2, R6.3)", () => {
    const result = buildFaq(base);
    expect(result.length).toBeGreaterThanOrEqual(3);
    expect(result.length).toBeLessThanOrEqual(5);
  });

  it("returns exactly 5 pairs (the full template set)", () => {
    const result = buildFaq(base);
    expect(result.length).toBe(5);
  });

  it("each pair has non-empty question and answer (R6.4)", () => {
    buildFaq(base).forEach(({ question, answer }) => {
      expect(question.length).toBeGreaterThan(0);
      expect(answer.length).toBeGreaterThan(0);
    });
  });

  it("each question is ≤ 200 chars (R6.4)", () => {
    buildFaq(base).forEach(({ question }) => {
      expect(question.length).toBeLessThanOrEqual(200);
    });
  });

  it("each answer is ≤ 500 chars (R6.4)", () => {
    buildFaq(base).forEach(({ answer }) => {
      expect(answer.length).toBeLessThanOrEqual(500);
    });
  });

  // Tone: friendly — every answer must contain "you" or "your" (R6.6)
  it("friendly tone: every answer contains 'you' or 'your' (R6.6)", () => {
    buildFaq({ ...base, tone: "friendly" }).forEach(({ answer }) => {
      expect(answer).toMatch(/\byou\b|\byour\b/i);
    });
  });

  // Tone: casual — same second-person requirement (R6.6)
  it("casual tone: every answer contains 'you' or 'your' (R6.6)", () => {
    buildFaq({ ...base, tone: "casual" }).forEach(({ answer }) => {
      expect(answer).toMatch(/\byou\b|\byour\b/i);
    });
  });

  // Tone: professional — no "you" or "your" in any answer (R6.7)
  it("professional tone: no answer contains 'you' or 'your' (R6.7)", () => {
    buildFaq({ ...base, tone: "professional" }).forEach(({ answer }) => {
      expect(answer).not.toMatch(/\byou\b|\byour\b/i);
    });
  });

  // Absent tone — treated as professional (R6.7)
  it("absent tone: no answer contains 'you' or 'your' (R6.7)", () => {
    buildFaq(base).forEach(({ answer }) => {
      expect(answer).not.toMatch(/\byou\b|\byour\b/i);
    });
  });

  // R6.8 — primaryService too long (101 chars)
  it("throws when primaryService exceeds 100 characters (R6.8)", () => {
    expect(() =>
      buildFaq({ primaryService: "a".repeat(101), city: "Austin" }),
    ).toThrow(/primaryService/);
  });

  // R6.8 — primaryService empty
  it("throws when primaryService is empty (R6.8)", () => {
    expect(() => buildFaq({ primaryService: "", city: "Austin" })).toThrow(
      /primaryService/,
    );
  });

  // R6.8 — city too long
  it("throws when city exceeds 100 characters (R6.8)", () => {
    expect(() =>
      buildFaq({ primaryService: "plumbing", city: "c".repeat(101) }),
    ).toThrow(/city/);
  });

  // R6.8 — city empty
  it("throws when city is empty (R6.8)", () => {
    expect(() => buildFaq({ primaryService: "plumbing", city: "" })).toThrow(
      /city/,
    );
  });

  // R6.9 — unrecognised tone
  it("throws when tone is an unrecognised value (R6.9)", () => {
    expect(() =>
      // @ts-expect-error intentional bad tone
      buildFaq({ ...base, tone: "aggressive" }),
    ).toThrow(/tone/i);
  });

  // R6.5 — determinism
  it("identical inputs always return identical output (R6.5)", () => {
    const a = buildFaq({ ...base, tone: "friendly" });
    const b = buildFaq({ ...base, tone: "friendly" });
    expect(a).toEqual(b);
  });
});
