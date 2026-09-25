# Implementation Plan: localpage-factory

## Overview

Build the `localpage-factory` CLI tool bottom-up: shared types and project scaffold first,
then each pure transformation module with its tests, then the assembler, then the CLI entry
point, and finally integration tests that validate end-to-end behaviour. Each step compiles
and its tests pass before the next step begins.

## Tasks

- [ ] 1. Scaffold project structure, shared types, and test framework
  - Initialise `package.json` with `name`, `version`, `scripts` (`build`, `test`), and
    `type: "module"` (or `"commonjs"` — pick one and stay consistent).
  - Add dependencies: `typescript`, `vitest`, `fast-check`; add `tsconfig.json` targeting
    Node 18, `strict: true`, `outDir: "dist"`.
  - Create `src/types.ts` exporting `Tone`, `Review`, `BusinessInput`, `MetaInput`,
    `MetaResult`, `JsonLdInput`, `JsonLdBlock`, `FaqPair`, and `ValidationError` exactly as
    specified in the design data-models section.
  - Add a `vitest.config.ts` (or equivalent) so `npm test` runs all `*.test.ts` and
    `*.property.test.ts` files.
  - _Requirements: R1–R9 (foundational — required by every subsequent module)_

- [ ] 2. Implement `escapeHtml` and its tests
  - [ ] 2.1 Implement `src/escape.ts` exporting `escapeHtml(s: string): string`
    - Replace `&` → `&amp;`, `<` → `&lt;`, `>` → `&gt;`, `"` → `&quot;`, `'` → `&#39;`.
    - Throw `TypeError` for non-string arguments.
    - _Requirements: R5.1, R5.2, R5.3, R5.4, R5.6, R5.7_

  - [ ]* 2.2 Write property tests for `escapeHtml` (`src/__tests__/escape.property.test.ts`)
    - **Property 13: HTML escaping replaces all five dangerous characters**
    - **Validates: Requirements R5.1, R5.7**
    - **Property 14: HTML escaping is the identity on safe inputs**
    - **Validates: Requirements R5.2, R5.4**
    - Each property runs ≥ 100 iterations via `fc.assert(fc.property(...))`.

  - [ ]* 2.3 Write example-based unit tests (`src/__tests__/escape.test.ts`)
    - Each of the five entities individually.
    - Empty string → empty string (R5.3).
    - Non-string argument → `TypeError` (R5.6).
    - Multiple consecutive special characters (R5.7).

- [ ] 3. Implement `slugify` and its tests
  - [ ] 3.1 Implement `src/slug.ts` exporting `slugify(businessName: string, city: string): string`
    - Lower-case both inputs, replace whitespace runs with `-`, strip non-ASCII-alphanumeric/
      hyphen characters, join with `-`, collapse consecutive hyphens, strip leading/trailing
      hyphens, truncate at 200 characters at a hyphen boundary.
    - Throw for blank or whitespace-only inputs.
    - _Requirements: R2.1–R2.10_

  - [ ]* 3.2 Write property tests (`src/__tests__/slug.property.test.ts`)
    - **Property 3: Slug output is lowercase, ASCII-safe, and structurally clean**
    - **Validates: Requirements R2.2, R2.3, R2.4, R2.7, R2.8, R2.10**
    - **Property 4: Slug is deterministic**
    - **Validates: Requirement R2.6**
    - **Property 5: Slug rejects blank inputs**
    - **Validates: Requirement R2.9**

  - [ ]* 3.3 Write example-based unit tests (`src/__tests__/slug.test.ts`)
    - Name + city producing a well-known slug.
    - Unicode characters stripped to ASCII.
    - Input whose naive join exceeds 200 chars — verify truncation at hyphen (R2.10).
    - Whitespace-only city → throws (R2.9).

