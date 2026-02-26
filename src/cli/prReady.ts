/**
 * PR Readiness Auto-Check Command — issue #123
 *
 * Run via:  npm run pr-ready
 *
 * Validates local PR readiness by checking:
 *   1. Git working tree is clean (no uncommitted changes)
 *   2. Branch name follows the project naming convention
 *   3. Lint passes (tsc --noEmit)
 *   4. Tests pass (vitest run)
 *   5. Build succeeds (tsx src/cli/build.ts)
 *   6. Validate passes (tsx src/cli/validate.ts)
 *
 * Outputs a ✓/✗ pass/fail checklist and exits non-zero when any check fails.
 */
import { execSync } from "node:child_process";

const BRANCH_PATTERN = /^((feat|fix|chore|test|docs|refactor)\/\S+|main)$/;

interface CheckResult {
  name: string;
  passed: boolean;
  output?: string;
}

function run(cmd: string): { ok: boolean; output: string } {
  try {
    const output = execSync(cmd, { encoding: "utf8", stdio: "pipe" });
    return { ok: true, output: output.trim() };
  } catch (err: unknown) {
    const cmdError = err as { stdout?: string; stderr?: string; message?: string };
    const output = [cmdError.stdout, cmdError.stderr, cmdError.message].filter(Boolean).join("\n").trim();
    return { ok: false, output };
  }
}

function checkWorkingTree(): CheckResult {
  const { ok, output } = run("git status --porcelain");
  if (!ok) {
    return { name: "working tree is clean", passed: false, output };
  }
  if (output.length > 0) {
    return {
      name: "working tree is clean",
      passed: false,
      output: `Uncommitted changes detected:\n${output}`,
    };
  }
  return { name: "working tree is clean", passed: true };
}

function checkBranchName(): CheckResult {
  const { ok, output } = run("git branch --show-current");
  if (!ok) {
    return { name: "branch name matches convention", passed: false, output };
  }
  const branch = output.trim();
  if (!BRANCH_PATTERN.test(branch)) {
    return {
      name: `branch name matches convention (got: ${branch})`,
      passed: false,
      output: `Branch "${branch}" does not match required pattern: feat|fix|chore|test|docs|refactor/<slug>`,
    };
  }
  return { name: `branch name matches convention (${branch})`, passed: true };
}

function checkLint(): CheckResult {
  const { ok, output } = run("npm run lint 2>&1");
  return { name: "lint", passed: ok, output: ok ? undefined : output };
}

function checkTest(): CheckResult {
  const { ok, output } = run("npm test 2>&1");
  return { name: "test", passed: ok, output: ok ? undefined : output };
}

function checkBuild(): CheckResult {
  const { ok, output } = run("npm run build 2>&1");
  return { name: "build", passed: ok, output: ok ? undefined : output };
}

function checkValidate(): CheckResult {
  const { ok, output } = run("npm run validate 2>&1");
  return { name: "validate", passed: ok, output: ok ? undefined : output };
}

function printChecklist(results: CheckResult[]): void {
  process.stdout.write("PR Readiness Check\n");
  process.stdout.write("==================\n");
  for (const result of results) {
    const icon = result.passed ? "✓" : "✗";
    process.stdout.write(`${icon}  ${result.name}\n`);
    if (!result.passed && result.output) {
      const indented = result.output
        .split("\n")
        .map((line) => `    ${line}`)
        .join("\n");
      process.stdout.write(`${indented}\n`);
    }
  }
  process.stdout.write("\n");
}

function main(): void {
  const results: CheckResult[] = [];

  // Git checks first — run always regardless of previous results
  results.push(checkWorkingTree());
  results.push(checkBranchName());

  // Toolchain checks — run all even if some fail
  results.push(checkLint());
  results.push(checkTest());
  results.push(checkBuild());
  results.push(checkValidate());

  printChecklist(results);

  const failCount = results.filter((r) => !r.passed).length;
  if (failCount === 0) {
    process.stdout.write("All checks passed. Ready to open a PR.\n");
    process.exit(0);
  } else {
    process.stdout.write(
      `${failCount} check${failCount === 1 ? "" : "s"} failed. Fix the issues above before opening a PR.\n`,
    );
    process.exit(1);
  }
}

main();
