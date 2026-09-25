/**
 * CLI integration tests — spawn dist/cli.js as a child process.
 * Each test covers 1–2 representative cases; no property generators
 * (subprocess spawning at scale would be slow and tests external I/O).
 *
 * Requirements: R1.6–R1.9, R7.1, R8.3–R8.8
 */
import { describe, it, expect, afterEach } from "vitest";
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

// Absolute path to the compiled CLI entry point
const CLI = path.resolve(import.meta.dirname, "../../dist/cli.js");

// Directory containing fixture JSON files
const FIXTURES = path.resolve(import.meta.dirname, "fixtures");

/** Temporary directories created during tests — cleaned up in afterEach. */
const tempDirs: string[] = [];

function makeTempDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "lpf-test-"));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* ignore */ }
  }
});

/** Run the CLI synchronously and return { status, stdout, stderr }. */
function runCli(args: string[]): { status: number; stdout: string; stderr: string } {
  const result = spawnSync("node", [CLI, ...args], { encoding: "utf8" });
  return {
    status: result.status ?? 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

// ---------------------------------------------------------------------------
// Happy path
// ---------------------------------------------------------------------------

describe("CLI — happy path", () => {
  it("exits 0 and prints absolute output path on stdout for valid input (R8.4, R7.1)", () => {
    const outDir = makeTempDir();
    const { status, stdout, stderr } = runCli([
      "--input", path.join(FIXTURES, "valid.json"),
      "--out", outDir,
    ]);
    expect(status).toBe(0);
    expect(stderr).toBe("");
    const writtenPath = stdout.trim();
    expect(path.isAbsolute(writtenPath)).toBe(true);
    expect(writtenPath.endsWith(".html")).toBe(true);
    expect(fs.existsSync(writtenPath)).toBe(true);
  });

  it("output file name is <slug>.html derived from businessName + city (R7.1)", () => {
    const outDir = makeTempDir();
    const { status, stdout } = runCli([
      "--input", path.join(FIXTURES, "valid.json"),
      "--out", outDir,
    ]);
    expect(status).toBe(0);
    const writtenPath = stdout.trim();
    // slug for "Acme Plumbing" + "Austin" → acme-plumbing-austin
    expect(path.basename(writtenPath)).toBe("acme-plumbing-austin.html");
  });

  it("output file starts with <!DOCTYPE html>", () => {
    const outDir = makeTempDir();
    const { status, stdout } = runCli([
      "--input", path.join(FIXTURES, "valid.json"),
      "--out", outDir,
    ]);
    expect(status).toBe(0);
    const html = fs.readFileSync(stdout.trim(), "utf8");
    expect(html).toMatch(/^<!DOCTYPE html>/);
  });

  it("creates --out directory when it does not exist (R8.3)", () => {
    const parentDir = makeTempDir();
    const newDir = path.join(parentDir, "subdir", "pages");
    expect(fs.existsSync(newDir)).toBe(false);
    const { status } = runCli([
      "--input", path.join(FIXTURES, "valid.json"),
      "--out", newDir,
    ]);
    expect(status).toBe(0);
    expect(fs.existsSync(newDir)).toBe(true);
  });

  it("silently overwrites existing output file and exits 0 (R7.14)", () => {
    const outDir = makeTempDir();
    // First run
    const r1 = runCli([
      "--input", path.join(FIXTURES, "valid.json"),
      "--out", outDir,
    ]);
    expect(r1.status).toBe(0);
    const outFile = r1.stdout.trim();
    const size1 = fs.statSync(outFile).size;
    // Second run — same input, should overwrite
    const r2 = runCli([
      "--input", path.join(FIXTURES, "valid.json"),
      "--out", outDir,
    ]);
    expect(r2.status).toBe(0);
    expect(r2.stdout.trim()).toBe(outFile);
    expect(fs.statSync(outFile).size).toBe(size1);
  });

  it("works for friendly tone fixture", () => {
    const outDir = makeTempDir();
    const { status, stdout } = runCli([
      "--input", path.join(FIXTURES, "friendly.json"),
      "--out", outDir,
    ]);
    expect(status).toBe(0);
    const html = fs.readFileSync(stdout.trim(), "utf8");
    expect(html).toContain("Bright Electric");
    expect(html).toContain("Denver");
  });
});

// ---------------------------------------------------------------------------
// --help
// ---------------------------------------------------------------------------

describe("CLI — --help flag", () => {
  it("exits 0 and prints all flag names (R8.6)", () => {
    const { status, stdout } = runCli(["--help"]);
    expect(status).toBe(0);
    expect(stdout).toContain("--input");
    expect(stdout).toContain("--out");
    expect(stdout).toContain("--help");
  });
});

// ---------------------------------------------------------------------------
// Missing required flags
// ---------------------------------------------------------------------------

describe("CLI — missing required flags", () => {
  it("--input omitted → exit non-zero, stderr mentions --input (R1.6)", () => {
    const outDir = makeTempDir();
    const { status, stderr } = runCli(["--out", outDir]);
    expect(status).not.toBe(0);
    expect(stderr).toContain("--input");
  });

  it("--out omitted → exit non-zero, stderr mentions --out (R1.7)", () => {
    const { status, stderr } = runCli([
      "--input", path.join(FIXTURES, "valid.json"),
    ]);
    expect(status).not.toBe(0);
    expect(stderr).toContain("--out");
  });
});

// ---------------------------------------------------------------------------
// Bad --input path
// ---------------------------------------------------------------------------

describe("CLI — input file errors", () => {
  it("missing --input file → exit non-zero, stderr contains file path (R1.8, R8.7)", () => {
    const outDir = makeTempDir();
    const missingPath = path.join(FIXTURES, "does-not-exist.json");
    const { status, stderr } = runCli([
      "--input", missingPath,
      "--out", outDir,
    ]);
    expect(status).not.toBe(0);
    expect(stderr).toContain(missingPath);
  });

  it("invalid JSON file → exit non-zero, stderr mentions file path and parse failure (R1.9)", () => {
    const outDir = makeTempDir();
    const badFile = path.join(FIXTURES, "bad-syntax.json");
    const { status, stderr } = runCli([
      "--input", badFile,
      "--out", outDir,
    ]);
    expect(status).not.toBe(0);
    expect(stderr).toContain(badFile);
    expect(stderr.toLowerCase()).toMatch(/parse/);
  });
});

// ---------------------------------------------------------------------------
// Validation errors
// ---------------------------------------------------------------------------

describe("CLI — validation errors", () => {
  it("missing required field in JSON → exit non-zero, stderr mentions field name (R1.1–R1.4)", () => {
    const outDir = makeTempDir();
    const { status, stderr } = runCli([
      "--input", path.join(FIXTURES, "invalid-missing-field.json"),
      "--out", outDir,
    ]);
    expect(status).not.toBe(0);
    // The fixture omits "city", so the error should name it
    expect(stderr).toContain("city");
  });
});

// ---------------------------------------------------------------------------
// --out pointing to an existing file
// ---------------------------------------------------------------------------

describe("CLI — --out is an existing file", () => {
  it("--out is a file (not directory) → exit non-zero (R8.8)", () => {
    const outDir = makeTempDir();
    // Create a regular file at the --out path
    const existingFile = path.join(outDir, "not-a-dir.html");
    fs.writeFileSync(existingFile, "placeholder");
    const { status, stderr } = runCli([
      "--input", path.join(FIXTURES, "valid.json"),
      "--out", existingFile,
    ]);
    expect(status).not.toBe(0);
    expect(stderr).toContain(existingFile);
  });
});
