import { describe, expect, test } from "bun:test"

import { normalizeAgentName } from "./agent-resolver"

describe("runtime fallback agent resolver", () => {
  test("normalizes kept canonical and legacy agent names", () => {
    expect(normalizeAgentName("Orchestrator")).toBe("orchestrator")
    expect(normalizeAgentName("Sisyphus (Ultraworker)")).toBe("orchestrator")
    expect(normalizeAgentName("Reviewer")).toBe("reviewer")
    expect(normalizeAgentName("Momus (Plan Reviewer)")).toBe("reviewer")
    expect(normalizeAgentName("Sisyphus-Junior")).toBe("executor")
    expect(normalizeAgentName("multimodal-looker")).toBe("librarian")
  })

  test("does not keep retired planning agents in active runtime resolution", () => {
    expect(normalizeAgentName("prometheus")).toBeUndefined()
    expect(normalizeAgentName("atlas")).toBeUndefined()
    expect(normalizeAgentName("metis")).toBeUndefined()
  })
})
