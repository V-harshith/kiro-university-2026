import type { FaqInput, FaqPair, Tone } from "./types.js";

const VALID_TONES: ReadonlySet<Tone> = new Set([
  "professional",
  "friendly",
  "casual",
]);

/**
 * Returns true when the tone implies second-person ("you"/"your") phrasing.
 */
function isSecondPerson(tone: Tone | undefined): boolean {
  return tone === "friendly" || tone === "casual";
}

/**
 * Generates a deterministic FAQ block for a local business landing page.
 *
 * The function uses fixed templates keyed on tone so that identical inputs
 * always produce identical outputs (R6.5).  Templates are filled with the
 * caller-supplied `primaryService` and `city` values.
 *
 * Inputs:  FaqInput — primaryService (1–100 chars), city (1–100 chars),
 *          optional tone ("professional" | "friendly" | "casual")
 * Outputs: FaqPair[] — 3–5 pairs; question ≤ 200 chars, answer ≤ 500 chars
 * Throws:  Error when primaryService/city are out of range, or tone is unrecognised
 */
export function buildFaq(input: FaqInput): FaqPair[] {
  const { primaryService, city, tone } = input ?? {};

  // Validate primaryService
  if (typeof primaryService !== "string" || primaryService.length === 0) {
    throw new Error(
      'buildFaq: "primaryService" must be a non-empty string',
    );
  }
  if (primaryService.length > 100) {
    throw new Error(
      `buildFaq: "primaryService" must be at most 100 characters (got ${primaryService.length})`,
    );
  }

  // Validate city
  if (typeof city !== "string" || city.length === 0) {
    throw new Error('buildFaq: "city" must be a non-empty string');
  }
  if (city.length > 100) {
    throw new Error(
      `buildFaq: "city" must be at most 100 characters (got ${city.length})`,
    );
  }

  // Validate tone (when present)
  if (tone !== undefined && !VALID_TONES.has(tone)) {
    throw new Error(
      `buildFaq: unrecognised tone "${String(tone)}"; must be one of "professional", "friendly", or "casual"`,
    );
  }

  const s = primaryService; // alias for brevity
  const c = city;

  if (isSecondPerson(tone)) {
    // Friendly / casual — second-person ("you"/"your") in every answer (R6.6)
    return [
      {
        question: `What does ${s} in ${c} include?`,
        answer: `When you choose our ${s} service in ${c}, you get a thorough assessment, quality workmanship, and a satisfaction guarantee tailored to your needs.`,
      },
      {
        question: `How do you book ${s} in ${c}?`,
        answer: `Booking is easy — you can call us or fill out our online form, and we'll schedule your ${s} appointment in ${c} at a time that works for you.`,
      },
      {
        question: `How much does ${s} cost in ${c}?`,
        answer: `Pricing depends on the scope of your project. Contact us for a free, no-obligation quote so you know exactly what to expect before your ${s} work begins in ${c}.`,
      },
      {
        question: `Why should you choose us for ${s} in ${c}?`,
        answer: `Our team brings years of experience to every ${s} job in ${c}. You benefit from reliable service, transparent pricing, and a commitment to your complete satisfaction.`,
      },
      {
        question: `Is your ${s} service available throughout ${c}?`,
        answer: `Yes — you can reach us anywhere in ${c} and the surrounding areas. Get in touch to confirm your location and we'll get you scheduled right away.`,
      },
    ];
  } else {
    // Professional / absent — third-person / impersonal; no "you"/"your" (R6.7)
    return [
      {
        question: `What does ${s} in ${c} include?`,
        answer: `The ${s} service in ${c} covers a full assessment, professional workmanship, and a satisfaction guarantee — delivered to the highest industry standards.`,
      },
      {
        question: `How is ${s} scheduled in ${c}?`,
        answer: `Appointments for ${s} in ${c} can be arranged by phone or online. The team works around the client's schedule to minimise disruption.`,
      },
      {
        question: `What does ${s} cost in ${c}?`,
        answer: `Pricing for ${s} in ${c} varies based on the scope of work. A free, no-obligation quote is available upon request prior to any work commencing.`,
      },
      {
        question: `Why choose this ${s} provider in ${c}?`,
        answer: `With extensive experience in ${s} across ${c}, the team delivers reliable results, transparent pricing, and a proven track record of client satisfaction.`,
      },
      {
        question: `Is ${s} available throughout ${c}?`,
        answer: `The ${s} service covers ${c} and the surrounding region. Contact the office to confirm availability for a specific address or area.`,
      },
    ];
  }
}
