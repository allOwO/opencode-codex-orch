import { afterEach, describe, expect, test } from "bun:test"
import * as fs from "node:fs"
import * as path from "node:path"
import {
  AGENT_NAME_MAP,
  HOOK_NAME_MAP,
  MODEL_VERSION_MAP,
  migrateAgentConfigToCategory,
  migrateAgentNames,
  migrateConfigFile,
  migrateHookNames,
  migrateModelVersions,
  shouldDeleteAgentConfig,
} from "./migration"

const tempPaths: string[] = []
const retiredOrchestratorKey = ["si", "syphus"].join("")
const retiredReviewerKey = ["mo", "mus"].join("")
const retiredExecutorKey = [retiredOrchestratorKey, "junior"].join("-")
const retiredOrchestratorAgentKey = [retiredOrchestratorKey, "agent"].join("_")
const retiredHookKey = [retiredOrchestratorKey, "orchestrator"].join("-")
const retiredReviewerDisplay = ["M", "omus (Plan Reviewer)"].join("")
const retiredExecutorDisplay = ["S", "isyphus-Junior"].join("")

afterEach(() => {
  for (const tempPath of tempPaths.splice(0)) {
    fs.rmSync(tempPath, { force: true })
  }
})

function createTempConfig(rawConfig: Record<string, unknown>) {
  const tempPath = path.join(process.cwd(), `tmp-migration-${Date.now()}-${Math.random()}.json`)
  fs.writeFileSync(tempPath, `${JSON.stringify(rawConfig, null, 2)}
`, "utf-8")
  tempPaths.push(tempPath)
  return tempPath
}

describe("migrateAgentNames", () => {
  test("migrates only the remaining canonical alias and leaves retired names untouched", () => {
    const agents = {
      omo: { model: "anthropic/claude-opus-4-6" },
      [retiredReviewerDisplay]: { temperature: 0.2 },
      [retiredExecutorDisplay]: { model: "openai/gpt-5.4" },
      "multimodal-looker": { model: "openai/gpt-5.4" },
      orchestrator: { model: "anthropic/claude-opus-4-6" },
      reviewer: { model: "openai/gpt-5.4" },
    }

    const { migrated, changed } = migrateAgentNames(agents)

    expect(changed).toBe(true)
    expect(migrated.orchestrator).toEqual({ model: "anthropic/claude-opus-4-6" })
    expect(migrated[retiredReviewerDisplay]).toEqual({ temperature: 0.2 })
    expect(migrated[retiredExecutorDisplay]).toEqual({ model: "openai/gpt-5.4" })
    expect(migrated["multimodal-looker"]).toEqual({ model: "openai/gpt-5.4" })
    expect(migrated.reviewer).toEqual({ model: "openai/gpt-5.4" })
  })

  test("keeps retired planning agent names untouched until config-migration prunes them", () => {
    const { migrated } = migrateAgentNames({ prometheus: { model: "x" }, atlas: { model: "y" } })

    expect(migrated.prometheus).toEqual({ model: "x" })
    expect(migrated.atlas).toEqual({ model: "y" })
  })
})

describe("migrateHookNames", () => {
  test("migrates remaining supported hook names and reports removed entries", () => {
    const { migrated, changed, removed } = migrateHookNames([
      "anthropic-auto-compact",
      retiredHookKey,
      "comment-checker",
    ])

    expect(changed).toBe(true)
    expect(migrated).toContain("anthropic-context-window-limit-recovery")
    expect(migrated).toContain(retiredHookKey)
    expect(removed).toEqual([])
  })
})

describe("migrateModelVersions", () => {
  test("migrates known model aliases and records migration keys", () => {
    const { migrated, changed, newMigrations } = migrateModelVersions({
      orchestrator: { model: "anthropic/claude-opus-4-5" },
    })

    expect(changed).toBe(true)
    expect((migrated.orchestrator as Record<string, unknown>).model).toBe("anthropic/claude-opus-4-6")
    expect(newMigrations).toContain("model-version:anthropic/claude-opus-4-5->anthropic/claude-opus-4-6")
  })

  test("exposes known model migration entries", () => {
    expect(MODEL_VERSION_MAP["anthropic/claude-opus-4-5"]).toBe("anthropic/claude-opus-4-6")
  })
})

