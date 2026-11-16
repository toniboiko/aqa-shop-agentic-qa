import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

// Run state for the aqa-orchestrator agent.
//   node scripts/run-state.mjs <init|show|stage|bump|stop|resume> TC-xxx [arg]
// State lives in runs/<TC-id>.json. Exit codes: 0 ok, 1 error, 2 a loop limit was exceeded.

export const STAGES = ["plan", "write", "check", "heal", "mutate", "review", "final"];
export const LIMITS = { heal: 2, rework: 2 };

const ID = /^TC-\d+$/;

const pathFor = (tc, dir) => {
  if (!ID.test(tc ?? "")) throw new Error(`Bad test case id "${tc}". Expected TC-<number>.`);
  return join(dir, `${tc}.json`);
};

const write = (state, dir) => {
  mkdirSync(dir, { recursive: true });
  writeFileSync(pathFor(state.tc, dir), `${JSON.stringify(state, null, 2)}\n`);
  return state;
};

export const initState = (tc, dir = "runs") => {
  if (existsSync(pathFor(tc, dir))) throw new Error(`State for ${tc} already exists in ${dir}/.`);
  return write(
    { tc, stage: "plan", status: "running", stopReason: null, counters: { heal: 0, rework: 0 } },
    dir,
  );
};

export const loadState = (tc, dir = "runs") => {
  const file = pathFor(tc, dir);
  if (!existsSync(file)) throw new Error(`No state for ${tc} in ${dir}/. Run init first.`);
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    throw new Error(`State file for ${tc} is not valid JSON: ${file}.`);
  }
};

export const setStage = (tc, stage, dir = "runs") => {
  if (!STAGES.includes(stage)) throw new Error(`Unknown stage "${stage}". Expected one of: ${STAGES.join(", ")}.`);
  return write({ ...loadState(tc, dir), stage }, dir);
};

export const stop = (tc, reason, dir = "runs") =>
  write({ ...loadState(tc, dir), status: "stopped", stopReason: reason }, dir);

// Reopens a stopped run. Counters are kept unless the human names one to reset.
export const resume = (tc, counter, dir = "runs") => {
  if (counter !== undefined && !(counter in LIMITS)) throw new Error(`Unknown counter "${counter}". Expected heal or rework.`);
  const state = loadState(tc, dir);
  if (counter !== undefined) state.counters[counter] = 0;
  return write({ ...state, status: "running", stopReason: null }, dir);
};

export const bump = (tc, counter, dir = "runs") => {
  if (!(counter in LIMITS)) throw new Error(`Unknown counter "${counter}". Expected heal or rework.`);
  const state = loadState(tc, dir);
  state.counters[counter] += 1;
  const exceeded = state.counters[counter] > LIMITS[counter];
  if (exceeded) {
    state.status = "stopped";
    state.stopReason = `${counter} limit of ${LIMITS[counter]} exceeded`;
  }
  return { state: write(state, dir), exceeded };
};

const main = () => {
  const [command, tc, arg] = process.argv.slice(2);
  try {
    if (command === "init") console.log(JSON.stringify(initState(tc)));
    else if (command === "show") console.log(JSON.stringify(loadState(tc), null, 2));
    else if (command === "stage") console.log(JSON.stringify(setStage(tc, arg)));
    else if (command === "resume") console.log(JSON.stringify(resume(tc, arg)));
    else if (command === "stop") console.log(JSON.stringify(stop(tc, arg ?? "stopped")));
    else if (command === "bump") {
      const { state, exceeded } = bump(tc, arg);
      console.log(JSON.stringify(state));
      if (exceeded) {
        console.error(`LIMIT: ${state.stopReason}. Stop and escalate to the human.`);
        process.exit(2);
      }
    } else {
      throw new Error("Usage: node scripts/run-state.mjs <init|show|stage|bump|stop|resume> TC-xxx [arg]");
    }
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

if (import.meta.url === pathToFileURL(process.argv[1]).href) main();
