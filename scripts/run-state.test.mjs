import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { test } from "node:test";
import { bump, initState, loadState, setStage, stop } from "./run-state.mjs";

const script = resolve("scripts/run-state.mjs");
const freshDir = () => mkdtempSync(join(tmpdir(), "run-state-"));
const cli = (dir, ...args) => spawnSync("node", [script, ...args], { cwd: dir, encoding: "utf8" });

test("init creates a running state at stage plan", () => {
  const dir = freshDir();
  const state = initState("TC-003", dir);
  assert.deepEqual(state, {
    tc: "TC-003",
    stage: "plan",
    status: "running",
    stopReason: null,
    counters: { heal: 0, rework: 0 },
  });
  assert.ok(existsSync(join(dir, "TC-003.json")));
});

test("init rejects a bad id", () => {
  const dir = freshDir();
  assert.throws(() => initState("../x", dir));
  assert.throws(() => initState("tc-3", dir));
});

test("init refuses to overwrite an existing state", () => {
  const dir = freshDir();
  initState("TC-003", dir);
  bump("TC-003", "heal", dir);
  assert.throws(() => initState("TC-003", dir));
  assert.equal(loadState("TC-003", dir).counters.heal, 1);
});

test("setStage rejects an unknown stage", () => {
  const dir = freshDir();
  initState("TC-003", dir);
  assert.throws(() => setStage("TC-003", "deploy", dir));
  assert.equal(setStage("TC-003", "write", dir).stage, "write");
});

test("bump allows two heals and flags the third", () => {
  const dir = freshDir();
  initState("TC-003", dir);
  const results = [1, 2, 3].map(() => bump("TC-003", "heal", dir).exceeded);
  assert.deepEqual(results, [false, false, true]);
  const state = loadState("TC-003", dir);
  assert.equal(state.status, "stopped");
  assert.match(state.stopReason, /heal/);
});

test("bump counts heal and rework separately", () => {
  const dir = freshDir();
  initState("TC-003", dir);
  bump("TC-003", "heal", dir);
  bump("TC-003", "heal", dir);
  assert.equal(loadState("TC-003", dir).counters.rework, 0);
});

test("stop marks the run stopped with the reason", () => {
  const dir = freshDir();
  initState("TC-003", dir);
  const state = stop("TC-003", "product defect", dir);
  assert.equal(state.status, "stopped");
  assert.equal(state.stopReason, "product defect");
});

test("loadState fails clearly on a missing file and on corrupt JSON", () => {
  const dir = freshDir();
  assert.throws(() => loadState("TC-003", dir), /TC-003/);
  writeFileSync(join(dir, "TC-003.json"), "{not json");
  assert.throws(() => loadState("TC-003", dir), /TC-003/);
});

test("cli exits 2 when a limit is exceeded", () => {
  const dir = freshDir();
  assert.equal(cli(dir, "init", "TC-003").status, 0);
  assert.equal(cli(dir, "bump", "TC-003", "heal").status, 0);
  assert.equal(cli(dir, "bump", "TC-003", "heal").status, 0);
  assert.equal(cli(dir, "bump", "TC-003", "heal").status, 2);
  const shown = cli(dir, "show", "TC-003");
  assert.equal(shown.status, 0);
  assert.equal(JSON.parse(shown.stdout).status, "stopped");
  assert.equal(cli(dir, "init", "../x").status, 1);
});
