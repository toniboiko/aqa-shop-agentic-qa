import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { test } from "node:test";

const script = resolve("scripts/review-gate.mjs");

// A throwaway project with one test case and one spec tied to it.
const project = () => {
  const dir = mkdtempSync(join(tmpdir(), "review-gate-"));
  mkdirSync(join(dir, "test-cases"));
  mkdirSync(join(dir, "tests"));
  writeFileSync(join(dir, "test-cases/TC-001-login.md"), "# TC-001\n");
  writeFileSync(join(dir, "tests/login.spec.ts"), "// TC-001\nexport {};\n");
  return dir;
};

const gate = (dir, input, ...args) =>
  spawnSync("node", [script, ...args], { cwd: dir, encoding: "utf8", input });

test("status reports a test case without a verdict as missing", () => {
  const result = gate(project(), undefined, "status");
  assert.equal(result.status, 1);
  assert.match(result.stdout, /TC-001: missing/);
});

test("status reports a saved ACCEPT as fresh and exits 0", () => {
  const dir = project();
  gate(dir, "Verdict: ACCEPT\n", "save", "TC-001");
  const result = gate(dir, undefined, "status");
  assert.equal(result.status, 0);
  assert.match(result.stdout, /TC-001: fresh/);
});

test("status reports a verdict as stale after the spec changes", () => {
  const dir = project();
  gate(dir, "Verdict: ACCEPT\n", "save", "TC-001");
  writeFileSync(join(dir, "tests/login.spec.ts"), "// TC-001\nexport const changed = 1;\n");
  const result = gate(dir, undefined, "status");
  assert.equal(result.status, 1);
  assert.match(result.stdout, /TC-001: stale/);
});

test("status reports a REWORK verdict as not-accept", () => {
  const dir = project();
  gate(dir, "Verdict: REWORK\n", "save", "TC-001");
  const result = gate(dir, undefined, "status");
  assert.equal(result.status, 1);
  assert.match(result.stdout, /TC-001: not-accept/);
});

test("status lists only the test cases that need a review as problems", () => {
  const dir = project();
  mkdirSync(join(dir, "pages"));
  writeFileSync(join(dir, "test-cases/TC-002-cart.md"), "# TC-002\n");
  writeFileSync(join(dir, "tests/cart.spec.ts"), "// TC-002\nexport {};\n");
  gate(dir, "Verdict: ACCEPT\n", "save", "TC-001");
  const result = gate(dir, undefined, "status");
  assert.equal(result.status, 1);
  assert.match(result.stdout, /TC-001: fresh/);
  assert.match(result.stdout, /TC-002: missing/);
});

test("one spec can be tied to several test cases", () => {
  const dir = project();
  writeFileSync(join(dir, "test-cases/TC-002-cart.md"), "# TC-002\n");
  writeFileSync(join(dir, "tests/login.spec.ts"), "// TC-001\n// TC-002\nexport {};\n");
  const saved = gate(dir, "Verdict: ACCEPT\n", "save", "TC-002");
  assert.equal(saved.status, 0);
  const result = gate(dir, undefined, "status");
  assert.match(result.stdout, /TC-002: fresh/);
  assert.match(result.stdout, /TC-001: missing/);
});
