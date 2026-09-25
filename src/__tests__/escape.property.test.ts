import { describe, it } from "vitest";
import * as fc from "fast-check";
import { escapeHtml } from "../escape.js";

// The five characters that must be escaped
const SPECIAL = new Set(["&", "<", ">", '"', "'"]);

describe("escapeHtml — property tests", () => {
  // Feature: localpage-factory, Property 13: HTML escaping replaces all five dangerous characters
  // Validates: Requirements R5.1, R5.7
  it("Property 13 — every special character is replaced with its entity", () => {
    const ENTITIES = ["&amp;", "&lt;", "&gt;", "&quot;", "&#39;"];

    fc.assert(
      fc.property(fc.string(), (s) => {
        const result = escapeHtml(s);

        // Walk the result character by character; any `&` must be the start
        // of one of the five known entities.  Any `<`, `>`, `"`, `'` must
        // not appear at all (they were not in any entity we produce).
        for (let i = 0; i < result.length; i++) {
          const ch = result[i];
          if (ch === "&") {
            const matchesEntity = ENTITIES.some((e) =>
              result.startsWith(e, i),
            );
            if (!matchesEntity) return false;
          } else if (ch === "<" || ch === ">" || ch === '"' || ch === "'") {
            return false;
          }
        }

        return true;
      }),
      { numRuns: 100 },
    );
  });

  // Feature: localpage-factory, Property 14: HTML escaping is the identity on safe inputs
  // Validates: Requirements R5.2, R5.4
  it("Property 14 — strings with no special characters are returned unchanged", () => {
    // Build an arbitrary string composed only of characters not in SPECIAL
    const safeChar = fc
      .integer({ min: 32, max: 126 })
      .map((n) => String.fromCharCode(n))
      .filter((c) => !SPECIAL.has(c));

    fc.assert(
      fc.property(fc.stringOf(safeChar), (s) => {
        return escapeHtml(s) === s;
      }),
      { numRuns: 100 },
    );
  });
});
