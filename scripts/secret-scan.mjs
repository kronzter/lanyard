#!/usr/bin/env node
// Pre-commit secret scan (P0.1-R2). Rejects the commit when a staged file:
//   1. is a .env file (other than .env.example),
//   2. assigns 64 hex chars to a key-like name (private key, secret, seed, *_KEY), or
//   3. contains 12+ consecutive BIP39 English words (a mnemonic).
// Bare 64-hex values (tx hashes, labelhashes) are allowed. A line can opt out with
// the marker `secret-scan:allow`.
//
// Usage: node scripts/secret-scan.mjs            (scans staged files)
//        node scripts/secret-scan.mjs <files...> (scans the given files; used by tests)
import { execFileSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
import { basename } from "node:path";
import { wordlist } from "@scure/bip39/wordlists/english.js";

const BIP39 = new Set(wordlist);
const MNEMONIC_MIN_WORDS = 12;
const KEY_ASSIGNMENT =
  /(priv(ate)?[_-]?key|secret|mnemonic|seed[_-]?phrase|[A-Z0-9]_KEY)\s*["']?\s*[:=]\s*["']?(0x)?[0-9a-fA-F]{64}\b/i;
const ALLOW = "secret-scan:allow";

function gitlinks() {
  // Submodule entries (mode 160000) are commits, not files.
  const out = execFileSync("git", ["ls-files", "--stage", "-z"], { encoding: "utf8" });
  return new Set(
    out
      .split("\0")
      .filter((e) => e.startsWith("160000 "))
      .map((e) => e.slice(e.indexOf("\t") + 1)),
  );
}

function stagedFiles() {
  const out = execFileSync("git", ["diff", "--cached", "--name-only", "--diff-filter=ACMR", "-z"], {
    encoding: "utf8",
  });
  const links = gitlinks();
  return out.split("\0").filter((f) => f && !links.has(f));
}

function stagedContent(file) {
  // Scan what is staged, not the working tree.
  return execFileSync("git", ["show", `:${file}`], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
}

function isEnvFile(file) {
  const name = basename(file);
  return (name === ".env" || name.startsWith(".env.")) && name !== ".env.example";
}

function hasMnemonic(line) {
  let run = 0;
  for (const word of line.toLowerCase().split(/[^a-z]+/)) {
    if (!word) continue;
    run = BIP39.has(word) ? run + 1 : 0;
    if (run >= MNEMONIC_MIN_WORDS) return true;
  }
  return false;
}

export function scan(file, content) {
  const findings = [];
  if (isEnvFile(file)) findings.push(`${file}: .env files must never be committed`);
  if (content.includes("\0")) return findings; // binary
  content.split("\n").forEach((line, i) => {
    if (line.includes(ALLOW)) return;
    if (KEY_ASSIGNMENT.test(line))
      findings.push(`${file}:${i + 1}: looks like a private key or secret`);
    if (hasMnemonic(line)) findings.push(`${file}:${i + 1}: looks like a mnemonic`);
  });
  return findings;
}

const args = process.argv.slice(2).filter((f) => {
  try {
    return statSync(f).isFile(); // skips submodule dirs and symlinked dirs
  } catch {
    return false;
  }
});
const files = process.argv.length > 2 ? args : stagedFiles();
const read = process.argv.length > 2 ? (f) => readFileSync(f, "utf8") : stagedContent;
const findings = files.flatMap((f) => scan(f, read(f)));

if (findings.length) {
  console.error("secret-scan: commit rejected\n  " + findings.join("\n  "));
  console.error(`If a line is a false positive, add the marker "${ALLOW}" to it.`);
  process.exit(1);
}
