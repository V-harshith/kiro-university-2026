import { describe, it, expect } from "vitest";
import { slugify } from "../slug.js";

describe("slugify — example-based tests", () => {
  it("produces a well-known slug for a simple name + city", () => {
    expect(slugify("Joe's Plumbing", "Austin")).toBe("joes-plumbing-austin");
  });

  it("lowercases both inputs", () => {
    expect(slugify("ACME Corp", "New York")).toBe("acme-corp-new-york");
  });

  it("replaces whitespace runs with a single hyphen", () => {
    expect(slugify("Bob   Smith", "San   Jose")).toBe("bob-smith-san-jose");
  });

  it("strips non-ASCII characters (unicode → empty)", () => {
    // Café → caf (é stripped), München → mnchen (ü stripped)
    expect(slugify("Café", "München")).toBe("caf-mnchen");
  });

  it("strips punctuation that is not a hyphen", () => {
    expect(slugify("Best & Bright!", "St. Louis")).toBe("best-bright-st-louis");
  });

  it("collapses consecutive hyphens", () => {
    expect(slugify("A--B", "C--D")).toBe("a-b-c-d");
  });

  it("strips leading and trailing hyphens from segments", () => {
    expect(slugify("-leading", "trailing-")).toBe("leading-trailing");
  });

  it("throws when businessName is empty string (R2.9)", () => {
    expect(() => slugify("", "Austin")).toThrow(/businessName/);
  });

  it("throws when businessName is whitespace-only (R2.9)", () => {
    expect(() => slugify("   ", "Austin")).toThrow(/businessName/);
  });

  it("throws when city is empty string (R2.9)", () => {
    expect(() => slugify("Acme", "")).toThrow(/city/);
  });

  it("throws when city is whitespace-only (R2.9)", () => {
    expect(() => slugify("Acme", "   ")).toThrow(/city/);
  });

  it("truncates at 200 chars on a hyphen boundary (R2.10)", () => {
    // Build a name whose naive slug is way longer than 200
    const longName = "a".repeat(120);
    const longCity = "b".repeat(120);
    const result = slugify(longName, longCity);
    expect(result.length).toBeLessThanOrEqual(200);
    // Must not end with a hyphen
    expect(result.endsWith("-")).toBe(false);
    // Must not start with a hyphen
    expect(result.startsWith("-")).toBe(false);
  });

  it("truncates at hyphen boundary, not mid-word (R2.10)", () => {
    // 'word' segments separated by hyphens — truncation should land on a boundary
    const name = Array.from({ length: 20 }, (_, i) => `word${i}`).join(" ");
    const city = "city";
    const result = slugify(name, city);
    expect(result.length).toBeLessThanOrEqual(200);
    expect(result).toMatch(/^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/);
  });
});
