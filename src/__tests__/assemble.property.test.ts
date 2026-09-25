import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { assemble } from "../assemble.js";
import { validate } from "../validate.js";
import { buildMeta } from "../meta.js";
import { ValidationError } from "../types.js";
import type { BusinessInput } from "../types.js";

/** Non-empty, non-whitespace string of 1–80 characters. */
const fieldArb = fc
  .string({ minLength: 1, maxLength: 80 })
  .filter((s) => s.trim().length > 0);

/** Valid Review arbitrary. */
const reviewArb = fc.record({
  author: fieldArb,
  text: fieldArb,
});

/** Fully valid BusinessInput arbitrary (slugify can throw if all chars are non-ASCII,
 *  so we restrict businessName/city to ASCII printable characters to keep the
 *  generator reliable). */
const asciiField = fc
  .stringOf(
    fc.integer({ min: 32, max: 126 }).map((n) => String.fromCharCode(n)),
    { minLength: 1, maxLength: 60 },
  )
  .filter((s) => s.trim().length > 0)
  // slugify needs at least one alphanumeric character
  .filter((s) => /[a-zA-Z0-9]/.test(s));

const businessInputArb: fc.Arbitrary<BusinessInput> = fc.record({
  businessName: asciiField,
  city: asciiField,
  primaryService: fieldArb,
  phone: fieldArb,
  tone: fc.option(
    fc.constantFrom("professional" as const, "friendly" as const, "casual" as const),
    { nil: undefined },
  ),
  reviews: fc.option(
    fc.array(reviewArb, { minLength: 0, maxLength: 5 }),
    { nil: undefined },
  ),
});

describe("assemble — property tests", () => {
  // Feature: localpage-factory, Property 1: Validation rejects every individually missing required field
  // Validates: Requirements R1.1–R1.4
  it("Property 1 — validate throws for each individually missing required field", () => {
    const requiredFields = ["businessName", "city", "primaryService", "phone"] as const;
    fc.assert(
      fc.property(businessInputArb, (input) => {
        for (const field of requiredFields) {
          const incomplete = { ...input, [field]: undefined };
          let threw = false;
          try {
            validate(incomplete);
          } catch (e) {
            threw = true;
            // The error message must name the missing field
            if (!(e instanceof ValidationError)) return false;
            if (!e.message.includes(field)) return false;
          }
          if (!threw) return false;
        }
        return true;
      }),
      { numRuns: 100 },
    );
  });

  // Feature: localpage-factory, Property 2: Validation accepts all well-formed inputs
  // Validates: Requirement R1.5
  it("Property 2 — validate accepts all well-formed BusinessInput objects", () => {
    fc.assert(
      fc.property(businessInputArb, (input) => {
        try {
          validate(input);
          return true;
        } catch {
          return false;
        }
      }),
      { numRuns: 100 },
    );
  });

  // Feature: localpage-factory, Property 15: Assembled HTML contains no raw special characters from user input
  // Validates: Requirement R5.5
  it("Property 15 — HTML outside JSON-LD contains no raw & < > \" ' from user fields", () => {
    // Inject all five special characters into every user-supplied field
    const injectedInput: BusinessInput = {
      businessName: `A&<>"'B`,
      city: `C&<>"'D`,
      primaryService: `E&<>"'F`,
      phone: `G&<>"'H`,
    };
    const html = assemble(injectedInput);
    // Remove the JSON-LD block (JSON-encoded, not HTML-escaped)
    const withoutJsonLd = html.replace(
      /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
      "",
    );
    // None of the raw injected sequences should survive
    expect(withoutJsonLd).not.toContain(`A&<>"'B`);
    expect(withoutJsonLd).not.toContain(`C&<>"'D`);
    expect(withoutJsonLd).not.toContain(`E&<>"'F`);
    expect(withoutJsonLd).not.toContain(`G&<>"'H`);
    return true;
  });

  // Feature: localpage-factory, Property 21: Assembled HTML is structurally valid and self-contained
  // Validates: Requirements R7.2–R7.5, R7.8–R7.10
  it("Property 21 — assembled HTML meets all structural requirements", () => {
    fc.assert(
      fc.property(businessInputArb, (input) => {
        const html = assemble(input);
        const { title, description } = buildMeta(input);

        // The assembler HTML-escapes meta strings before injection, so compare escaped forms
        const escTitle = title.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
        const escDesc = description.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

        // Starts with <!DOCTYPE html>
        if (!html.startsWith("<!DOCTYPE html>")) return false;

        // Contains <title> with the right content
        if (!html.includes(`<title>${escTitle}</title>`)) return false;

        // Contains <meta name="description" content="...">
        if (!html.includes(`<meta name="description" content="${escDesc}">`))
          return false;

        // Exactly one <script type="application/ld+json">
        const scriptMatches = html.match(/<script\b[^>]*>/gi) ?? [];
        const ldJsonCount = scriptMatches.filter((m) =>
          m.includes('type="application/ld+json"'),
        ).length;
        if (ldJsonCount !== 1) return false;
        const otherScripts = scriptMatches.filter(
          (m) => !m.includes('type="application/ld+json"'),
        ).length;
        if (otherScripts !== 0) return false;

        // Contains <style>, no <link rel="stylesheet">
        if (!/<style\b/.test(html)) return false;
        if (/<link[^>]+rel=["']stylesheet["']/i.test(html)) return false;

        // No on* attributes
        if (/\bon\w+=/i.test(html)) return false;

        return true;
      }),
      { numRuns: 100 },
    );
  });

  // Feature: localpage-factory, Property 22: Assembly is deterministic (byte-identical on identical input)
  // Validates: Requirement R7.11
  it("Property 22 — assemble is deterministic for all valid inputs", () => {
    fc.assert(
      fc.property(businessInputArb, (input) => {
        return assemble(input) === assemble(input);
      }),
      { numRuns: 100 },
    );
  });

  // Feature: localpage-factory, Property 23: BusinessInput JSON round-trip
  // Validates: Requirement R9.2
  it("Property 23 — validate(JSON.parse(JSON.stringify(input))) produces identical BusinessInput", () => {
    fc.assert(
      fc.property(businessInputArb, (input) => {
        const roundTripped = validate(JSON.parse(JSON.stringify(input)));
        // All fields must match
        if (roundTripped.businessName !== input.businessName) return false;
        if (roundTripped.city !== input.city) return false;
        if (roundTripped.primaryService !== input.primaryService) return false;
        if (roundTripped.phone !== input.phone) return false;
        if (roundTripped.tone !== input.tone) return false;
        // Reviews deep-equal
        const ra = input.reviews ?? [];
        const rb = roundTripped.reviews ?? [];
        if (ra.length !== rb.length) return false;
        return ra.every((r, i) => r.author === rb[i].author && r.text === rb[i].text);
      }),
      { numRuns: 100 },
    );
  });
});
