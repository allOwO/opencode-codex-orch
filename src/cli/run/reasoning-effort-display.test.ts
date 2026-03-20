import { describe, expect, spyOn, test } from "bun:test"

import { handleMessageUpdated } from "./event-handlers"
import { createEventState } from "./events"
import { formatModelDetails, renderAgentHeader } from "./output-renderer"
import type { RunContext } from "./types"

function createMockContext(sessionID = "ses_main"): RunContext {
  return { sessionID } as RunContext
}

describe("reasoning effort display", () => {
  test("stores reasoningEffort from assistant message metadata", () => {
    // given
    const ctx = createMockContext()
    const state = createEventState()
    const stdoutSpy = spyOn(process.stdout, "write").mockImplementation(() => true)

    // when
    handleMessageUpdated(
      ctx,
      {
        type: "message.updated",
        properties: {
          info: {
            id: "msg_1",
            sessionID: "ses_main",
            role: "assistant",
            agent: "Sisyphus",
            modelID: "gpt-5.4",
            reasoningEffort: "high",
          },
        },
      } as const,
      state,
    )

    // then
    expect(state.currentReasoningEffort).toBe("high")
    stdoutSpy.mockRestore()
  })

  test("formats model details with variant and reasoning effort", () => {
    // given/when
    const result = formatModelDetails("medium", "high")

    // then
    expect(result).toBe(" (medium, effort: high)")
  })

  test("renders reasoningEffort in the agent header", () => {
    // given
    const stdoutSpy = spyOn(process.stdout, "write").mockImplementation(() => true)

    // when
    renderAgentHeader("Sisyphus", "gpt-5.4", null, "high", {})

    // then
    const output = stdoutSpy.mock.calls.map(call => String(call[0])).join("")
    expect(output).toContain("gpt-5.4 (effort: high)")
    stdoutSpy.mockRestore()
  })
})
