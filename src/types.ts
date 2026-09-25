/** The four valid tone values (undefined = professional default). */
export type Tone = "professional" | "friendly" | "casual";

/** A customer testimonial, as supplied in the input JSON. */
export interface Review {
  author: string; // non-empty
  text: string;   // non-empty
}

/** The raw BusinessInput structure read from --input JSON. */
export interface BusinessInput {
  businessName: string;    // required, non-empty
  city: string;            // required, non-empty
  primaryService: string;  // required, non-empty
  phone: string;           // required, non-empty
  tone?: Tone;             // optional, defaults to "professional"
  reviews?: Review[];      // optional, max 100 items
}

/** Subset of BusinessInput needed by buildMeta. */
export interface MetaInput {
  businessName: string;
  city: string;
  primaryService: string;
  tone?: Tone;
}

/** Return value of buildMeta. */
export interface MetaResult {
  title: string;       // ≤ 60 characters
  description: string; // ≤ 155 characters
}

/** Input subset for buildJsonLd. */
export interface JsonLdInput {
  businessName: string;
  city: string;
  primaryService: string;
  phone: string;
  reviews?: Review[];
}

/** A single schema.org Review entry shaped for Google's rich-result parser. */
export interface JsonLdReview {
  "@type": "Review";
  author: { "@type": "Person"; name: string };
  reviewBody: string;
}

/** schema.org LocalBusiness object (plain, JSON-serialisable). */
export interface JsonLdBlock {
  "@context": "https://schema.org";
  "@type": "LocalBusiness";
  name: string;
  telephone: string;
  areaServed: string;
  description: string;
  review?: JsonLdReview[];
}

/** Input subset for buildFaq. */
export interface FaqInput {
  primaryService: string;
  city: string;
  tone?: Tone;
}

/** One question/answer pair in the FAQ block. */
export interface FaqPair {
  question: string; // 1–200 characters
  answer: string;   // 1–500 characters
}

/** Structured validation error with the name of the offending field. */
export class ValidationError extends Error {
  constructor(
    public readonly field: string,
    message: string,
  ) {
    super(message);
    this.name = "ValidationError";
  }
}
