import { describe, expect, test } from "bun:test"

import { maybeCreateOrchestratorConfig } from "./orchestrator-agent"

describe("maybeCreateOrchestratorConfig", () => {
  test("respects canonical orchestrator disable and override keys", () => {
    const disabled = maybeCreateOrchestratorConfig({
      disabledAgents: ["orchestrator"],
      agentOverrides: {},
      availableModels: new Set(["openai/gpt-5.4"]),
      isFirstRunNoCache: false,
      availableAgents: [],
      availableSkills: [],
      availableCategories: [],
      mergedCategories: {},
      useTaskSystem: false,
    })

    expect(disabled).toBeUndefined()

    const configured = maybeCreateOrchestratorConfig({
      disabledAgents: [],
      agentOverrides: {
        orchestrator: {
          description: "Configured orchestrator",
        },
      },
      availableModels: new Set(["openai/gpt-5.4"]),
      isFirstRunNoCache: false,
      availableAgents: [],
      availableSkills: [],
      availableCategories: [],
      mergedCategories: {},
      useTaskSystem: false,
    })

    expect(configured?.description).toBe("Configured orchestrator")
  })
})