- [ ] 4. Implement `buildMeta` and its tests
  - [ ] 4.1 Implement `src/meta.ts` exporting `buildMeta(input: MetaInput): MetaResult`
    - Compose title as `"<businessName> – <primaryService> in <city>"` (or similar
      template); trim at 60 chars at the nearest word boundary, preserving `city` in full
      and truncating `businessName` first when needed (R3.11).
    - Compose description from all three fields; trim at 155 chars at the nearest word
      boundary.
    - Throw on missing, empty, or non-string required inputs (R3.10).
    - _Requirements: R3.1–R3.11_

  - [ ]* 4.2 Write property tests (`src/__tests__/meta.property.test.ts`)
    - **Property 6: Title tag length is always within budget**
    - **Validates: Requirement R3.2**
    - **Property 7: Meta description length is always within budget**
    - **Validates: Requirement R3.3**
    - **Property 8: City is always preserved verbatim in the title tag**
    - **Validates: Requirements R3.5, R3.11**
    - **Property 9: Meta output is deterministic**
    - **Validates: Requirement R3.7**

  - [ ]* 4.3 Write example-based unit tests (`src/__tests__/meta.test.ts`)
    - Exact truncation at 60 chars — verify no mid-word cut (R3.8).
    - Exact truncation at 155 chars — verify no mid-word cut (R3.9).
    - Long `businessName` + short `city` — city must survive verbatim (R3.11).
    - Missing required field → throws (R3.10).

- [ ] 5. Implement `buildJsonLd` and its tests
  - [ ] 5.1 Implement `src/jsonld.ts` exporting `buildJsonLd(input: JsonLdInput): JsonLdBlock`
    - Return a plain `JsonLdBlock` object with the six mandatory fields set from input.
    - Map `reviews` to the `review` array when present; throw on malformed `Review`
      objects (missing `author` or `text`).
    - Throw on missing or empty required string fields (R4.9).
    - _Requirements: R4.1–R4.11, R9.1_

  - [ ]* 5.2 Write property tests (`src/__tests__/jsonld.property.test.ts`)
    - **Property 10: JSON-LD output has correct schema.org fields**
    - **Validates: Requirements R4.2–R4.7**
    - **Property 11: JSON-LD review array mirrors input reviews**
    - **Validates: Requirement R4.8**
    - **Property 12: JSON-LD serialisation is stable (round-trip)**
    - **Validates: Requirements R4.11, R9.1**

  - [ ]* 5.3 Write example-based unit tests (`src/__tests__/jsonld.test.ts`)
    - Input with no `reviews` → no `review` key in output (R4.8).
    - Review missing `text` → throws (R4.10).
    - Required field absent → throws (R4.9).
    - `JSON.parse(JSON.stringify(result))` deeply equals result (R9.1).

- [ ] 6. Implement `buildFaq` and its tests
  - [ ] 6.1 Implement `src/faq.ts` exporting `buildFaq(input: FaqInput): FaqPair[]`
    - Return 3–5 `FaqPair` objects; all questions ≤ 200 chars, all answers ≤ 500 chars.
    - Friendly/casual tone: every answer contains "you" or "your" (R6.6).
    - Professional/absent tone: no answer contains "you" or "your" (R6.7).
    - Throw on out-of-range `primaryService`/`city` lengths or unrecognised tone (R6.8, R6.9).
    - The same inputs must always produce the same output (deterministic, R6.5).
    - _Requirements: R6.1–R6.9_

  - [ ]* 6.2 Write property tests (`src/__tests__/faq.property.test.ts`)
    - **Property 16: FAQ count is always between 3 and 5**
    - **Validates: Requirements R6.2, R6.3**
    - **Property 17: FAQ pairs have non-empty, length-bounded content**
    - **Validates: Requirement R6.4**
    - **Property 18: FAQ tone routing — friendly/casual uses second-person**
    - **Validates: Requirement R6.6**
    - **Property 19: FAQ tone routing — professional/absent avoids second-person**
    - **Validates: Requirement R6.7**
    - **Property 20: FAQ output is deterministic**
    - **Validates: Requirement R6.5**

  - [ ]* 6.3 Write example-based unit tests (`src/__tests__/faq.test.ts`)
    - Exactly 3 pairs returned for a minimal valid input.
    - Exactly 5 pairs returned for a full-length input.
    - `primaryService` length 101 → throws (R6.8).
    - Unrecognised tone string → throws (R6.9).

