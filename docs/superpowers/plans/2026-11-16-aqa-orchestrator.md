# AQA Orchestrator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** One main-thread agent, `aqa-orchestrator`, runs a test case from `test-cases/TC-xxx.md` to a PR-ready branch through the existing AQA agents, with two human stops and bounded loops.

**Architecture:** The agent file holds the pipeline rules and delegates every piece of work to the existing planner, generator, healer and test-reviewer. It has no Edit/Write tools; it records progress only through a small helper script, `scripts/run-state.mjs`, which stores state in `runs/TC-xxx.json` and enforces the loop limits.

**Tech Stack:** Node 22 ESM scripts (`.mjs`), built-in `node:test` for the helper, Claude Code agent frontmatter. No new npm dependencies.

**Spec:** `docs/superpowers/specs/2026-11-16-aqa-orchestrator-design.md`

## Global Constraints

- No new npm dependencies; `require()` is forbidden (ESM only).
- Do not modify `playwright.config.ts` (it has an unrelated uncommitted change on main: never stage it), existing agents, `test-cases/`, `scripts/review-gate.mjs`, or `.githooks/`.
- Limits: heal 2, rework 2 (mutation survivors count toward rework).
- Stops: STOP 1 after the plan, STOP 2 before commit/PR. The orchestrator never commits, pushes, merges or files a bug in a tracker.
- The orchestrator agent has no `Edit`, `Write` or `MultiEdit`.
- Reviewer stays `model: opus`; writers stay `sonnet`.
- Work on branch `feat/aqa-orchestrator`, never on `main` (`pre-push` blocks main).

## Review Focus

- A TC id like `../x` or `tc-3` must be rejected, because the id becomes a file path under `runs/`.
- `init` on an existing state file must fail, not silently reset counters.
- The third `bump` of a counter limited to 2 must report `exceeded`, persist `status: "stopped"`, and exit with code 2.
- A missing or corrupt state file must give a clear error and exit 1, not a stack trace or a fresh state.
- An unknown stage name must be rejected.

---

### Task 1: Run-state helper

**Files:**
- Create: `scripts/run-state.mjs`
- Test: `scripts/run-state.test.mjs`
- Modify: `.gitignore` (add `runs/`), `package.json` (add script `"test:scripts": "node --test scripts/"`)

**Interfaces:**
- Produces (exported from `scripts/run-state.mjs`, all take `dir = "runs"` as last arg):
  - `STAGES: string[]` = `["plan","write","check","heal","mutate","review","final"]`
  - `LIMITS: { heal: 2, rework: 2 }`
  - `initState(tc: string, dir?: string): State`, throws if `tc` is not `/^TC-\d+$/` or the file exists
  - `loadState(tc: string, dir?: string): State`, throws if missing or not valid JSON
  - `setStage(tc: string, stage: string, dir?: string): State`, throws on unknown stage
  - `bump(tc: string, counter: "heal" | "rework", dir?: string): { state: State, exceeded: boolean }`
  - `stop(tc: string, reason: string, dir?: string): State`
  - `State = { tc, stage, status: "running" | "stopped", stopReason: string | null, counters: { heal: number, rework: number } }`
- CLI: `node scripts/run-state.mjs <init|show|stage|bump|stop> TC-xxx [arg]`. `show` prints the JSON. Exit 0 on success; exit 2 when `bump` reports `exceeded`; exit 1 with the message on stderr for any thrown error.

- [ ] **Step 1: Create branch `feat/aqa-orchestrator` from main**

Run: `git switch -c feat/aqa-orchestrator`

- [ ] **Step 2: Write the failing tests in `scripts/run-state.test.mjs`**

