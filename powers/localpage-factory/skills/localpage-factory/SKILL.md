---
name: "localpage-factory"
description: "Generate a publish-ready local landing page for a local business from a single JSON file. Use when asked to build, regenerate or restyle a local business landing page, service page or city page - producing an SEO slug, a title tag and meta description inside search-engine length limits, schema.org LocalBusiness JSON-LD, an FAQ block and one self-contained HTML file."
license: "MIT"
metadata:
  author: "Harshith Velneni"
  version: "1.0.0"
---

# LocalPage Factory

Turn one JSON brief about a local business into one publish-ready HTML page. No framework, no
external requests, no build step at runtime - the output is a single file you can drop on any host.

## When to use

- "Make a landing page for <business> in <city>"
- Building or regenerating a service page / city page for a local SEO client
- Generating pages in bulk from a folder of briefs

## Input shape (`business.json`)

```json
{
  "businessName": "Sunrise Roofing & Repair",
  "city": "Portland",
  "primaryService": "residential roof replacement",
  "phone": "503-555-0199",
  "tone": "friendly",
  "reviews": [
    { "author": "Maria G.", "text": "They replaced our entire roof in two days." }
  ]
}
```

`businessName`, `city` and `primaryService` are required; `phone`, `tone` and `reviews` are optional.
Validation fails loudly (throws) rather than emitting a half-built page.

## Workflow

1. Write or receive the brief as `business.json` in the working directory.
2. Build once: `npx tsc` (emits to `dist/`).
3. Generate the page: `node dist/cli.js --input business.json --out out/`
   - The slug is derived from business name + city + service, so the file lands as
     `out/<slug>.html` (e.g. `sunrise-roofing-repair-portland.html`).
4. Inspect `out/<slug>.html` in a browser - it is self-contained (inline CSS, no external fetches).

For a batch, loop the CLI over one JSON file per business; each run is independent and
deterministic, so identical input always produces a byte-identical page.

## What the generated page contains

- `<title>` within 60 characters and a `<meta name="description">` within 155 characters, both
  derived from the brief and trimmed on a word boundary.
- A `LocalBusiness` JSON-LD block (`@context`, `@type`, name, address locality, telephone, service,
  and `review` entries when reviews are supplied).
- An FAQ section of 3-5 question/answer pairs about the service in that city.
- One self-contained HTML document: inline CSS, no external requests.

## Rules to preserve when extending

- Every user-supplied string that reaches HTML goes through `escapeHtml` (`src/escape.ts`). This is
  the XSS guard; never interpolate raw brief text into markup.
- Keep the generators pure (`slugify`, `buildMeta`, `buildJsonLd`, `buildFaq`, `assemble`) so each
  stays independently testable; I/O lives only in `cli.ts`.
- Run `npx vitest run` after any change; behaviour changes need unit tests, and rules that hold for
  all inputs need a fast-check property test in the matching `*.property.test.ts` file.

## Reference

- Specification the page is built against: `.kiro/specs/localpage-factory/requirements.md` and
  `design.md` (including the correctness properties each module must satisfy).
