import { mkdir, writeFile } from "node:fs/promises"
import { join } from "node:path"

const AGENTS = ["sisyphus", "prometheus", "oracle", "librarian", "explore", "multimodal-looker", "metis", "momus", "atlas"]
const CATEGORIES = ["visual-engineering", "deep", "quick", "writing", "unspecified-high", "unspecified-low"]

function buildConfig(model: string): Record<string, unknown> {
  const agents = Object.fromEntries(AGENTS.map((name) => [name, { model }]))
  const categories = Object.fromEntries(CATEGORIES.map((name) => [name, { model }]))
  return { model_fallback: false, runtime_fallback: false, agents, categories }
}

function buildOpenCodeConfig(model: string): Record<string, unknown> {
  return {
    "$schema": "https://opencode.ai/config.json",
    model,
    default_agent: "build",
  }
}

export async function seedWorkspace(dir: string, model: string): Promise<void> {
  await mkdir(join(dir, ".opencode"), { recursive: true })
  await mkdir(join(dir, "src", "nested"), { recursive: true })
  await writeFile(join(dir, "package.json"), JSON.stringify({ name: "bench", version: "9.9.9" }, null, 2) + "\n")
  await writeFile(join(dir, "src", "runner.ts"), "export const runner = true\n")
  await writeFile(join(dir, "src", "alpha-hook.ts"), "export const alphaHook = true\n")
  await writeFile(join(dir, "src", "nested", "beta-hook.ts"), "export const betaHook = true\n")
  await writeFile(join(dir, "src", "plain.ts"), "export const plain = true\n")
  await writeFile(join(dir, ".opencode", "opencode.json"), JSON.stringify(buildOpenCodeConfig(model), null, 2) + "\n")
  await writeFile(join(dir, ".opencode", "opencode-codex-orch.json"), JSON.stringify(buildConfig(model), null, 2) + "\n")
}
