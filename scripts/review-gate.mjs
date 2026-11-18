import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join, normalize } from "node:path";

// Review gate for test-reviewer verdicts.
//   save <TC-id>   reads the reviewer's answer from stdin, writes reviews/<TC-id>.md
//   check          pre-push: every TC touched on this branch needs a fresh ACCEPT
//   status         working tree: fresh / stale / missing / not-accept per TC; exit 1 if any is not fresh
//
// A spec is tied to its test cases by `// TC-003` lines at the top of the file (one line per test case).
// A verdict is fresh while the sha256 of the test case, its specs and everything
// they import locally (Page Objects, test-data) is unchanged.

const SPEC_DIR = "tests";
const CASE_DIR = "test-cases";
const REVIEW_DIR = "reviews";
const EXCLUDED_SPECS = new Set(["seed.spec.ts"]);
const WATCHED = /^(tests|pages|fixtures|test-data|test-cases)\//;

const git = (...args) => spawnSync("git", args, { encoding: "utf8" });

const fail = (message) => {
  console.error(message);
  process.exit(1);
};

const tcsOf = (specPath) =>
  [...readFileSync(specPath, "utf8").matchAll(/^\/\/\s*(TC-\d+)\s*$/gm)].map((m) => m[1]);

const listSpecs = () =>
  readdirSync(SPEC_DIR)
    .filter((f) => f.endsWith(".spec.ts") && !EXCLUDED_SPECS.has(f))
    .map((f) => join(SPEC_DIR, f));

const localImports = (file) =>
  [...readFileSync(file, "utf8").matchAll(/from\s+["'](\.{1,2}\/[^"']+)["']/g)]
    .map((m) => normalize(join(dirname(file), m[1])))
    .map((base) => [`${base}.ts`, join(base, "index.ts"), base].find(existsSync))
    .filter(Boolean);

const closure = (files) => {
  const seen = new Set();
  const visit = (file) => {
    if (seen.has(file)) return;
    seen.add(file);
    localImports(file).forEach(visit);
  };
  files.forEach(visit);
  return [...seen].sort();
};

const caseFile = (tc) => {
  const name = readdirSync(CASE_DIR).find((f) => f.startsWith(`${tc}-`));
  return name ? join(CASE_DIR, name) : undefined;
};

// Everything a verdict for this TC depends on.
const dependencies = (tc, specs) => {
  const tcFile = caseFile(tc);
  if (!tcFile) fail(`No file for ${tc} in ${CASE_DIR}/.`);
  return [tcFile, ...closure(specs)].sort();
};

const hashOf = (files) => {
  const hash = createHash("sha256");
  for (const file of files) hash.update(`${file}\n${readFileSync(file, "utf8")}\n`);
  return hash.digest("hex");
};

const specsByTc = () => {
  const map = new Map();
  for (const spec of listSpecs()) {
    const tcs = tcsOf(spec);
    if (tcs.length === 0) fail(`${spec} has no "// TC-xxx" line at the top. Add it, or exclude the spec in review-gate.mjs.`);
    for (const tc of tcs) map.set(tc, [...(map.get(tc) ?? []), spec]);
  }
  return map;
};

const save = (tc) => {
  if (!tc) fail("Usage: npm run review:save -- TC-003 < reviewer-output.txt");
  const specs = specsByTc().get(tc);
  if (!specs) fail(`No spec in ${SPEC_DIR}/ is tied to ${tc}.`);

  const text = readFileSync(0, "utf8");
  const verdicts = [...text.matchAll(/Verdict:\s*\**\s*(ACCEPT|REWORK)/gi)];
  if (verdicts.length === 0) fail('The reviewer output has no "Verdict: ACCEPT" or "Verdict: REWORK" line.');
  const verdict = verdicts.at(-1)[1].toUpperCase();

  mkdirSync(REVIEW_DIR, { recursive: true });
  const body = `Verdict: ${verdict}\nReviewed: ${hashOf(dependencies(tc, specs))}\nSpecs: ${specs.join(", ")}\n\n${text.trim()}\n`;
  writeFileSync(join(REVIEW_DIR, `${tc}.md`), body);
  console.log(`${REVIEW_DIR}/${tc}.md saved: ${verdict}`);
};

// State of one test case's verdict: fresh, missing, not-accept or stale.
const verdictState = (tc, specs) => {
  const reviewFile = join(REVIEW_DIR, `${tc}.md`);
  if (!existsSync(reviewFile)) return "missing";
  const review = readFileSync(reviewFile, "utf8");
  if (review.match(/^Verdict:\s*(\w+)/m)?.[1] !== "ACCEPT") return "not-accept";
  if (review.match(/^Reviewed:\s*(\w+)/m)?.[1] !== hashOf(dependencies(tc, specs))) return "stale";
  return "fresh";
};

const PROBLEM_TEXT = {
  missing: (tc) => `${tc}: no ${join(REVIEW_DIR, `${tc}.md`)}`,
  "not-accept": (tc) => `${tc}: verdict is not ACCEPT`,
  stale: (tc) => `${tc}: code changed after the review`,
};

const check = () => {
  const base = git("merge-base", "HEAD", "origin/main");
  if (base.status !== 0) {
    console.warn("review-gate: origin/main not found, skipping the check.");
    return;
  }
  const changed = git("diff", "--name-only", base.stdout.trim(), "HEAD")
    .stdout.split("\n")
    .filter((f) => WATCHED.test(f));

  const problems = [];
  for (const [tc, specs] of specsByTc()) {
    const files = dependencies(tc, specs);
    if (!files.some((f) => changed.includes(f))) continue;
    const state = verdictState(tc, specs);
    if (state !== "fresh") problems.push(PROBLEM_TEXT[state](tc));
  }

  if (problems.length > 0) {
    fail(
      `Push blocked, test-reviewer verdict missing or stale:\n  ${problems.join("\n  ")}\n` +
        `Run test-reviewer, then: pbpaste | npm run review:save -- <TC-id>, commit reviews/ and push again.`,
    );
  }
};

// Working-tree view, no git needed: which test cases need a review right now.
// Exit 1 when any test case is not fresh.
const status = () => {
  let needReview = false;
  for (const [tc, specs] of specsByTc()) {
    const state = verdictState(tc, specs);
    console.log(`${tc}: ${state}`);
    if (state !== "fresh") needReview = true;
  }
  if (needReview) process.exit(1);
};

const [command, arg] = process.argv.slice(2);
if (command === "save") save(arg);
else if (command === "check") check();
else if (command === "status") status();
else fail("Usage: review-gate.mjs save <TC-id> | check | status");
