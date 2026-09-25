# Requirements Document

## Introduction

`localpage-factory` is a Node.js + TypeScript CLI tool that transforms a local business's structured details into a publish-ready, self-contained HTML landing page optimised for local SEO. Given a JSON input file, the tool produces a slug, a title tag, a meta description, a schema.org `LocalBusiness` JSON-LD block, an FAQ block, and a single HTML file with inline CSS and no external dependencies.

## Glossary

- **Business_Input**: A JSON object supplied by the caller containing the fields listed in R1.
- **Slug**: A URL-safe, lowercase, hyphen-separated string derived from the business name and city.
- **Title_Tag**: The content of the HTML `<title>` element, at most 60 characters.
- **Meta_Description**: The content of the HTML `<meta name="description">` element, at most 155 characters.
- **JSON_LD_Block**: A `<script type="application/ld+json">` element containing a schema.org `LocalBusiness` object.
- **FAQ_Block**: A structured list of 3–5 question/answer pairs about the business's primary service.
- **Landing_Page**: A single, self-contained HTML file with inline CSS and no external network requests.
- **Slug_Function**: The pure function responsible for deriving a Slug from business name and city.
- **Meta_Function**: The pure function responsible for producing the Title_Tag and Meta_Description.
- **JSONLD_Function**: The pure function responsible for building the JSON_LD_Block.
- **Escape_Function**: The pure function responsible for HTML-escaping user-supplied text.
- **FAQ_Function**: The pure function responsible for generating the FAQ_Block.
- **CLI**: The command-line entry point at `dist/cli.js`.
- **Tone**: An optional string (`"professional"`, `"friendly"`, or `"casual"`) that influences generated copy. Defaults to `"professional"` when absent.
- **Review**: An optional object with fields `author` (string) and `text` (string) representing a customer testimonial.

---

## Requirements

### Requirement 1: Input Validation

**User Story:** As a developer, I want the tool to reject incomplete input early, so that I get a clear error rather than a silently broken page.

#### Acceptance Criteria

1. WHEN `Business_Input` is provided without a `businessName` field, THEN THE CLI SHALL exit with a non-zero status code and print an error message identifying the missing field name.
2. WHEN `Business_Input` is provided without a `city` field, THEN THE CLI SHALL exit with a non-zero status code and print an error message identifying the missing field name.
3. WHEN `Business_Input` is provided without a `primaryService` field, THEN THE CLI SHALL exit with a non-zero status code and print an error message identifying the missing field name.
4. WHEN `Business_Input` is provided without a `phone` field, THEN THE CLI SHALL exit with a non-zero status code and print an error message identifying the missing field name.
5. WHEN `Business_Input` is provided with all four required fields (`businessName`, `city`, `primaryService`, `phone`) present and each containing at least one non-whitespace character, THE CLI SHALL proceed to page generation without emitting any error and without exiting before generation completes.
6. WHEN the `--input` flag is omitted from the CLI invocation, THEN THE CLI SHALL exit with a non-zero status code and print a usage message that identifies `--input` as a required flag.
7. WHEN the `--out` flag is omitted from the CLI invocation, THEN THE CLI SHALL exit with a non-zero status code and print a usage message that identifies `--out` as a required flag.
8. WHEN the file referenced by `--input` does not exist, THEN THE CLI SHALL exit with a non-zero status code and print an error message that includes the file path.
9. IF the file referenced by `--input` exists but cannot be parsed as valid JSON, THEN THE CLI SHALL exit with a non-zero status code and print an error message that includes the file path and indicates a parse failure.

---

### Requirement 2: Slug Generation

**User Story:** As a developer, I want a deterministic, URL-safe slug derived from the business name and city, so that the output file has a predictable, linkable name.

#### Acceptance Criteria

