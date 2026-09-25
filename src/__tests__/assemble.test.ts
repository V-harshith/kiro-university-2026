import { describe, it, expect } from "vitest";
import { assemble } from "../assemble.js";
import { buildMeta } from "../meta.js";
import type { BusinessInput } from "../types.js";

const base: BusinessInput = {
  businessName: "Acme Plumbing",
  city: "Austin",
  primaryService: "pipe repair",
  phone: "512-555-0100",
};

describe("assemble — example-based tests", () => {
  it("output starts with <!DOCTYPE html> (R7.2)", () => {
    expect(assemble(base)).toMatch(/^<!DOCTYPE html>/);
  });

  it("<title> text matches buildMeta output (R7.3)", () => {
    const { title } = buildMeta(base);
    const html = assemble(base);
    // base has no special chars so title == escaped title
    expect(html).toContain(`<title>${title}</title>`);
  });

  it("<meta name=\"description\"> present with correct content (R7.4)", () => {
    const { description } = buildMeta(base);
    const html = assemble(base);
    // base has no special chars so description == escaped description
    expect(html).toContain(`<meta name="description" content="${description}">`);
  });

  it("contains exactly one <script type=\"application/ld+json\"> element (R7.5, R7.9)", () => {
    const html = assemble(base);
    const matches = html.match(/<script\b[^>]*>/gi) ?? [];
    const ldJsonScripts = matches.filter((m) =>
      m.includes('type="application/ld+json"'),
    );
    expect(ldJsonScripts).toHaveLength(1);
    // No other script tags
    const otherScripts = matches.filter(
      (m) => !m.includes('type="application/ld+json"'),
    );
    expect(otherScripts).toHaveLength(0);
  });

  it("contains a <style> element and no <link rel=\"stylesheet\"> (R7.8)", () => {
    const html = assemble(base);
    expect(html).toMatch(/<style\b/);
    expect(html).not.toMatch(/<link[^>]+rel=["']stylesheet["']/i);
  });

  it("contains no on* attributes (R7.10)", () => {
    const html = assemble(base);
    expect(html).not.toMatch(/\bon\w+=/i);
  });

  it("businessName appears in body as non-empty text (R7.12)", () => {
    expect(assemble(base)).toContain("Acme Plumbing");
  });

  it("city appears in body as non-empty text (R7.12)", () => {
    expect(assemble(base)).toContain("Austin");
  });

  it("primaryService appears in body as non-empty text (R7.12)", () => {
    expect(assemble(base)).toContain("pipe repair");
  });

  it("phone appears in body as non-empty text (R7.12)", () => {
    expect(assemble(base)).toContain("512-555-0100");
  });

  it("FAQ block rendered in body (R7.6)", () => {
    const html = assemble(base);
    expect(html).toMatch(/faq/i);
    expect(html).toMatch(/class="faq-question"/);
    expect(html).toMatch(/class="faq-answer"/);
  });

  it("does not render reviews section when no reviews present", () => {
    const html = assemble(base);
    expect(html).not.toMatch(/class="reviews"/);
  });

  it("renders reviews when present (R7.7)", () => {
    const input: BusinessInput = {
      ...base,
      reviews: [
        { author: "Alice", text: "Great service!" },
        { author: "Bob", text: "Very professional." },
      ],
    };
    const html = assemble(input);
    expect(html).toContain("Alice");
    expect(html).toContain("Great service!");
    expect(html).toContain("Bob");
    expect(html).toContain("Very professional.");
    expect(html).toMatch(/class="review"/);
  });

  it("HTML-escapes special characters in businessName (R5.5)", () => {
    const html = assemble({
      ...base,
      businessName: 'A&B <Corp> "Ltd" \'s',
    });
    // Raw special chars must not appear outside the JSON-LD block
    // Strip the JSON-LD script block first
    const withoutJsonLd = html.replace(
      /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
      "",
    );
    expect(withoutJsonLd).not.toMatch(/A&B/);
    expect(withoutJsonLd).toContain("A&amp;B");
    expect(withoutJsonLd).not.toContain("<Corp>");
    expect(withoutJsonLd).toContain("&lt;Corp&gt;");
  });

  it("is deterministic — identical inputs produce identical output (R7.11)", () => {
    const a = assemble(base);
    const b = assemble(base);
    expect(a).toBe(b);
  });

  it("is deterministic with reviews (R7.11)", () => {
    const input: BusinessInput = {
      ...base,
      tone: "friendly",
      reviews: [{ author: "Carol", text: "Excellent!" }],
    };
    expect(assemble(input)).toBe(assemble(input));
  });
});
