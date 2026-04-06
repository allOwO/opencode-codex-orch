import { describe, expect, test } from "bun:test"
import type { AgentConfig } from "@opencode-ai/sdk"

import { collectPendingBuiltinAgents } from "./general-agents"
import type { AgentFactory, AgentPromptMetadata, BuiltinAgentName } from "../types"

function createSubagentFactory(description: string): AgentFactory {
  const factory = ((model: string) => ({
    description,
    model,
    mode: "subagent",
    prompt: `${description} prompt`,
  })) as AgentFactory
  factory.mode = "subagent"
  return factory
}

function createAgentSources(): Record<BuiltinAgentName, AgentFactory | AgentConfig> {
  return {
    sisyphus: createSubagentFactory("orchestrator"),
    oracle: createSubagentFactory("oracle"),
    librarian: createSubagentFactory("librarian"),
    explore: createSubagentFactory("explore"),
    deepsearch: createSubagentFactory("deepsearch"),
    momus: createSubagentFactory("reviewer"),
  }
}

function createAgentMetadata(): Partial<Record<BuiltinAgentName, AgentPromptMetadata>> {
  return {
    momus: {
      category: "advisor",
      cost: "CHEAP",
      triggers: [],
    },
  }
}

describe("collectPendingBuiltinAgents", () => {
  test("uses canonical reviewer runtime name for overrides, disable checks, and available agents", () => {
    const result = collectPendingBuiltinAgents({
      agentSources: createAgentSources(),
      agentMetadata: createAgentMetadata(),
      disabledAgents: ["reviewer"],
      agentOverrides: {
        reviewer: {
          description: "Configured reviewer",
        },
      },
      systemDefaultModel: "openai/gpt-5.4",
      mergedCategories: {},
      availableModels: new Set(["openai/gpt-5.4"]),
    })

    expect(result.pendingAgentConfigs.has("reviewer")).toBe(false)
    expect(result.pendingAgentConfigs.has("momus")).toBe(false)
    expect(result.availableAgents.some((agent) => agent.name === "reviewer")).toBe(false)
    expect(result.availableAgents.some((agent) => agent.name === "momus")).toBe(false)
  })

  test("publishes reviewer under its canonical runtime name", () => {
    const result = collectPendingBuiltinAgents({
      agentSources: createAgentSources(),
      agentMetadata: createAgentMetadata(),
      disabledAgents: [],
      agentOverrides: {
        reviewer: {
          description: "Configured reviewer",
        },
      },
      systemDefaultModel: "openai/gpt-5.4",
      mergedCategories: {},
      availableModels: new Set(["openai/gpt-5.4"]),
    })

    expect(result.pendingAgentConfigs.has("reviewer")).toBe(true)
    expect(result.pendingAgentConfigs.has("momus")).toBe(false)
    expect(result.pendingAgentConfigs.get("reviewer")?.description).toBe("Configured reviewer")
    expect(result.availableAgents.some((agent) => agent.name === "reviewer")).toBe(true)
    expect(result.availableAgents.some((agent) => agent.name === "momus")).toBe(false)
  })
})
