import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

// Mutation check: break one expected value at a time, run the suite and
// require it to fail ON that value. A mutation that leaves the suite green
// means the assertion proves nothing.
// Targets, in pages/*.ts and test-data/*.ts:
//   strings  `name: "..."` locator names (pages), every `key: "..."` (test-data)
//   numbers  `key: 3` object values, such as `level: 3`
//   regexes  regex literals passed as arguments, such as getByText(/^\d+$/)
// Each match is captured as prefix + value + suffix; only the value is changed.

const SUFFIX = "__MUTATED__";
const NUMBER_SHIFT = 90000;
const STRING_VALUE = String.raw`(?<value>(?:[^"\\]|\\.)*)`;
const OBJECT_KEY_START = String.raw`(?<=(?:^|[{,])[ \t]*)`;

type Target = {
  dir: string;
  kind: "string" | "number" | "regex";
  pattern: RegExp;
  mutate: (value: string) => string;
};

const appendSuffix = (value: string) => `${value}${SUFFIX}`;
const shiftNumber = (value: string) => `${Number(value) + NUMBER_SHIFT}`;

const TARGETS: Target[] = [
  {
    dir: "pages",
    kind: "string",
    pattern: new RegExp(
      `(?<prefix>name:\\s*")${STRING_VALUE}(?<suffix>")`,
      "g",
    ),
    mutate: appendSuffix,
  },
  {
    dir: "test-data",
    kind: "string",
    pattern: new RegExp(
      `(?<prefix>\\b\\w+:\\s*")${STRING_VALUE}(?<suffix>")`,
      "g",
    ),
    mutate: appendSuffix,
  },
  ...["pages", "test-data"].flatMap((dir): Target[] => [
    {
      dir,
      kind: "number",
      pattern: new RegExp(
        `${OBJECT_KEY_START}(?<prefix>\\w+:[ \\t]*)(?<value>\\d+)(?<suffix>\\b)`,
        "gm",
      ),
      mutate: shiftNumber,
    },
    {
      dir,
      kind: "regex",
      pattern:
        /(?<=[(,=:]\s*)(?<prefix>\/)(?<value>(?:[^/\\\n]|\\.)+)(?<suffix>\/[dgimsuvy]*)(?=\s*[),;.}])/g,
      mutate: appendSuffix,
    },
  ]),
];

type Mutation = {
  file: string;
  kind: Target["kind"];
  pattern: RegExp;
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
  for (const { dir, kind, pattern, mutate } of TARGETS) {
    for (const entry of readdirSync(dir)) {
      if (!entry.endsWith(".ts")) continue;
      const file = join(dir, entry);
      const source = readFileSync(file, "utf8");
      let index = 0;
      for (const match of source.matchAll(pattern)) {
        const original = match.groups?.value ?? "";
        mutations.push({
          file,
          kind,
          pattern,
          original,
          mutated: mutate(original),
          index: index++,
        });
      }
    }
  }
  return mutations;
}

function applyMutation(source: string, mutation: Mutation): string {
  let current = 0;
  return source.replace(mutation.pattern, (...args) => {
    const groups = args.at(-1) as Record<string, string>;
    return current++ === mutation.index
      ? `${groups.prefix}${mutation.mutated}${groups.suffix}`
      : (args[0] as string);
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
    `No mutation targets found in ${[...new Set(TARGETS.map((t) => t.dir))].join(", ")}. Zero mutations is not a pass.`,
  );
  process.exit(1);
}

const results = mutations.map((mutation) => {
  const verdict = judge(mutation);
  console.log(
    `${verdict.padEnd(12)} ${mutation.file}  ${mutation.kind}  ${mutation.original}`,
  );
  return verdict;
});

const bad = results.filter((verdict) => verdict !== "killed").length;
console.log(`\n${results.length - bad}/${results.length} mutations killed`);
process.exit(bad === 0 ? 0 : 1);