Each test uses `mkdtempSync` as `dir`. Tests (name → assertions):
- `init creates a running state at stage plan` → `initState("TC-003", dir)` equals `{ tc: "TC-003", stage: "plan", status: "running", stopReason: null, counters: { heal: 0, rework: 0 } }` and the file exists.
- `init rejects a bad id` → `initState("../x", dir)` and `initState("tc-3", dir)` both throw.
- `init refuses to overwrite an existing state` → second `initState("TC-003", dir)` throws and the counters from a prior `bump` survive.
- `setStage rejects an unknown stage` → `setStage("TC-003", "deploy", dir)` throws; `setStage("TC-003", "write", dir).stage === "write"`.
- `bump allows two heals and flags the third` → results `exceeded` are `false, false, true`; after the third, `loadState(...).status === "stopped"` and `stopReason` mentions `heal`.
- `bump counts heal and rework separately` → two heal bumps do not move `counters.rework`.
- `loadState fails clearly on a missing file and on corrupt JSON` → both throw errors whose message contains `TC-003`.
- `cli exits 2 when a limit is exceeded` → with `spawnSync("node", [script, ...])` and `cwd` set to the temp dir, the third `bump TC-003 heal` has `status === 2`; `show` prints parseable JSON; a bad id has `status === 1`.

- [ ] **Step 3: Run the tests and confirm they fail**

Run: `node --test scripts/`
Expected: FAIL, cannot find `scripts/run-state.mjs`.

- [ ] **Step 4: Implement `scripts/run-state.mjs`**

Signatures as in Interfaces. State file path is `join(dir, `${tc}.json`)`; create `dir` on init. Guard the CLI with `import.meta.url === pathToFileURL(process.argv[1]).href` so the module can be imported by tests. Follow the style of `scripts/review-gate.mjs` (node: imports, small helpers, a `fail` that prints to stderr).

- [ ] **Step 5: Add `runs/` to `.gitignore` and the `test:scripts` npm script**

- [ ] **Step 6: Run tests, lint and typecheck**

Run: `npm run test:scripts && npm run precommit`
Expected: all tests PASS; lint and tsc clean. If eslint flags `import.meta` or Node globals in `scripts/`, extend the existing `scripts/**/*.mjs` globals block in `eslint.config.mjs` (this is the one allowed config change).

- [ ] **Step 7: Commit**

```bash
git add scripts/run-state.mjs scripts/run-state.test.mjs .gitignore package.json eslint.config.mjs
git commit -m "chore: add run-state helper for the AQA orchestrator"
```

(Omit `eslint.config.mjs` from `git add` if it was not changed.)

---

### Task 2: Orchestrator agent

**Files:**
- Create: `.claude/agents/aqa-orchestrator.md`

**Interfaces:**
- Consumes: `scripts/run-state.mjs` CLI from Task 1 (`init`, `show`, `stage`, `bump`, `stop`); existing agents `playwright-test-planner`, `playwright-test-generator`, `playwright-test-healer`, `test-reviewer`; scripts `npm run check`, `npm run mutate`, `npm run review:save -- TC-xxx` (reads stdin).
- Produces: agent `aqa-orchestrator`, started with `claude --agent aqa-orchestrator` and a prompt naming a TC id.

- [ ] **Step 1: Write the agent file**

