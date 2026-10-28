import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { relative, resolve } from "node:path";

// PostToolUse hook: after Claude writes or edits a file, lint it and typecheck
// the project right away. Exit code 2 sends the problems back to Claude.

const WATCHED = /^(pages|tests|test-data|scripts)\/.+\.(ts|mts)$/;

const input = JSON.parse(readFileSync(0, "utf8"));
const filePath = input.tool_input?.file_path;
if (!filePath) process.exit(0);

const file = relative(process.cwd(), resolve(filePath));
if (!WATCHED.test(file)) process.exit(0);

const run = (args) =>
  spawnSync("npx", args, { encoding: "utf8", cwd: process.cwd() });

const problems = [
  ["eslint", file],
  ["tsc", "--noEmit"],
]
  .map((args) => ({ args, result: run(args) }))
  .filter(({ result }) => result.status !== 0)
  .map(
    ({ args, result }) =>
      `${args.join(" ")} failed:\n${result.stdout}${result.stderr}`,
  );

if (problems.length > 0) {
  console.error(`Check failed for ${file}\n\n${problems.join("\n")}`);
  process.exit(2);
}
