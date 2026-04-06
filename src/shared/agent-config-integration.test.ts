import { describe, test, expect } from "bun:test"
import { migrateAgentNames } from "./migration"
import { getAgentDisplayName } from "./agent-display-names"
import { AGENT_MODEL_REQUIREMENTS } from "./model-requirements"

describe("Agent Config Integration", () => {
  describe("Old format config migration", () => {
    test("migrates surviving legacy names to orchestrator and reviewer", () => {
      const oldConfig = {
        Sisyphus: { model: "anthropic/claude-opus-4-6" },
        "Momus (Plan Reviewer)": { model: "anthropic/claude-sonnet-4-6" },
      }

      const result = migrateAgentNames(oldConfig)

      expect(result.migrated).toHaveProperty("orchestrator")
      expect(result.migrated).toHaveProperty("reviewer")
      expect(result.migrated).not.toHaveProperty("sisyphus")
      expect(result.migrated).not.toHaveProperty("momus")
      expect(result.migrated.orchestrator).toEqual({ model: "anthropic/claude-opus-4-6" })
      expect(result.migrated.reviewer).toEqual({ model: "anthropic/claude-sonnet-4-6" })
      expect(result.changed).toBe(true)
    })

    test("migrates surviving legacy keys while keeping removed agents removable", () => {
      // given - config with old format keys
      const oldConfig = {
        Sisyphus: { model: "anthropic/claude-opus-4-6" },
        Atlas: { model: "anthropic/claude-opus-4-6" },
        "Prometheus (Planner)": { model: "anthropic/claude-opus-4-6" },
        "Metis (Plan Consultant)": { model: "anthropic/claude-sonnet-4-6" },
        "Momus (Plan Reviewer)": { model: "anthropic/claude-sonnet-4-6" },
      }

      // when - migration is applied
      const result = migrateAgentNames(oldConfig)

      // then - keys are canonical
      expect(result.migrated).toHaveProperty("orchestrator")
      expect(result.migrated).toHaveProperty("atlas")
      expect(result.migrated).toHaveProperty("reviewer")

      // then - old keys are removed
      expect(result.migrated).not.toHaveProperty("Sisyphus")
      expect(result.migrated).not.toHaveProperty("Atlas")
      expect(result.migrated).not.toHaveProperty("Prometheus (Planner)")
      expect(result.migrated).not.toHaveProperty("Metis (Plan Consultant)")
      expect(result.migrated).not.toHaveProperty("Momus (Plan Reviewer)")

      // then - values are preserved
      expect(result.migrated.orchestrator).toEqual({ model: "anthropic/claude-opus-4-6" })
      expect(result.migrated.prometheus).toEqual({ model: "anthropic/claude-opus-4-6" })
      expect(result.migrated.atlas).toEqual({ model: "anthropic/claude-opus-4-6" })
      
      // then - changed flag is true
      expect(result.changed).toBe(true)
    })

    test("preserves already lowercase keys", () => {
      // given - config with lowercase keys
      const config = {
        orchestrator: { model: "anthropic/claude-opus-4-6" },
        oracle: { model: "openai/gpt-5.4" },
        librarian: { model: "opencode/big-pickle" },
      }

      // when - migration is applied
      const result = migrateAgentNames(config)

      // then - keys remain unchanged
      expect(result.migrated).toEqual(config)
      
      // then - changed flag is false
      expect(result.changed).toBe(false)
    })

    test("handles mixed case config", () => {
      // given - config with mixed old and new format
      const mixedConfig = {
        Sisyphus: { model: "anthropic/claude-opus-4-6" },
        oracle: { model: "openai/gpt-5.4" },
        "Prometheus (Planner)": { model: "anthropic/claude-opus-4-6" },
        librarian: { model: "opencode/big-pickle" },
      }

      // when - migration is applied
      const result = migrateAgentNames(mixedConfig)

      // then - all keys are canonical
      expect(result.migrated).toHaveProperty("orchestrator")
      expect(result.migrated).toHaveProperty("oracle")
      expect(result.migrated).toHaveProperty("librarian")
      expect(Object.keys(result.migrated).every((key) => key === key.toLowerCase())).toBe(true)
      
      // then - changed flag is true
      expect(result.changed).toBe(true)
    })
  })

  describe("Display name resolution", () => {
    test("returns canonical display names for surviving renamed agents", () => {
      expect(getAgentDisplayName("orchestrator")).toBe("Orchestrator")
      expect(getAgentDisplayName("reviewer")).toBe("Reviewer")
    })

    test("returns correct display names for all active builtin agents", () => {
      // given - lowercase config keys
      const agents = ["orchestrator", "reviewer", "oracle", "librarian", "explore", "deepsearch"]

      // when - display names are requested
      const displayNames = agents.map((agent) => getAgentDisplayName(agent))

      // then - display names are correct
      expect(displayNames).toContain("Orchestrator")
      expect(displayNames).toContain("Reviewer")
      expect(displayNames).toContain("oracle")
      expect(displayNames).toContain("librarian")
      expect(displayNames).toContain("explore")
      expect(displayNames).toContain("DeepSearch")
    })

    test("handles active and legacy compatibility names case-insensitively", () => {
      const keys = ["Sisyphus", "Momus", "SISYPHUS", "reviewer", "DeepSearch", "DEEPSEARCH"]

      // when - display names are requested
      const displayNames = keys.map((key) => getAgentDisplayName(key))

      // then - correct display names are returned
      expect(displayNames[0]).toBe("Orchestrator")
      expect(displayNames[1]).toBe("Reviewer")
      expect(displayNames[2]).toBe("Orchestrator")
      expect(displayNames[3]).toBe("Reviewer")
      expect(displayNames[4]).toBe("DeepSearch")
      expect(displayNames[5]).toBe("DeepSearch")
    })

    test("returns original key for unknown agents", () => {
      // given - unknown agent key
      const unknownKey = "custom-agent"

      // when - display name is requested
      const displayName = getAgentDisplayName(unknownKey)

      // then - original key is returned
      expect(displayName).toBe(unknownKey)
    })
  })

  describe("Model requirements integration", () => {
    test("all model requirements use lowercase keys", () => {
      // given - AGENT_MODEL_REQUIREMENTS object
      const agentKeys = Object.keys(AGENT_MODEL_REQUIREMENTS)

      // when - checking key format
      const allLowercase = agentKeys.every((key) => key === key.toLowerCase())

      // then - all keys are lowercase
      expect(allLowercase).toBe(true)
    })

    test("model requirements include all active builtin agents", () => {
      // given - expected builtin agents
      const expectedAgents = ["orchestrator", "sisyphus", "deepsearch", "reviewer", "oracle", "librarian", "explore", "momus"]

      // when - checking AGENT_MODEL_REQUIREMENTS
      const agentKeys = Object.keys(AGENT_MODEL_REQUIREMENTS)

      // then - all expected agents are present
      for (const agent of expectedAgents) {
        expect(agentKeys).toContain(agent)
      }
    })

    test("no uppercase keys in model requirements", () => {
      // given - AGENT_MODEL_REQUIREMENTS object
      const agentKeys = Object.keys(AGENT_MODEL_REQUIREMENTS)

      // when - checking for uppercase keys
      const uppercaseKeys = agentKeys.filter((key) => key !== key.toLowerCase())

      // then - no uppercase keys exist
      expect(uppercaseKeys).toEqual([])
    })
  })

  describe("End-to-end config flow", () => {
    test("old config migrates and displays correctly", () => {
      // given - old format config
      const oldConfig = {
        Sisyphus: { model: "anthropic/claude-opus-4-6", temperature: 0.1 },
        "Prometheus (Planner)": { model: "anthropic/claude-opus-4-6" },
      }

      // when - config is migrated
      const result = migrateAgentNames(oldConfig)

      // then - keys are lowercase
      expect(result.migrated).toHaveProperty("orchestrator")
        // when - display names are retrieved
        const sisyphusDisplay = getAgentDisplayName("orchestrator")

        // then - display names are correct
        expect(sisyphusDisplay).toBe("Orchestrator")

        // then - config values are preserved
        expect(result.migrated.orchestrator).toEqual({ model: "anthropic/claude-opus-4-6", temperature: 0.1 })
        expect(result.migrated.prometheus).toEqual({ model: "anthropic/claude-opus-4-6" })
      })

    test("new config works without migration", () => {
      // given - new format config (already lowercase)
      const newConfig = {
        orchestrator: { model: "anthropic/claude-opus-4-6" },
        reviewer: { model: "anthropic/claude-opus-4-6" },
      }

      // when - migration is applied (should be no-op)
      const result = migrateAgentNames(newConfig)

      // then - config is unchanged
      expect(result.migrated).toEqual(newConfig)
      
      // then - changed flag is false
      expect(result.changed).toBe(false)

      // when - display names are retrieved
      const sisyphusDisplay = getAgentDisplayName("orchestrator")
      const reviewerDisplay = getAgentDisplayName("reviewer")

      // then - display names are correct
      expect(sisyphusDisplay).toBe("Orchestrator")
      expect(reviewerDisplay).toBe("Reviewer")
    })
  })
})
