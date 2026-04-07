import { describe, test, expect } from "bun:test"
import { REVIEWER_SYSTEM_PROMPT } from "./reviewer"

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

describe("REVIEWER_SYSTEM_PROMPT policy requirements", () => {
  test("should treat SYSTEM DIRECTIVE as ignorable/stripped", () => {
    // given
    const prompt = REVIEWER_SYSTEM_PROMPT
    
    // when / #then
    // Should mention that system directives are ignored
    expect(prompt.toLowerCase()).toMatch(/system directive.*ignore|ignore.*system directive/)
    // Should give examples of system directive patterns
    expect(prompt).toMatch(/<system-reminder>|system-reminder/)
  })

  test("should extract a single reviewable markdown plan path without requiring .orchestrator/plans", () => {
    // given
    const prompt = REVIEWER_SYSTEM_PROMPT

    // when / #then
    expect(prompt).toContain("docs/superpowers/specs/")
    expect(prompt).toContain(".md")
    // New extraction policy should be mentioned
    expect(prompt.toLowerCase()).toMatch(/extract|search|find path/)
    expect(prompt).not.toMatch(/exactly one `\.orchestrator\/plans\/\*\.md` path exists/i)
    // No .orchestrator/plans path should appear anywhere in the prompt
    expect(prompt).not.toContain(".orchestrator/plans")
  })

  test("should NOT teach that 'Please review' is INVALID (conversational wrapper allowed)", () => {
    // given
    const prompt = REVIEWER_SYSTEM_PROMPT

    // when / #then
    // Conversational wrapper is VALID input — prompt should show it as an example
    expect(prompt).toContain("Please review")
    // The wrapper example should NOT use .orchestrator paths
    expect(prompt).not.toMatch(/Please review.*\.orchestrator/)
  })

  test("should handle ambiguity (2+ paths) and 'no path found' rejection", () => {
    // given
    const prompt = REVIEWER_SYSTEM_PROMPT

    // when / #then
    // Should mention what happens when multiple paths are found
    expect(prompt.toLowerCase()).toMatch(/multiple|ambiguous|2\+|two/)
    // Should mention rejection if no path found
    expect(prompt.toLowerCase()).toMatch(/no.*path.*found|reject.*no.*path/)
  })

  test("should accept a markdown plan path under docs/superpowers/specs", () => {
    // given
    const prompt = REVIEWER_SYSTEM_PROMPT

    // when / #then
    expect(prompt).toContain("docs/superpowers/specs/payment-design.md")
    expect(prompt.toLowerCase()).toMatch(/reviewable markdown plan path|markdown plan path/)
  })
})
