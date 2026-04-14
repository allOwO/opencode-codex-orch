import { describe, expect, it } from "bun:test"
import { AGENT_DISPLAY_NAMES, getAgentDisplayName, getAgentConfigKey } from "./agent-display-names"

const retiredOrchestratorKey = ["si", "syphus"].join("")
const retiredReviewerKey = ["mo", "mus"].join("")
const retiredExecutorKey = [retiredOrchestratorKey, "junior"].join("-")
const retiredOrchestratorDisplay = ["S", "isyphus (Ultraworker)"].join("")
const retiredReviewerDisplay = ["M", "omus (Plan Critic)"].join("")
const retiredExecutorDisplay = ["S", "isyphus-Junior"].join("")

describe("getAgentDisplayName", () => {
  it("returns display name for orchestrator", () => {
    expect(getAgentDisplayName("orchestrator")).toBe("Orchestrator")
  })

  it("returns display name for reviewer", () => {
    expect(getAgentDisplayName("reviewer")).toBe("Reviewer")
  })

  it("returns canonical agent display names only", () => {
    expect(getAgentDisplayName("orchestrator")).toBe("Orchestrator")
    expect(getAgentDisplayName("reviewer")).toBe("Reviewer")
    expect(getAgentDisplayName("executor")).toBe("Executor")
    expect(getAgentDisplayName("quicktask")).toBe("quickTask")
  })

  it("returns original key for unknown agents (fallback)", () => {
    // given config key "custom-agent"
    const configKey = "custom-agent"

    // when getAgentDisplayName called
    const result = getAgentDisplayName(configKey)

    // then returns "custom-agent" (original key unchanged)
    expect(result).toBe("custom-agent")
  })

  it("does not remap retired agent names", () => {
    expect(getAgentDisplayName(retiredOrchestratorKey)).toBe(retiredOrchestratorKey)
    expect(getAgentDisplayName(retiredReviewerKey)).toBe(retiredReviewerKey)
  })

  it("does not remap retired executor display names", () => {
    expect(getAgentDisplayName(retiredExecutorKey)).toBe(retiredExecutorKey)
  })

  it("returns display name for oracle", () => {
    // given config key "oracle"
    const configKey = "oracle"

    // when getAgentDisplayName called
    const result = getAgentDisplayName(configKey)

    // then returns "oracle"
    expect(result).toBe("oracle")
  })

  it("returns display name for librarian", () => {
    // given config key "librarian"
    const configKey = "librarian"

    // when getAgentDisplayName called
    const result = getAgentDisplayName(configKey)

    // then returns "librarian"
    expect(result).toBe("librarian")
  })

  it("returns display name for explore", () => {
    // given config key "explore"
    const configKey = "explore"

    // when getAgentDisplayName called
    const result = getAgentDisplayName(configKey)

    // then returns "explore"
    expect(result).toBe("explore")
  })

  it("does not expose retired agent display names in the active surface", () => {
    expect(getAgentDisplayName("atlas")).toBe("atlas")
    expect(getAgentDisplayName("prometheus")).toBe("prometheus")
    expect(getAgentDisplayName("metis")).toBe("metis")
    expect(getAgentDisplayName("multimodal-looker")).toBe("multimodal-looker")
  })
})

describe("getAgentConfigKey", () => {
  it("resolves canonical display names to canonical config keys", () => {
    expect(getAgentConfigKey("Orchestrator")).toBe("orchestrator")
    expect(getAgentConfigKey("Reviewer")).toBe("reviewer")
  })

  it("resolves unknown retired display names as plain lowercase strings", () => {
    expect(getAgentConfigKey("atlas (plan executor)")).toBe("atlas (plan executor)")
    expect(getAgentConfigKey("prometheus (plan builder)")).toBe("prometheus (plan builder)")
    expect(getAgentConfigKey("metis (plan consultant)")).toBe("metis (plan consultant)")
  })

  it("passes through lowercase retired config keys unchanged", () => {
    expect(getAgentConfigKey("prometheus")).toBe("prometheus")
    expect(getAgentConfigKey("atlas")).toBe("atlas")
    expect(getAgentConfigKey("metis")).toBe("metis")
  })

  it("returns lowercased unknown agents", () => {
    // given unknown agent name
    // when getAgentConfigKey called
    // then returns lowercased
    expect(getAgentConfigKey("Custom-Agent")).toBe("custom-agent")
  })

  it("does not remap retired config or display names", () => {
    expect(getAgentConfigKey("Orchestrator")).toBe("orchestrator")
    expect(getAgentConfigKey("Reviewer")).toBe("reviewer")
    expect(getAgentConfigKey(retiredOrchestratorKey)).toBe(retiredOrchestratorKey)
    expect(getAgentConfigKey(retiredReviewerKey)).toBe(retiredReviewerKey)
    expect(getAgentConfigKey(retiredExecutorKey)).toBe(retiredExecutorKey)
    expect(getAgentConfigKey(retiredOrchestratorDisplay)).toBe(`${retiredOrchestratorKey} (ultraworker)`)
    expect(getAgentConfigKey(retiredReviewerDisplay)).toBe(`${retiredReviewerKey} (plan critic)`)
    expect(getAgentConfigKey(retiredExecutorDisplay)).toBe(retiredExecutorKey)
  })
})

describe("AGENT_DISPLAY_NAMES", () => {
  it("contains canonical mappings for surviving renamed agents", () => {
    expect(AGENT_DISPLAY_NAMES.orchestrator).toBe("Orchestrator")
    expect(AGENT_DISPLAY_NAMES.reviewer).toBe("Reviewer")
  })

  it("contains all expected agent mappings", () => {
    // given expected mappings
    const expectedMappings = {
      orchestrator: "Orchestrator",
      deepsearch: "DeepSearch",
      executor: "Executor",
      reviewer: "Reviewer",
      oracle: "oracle",
      librarian: "librarian",
      explore: "explore",
      quicktask: "quickTask",
      build: "build",
    }

    // when checking the constant
    // then contains all expected mappings
    expect(AGENT_DISPLAY_NAMES).toEqual(expectedMappings)
  })

  it("does not include retired agent names", () => {
    expect(AGENT_DISPLAY_NAMES).not.toHaveProperty("prometheus")
    expect(AGENT_DISPLAY_NAMES).not.toHaveProperty("atlas")
    expect(AGENT_DISPLAY_NAMES).not.toHaveProperty("metis")
    expect(AGENT_DISPLAY_NAMES).not.toHaveProperty("multimodal-looker")
  })
})
