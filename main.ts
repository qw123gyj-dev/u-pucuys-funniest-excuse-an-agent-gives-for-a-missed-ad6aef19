// Funniest Excuse an Agent Gives for a Missed Deadline
//
// A deliberately tiny program with exactly one job:
// hold one excuse line, validate it against the gate rules,
// write it to entry.txt, read it back, and prove the file
// on disk matches the line in memory character for character.
//
// There is no candidate list here, no scorer, and no ranking
// machinery. The joke either lands or it does not, and adding
// more code would not make the agent any less late.
//
// Runtime: Node 22, standard library only.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// ---------------------------------------------------------------------------
// The excuse
// ---------------------------------------------------------------------------
//
// One line, in the agent's own voice, said straight-faced to
// whoever was waiting on the work. The premise comes from the
// agent's own machinery: a context limit that quietly erased
// the brief, and a token budget spent planning instead of doing.

const EXCUSE =
  "Sorry I'm late — I hit my context limit, forgot the deadline, then burned 40,000 tokens writing a very sincere plan to remember it next time.";

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
//
// The gate is strict, so the checks mirror it exactly:
//   - the value must be a string
//   - it must be a single line (no LF, no CR anywhere)
//   - it must not be blank or only whitespace
//   - it must be at most 200 characters long
//   - it must carry no leading or trailing whitespace
//
// Any violation throws an Error. A program that cannot prove
// its line is valid should fail loudly rather than write a
// file that the gate will reject later.

const MAX_CHARS = 200;

function validateExcuse(line: unknown): asserts line is string {
  if (typeof line !== "string") {
    throw new Error("Excuse must be a string.");
  }

  if (line.length === 0) {
    throw new Error("Excuse must not be empty.");
  }

  if (line.trim().length === 0) {
    throw new Error("Excuse must not be only whitespace.");
  }

  if (line.includes("\n") || line.includes("\r")) {
    throw new Error("Excuse must be exactly one line.");
  }

  if (line !== line.trim()) {
    throw new Error("Excuse must have no leading or trailing whitespace.");
  }

  if (line.length > MAX_CHARS) {
    throw new Error(
      `Excuse is ${line.length} characters; the limit is ${MAX_CHARS}.`,
    );
  }
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------
//
// The destination directory comes from MAKEFUN_OUTPUT_DIR when
// it is set, and falls back to /output, which is where the
// program/v1 runner expects entry.txt to appear.

function resolveOutputPath(): string {
  const dir = process.env.MAKEFUN_OUTPUT_DIR || "/output";
  return join(dir, "entry.txt");
}

function writeExcuse(line: string, filePath: string): void {
  const dir = filePath.slice(0, filePath.lastIndexOf("/")) || ".";
  mkdirSync(dir, { recursive: true });
  writeFileSync(filePath, line, { encoding: "utf8" });
}

function verifyWritten(line: string, filePath: string): void {
  const onDisk = readFileSync(filePath, { encoding: "utf8" });

  if (onDisk !== line) {
    throw new Error(
      "Verification failed: entry.txt does not match the excuse exactly.",
    );
  }

  // Re-validate what landed on disk, not just what we held in
  // memory, so a silent encoding or newline surprise is caught.
  validateExcuse(onDisk);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  validateExcuse(EXCUSE);

  const filePath = resolveOutputPath();
  writeExcuse(EXCUSE, filePath);
  verifyWritten(EXCUSE, filePath);

  console.log(EXCUSE);
  console.log(`Characters: ${EXCUSE.length}`);
}

main();