describe("category migration helpers", () => {
  test("migrates model-based config to canonical category names", () => {
    const { migrated, changed } = migrateAgentConfigToCategory({ model: "google/gemini-3.1-pro", temperature: 0.1 })

    expect(changed).toBe(true)
    expect(migrated).toEqual({ category: "designer", temperature: 0.1 })
  })

  test("deletes config when it only restates canonical defaults", () => {
    expect(shouldDeleteAgentConfig({ category: "designer" }, "designer")).toBe(true)
    expect(shouldDeleteAgentConfig({ category: "hard" }, "hard")).toBe(true)
    expect(shouldDeleteAgentConfig({ category: "designer", variant: "high" }, "designer")).toBe(true)
    expect(shouldDeleteAgentConfig({ category: "designer", temperature: 0.3 }, "designer")).toBe(false)
  })
})

describe("migrateConfigFile", () => {
  test("migrates remaining alias keys and removes retired planning agents", () => {
    const rawConfig: Record<string, unknown> = {
      agents: {
        omo: { model: "anthropic/claude-opus-4-6" },
        [retiredReviewerKey]: { model: "openai/gpt-5.4" },
        [retiredExecutorKey]: { model: "openai/gpt-5.4" },
        prometheus: { model: "anthropic/claude-opus-4-6" },
      },
      disabled_agents: [retiredOrchestratorKey, "metis", "atlas"],
      categories: {
        deep: { model: "openai/gpt-5.3-codex" },
        "visual-engineering": { model: "google/gemini-3.1-pro" },
      },
      omo_agent: { disabled: false },
      [retiredOrchestratorAgentKey]: { planner_enabled: true },
    }
    const configPath = createTempConfig(rawConfig)

    const needsWrite = migrateConfigFile(configPath, rawConfig)

    expect(needsWrite).toBe(true)
    expect(rawConfig.orchestrator_agent).toBeUndefined()
    expect(rawConfig[retiredOrchestratorAgentKey]).toEqual({ planner_enabled: true })
    expect(rawConfig.omo_agent).toEqual({ disabled: false })

    const agents = rawConfig.agents as Record<string, unknown>
    expect(agents.orchestrator).toBeDefined()
    expect(agents[retiredReviewerKey]).toBeDefined()
    expect(agents[retiredExecutorKey]).toBeDefined()
    expect(agents.prometheus).toBeUndefined()

    const disabledAgents = rawConfig.disabled_agents as string[]
    expect(disabledAgents).toEqual([retiredOrchestratorKey])

    const categories = rawConfig.categories as Record<string, unknown>
    expect(categories.hard).toBeDefined()
    expect(categories.designer).toBeDefined()
    expect(categories.deep).toBeUndefined()
    expect(categories["visual-engineering"]).toBeUndefined()
  })

  test("does not rewrite already-canonical config", () => {
    const rawConfig: Record<string, unknown> = {
      agents: {
        orchestrator: { model: "anthropic/claude-opus-4-6" },
        reviewer: { model: "openai/gpt-5.4" },
      },
      categories: {
        designer: { model: "google/gemini-3.1-pro" },
        hard: { model: "openai/gpt-5.3-codex" },
      },
      disabled_agents: ["orchestrator"],
    }
    const configPath = createTempConfig(rawConfig)

    const needsWrite = migrateConfigFile(configPath, rawConfig)

    expect(needsWrite).toBe(false)
  })
})

describe("migration maps", () => {
  test("does not expose retired surviving-agent aliases", () => {
    expect(AGENT_NAME_MAP.omo).toBe("orchestrator")
    expect(AGENT_NAME_MAP[retiredReviewerKey]).toBeUndefined()
    expect(AGENT_NAME_MAP[retiredExecutorKey]).toBeUndefined()
    expect(AGENT_NAME_MAP["multimodal-looker"]).toBeUndefined()
    expect(HOOK_NAME_MAP[retiredHookKey]).toBeUndefined()
  })
})
