import { join, relative } from "node:path"

const REPO_ROOT = join(import.meta.dir, "..")
const TEST_ROOTS = ["bin", "script", "src"] as const
const ISOLATED_TEST_SPECS = [
  "src/plugin-handlers",
  "src/hooks/atlas",
  "src/hooks/compaction-context-injector",
  "src/features/tmux-subagent",
  "src/cli/doctor/formatter.test.ts",
  "src/cli/doctor/format-default.test.ts",
  "src/cli/doctor/checks/system-loaded-version.test.ts",
  "src/cli/mcp-oauth/login.test.ts",
  "src/features/mcp-oauth/provider.test.ts",
  "src/features/skill-mcp-manager/manager.test.ts",
  "src/tools/call-oco-agent/sync-executor.test.ts",
  "src/tools/call-oco-agent/session-creator.test.ts",
  "src/tools/session-manager",
  "src/features/opencode-skill-loader/loader.test.ts",
  "src/hooks/anthropic-context-window-limit-recovery/recovery-hook.test.ts",
  "src/hooks/anthropic-context-window-limit-recovery/executor.test.ts",
  "src/shared/model-error-classifier.test.ts",
  "src/shared/connected-providers-cache.test.ts",
  "src/shared/model-availability.test.ts",
] as const

function runBunTest(args: string[]): void {
  const result = Bun.spawnSync([process.execPath, "test", ...args], {
    cwd: REPO_ROOT,
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
    env: process.env,
  })

  if (result.exitCode !== 0) {
    process.exit(result.exitCode)
  }
}

function isCoveredByIsolatedSpec(filePath: string): boolean {
  return ISOLATED_TEST_SPECS.some((spec) => filePath === spec || filePath.startsWith(`${spec}/`))
}

function getMatchingTestFiles(spec: string, allTestFiles: string[]): string[] {
  return allTestFiles.filter((filePath) => filePath === spec || filePath.startsWith(`${spec}/`))
}

async function collectTestFiles(): Promise<string[]> {
  const discovered = new Set<string>()

  for (const root of TEST_ROOTS) {
    const glob = new Bun.Glob("**/*.test.ts")
    const cwd = join(REPO_ROOT, root)
    for await (const match of glob.scan({ cwd, absolute: true })) {
      discovered.add(relative(REPO_ROOT, match))
    }
  }

  return [...discovered].sort()
}

const allTestFiles = await collectTestFiles()
const batchTestFiles = allTestFiles.filter((filePath) => !isCoveredByIsolatedSpec(filePath))

for (const spec of ISOLATED_TEST_SPECS) {
  if (getMatchingTestFiles(spec, allTestFiles).length > 0) {
    runBunTest([spec])
  }
}

if (batchTestFiles.length > 0) {
  runBunTest(batchTestFiles)
}
