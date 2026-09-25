import { describe, it, expect } from "vitest";
import { validate } from "../validate.js";
import { ValidationError } from "../types.js";

const validInput = {
  businessName: "Acme Plumbing",
  city: "Austin",
  primaryService: "pipe repair",
  phone: "512-555-0100",
};

describe("validate — example-based tests", () => {
  // R1.1–R1.4: each required field absent → throws with field name in message
  it("throws ValidationError when businessName is absent (R1.1)", () => {
    const { businessName: _, ...rest } = validInput;
    expect(() => validate(rest)).toThrow(ValidationError);
    try { validate(rest); } catch (e) {
      expect((e as ValidationError).message).toMatch(/businessName/);
      expect((e as ValidationError).field).toBe("businessName");
    }
  });

  it("throws ValidationError when city is absent (R1.2)", () => {
    const { city: _, ...rest } = validInput;
    expect(() => validate(rest)).toThrow(ValidationError);
    try { validate(rest); } catch (e) {
      expect((e as ValidationError).message).toMatch(/city/);
    }
  });

  it("throws ValidationError when primaryService is absent (R1.3)", () => {
    const { primaryService: _, ...rest } = validInput;
    expect(() => validate(rest)).toThrow(ValidationError);
    try { validate(rest); } catch (e) {
      expect((e as ValidationError).message).toMatch(/primaryService/);
    }
  });

  it("throws ValidationError when phone is absent (R1.4)", () => {
    const { phone: _, ...rest } = validInput;
    expect(() => validate(rest)).toThrow(ValidationError);
    try { validate(rest); } catch (e) {
      expect((e as ValidationError).message).toMatch(/phone/);
    }
  });

  it("throws when businessName is empty string", () => {
    expect(() => validate({ ...validInput, businessName: "" })).toThrow(ValidationError);
  });

  it("throws when businessName is whitespace-only", () => {
    expect(() => validate({ ...validInput, businessName: "   " })).toThrow(ValidationError);
  });

  // R1.5: all required fields present → returns typed BusinessInput
  it("returns a typed BusinessInput when all required fields are valid (R1.5)", () => {
    const result = validate(validInput);
    expect(result.businessName).toBe("Acme Plumbing");
    expect(result.city).toBe("Austin");
    expect(result.primaryService).toBe("pipe repair");
    expect(result.phone).toBe("512-555-0100");
  });

  it("accepts all three valid tone values", () => {
    expect(() => validate({ ...validInput, tone: "professional" })).not.toThrow();
    expect(() => validate({ ...validInput, tone: "friendly" })).not.toThrow();
    expect(() => validate({ ...validInput, tone: "casual" })).not.toThrow();
  });

  it("throws ValidationError for an unrecognised tone value", () => {
    expect(() => validate({ ...validInput, tone: "aggressive" })).toThrow(ValidationError);
    try { validate({ ...validInput, tone: "aggressive" }); } catch (e) {
      expect((e as ValidationError).message).toMatch(/tone/);
    }
  });

  it("accepts a valid reviews array", () => {
    const result = validate({
      ...validInput,
      reviews: [{ author: "Alice", text: "Great!" }],
    });
    expect(result.reviews).toHaveLength(1);
    expect(result.reviews![0].author).toBe("Alice");
  });

  it("throws when a review is missing author", () => {
    expect(() =>
      validate({ ...validInput, reviews: [{ text: "Good" }] }),
    ).toThrow(ValidationError);
  });

  it("throws when a review is missing text", () => {
    expect(() =>
      validate({ ...validInput, reviews: [{ author: "Bob" }] }),
    ).toThrow(ValidationError);
  });

  it("throws when root input is null", () => {
    expect(() => validate(null)).toThrow(ValidationError);
  });

  it("throws when root input is a string", () => {
    expect(() => validate("hello")).toThrow(ValidationError);
  });

  it("throws when root input is an array", () => {
    expect(() => validate([])).toThrow(ValidationError);
  });

  // R9.2: JSON round-trip produces identical BusinessInput
  it("JSON round-trip produces identical result (R9.2)", () => {
    const inputWithExtras = {
      ...validInput,
      tone: "friendly" as const,
      reviews: [{ author: "Carol", text: "Excellent service." }],
    };
    const result = validate(JSON.parse(JSON.stringify(inputWithExtras)));
    expect(result.businessName).toBe(inputWithExtras.businessName);
    expect(result.city).toBe(inputWithExtras.city);
    expect(result.primaryService).toBe(inputWithExtras.primaryService);
    expect(result.phone).toBe(inputWithExtras.phone);
    expect(result.tone).toBe(inputWithExtras.tone);
    expect(result.reviews).toEqual(inputWithExtras.reviews);
  });
});
