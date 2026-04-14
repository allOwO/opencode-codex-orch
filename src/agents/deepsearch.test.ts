import { describe, expect, test } from "bun:test"
import { createDeepSearchAgent } from "./deepsearch"

const TEST_MODEL = "openai/gpt-5.4"

describe("createDeepSearchAgent", () => {
  test("defines non-overlapping track orchestration with final reviewer check", () => {
    const prompt = createDeepSearchAgent(TEST_MODEL).prompt ?? ""

    expect(prompt).toContain("Plan → Wave → Parent Synthesis")
    expect(prompt).toContain("non-overlapping")
    expect(prompt).toContain("Local codebase track")
    expect(prompt).toContain("Local docs track")
    expect(prompt).toContain("coverage matrix")
    expect(prompt).toContain("gap-only")
    expect(prompt).toContain("reviewer")
    expect(prompt).toContain("docs/deepsearch/<topic>.md")
  })
})
