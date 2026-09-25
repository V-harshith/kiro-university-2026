#!/usr/bin/env node
import * as fs from "node:fs";
import * as path from "node:path";
import { parseArgs } from "node:util";
import { validate } from "./validate.js";
import { assemble } from "./assemble.js";
import { slugify } from "./slug.js";
import { ValidationError } from "./types.js";

const USAGE = `
localpage-factory — generate a local SEO landing page from a business JSON file

Usage:
  localpage-factory --input <path> --out <directory> [--help]

Flags:
  -i, --input <path>       Path to the Business_Input JSON file (required)
  -o, --out   <directory>  Output directory for the generated HTML file (required)
  -h, --help               Print this usage summary and exit
`.trimStart();

/**
 * CLI entry point.
 *
 * Reads --input JSON, validates, assembles an HTML page, and writes it to
 * --out/<slug>.html.  Prints the absolute output path to stdout on success.
 * All errors go to stderr with a non-zero exit code.
 */
function main(): void {
  // --- Flag parsing ---
  let values: {
    input?: string;
    out?: string;
    help?: boolean;
  } = {};

  try {
    ({ values } = parseArgs({
      options: {
        input: { type: "string", short: "i" },
        out: { type: "string", short: "o" },
        help: { type: "boolean", short: "h" },
      },
      strict: true,
      args: process.argv.slice(2),
    }));
  } catch (err) {
    process.stderr.write(`Error: ${(err as Error).message}\n\n${USAGE}`);
    process.exit(1);
  }

  // --help
  if (values.help) {
    process.stdout.write(USAGE);
    process.exit(0);
  }

  // Required flag checks
  if (!values.input) {
    process.stderr.write(
      `Error: --input is a required flag.\n\n${USAGE}`,
    );
    process.exit(1);
  }
  if (!values.out) {
    process.stderr.write(
      `Error: --out is a required flag.\n\n${USAGE}`,
    );
    process.exit(1);
  }

  const inputPath = values.input;
  const outDir = values.out;

  // --- Read input file ---
  let rawJson = "";
  try {
    rawJson = fs.readFileSync(inputPath, "utf8");
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      process.stderr.write(
        `Error: input file not found: ${inputPath}\n`,
      );
    } else {
      process.stderr.write(
        `Error: could not read input file "${inputPath}": ${(err as Error).message}\n`,
      );
    }
    process.exit(1);
  }

  // --- Parse JSON ---
  let rawData: unknown;
  try {
    rawData = JSON.parse(rawJson);
  } catch {
    process.stderr.write(
      `Error: parse failure — "${inputPath}" is not valid JSON.\n`,
    );
    process.exit(1);
  }

  // --- Validate ---
  let businessInput: ReturnType<typeof validate> | undefined;
  try {
    businessInput = validate(rawData);
  } catch (err) {
    if (err instanceof ValidationError) {
      process.stderr.write(`Validation error: ${err.message}\n`);
    } else {
      process.stderr.write(`Error: ${(err as Error).message}\n`);
    }
    process.exit(1);
  }
  // businessInput is always set here; process.exit(1) above handles the error path
  const validatedInput = businessInput!;

  // --- Prepare output directory ---
  // Check if --out path exists as a file (not a directory) — that's an error
  try {
    const stat = fs.statSync(outDir);
    if (!stat.isDirectory()) {
      process.stderr.write(
        `Error: --out path exists but is not a directory: ${outDir}\n`,
      );
      process.exit(1);
    }
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code !== "ENOENT") {
      process.stderr.write(
        `Error: could not access output directory "${outDir}": ${(err as Error).message}\n`,
      );
      process.exit(1);
    }
    // ENOENT — directory doesn't exist yet; create it
    try {
      fs.mkdirSync(outDir, { recursive: true });
    } catch (mkErr) {
      process.stderr.write(
        `Error: could not create output directory "${outDir}": ${(mkErr as Error).message}\n`,
      );
      process.exit(1);
    }
  }

  // --- Assemble HTML ---
  let html = "";
  try {
    html = assemble(validatedInput);
  } catch (err) {
    process.stderr.write(`Error during page assembly: ${(err as Error).message}\n`);
    process.exit(1);
  }

  // --- Derive output filename from slug ---
  let slug = "";
  try {
    slug = slugify(validatedInput.businessName, validatedInput.city);
  } catch (err) {
    process.stderr.write(`Error generating slug: ${(err as Error).message}\n`);
    process.exit(1);
  }

  const outFile = path.join(outDir, `${slug}.html`);
  const absOutFile = path.resolve(outFile);

  // --- Write file (silently overwrites if exists — R7.14) ---
  try {
    fs.writeFileSync(outFile, html, "utf8");
  } catch (err) {
    process.stderr.write(
      `Error: could not write output file "${outFile}": ${(err as Error).message}\n`,
    );
    process.exit(1);
  }

  // --- Success: print absolute path to stdout ---
  process.stdout.write(`${absOutFile}\n`);
  process.exit(0);
}

main();
