import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

// Mutation check: for every `name: "..."` string in pages/*.ts, break the
// expected value, run the suite and require it to fail ON that value.
// A mutation that leaves the suite green means the assertion proves nothing.

const PAGES_DIR = "pages";
const SUFFIX = "__MUTATED__";
const NAME_LITERAL = /(name:\s*)"((?:[^"\\]|\\.)*)"/g;

type Mutation = {
  file: string;
  original: string;
  mutated: string;
  index: number;
};
type Verdict = "killed" | "survived" | "inconclusive";

function runSuite(): { status: number; output: string } {
  const result = spawnSync("npx", ["playwright", "test", "--reporter=line"], {
    encoding: "utf8",
    env: { ...process.env, PLAYWRIGHT_HTML_OPEN: "never" },
  });
  return {
    status: result.status ?? 1,
    output: `${result.stdout ?? ""}${result.stderr ?? ""}`,
  };
}

function collectMutations(): Mutation[] {
  const mutations: Mutation[] = [];
  for (const entry of readdirSync(PAGES_DIR)) {
    if (!entry.endsWith(".ts")) continue;
    const file = join(PAGES_DIR, entry);
    const source = readFileSync(file, "utf8");
    let index = 0;
    for (const match of source.matchAll(NAME_LITERAL)) {
      mutations.push({
        file,
        original: match[2],
        mutated: `${match[2]}${SUFFIX}`,
        index: index++,
      });
    }
  }
  return mutations;
}

function applyMutation(source: string, mutation: Mutation): string {
  let current = 0;
  return source.replace(NAME_LITERAL, (whole, prefix: string) => {
    return current++ === mutation.index
      ? `${prefix}"${mutation.mutated}"`
      : whole;
  });
}

function judge(mutation: Mutation): Verdict {
  const originalSource = readFileSync(mutation.file, "utf8");
  const restore = () => writeFileSync(mutation.file, originalSource);
  process.once("SIGINT", () => {
    restore();
    process.exit(130);
  });
  try {
    writeFileSync(mutation.file, applyMutation(originalSource, mutation));
    const { status, output } = runSuite();
    if (status === 0) return "survived";
    return output.includes(mutation.mutated) ? "killed" : "inconclusive";
  } finally {
    restore();
  }
}

const baseline = runSuite();
if (baseline.status !== 0) {
  console.error("Baseline run is not green. Fix the suite before mutating.\n");
  console.error(baseline.output);
  process.exit(1);
}

const mutations = collectMutations();
if (mutations.length === 0) {
  console.error(
    `No mutation targets found in ${PAGES_DIR}/. Zero mutations is not a pass.`,
  );
  process.exit(1);
}

const results = mutations.map((mutation) => {
  const verdict = judge(mutation);
  console.log(`${verdict.padEnd(12)} ${mutation.file}  "${mutation.original}"`);
  return verdict;
});

const bad = results.filter((verdict) => verdict !== "killed").length;
console.log(`\n${results.length - bad}/${results.length} mutations killed`);
process.exit(bad === 0 ? 0 : 1);
