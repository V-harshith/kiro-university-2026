import { describe, it, expect } from "vitest";
import { escapeHtml } from "../escape.js";

describe("escapeHtml — example-based tests", () => {
  it("escapes & to &amp;", () => {
    expect(escapeHtml("a&b")).toBe("a&amp;b");
  });

  it("escapes < to &lt;", () => {
    expect(escapeHtml("a<b")).toBe("a&lt;b");
  });

  it("escapes > to &gt;", () => {
    expect(escapeHtml("a>b")).toBe("a&gt;b");
  });

  it('escapes " to &quot;', () => {
    expect(escapeHtml('say "hello"')).toBe("say &quot;hello&quot;");
  });

  it("escapes ' to &#39;", () => {
    expect(escapeHtml("it's fine")).toBe("it&#39;s fine");
  });

  it("returns empty string unchanged (R5.3)", () => {
    expect(escapeHtml("")).toBe("");
  });

  it("returns safe-only strings unchanged (R5.2)", () => {
    expect(escapeHtml("Hello, World! 123")).toBe("Hello, World! 123");
  });

  it("throws TypeError for non-string argument — number (R5.6)", () => {
    // @ts-expect-error intentional bad arg
    expect(() => escapeHtml(42)).toThrow(TypeError);
  });

  it("throws TypeError for non-string argument — null (R5.6)", () => {
    // @ts-expect-error intentional bad arg
    expect(() => escapeHtml(null)).toThrow(TypeError);
  });

  it("throws TypeError for non-string argument — undefined (R5.6)", () => {
    // @ts-expect-error intentional bad arg
    expect(() => escapeHtml(undefined)).toThrow(TypeError);
  });

  it("handles multiple consecutive special characters (R5.7)", () => {
    expect(escapeHtml("&<>\"'")).toBe("&amp;&lt;&gt;&quot;&#39;");
  });

  it("handles adjacent repeated special characters (R5.7)", () => {
    expect(escapeHtml("&&<<>>\"\"''")).toBe(
      "&amp;&amp;&lt;&lt;&gt;&gt;&quot;&quot;&#39;&#39;",
    );
  });

  it("does not double-escape already-escaped entities", () => {
    expect(escapeHtml("&amp;")).toBe("&amp;amp;");
  });
});
