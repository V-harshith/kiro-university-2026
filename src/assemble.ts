import type { BusinessInput } from "./types.js";
import { escapeHtml } from "./escape.js";
import { slugify } from "./slug.js";
import { buildMeta } from "./meta.js";
import { buildJsonLd } from "./jsonld.js";
import { buildFaq } from "./faq.js";

/**
 * Assembles a complete, self-contained HTML5 landing page for a local business.
 *
 * Calls all pure transformation functions internally and escapes every
 * user-supplied string via escapeHtml before injection into markup.
 * The JSON-LD block is excluded from HTML-escaping because it uses JSON encoding.
 *
 * Inputs:  BusinessInput — fully validated business data
 * Outputs: complete HTML document string (deterministic for identical inputs)
 * Throws:  any error propagated from the underlying pure functions
 */
export function assemble(input: BusinessInput): string {
  const { businessName, city, primaryService, phone, reviews } = input;

  // --- Pure transformations ---
  const meta = buildMeta(input);
  const jsonLd = buildJsonLd(input);
  const faqPairs = buildFaq(input);
  // slugify is used by cli.ts for the filename; call here for determinism check
  const slug = slugify(businessName, city);

  // --- Escape all user-supplied strings for HTML injection ---
  const eName = escapeHtml(businessName);
  const eCity = escapeHtml(city);
  const eService = escapeHtml(primaryService);
  const ePhone = escapeHtml(phone);
  const eTitle = escapeHtml(meta.title);
  const eDesc = escapeHtml(meta.description);

  // JSON-LD is JSON-encoded (no HTML escaping needed inside the script block)
  const jsonLdString = JSON.stringify(jsonLd, null, 2);

  // --- FAQ block ---
  const faqHtml = faqPairs
    .map(
      ({ question, answer }) =>
        `      <div class="faq-item">
        <h3 class="faq-question">${escapeHtml(question)}</h3>
        <p class="faq-answer">${escapeHtml(answer)}</p>
      </div>`,
    )
    .join("\n");

  // --- Reviews block (only rendered when reviews are present) ---
  let reviewsHtml = "";
  if (reviews && reviews.length > 0) {
    const reviewItems = reviews
      .map(
        ({ author, text }) =>
          `      <blockquote class="review">
        <p class="review-text">${escapeHtml(text)}</p>
        <cite class="review-author">${escapeHtml(author)}</cite>
      </blockquote>`,
      )
      .join("\n");

    reviewsHtml = `
    <section class="reviews" aria-label="Customer reviews">
      <h2>What Our Customers Say</h2>
${reviewItems}
    </section>`;
  }

  // slug is used as a data attribute for determinism verification; not injected into visible HTML
  void slug;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${eTitle}</title>
  <meta name="description" content="${eDesc}">
  <script type="application/ld+json">
${jsonLdString}
  </script>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; line-height: 1.6; color: #222; background: #fff; }
    .container { max-width: 800px; margin: 0 auto; padding: 2rem 1rem; }
    header { background: #1a3c5e; color: #fff; padding: 2rem 1rem; text-align: center; }
    header h1 { font-size: 2rem; margin-bottom: 0.5rem; }
    header p { font-size: 1.1rem; opacity: 0.9; }
    .hero { padding: 2rem 0; border-bottom: 1px solid #e0e0e0; }
    .hero h2 { font-size: 1.5rem; margin-bottom: 1rem; color: #1a3c5e; }
    .contact { background: #f0f4f8; border-radius: 8px; padding: 1.5rem; margin: 2rem 0; }
    .contact h2 { margin-bottom: 0.75rem; color: #1a3c5e; }
    .contact p { font-size: 1.1rem; }
    .faq { margin: 2rem 0; }
    .faq h2 { font-size: 1.5rem; margin-bottom: 1rem; color: #1a3c5e; }
    .faq-item { border-bottom: 1px solid #e0e0e0; padding: 1rem 0; }
    .faq-question { font-size: 1rem; font-weight: 600; margin-bottom: 0.5rem; }
    .faq-answer { color: #444; }
    .reviews { margin: 2rem 0; }
    .reviews h2 { font-size: 1.5rem; margin-bottom: 1rem; color: #1a3c5e; }
    .review { border-left: 4px solid #1a3c5e; padding: 1rem 1.25rem; margin-bottom: 1rem; background: #f9f9f9; }
    .review-text { margin-bottom: 0.5rem; font-style: italic; }
    .review-author { font-weight: 600; font-size: 0.9rem; }
    footer { text-align: center; padding: 2rem 1rem; font-size: 0.85rem; color: #666; border-top: 1px solid #e0e0e0; }
  </style>
</head>
<body>
  <header>
    <div class="container">
      <h1>${eName}</h1>
      <p>${eService} in ${eCity}</p>
    </div>
  </header>

  <main class="container">
    <section class="hero">
      <h2>Professional ${eService} in ${eCity}</h2>
      <p>
        ${eName} is your trusted provider of ${eService} services in ${eCity}.
        We deliver quality workmanship and reliable results every time.
      </p>
    </section>

    <section class="contact" aria-label="Contact information">
      <h2>Contact Us</h2>
      <p><strong>Business:</strong> ${eName}</p>
      <p><strong>Service:</strong> ${eService}</p>
      <p><strong>Location:</strong> ${eCity}</p>
      <p><strong>Phone:</strong> ${ePhone}</p>
    </section>
${reviewsHtml}
    <section class="faq" aria-label="Frequently asked questions">
      <h2>Frequently Asked Questions</h2>
${faqHtml}
    </section>
  </main>

  <footer>
    <p>&copy; ${eName} &mdash; ${eService} in ${eCity}</p>
  </footer>
</body>
</html>`;
}
