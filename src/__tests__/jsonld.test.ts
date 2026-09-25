import { describe, it, expect } from "vitest";
import { buildJsonLd } from "../jsonld.js";

const base = {
  businessName: "Acme Plumbing",
  city: "Austin",
  primaryService: "pipe repair",
  phone: "512-555-0100",
};

describe("buildJsonLd — example-based tests", () => {
  it("sets @context to https://schema.org (R4.2)", () => {
    expect(buildJsonLd(base)["@context"]).toBe("https://schema.org");
  });

  it("sets @type to LocalBusiness (R4.3)", () => {
    expect(buildJsonLd(base)["@type"]).toBe("LocalBusiness");
  });

  it("sets name to businessName (R4.4)", () => {
    expect(buildJsonLd(base).name).toBe("Acme Plumbing");
  });

  it("sets telephone to phone (R4.5)", () => {
    expect(buildJsonLd(base).telephone).toBe("512-555-0100");
  });

  it("sets areaServed to city (R4.6)", () => {
    expect(buildJsonLd(base).areaServed).toBe("Austin");
  });

  it("sets description to primaryService (R4.7)", () => {
    expect(buildJsonLd(base).description).toBe("pipe repair");
  });

  it("omits review key when no reviews are provided (R4.8)", () => {
    const result = buildJsonLd(base);
    expect(result).not.toHaveProperty("review");
  });

  it("omits review key when reviews is an empty array", () => {
    const result = buildJsonLd({ ...base, reviews: [] });
    expect(result).not.toHaveProperty("review");
  });

  it("maps reviews to review array with author and reviewBody (R4.8)", () => {
    const input = {
      ...base,
      reviews: [
        { author: "Alice", text: "Great service!" },
        { author: "Bob", text: "Very professional." },
      ],
    };
    const result = buildJsonLd(input);
    expect(result.review).toHaveLength(2);
    expect(result.review?.[0]).toEqual({ author: "Alice", reviewBody: "Great service!" });
    expect(result.review?.[1]).toEqual({ author: "Bob", reviewBody: "Very professional." });
  });

  it("throws when review is missing text field (R4.10)", () => {
    const input = {
      ...base,
      // @ts-expect-error intentional malformed review
      reviews: [{ author: "Alice" }],
    };
    expect(() => buildJsonLd(input)).toThrow(/text/);
  });

  it("throws when review is missing author field (R4.10)", () => {
    const input = {
      ...base,
      // @ts-expect-error intentional malformed review
      reviews: [{ text: "Good work" }],
    };
    expect(() => buildJsonLd(input)).toThrow(/author/);
  });

  it("throws when businessName is absent (R4.9)", () => {
    const { businessName: _, ...rest } = base;
    // @ts-expect-error intentional missing field
    expect(() => buildJsonLd(rest)).toThrow(/businessName/);
  });

  it("throws when city is absent (R4.9)", () => {
    const { city: _, ...rest } = base;
    // @ts-expect-error intentional missing field
    expect(() => buildJsonLd(rest)).toThrow(/city/);
  });

  it("throws when primaryService is absent (R4.9)", () => {
    const { primaryService: _, ...rest } = base;
    // @ts-expect-error intentional missing field
    expect(() => buildJsonLd(rest)).toThrow(/primaryService/);
  });

  it("throws when phone is absent (R4.9)", () => {
    const { phone: _, ...rest } = base;
    // @ts-expect-error intentional missing field
    expect(() => buildJsonLd(rest)).toThrow(/phone/);
  });

  it("JSON round-trip: parse(stringify(result)) deeply equals result (R9.1)", () => {
    const input = {
      ...base,
      reviews: [{ author: "Carol", text: "Excellent!" }],
    };
    const result = buildJsonLd(input);
    const roundTripped = JSON.parse(JSON.stringify(result));
    expect(roundTripped).toEqual(result);
  });
});
