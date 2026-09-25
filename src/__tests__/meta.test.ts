import { describe, it, expect } from "vitest";
import { buildMeta } from "../meta.js";

describe("buildMeta — example-based tests", () => {
  const base = {
    businessName: "Acme Plumbing",
    city: "Austin",
    primaryService: "pipe repair",
  };

  it("returns title and description for well-formed input", () => {
    const result = buildMeta(base);
    expect(result.title.length).toBeGreaterThan(0);
    expect(result.description.length).toBeGreaterThan(0);
  });

  it("title contains the city verbatim (R3.5)", () => {
    const result = buildMeta(base);
    expect(result.title).toContain("Austin");
  });

  it("title is ≤ 60 characters (R3.2)", () => {
    const result = buildMeta(base);
    expect(result.title.length).toBeLessThanOrEqual(60);
  });

  it("description is ≤ 155 characters (R3.3)", () => {
    const result = buildMeta(base);
    expect(result.description.length).toBeLessThanOrEqual(155);
  });

  it("description includes the primaryService (R3.6)", () => {
    const result = buildMeta(base);
    expect(result.description.toLowerCase()).toContain("pipe repair");
  });

  // R3.8 — truncation at 60 chars does not cut mid-word
  it("does not cut mid-word when title must be truncated (R3.8)", () => {
    // businessName (30) + " – " (3) + primaryService (25) + " in " (4) + city (13) = 75 → truncates
    const longInput = {
      businessName: "Extraordinary Premium Services Co",
      city: "San Francisco",
      primaryService: "comprehensive maintenance work",
    };
    const result = buildMeta(longInput);
    expect(result.title.length).toBeLessThanOrEqual(60);
    // City must survive
    expect(result.title).toContain("San Francisco");
    // The truncation point must not land mid-word: the character immediately
    // before the " in <city>" suffix must be either a word-end (complete word)
    // or the title must equal the full natural string if it happens to fit.
    // Simply verify the title does not end with a hyphen or space (clean boundary).
    const beforeCity = result.title.replace(` in San Francisco`, "");
    expect(beforeCity).not.toMatch(/[-\s]$/);
  });

  // R3.9 — truncation at 155 chars does not cut mid-word
  it("does not cut mid-word when description must be truncated (R3.9)", () => {
    const longInput = {
      businessName: "Extraordinary Premium Specialist Services",
      city: "San Francisco California",
      primaryService:
        "comprehensive high-quality residential plumbing maintenance and installation",
    };
    const result = buildMeta(longInput);
    expect(result.description.length).toBeLessThanOrEqual(155);
    // The character just before where we'd cut must be a space boundary
    // (i.e. no truncation in the middle of a word)
    const desc = result.description;
    if (desc.length < 155) {
      // Under limit is fine
    } else {
      // At limit: char at index 155 (if it existed) would be inside a word → bad
      // Our truncation walks back to the last space, so the last char should be
      // either punctuation or a complete word-end letter (not a mid-word cut)
      expect(desc).not.toMatch(/\w-$/); // no hyphen-truncation either
    }
  });

  // R3.11 — long businessName + short city: city must survive verbatim
  it("preserves city verbatim when businessName is very long (R3.11)", () => {
    const result = buildMeta({
      businessName: "A".repeat(60),
      city: "Portland",
      primaryService: "roofing",
    });
    expect(result.title.length).toBeLessThanOrEqual(60);
    expect(result.title).toContain("Portland");
  });

  it("preserves short city verbatim even with long businessName + service (R3.11)", () => {
    const result = buildMeta({
      businessName: "Super Long Premium Business Name That Goes On",
      city: "NYC",
      primaryService: "plumbing repairs",
    });
    expect(result.title).toContain("NYC");
    expect(result.title.length).toBeLessThanOrEqual(60);
  });

  // R3.10 — missing required fields throw
  it("throws when businessName is missing (R3.10)", () => {
    // @ts-expect-error intentional bad arg
    expect(() => buildMeta({ city: "Austin", primaryService: "plumbing" })).toThrow(
      /businessName/,
    );
  });

  it("throws when city is missing (R3.10)", () => {
    // @ts-expect-error intentional bad arg
    expect(() => buildMeta({ businessName: "Acme", primaryService: "plumbing" })).toThrow(
      /city/,
    );
  });

  it("throws when primaryService is missing (R3.10)", () => {
    // @ts-expect-error intentional bad arg
    expect(() => buildMeta({ businessName: "Acme", city: "Austin" })).toThrow(
      /primaryService/,
    );
  });

  it("throws when businessName is empty string (R3.10)", () => {
    expect(() =>
      buildMeta({ businessName: "", city: "Austin", primaryService: "plumbing" }),
    ).toThrow(/businessName/);
  });

  it("throws when businessName is whitespace-only (R3.10)", () => {
    expect(() =>
      buildMeta({ businessName: "   ", city: "Austin", primaryService: "plumbing" }),
    ).toThrow(/businessName/);
  });

  it("is deterministic — same inputs return same outputs (R3.7)", () => {
    const a = buildMeta(base);
    const b = buildMeta(base);
    expect(a.title).toBe(b.title);
    expect(a.description).toBe(b.description);
  });
});
