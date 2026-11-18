# AQA orchestrator: design

Status: draft, awaiting approval. Size: small change (one agent file, one helper script, one state folder).

## Intent and why

Today a human chains the AQA agents by hand: plan, spec, check, green run, mutate, reviewer, `review:save`, PR. The order lives in the owner's head and in memory notes. The goal is one entry point that runs the whole chain for a test case, enforces the order and the limits, and stops where a human must decide.

## Goals

- One command runs a test case from `test-cases/TC-xxx.md` to a PR-ready branch.
- Exactly two human stops: (1) approval of the plan in `specs/`, (2) review of the diff before commit/PR.
- The orchestrator delegates all work to the existing agents and never writes tests itself.
- Every loop is bounded; at the limit it escalates to the human.
- State survives a crashed or closed session.

## Non-goals

- No new npm dependencies, no Agent SDK or CI runner (nightly triage is a later, separate project).
- No changes to `playwright.config.ts`, existing agents, `test-cases/`, or the review gate.
- No automatic commit, push, merge, or filing of bugs in a tracker.

## Anti-goals (failure even if it "works")

- The orchestrator makes a test green by editing it, weakening assertions, adding retries/skip, or taking expected values from the live UI.
- A subagent's claim ("tests pass") is accepted without the real command output.
- Silent endless healer/reviewer loops.

## Constraints

- In Claude Code a subagent cannot spawn subagents, so the orchestrator must run as the main thread: `claude --agent aqa-orchestrator`.
- CLAUDE.md rules win over the orchestrator's prompt. Definition of done: run the affected tests and report the real result.
- Memory rule: after tests pass run `npm run mutate`, then commit.
- Reviewer must stay on a different model (opus) from the writers (sonnet).

## Approaches considered

- A. Skill `/aqa-flow`: simplest, but the session can edit code itself and state lives only in the chat.
- B. Main-thread agent `aqa-orchestrator` with restricted tools and a state file: chosen.
- C. Headless Agent SDK script: needs a new dependency; deferred to nightly triage.

Chosen: B, by the owner's go-ahead on the recommendation, with two stops.

## Design

Files:
- `.claude/agents/aqa-orchestrator.md`: the agent definition.
- `scripts/run-state.mjs`: tiny helper, reads/writes `runs/TC-xxx.json`.
- `runs/` added to `.gitignore` (state is local, not versioned).

Agent tools: `Agent(playwright-test-planner, playwright-test-generator, playwright-test-healer, test-reviewer)`, `Read`, `Grep`, `Glob`, `Bash`. No `Edit`/`Write`/`MultiEdit`. State is written only through `scripts/run-state.mjs` (this is why: a `permissions.deny` on Write for `tests/**` would also block the generator, since permissions are global).

Stages and transitions:

1. `plan`: planner reads the TC, writes `specs/TC-xxx-*.md`. STOP 1: human approves or edits the plan.
2. `write`: generator writes spec, Page Objects, test-data. The existing per-file hook runs on each edit.
3. `check`: `npm run check`, then the single spec. Real output is recorded.
4. On failure, `heal` (max 2 attempts): healer classifies.
   - test defect: fix applied by healer, back to `check`.
   - product defect: bug draft in `bugs/`, orchestrator stops, human decides.
   - unclear: trace shown, orchestrator stops, human decides.
5. `mutate`: `npm run mutate`. Surviving mutants go back to the generator as a `write` retry; this shares the rework limit below.
6. `review`: `test-reviewer`. REWORK goes back to `write` (max 2 rework rounds, then escalate). ACCEPT: `pbpaste`-free save, the orchestrator pipes the verdict into `npm run review:save -- TC-xxx` via stdin.
7. STOP 2: orchestrator prints diff summary, check/mutate results, verdict. Human reviews, then commits and opens the PR.

Limits: heal 2, rework 2. Any exceeded limit or `unclear` results in a stop with a report; no further attempts without the human.

Report format at every stop: stage, command output excerpts (real), files touched, what the human must decide.

## Decisions I made (please check)

- `runs/` state file and `run-state.mjs` helper (JSON, no dependencies).
- Limits of 2 for heal and for rework.
- Review verdict is saved by the orchestrator after ACCEPT, because the gate requires it before push; the human still decides on commit/PR.
- Mutation survivors count toward the rework limit.

## Left to the builder

- Exact prompt wording of the agent file, within the rules above.
- State file schema.
- How to feed the reviewer's text to `review:save` via stdin from Bash.
- A smoke test of the whole flow on an existing TC (e.g. TC-003) before declaring it done.
