import { describe, expect, test } from "bun:test"

import { normalizeAgentName } from "./agent-resolver"

describe("runtime fallback agent resolver", () => {
  test("normalizes canonical agent names only", () => {
    expect(normalizeAgentName("Orchestrator")).toBe("orchestrator")
    expect(normalizeAgentName("Reviewer")).toBe("reviewer")
    expect(normalizeAgentName("Executor")).toBe("executor")
  })

  test("does not normalize retired agent aliases", () => {
    expect(normalizeAgentName("Sisyphus (Ultraworker)")).toBeUndefined()
    expect(normalizeAgentName("Momus (Plan Reviewer)")).toBeUndefined()
    expect(normalizeAgentName("Sisyphus-Junior")).toBeUndefined()
    expect(normalizeAgentName("multimodal-looker")).toBeUndefined()
  })

  test("does not keep retired planning agents in active runtime resolution", () => {
    expect(normalizeAgentName("prometheus")).toBeUndefined()
    expect(normalizeAgentName("atlas")).toBeUndefined()
    expect(normalizeAgentName("metis")).toBeUndefined()
  })
})