1. THE Slug_Function SHALL accept a `businessName` string and a `city` string and return a Slug.
2. WHEN `Slug_Function` is called, THE Slug_Function SHALL convert both inputs to lowercase before processing.
3. WHEN `Slug_Function` is called, THE Slug_Function SHALL replace all whitespace sequences with a single hyphen.
4. WHEN `Slug_Function` is called, THE Slug_Function SHALL remove all characters that are not ASCII letters, digits, or hyphens.
5. WHEN `Slug_Function` is called, THE Slug_Function SHALL join the processed `businessName` and `city` segments with a hyphen.
6. WHEN `Slug_Function` is called with identical inputs, THE Slug_Function SHALL return the same Slug on every call.
7. WHEN `Slug_Function` is called, THE Slug_Function SHALL produce a Slug that contains no leading or trailing hyphens.
8. WHEN `Slug_Function` is called, THE Slug_Function SHALL produce a Slug that contains no consecutive hyphens.
9. IF either `businessName` or `city` is an empty string or contains only whitespace, THEN THE Slug_Function SHALL throw an error indicating which input is invalid.
10. WHEN the derived Slug exceeds 200 characters, THE Slug_Function SHALL truncate the Slug to 200 characters at the nearest preceding hyphen boundary.

---

### Requirement 3: Title Tag and Meta Description Generation

**User Story:** As an SEO practitioner, I want a title tag and meta description generated from the business details, so that the landing page ranks and displays correctly in search results.

#### Acceptance Criteria

1. THE Meta_Function SHALL accept `businessName` (1–100 characters), `city` (1–100 characters), `primaryService` (1–100 characters), and an optional `Tone` whose value is one of `"professional"`, `"friendly"`, or `"casual"`, and return a Title_Tag and a Meta_Description.
2. WHEN `Meta_Function` is called, THE Meta_Function SHALL produce a Title_Tag that is at most 60 characters in length.
3. WHEN `Meta_Function` is called, THE Meta_Function SHALL produce a Meta_Description that is at most 155 characters in length.
4. WHEN `Meta_Function` is called, THE Meta_Function SHALL include the verbatim value of `businessName` in the Title_Tag.
5. WHEN `Meta_Function` is called, THE Meta_Function SHALL include the verbatim value of `city` in the Title_Tag.
6. WHEN `Meta_Function` is called, THE Meta_Function SHALL include `primaryService` in the Meta_Description.
7. WHEN `Meta_Function` is called with identical inputs, THE Meta_Function SHALL return identical Title_Tag and Meta_Description values on every call.
8. IF the natural Title_Tag exceeds 60 characters, THEN THE Meta_Function SHALL truncate it to 60 characters at the nearest word boundary at or before character 60.
9. IF the natural Meta_Description exceeds 155 characters, THEN THE Meta_Function SHALL truncate it to 155 characters at the nearest word boundary at or before character 155.
10. IF any required input (`businessName`, `city`, or `primaryService`) is absent, empty, or not a string, THEN THE Meta_Function SHALL throw an error identifying the invalid input.
11. IF the combined length of `businessName` and `city` (plus separator characters) already exceeds 60 characters, THEN THE Meta_Function SHALL preserve `city` in full and truncate `businessName` so that the Title_Tag fits within 60 characters.

---

### Requirement 4: schema.org JSON-LD Block

**User Story:** As an SEO practitioner, I want a valid schema.org `LocalBusiness` JSON-LD block embedded in the page, so that search engines can parse structured business data.

#### Acceptance Criteria

1. THE JSONLD_Function SHALL accept `businessName`, `city`, `primaryService`, and `phone` as required string inputs of 1–500 characters each, and return a JSON-serialisable object conforming to the schema.org `LocalBusiness` type.
2. WHEN `JSONLD_Function` is called, THE JSONLD_Function SHALL set the `"@context"` property to `"https://schema.org"`.
3. WHEN `JSONLD_Function` is called, THE JSONLD_Function SHALL set the `"@type"` property to `"LocalBusiness"`.
4. WHEN `JSONLD_Function` is called, THE JSONLD_Function SHALL set the `"name"` property to the value of `businessName`.
5. WHEN `JSONLD_Function` is called, THE JSONLD_Function SHALL set the `"telephone"` property to the value of `phone`.
6. WHEN `JSONLD_Function` is called, THE JSONLD_Function SHALL set the `"areaServed"` property to the value of `city`.
7. WHEN `JSONLD_Function` is called, THE JSONLD_Function SHALL set the `"description"` property to the value of `primaryService`.
8. WHEN `JSONLD_Function` is called with one or more Review objects (maximum 100), THE JSONLD_Function SHALL include a `"review"` array containing one entry per Review, each with `"author"` and `"reviewBody"` properties.
9. IF any required input is absent, empty, or not a string, THEN THE JSONLD_Function SHALL throw an error identifying the invalid input.
10. IF a Review object is missing the `author` or `text` property, THEN THE JSONLD_Function SHALL throw an error identifying the malformed Review.
11. WHEN `JSONLD_Function` is called with identical inputs, THE JSONLD_Function SHALL return an object that serialises to the same JSON string on every call.

