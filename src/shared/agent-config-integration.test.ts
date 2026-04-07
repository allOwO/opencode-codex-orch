import { describe, expect, test } from "bun:test"
import { getAgentDisplayName } from "./agent-display-names"
import { migrateAgentNames } from "./migration"
import { AGENT_MODEL_REQUIREMENTS } from "./model-requirements"

describe("Agent Config Integration", () => {
  describe("Canonical config migration", () => {
    test("preserves canonical agent keys", () => {
      const config = {
        orchestrator: { model: "anthropic/claude-opus-4-6" },
        reviewer: { model: "anthropic/claude-sonnet-4-6" },
      }

      const result = migrateAgentNames(config)

      expect(result.migrated).toEqual(config)
      expect(result.changed).toBe(false)
    })

    test("keeps retired planning-agent keys unchanged for later pruning", () => {
      const config = {
        atlas: { model: "anthropic/claude-opus-4-6" },
        prometheus: { model: "anthropic/claude-opus-4-6" },
        metis: { model: "anthropic/claude-sonnet-4-6" },
      }

      const result = migrateAgentNames(config)

      expect(result.migrated).toEqual(config)
      expect(result.changed).toBe(false)
    })
  })

  describe("Display name resolution", () => {
    test("returns canonical display names for active renamed agents", () => {
      expect(getAgentDisplayName("orchestrator")).toBe("Orchestrator")
      expect(getAgentDisplayName("reviewer")).toBe("Reviewer")
    })

    test("returns correct display names for all active builtin agents", () => {
      const agents = ["orchestrator", "reviewer", "oracle", "librarian", "explore", "deepsearch"]
      const displayNames = agents.map((agent) => getAgentDisplayName(agent))

      expect(displayNames).toContain("Orchestrator")
      expect(displayNames).toContain("Reviewer")
      expect(displayNames).toContain("oracle")
      expect(displayNames).toContain("librarian")
      expect(displayNames).toContain("explore")
      expect(displayNames).toContain("DeepSearch")
    })

    test("handles active canonical names case-insensitively", () => {
      const keys = ["Orchestrator", "REVIEWER", "orchestrator", "reviewer", "DeepSearch", "DEEPSEARCH"]
      const displayNames = keys.map((key) => getAgentDisplayName(key))

      expect(displayNames[0]).toBe("Orchestrator")
      expect(displayNames[1]).toBe("Reviewer")
      expect(displayNames[2]).toBe("Orchestrator")
      expect(displayNames[3]).toBe("Reviewer")
      expect(displayNames[4]).toBe("DeepSearch")
      expect(displayNames[5]).toBe("DeepSearch")
    })

    test("returns original key for unknown agents", () => {
      expect(getAgentDisplayName("custom-agent")).toBe("custom-agent")
    })
  })

  describe("Model requirements integration", () => {
    test("all model requirements use lowercase keys", () => {
      const agentKeys = Object.keys(AGENT_MODEL_REQUIREMENTS)
      expect(agentKeys.every((key) => key === key.toLowerCase())).toBe(true)
    })

    test("model requirements include all active builtin agents", () => {
      const expectedAgents = ["orchestrator", "deepsearch", "reviewer", "oracle", "librarian", "explore"]
      const agentKeys = Object.keys(AGENT_MODEL_REQUIREMENTS)

      for (const agent of expectedAgents) {
        expect(agentKeys).toContain(agent)
      }
    })

    test("no uppercase keys in model requirements", () => {
      const agentKeys = Object.keys(AGENT_MODEL_REQUIREMENTS)
      expect(agentKeys.filter((key) => key !== key.toLowerCase())).toEqual([])
    })
  })

  describe("End-to-end config flow", () => {
    test("canonical config displays correctly without migration", () => {
      const config = {
        orchestrator: { model: "anthropic/claude-opus-4-6", temperature: 0.1 },
        reviewer: { model: "anthropic/claude-opus-4-6" },
      }

      const result = migrateAgentNames(config)
      const orchestratorDisplay = getAgentDisplayName("orchestrator")
      const reviewerDisplay = getAgentDisplayName("reviewer")

      expect(result.migrated).toEqual(config)
      expect(orchestratorDisplay).toBe("Orchestrator")
      expect(reviewerDisplay).toBe("Reviewer")
    })
  })
})
