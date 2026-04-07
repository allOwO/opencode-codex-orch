import { describe, it, expect } from "bun:test"
import { remapAgentKeysToDisplayNames } from "./agent-key-remapper"

describe("remapAgentKeysToDisplayNames", () => {
  it("remaps known agent keys to display names", () => {
    // given agents with lowercase keys
    const agents = {
      orchestrator: { prompt: "test", mode: "primary" },
      oracle: { prompt: "test", mode: "subagent" },
    }

    // when remapping
    const result = remapAgentKeysToDisplayNames(agents)

    // then known agents get display name keys only
    expect(result.Orchestrator).toBeDefined()
    expect(result["oracle"]).toBeDefined()
    expect(result["orchestrator"]).toBeUndefined()
  })

  it("preserves unknown agent keys unchanged", () => {
    // given agents with a custom key
    const agents = {
      "custom-agent": { prompt: "custom" },
    }

    // when remapping
    const result = remapAgentKeysToDisplayNames(agents)

    // then custom key is unchanged
    expect(result["custom-agent"]).toBeDefined()
  })

  it("remaps active agents to display names and leaves retired names alone", () => {
    const agents = {
      orchestrator: {},
      reviewer: {},
      deepsearch: {},
      prometheus: {},
      atlas: {},
      metis: {},
    }

    // when remapping
    const result = remapAgentKeysToDisplayNames(agents)

    // then active agents get display names while retired keys stay literal
    expect(result.Orchestrator).toBeDefined()
    expect(result["orchestrator"]).toBeUndefined()
    expect(result.Reviewer).toBeDefined()
    expect(result.DeepSearch).toBeDefined()
    expect(result["prometheus"]).toBeDefined()
    expect(result["atlas"]).toBeDefined()
    expect(result["metis"]).toBeDefined()
  })
})