---

### Requirement 5: HTML Escaping

**User Story:** As a security-conscious developer, I want all user-supplied text to be HTML-escaped before it is written into the page, so that the output never contains executable script or broken markup.

#### Acceptance Criteria

1. THE Escape_Function SHALL accept a string and return a string in which every occurrence of `&`, `<`, `>`, `"`, and `'` is replaced independently and in full with the corresponding HTML entity (`&amp;`, `&lt;`, `&gt;`, `&quot;`, `&#39;`) across the entire input.
2. WHEN `Escape_Function` is called with a string containing no special characters, THE Escape_Function SHALL return a string identical in length and content to the input.
3. WHEN `Escape_Function` is called with an empty string, THE Escape_Function SHALL return an empty string.
4. WHEN `Escape_Function` is called with identical inputs, THE Escape_Function SHALL return the same output on every call regardless of call count or order relative to other calls.
5. WHEN the Landing_Page is assembled, THE CLI SHALL pass every user-supplied string through `Escape_Function` before inserting it into HTML markup, such that no raw `&`, `<`, `>`, `"`, or `'` from user input appears verbatim in the final HTML output.
6. IF `Escape_Function` is called with a non-string argument, THEN THE Escape_Function SHALL throw a TypeError identifying the invalid argument type.
7. WHEN `Escape_Function` is called with a string containing multiple consecutive or adjacent special characters, THE Escape_Function SHALL replace each special character individually and return the fully-escaped result.

---

### Requirement 6: FAQ Block Generation

**User Story:** As a local business owner, I want a FAQ block about my primary service included on the page, so that the page addresses common customer questions and improves search visibility.

#### Acceptance Criteria

1. THE FAQ_Function SHALL accept `primaryService` as a non-empty string of 1–100 characters, `city` as a non-empty string of 1–100 characters, and an optional `Tone` parameter whose value is one of `"friendly"`, `"casual"`, or `"professional"`, and SHALL return an array of between 3 and 5 question/answer pairs.
2. WHEN `FAQ_Function` is called, THE FAQ_Function SHALL return no fewer than 3 question/answer pairs.
3. WHEN `FAQ_Function` is called, THE FAQ_Function SHALL return no more than 5 question/answer pairs.
4. WHEN `FAQ_Function` is called, each question/answer pair SHALL contain a non-empty `question` string of 1–200 characters and a non-empty `answer` string of 1–500 characters.
5. WHEN `FAQ_Function` is called with identical `primaryService`, `city`, and `Tone` inputs, THE FAQ_Function SHALL return structurally identical question/answer pairs on every call.
6. WHEN `Tone` is `"friendly"` or `"casual"`, THE FAQ_Function SHALL use second-person phrasing (i.e. at least one of "you" or "your") in every generated answer.
7. WHEN `Tone` is `"professional"` or absent, THE FAQ_Function SHALL use third-person or impersonal phrasing and SHALL NOT use "you" or "your" in any generated answer.
8. IF `primaryService` is an empty string or exceeds 100 characters, or `city` is an empty string or exceeds 100 characters, THEN THE FAQ_Function SHALL throw an error indicating the invalid input.
9. IF `Tone` is provided and its value is not one of `"friendly"`, `"casual"`, or `"professional"`, THEN THE FAQ_Function SHALL throw an error indicating the unrecognised tone value.

---

### Requirement 7: Landing Page Assembly