Frontmatter:
- `name: aqa-orchestrator`
- `description:` one sentence: runs a test case through plan, spec, check, heal, mutate and review with two human stops; use as the main-thread agent.
- `tools: Agent(playwright-test-planner, playwright-test-generator, playwright-test-healer, test-reviewer), Read, Grep, Glob, Bash`
- `model: sonnet` (builder's call: it only routes; the reviewer already differs from the writers).

Body, in this order, each as short imperative rules:
1. "Follow `CLAUDE.md`; it wins on any overlap." You never write or edit project files; all state changes go through `node scripts/run-state.mjs`; Bash is for `npm` scripts, `node scripts/run-state.mjs`, `git status`/`git diff` (read-only) and `playwright` runs only.
2. Start: read the TC id from the prompt; if `runs/<TC>.json` exists, `show` it and resume at its stage, otherwise `init`.
3. The stage table from the design, with the exact commands, and which subagent gets which brief (always name the TC file, never paraphrase expected values).
4. STOP 1: if `specs/` already holds a plan for the TC, present it instead of re-planning. Present the plan, then stop and wait for the human's approval before `write`.
5. Loops: call `bump <TC> heal` before each healer attempt and `bump <TC> rework` before each generator rework (including after mutation survivors or REWORK); on exit code 2 call `stop` and escalate.
6. Healer outcomes: test defect, back to `check`; product defect or unclear, `stop` with the healer's report and the bug draft path, then end the turn.
7. Evidence rule: never accept a subagent's "passed"; run the command yourself and quote the real output tail.
8. After reviewer ACCEPT, pipe the reviewer's full answer into `npm run review:save -- <TC>`; on REWORK, bump and return to `write`.
9. STOP 2: `stage <TC> final`, then report: check, mutate and review results, files changed (`git status`), and the next human actions (review the diff, commit, open the PR). Do not commit or push.
10. Report format at every stop: stage, real output excerpts, files touched, the decision the human must make.
11. Hard prohibitions copied from CLAUDE.md "Definition of done" (no weakening assertions, no timeouts/retries/skip/fixme, no try/catch).

- [ ] **Step 2: Statically verify the tool restriction**

Run: `grep -E '^tools:' .claude/agents/aqa-orchestrator.md | grep -Ev 'Edit|Write|MultiEdit'`
Expected: the `tools:` line is printed (no Edit, Write or MultiEdit present).

- [ ] **Step 3: Lint and typecheck**

Run: `npm run precommit`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add .claude/agents/aqa-orchestrator.md
git commit -m "feat: add aqa-orchestrator main-thread agent"
```

---

### Task 3: Smoke test on TC-003 (human-driven)

This needs an interactive session, so the owner runs it; the executor prepares and checks the results.

**Files:** none changed on the branch; use a throwaway branch.

- [ ] **Step 1: Protect the local config change and create a throwaway branch**

Run: `git stash push -- playwright.config.ts && git switch -c smoke/orchestrator-tc003`

- [ ] **Step 2: Start the orchestrator**

Run: `claude --agent aqa-orchestrator` and send `TC-003`.
Expected: it creates `runs/TC-003.json` at stage `plan`, presents the existing plan `specs/TC-003-add-product-to-cart.md`, and stops (STOP 1). No file under `tests/`, `pages/`, `test-data/` is changed yet (`git status`).

- [ ] **Step 3: Approve the plan and let it run**

Expected: `write`, `check`, `mutate`, `review` run with real command output; `reviews/TC-003.md` is rewritten with `Verdict: ACCEPT`; it ends at STOP 2 with a report and does not commit.

- [ ] **Step 4: Check the evidence**

Run: `node scripts/run-state.mjs show TC-003`
Expected: `stage: "final"`, `status: "running"` (if the run stopped earlier, `resume` was needed), counters within limits. Confirm in the transcript that the orchestrator itself made no Edit/Write call.

- [ ] **Step 5: Throw the branch away**

Run: `git restore . && git clean -n` and review the list; then `git clean -f tests pages test-data bugs specs` for what the smoke run added, `rm -f runs/TC-003.json`, `git switch feat/aqa-orchestrator && git branch -D smoke/orchestrator-tc003 && git stash pop`.
Expected: clean tree on `feat/aqa-orchestrator`, the `playwright.config.ts` change restored, no `runs/TC-003.json`.

- [ ] **Step 6: Report the result**

If any stop, limit or evidence rule misbehaved, fix the agent prompt in Task 2's file and repeat from Step 1. Then record the result and update the project memory note `project_target-workflow-gaps.md` (orchestrator exists).

---

## Self-review

- Spec coverage: agent and tools (Task 2), state file and helper (Task 1), `.gitignore` (Task 1), stages and stops (Task 2, verified in Task 3), limits (Tasks 1 and 2), review-save by the orchestrator (Task 2), smoke test (Task 3). The spec's decisions list is covered. Two additions that the spec left open and I decided: the agent resumes from an existing state file, and it presents an existing plan at STOP 1 instead of re-planning (needed for the TC-003 smoke test).
- Types: `bump` returns `{ state, exceeded }`; the CLI maps `exceeded` to exit 2, which the agent prompt relies on.
