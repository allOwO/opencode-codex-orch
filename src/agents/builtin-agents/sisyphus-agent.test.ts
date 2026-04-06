import { describe, expect, test } from "bun:test"

import { maybeCreateSisyphusConfig } from "./sisyphus-agent"

describe("maybeCreateSisyphusConfig", () => {
  test("respects canonical orchestrator disable and override keys", () => {
    const disabled = maybeCreateSisyphusConfig({
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

    const configured = maybeCreateSisyphusConfig({
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