**User Story:** As a developer, I want the tool to produce a single, self-contained HTML file, so that the page can be deployed to any static host without additional build steps.

#### Acceptance Criteria

1. WHEN `Business_Input` passes validation, THE CLI SHALL write a Landing_Page file whose name is `<Slug>.html` inside the directory specified by `--out`.
2. THE Landing_Page SHALL be a valid HTML5 document containing a `<!DOCTYPE html>` declaration.
3. THE Landing_Page SHALL contain the Title_Tag inside a `<title>` element in the `<head>`.
4. THE Landing_Page SHALL contain the Meta_Description inside a `<meta name="description">` element in the `<head>`.
5. THE Landing_Page SHALL contain the JSON_LD_Block inside the `<head>`.
6. THE Landing_Page SHALL contain the FAQ_Block rendered as non-empty text content in the `<body>`.
7. WHEN one or more Review objects are present in `Business_Input`, THE Landing_Page SHALL render each review's `author` and `text` as non-empty text content in the `<body>`.
8. THE Landing_Page SHALL contain a `<style>` element in the `<head>` containing all CSS used by the page, and SHALL include no `<link rel="stylesheet">` elements.
9. THE Landing_Page SHALL include no `<script>` elements except a single `<script type="application/ld+json">` element.
10. THE Landing_Page SHALL include no HTML attributes of the form `on*` (e.g. `onclick`, `onload`).
11. WHEN `Business_Input` is provided with identical content, THE CLI SHALL produce byte-for-byte identical Landing_Page output on every invocation.
12. THE Landing_Page SHALL display `businessName`, `city`, `primaryService`, and `phone` as non-empty text content in the `<body>`.
13. WHEN the `--out` directory does not exist and cannot be created, THE CLI SHALL exit with a non-zero status code, print an error message identifying the directory path, and write no output file.
14. WHEN `<Slug>.html` already exists in the `--out` directory, THE CLI SHALL overwrite it silently.

---

### Requirement 8: CLI Interface

**User Story:** As a developer, I want a straightforward CLI invocation, so that I can integrate the tool into build scripts and CI pipelines.

#### Acceptance Criteria

1. THE CLI SHALL accept a `--input <path>` flag specifying the path to a Business_Input JSON file.
2. THE CLI SHALL accept an `--out <directory>` flag specifying the output directory for the Landing_Page.
3. WHEN `--out` references a directory that does not yet exist, THE CLI SHALL create it before writing output.
4. WHEN page generation succeeds, THE CLI SHALL exit with status code `0` and print the absolute path of the written Landing_Page file to stdout.
5. WHEN page generation fails for any reason, THE CLI SHALL exit with a non-zero status code and print a human-readable error message indicating the cause of failure to stderr.
6. THE CLI SHALL accept a `--help` flag and print a usage summary to stdout that includes the tool name, a brief description, and all accepted flags.
7. WHEN `--input` is provided but the referenced file does not exist, THE CLI SHALL exit with a non-zero status code and print an error message that includes the missing file path.
8. WHEN `--out` is provided but the path is not a valid directory path (e.g. points to an existing file), THE CLI SHALL exit with a non-zero status code and print an error message identifying the invalid path.

---

### Requirement 9: Parser / Serialiser Round-Trip

**User Story:** As a developer, I want the JSON-LD block and the input parsing to be verifiable by round-trip testing, so that serialisation bugs are caught before deployment.

#### Acceptance Criteria

1. FOR ALL valid `Business_Input` objects, parsing the JSON output of `JSONLD_Function` and then serialising it again SHALL produce a JSON string with the same key-value pairs at every nesting level as the original output (regardless of key ordering).
2. FOR ALL valid JSON strings accepted by the CLI `--input` parser, serialising the parsed `Business_Input` object back to JSON and then re-parsing it SHALL produce a `Business_Input` object whose fields are identical in type and value to the original.
3. IF `JSONLD_Function` is called with a `Business_Input` that fails schema validation (e.g. a required field is missing or has the wrong type), THEN THE JSONLD_Function SHALL throw an error and SHALL NOT return a partially-constructed object.