- [ ] 7. Checkpoint — all pure-function tests pass
  - Run `npm test`; all tests for `escape`, `slug`, `meta`, `jsonld`, and `faq` must be
    green before proceeding. Ask the user if anything is unclear or failing unexpectedly.

- [ ] 8. Implement `validate` and its tests
  - [ ] 8.1 Implement `src/validate.ts` exporting `validate(raw: unknown): BusinessInput`
    - Check that `raw` is an object and that each of the four required string fields is
      present, non-empty, and a string; collect all failures and throw a single
      `ValidationError` listing each missing/invalid field name.
    - Accept optional `tone` (must be one of the three valid values) and optional `reviews`
      (must be an array of `Review`-shaped objects).
    - Return a typed `BusinessInput` on success.
    - _Requirements: R1.1–R1.5, R9.2_

  - [ ]* 8.2 Write example-based unit tests (`src/__tests__/validate.test.ts`)
    - Each of the four required fields absent individually → throws with field name in
      message (R1.1–R1.4).
    - All required fields present → returns correctly typed object (R1.5).
    - Invalid `tone` value → throws (R1 / validate contract).
    - `validate(JSON.parse(JSON.stringify(validInput)))` round-trip equality (R9.2).

  - Note: Properties 1 and 2 are validated through `assemble.property.test.ts` (see task 9).

- [ ] 9. Implement `assemble` and its tests
  - [ ] 9.1 Implement `src/assemble.ts` exporting `assemble(input: BusinessInput): string`
    - Call `slugify`, `buildMeta`, `buildJsonLd`, `buildFaq` internally.
    - Pass every user-supplied string through `escapeHtml` before injecting into HTML markup
      (excluding the JSON-LD `<script>` block, which uses JSON encoding).
    - Produce a complete HTML5 document:
      - `<!DOCTYPE html>` declaration.
      - `<title>` from `buildMeta`.
      - `<meta name="description">` from `buildMeta`.
      - Single `<script type="application/ld+json">` in `<head>`.
      - `<style>` element with all inline CSS; no `<link rel="stylesheet">`.
      - No `on*` attributes; no other `<script>` elements.
      - `businessName`, `city`, `primaryService`, `phone` in `<body>`.
      - FAQ block rendered in `<body>`.
      - Reviews (if any) rendered in `<body>`.
    - _Requirements: R7.2–R7.12_

  - [ ]* 9.2 Write property tests (`src/__tests__/assemble.property.test.ts`)
    - **Property 1: Validation rejects every individually missing required field**
    - **Validates: Requirements R1.1–R1.4**
    - **Property 2: Validation accepts all well-formed inputs**
    - **Validates: Requirement R1.5**
    - **Property 15: Assembled HTML contains no raw special characters from user input**
    - **Validates: Requirement R5.5**
    - **Property 21: Assembled HTML is structurally valid and self-contained**
    - **Validates: Requirements R7.2–R7.5, R7.8–R7.10**
    - **Property 22: Assembly is deterministic (byte-identical on identical input)**
    - **Validates: Requirement R7.11**
    - **Property 23: BusinessInput JSON round-trip**
    - **Validates: Requirement R9.2**

  - [ ]* 9.3 Write example-based unit tests (`src/__tests__/assemble.test.ts`)
    - Output starts with `<!DOCTYPE html>` (R7.2).
    - `<title>` text matches `buildMeta` output (R7.3).
    - `<meta name="description" content="...">` present (R7.4).
    - Exactly one `<script type="application/ld+json">` (R7.5, R7.9).
    - No `<link rel="stylesheet">` (R7.8).
    - No `on*` attributes (R7.10).
    - Reviews rendered when present (R7.7).
    - Overwrite of existing file produces identical content (R7.14).

- [ ] 10. Implement `cli.ts` and wire everything together
  - [ ] 10.1 Implement `src/cli.ts` as the entry point
    - Use `util.parseArgs` with `strict: true` for `--input`, `--out`, `--help`.
    - On `--help`: print usage summary listing all flags and exit 0 (R8.6).
    - Validate that both `--input` and `--out` are present; exit 1 with usage message
      identifying the missing flag if either is absent (R1.6, R1.7).
    - Read `--input` file; handle `ENOENT` (exit 1 + path in message, R1.8, R8.7) and
      `SyntaxError` from `JSON.parse` (exit 1 + path + "parse failure", R1.9).
    - Call `validate()`; catch `ValidationError` → stderr + exit 1 (R1.1–R1.4).
    - Check `--out`: if it exists as a file (not a directory), exit 1 with descriptive
      message (R8.8). Create directory with `fs.mkdirSync({ recursive: true })`; catch
      creation errors → stderr + exit 1 (R7.13).
    - Call `assemble()`, derive file name via `slugify`, write with `fs.writeFileSync`.
    - On success: print absolute path of written file to stdout, exit 0 (R8.4).
    - All errors → stderr, non-zero exit (R8.5).
    - _Requirements: R1.5–R1.9, R7.1, R7.13, R7.14, R8.1–R8.8_

  - Add `"main": "dist/cli.js"` and a `"bin"` entry to `package.json`.
  - Compile with `tsc` and verify `dist/cli.js` is emitted without type errors.

- [ ] 11. Write CLI integration tests (`src/__tests__/cli.integration.test.ts`)
  - [ ]* 11.1 Write integration tests for the happy path and error cases
    - Spawn `node dist/cli.js --input <fixture> --out <tmpdir>` for a valid fixture; assert
      exit code 0, stdout is absolute path of written file, file exists at that path (R8.4,
      R7.1).
    - Output directory created when it does not exist (R8.3).
    - `--input` omitted → exit non-zero, stderr mentions `--input` (R1.6).
    - `--out` omitted → exit non-zero, stderr mentions `--out` (R1.7).
    - `--input` path missing → exit non-zero, stderr contains file path (R1.8, R8.7).
    - Invalid JSON file → exit non-zero, stderr contains file path and parse failure (R1.9).
    - `--out` pointing to an existing file → exit non-zero (R8.8).
    - `--help` → exit 0, stdout contains flag names (R8.6).
    - _Requirements: R1.6–R1.9, R7.1, R8.3–R8.8_

- [ ] 12. Final checkpoint — full test suite passes
  - Run `npm test`; every test file (unit, property, integration) must be green.
  - Compile `tsc --noEmit` with zero diagnostics.
  - Ask the user if anything is unclear or if any tests are failing unexpectedly.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP delivery.
- All property tests must run ≥ 100 iterations and be tagged with a comment in the format:
  `// Feature: localpage-factory, Property N: <property text>`
- Integration tests operate on 2–3 fixture examples only; they do not use property
  generators (subprocess spawning at scale would be slow and tests external I/O).
- `escapeHtml` is implemented first (task 2) because `assemble` depends on it and it is
  the simplest pure function — a good warm-up before the more complex modules.
- The `assemble.property.test.ts` file covers Properties 1 and 2 (validation behaviour)
  because those properties are most naturally exercised through the full pipeline.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1", "3.1", "4.1", "5.1", "6.1"] },
    { "id": 1, "tasks": ["2.2", "2.3", "3.2", "3.3", "4.2", "4.3", "5.2", "5.3", "6.2", "6.3"] },
    { "id": 2, "tasks": ["8.1"] },
    { "id": 3, "tasks": ["8.2", "9.1"] },
    { "id": 4, "tasks": ["9.2", "9.3", "10.1"] },
    { "id": 5, "tasks": ["11.1"] }
  ]
}
```
