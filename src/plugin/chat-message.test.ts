/// <reference types="bun-types" />

import { describe, test, expect } from "bun:test"

import { createChatMessageHandler } from "./chat-message"

type ChatMessagePart = { type: string; text?: string; [key: string]: unknown }
type ChatMessageHandlerOutput = { message: Record<string, unknown>; parts: ChatMessagePart[] }

function createMockHandlerArgs(overrides?: {
  pluginConfig?: Record<string, unknown>
  shouldOverride?: boolean
}) {
  const appliedSessions: string[] = []
  const toastCalls: Array<{ body: { title: string; message: string; variant: "warning"; duration: number } }> = []
  return {
    ctx: {
      client: {
        tui: {
          showToast: async (input: { body: { title: string; message: string; variant: "warning"; duration: number } }) => {
            toastCalls.push(input)
          },
        },
      },
    } as any,
    pluginConfig: (overrides?.pluginConfig ?? {}) as any,
    firstMessageVariantGate: {
      shouldOverride: () => overrides?.shouldOverride ?? false,
      markApplied: (sessionID: string) => { appliedSessions.push(sessionID) },
    },
    hooks: {
      stopContinuationGuard: null,
      backgroundNotificationHook: null,
      keywordDetector: null,
      claudeCodeHooks: null,
      autoSlashCommand: null,
      startWork: null,
      ralphLoop: null,
    } as any,
    _appliedSessions: appliedSessions,
    _toastCalls: toastCalls,
  }
}

function createMockInput(agent?: string, model?: { providerID: string; modelID: string }) {
  return {
    sessionID: "test-session",
    agent,
    model,
  }
}

function createMockOutput(variant?: string): ChatMessageHandlerOutput {
  const message: Record<string, unknown> = {}
  if (variant !== undefined) {
    message["variant"] = variant
  }
  return { message, parts: [] }
}

describe("createChatMessageHandler - TUI variant passthrough", () => {
  test("first message: does not override TUI variant when user has no selection", async () => {
    //#given - first message, no user-selected variant
    const args = createMockHandlerArgs({ shouldOverride: true })
    const handler = createChatMessageHandler(args)
    const input = createMockInput("sisyphus", { providerID: "openai", modelID: "gpt-5.3-codex" })
    const output = createMockOutput() // no variant set

    //#when
    await handler(input, output)

    //#then - TUI sent undefined, should stay undefined (no config override)
    expect(output.message["variant"]).toBeUndefined()
  })

  test("first message: preserves user-selected variant when already set", async () => {
    //#given - first message, user already selected "xhigh" variant in OpenCode UI
    const args = createMockHandlerArgs({ shouldOverride: true })
    const handler = createChatMessageHandler(args)
    const input = createMockInput("sisyphus", { providerID: "openai", modelID: "gpt-5.3-codex" })
    const output = createMockOutput("xhigh") // user selected xhigh

    //#when
    await handler(input, output)

    //#then - user's xhigh must be preserved
    expect(output.message["variant"]).toBe("xhigh")
  })

  test("subsequent message: preserves TUI variant", async () => {
    //#given - not first message, variant already set
    const args = createMockHandlerArgs({ shouldOverride: false })
    const handler = createChatMessageHandler(args)
    const input = createMockInput("sisyphus", { providerID: "openai", modelID: "gpt-5.3-codex" })
    const output = createMockOutput("xhigh")

    //#when
    await handler(input, output)

    //#then
    expect(output.message["variant"]).toBe("xhigh")
  })

  test("subsequent message: does not inject variant when TUI sends none", async () => {
    //#given - not first message, no variant from TUI
    const args = createMockHandlerArgs({ shouldOverride: false })
    const handler = createChatMessageHandler(args)
    const input = createMockInput("sisyphus", { providerID: "openai", modelID: "gpt-5.3-codex" })
    const output = createMockOutput() // no variant

    //#when
    await handler(input, output)

    //#then - should stay undefined, not auto-resolved from config
    expect(output.message["variant"]).toBeUndefined()
  })

  test("first message: marks gate as applied regardless of variant presence", async () => {
    //#given - first message with user-selected variant
    const args = createMockHandlerArgs({ shouldOverride: true })
    const handler = createChatMessageHandler(args)
    const input = createMockInput("sisyphus", { providerID: "openai", modelID: "gpt-5.3-codex" })
    const output = createMockOutput("xhigh")

    //#when
    await handler(input, output)

    //#then - gate should still be marked as applied
    expect(args._appliedSessions).toContain("test-session")
  })

  test("injects queued background notifications through chat.message hook", async () => {
    //#given
    const args = createMockHandlerArgs()
    args.hooks.backgroundNotificationHook = {
      "chat.message": async (
        _input: { sessionID: string },
        output: ChatMessageHandlerOutput,
      ): Promise<void> => {
        output.parts.push({
          type: "text",
          text: "<system-reminder>[BACKGROUND TASK COMPLETED]</system-reminder>",
        })
      },
    }
    const handler = createChatMessageHandler(args)
    const input = createMockInput("sisyphus", { providerID: "openai", modelID: "gpt-5.3-codex" })
    const output = createMockOutput()

    //#when
    await handler(input, output)

    //#then
    expect(output.parts).toHaveLength(1)
    expect(output.parts[0].text).toContain("[BACKGROUND TASK COMPLETED]")
  })

  test("does not activate retired ultrawork mode when ulw intent is prefixed", async () => {
    // #given
    const args = createMockHandlerArgs()
    const handler = createChatMessageHandler(args)
    const input = createMockInput("sisyphus", { providerID: "openai", modelID: "gpt-5.4" })
    const output: ChatMessageHandlerOutput = {
      message: {},
      parts: [{ type: "text", text: "ulw fix the failing tests" }],
    }

    // #when
    await handler(input, output)

    // #then
    expect(output.parts).toHaveLength(1)
    expect(output.parts[0].text).toBe("ulw fix the failing tests")
    expect(output.parts[0].text).not.toContain("OCO_INTERNAL_INITIATOR")
    expect(args._toastCalls.some((call) => call.body.title === "Ultrawork Mode Activated")).toBe(false)
  })

  test("does not inject lightweight execution bias for mid-sentence mentions", async () => {
    // #given
    const args = createMockHandlerArgs()
    const handler = createChatMessageHandler(args)
    const input = createMockInput("sisyphus", { providerID: "openai", modelID: "gpt-5.4" })
    const output: ChatMessageHandlerOutput = {
      message: {},
      parts: [{ type: "text", text: "why is ulw mode gone in this fork" }],
    }

    // #when
    await handler(input, output)

    // #then
    expect(output.parts[0].text).not.toContain("[SYSTEM DIRECTIVE: OCO - EXECUTION BIAS]")
  })

  test("does not activate retired ultrawork mode when ulw is prefixed after whitespace", async () => {
    // #given
    const args = createMockHandlerArgs()
    const handler = createChatMessageHandler(args)
    const input = createMockInput("sisyphus", { providerID: "openai", modelID: "gpt-5.4" })
    const output: ChatMessageHandlerOutput = {
      message: {},
      parts: [{ type: "text", text: "\n  ulw fix the failing tests" }],
    }

    // #when
    await handler(input, output)

    // #then
    expect(output.parts).toHaveLength(1)
    expect(output.parts[0].text).toBe("\n  ulw fix the failing tests")
  })

  test("does not inject lightweight execution bias into image-only prompts", async () => {
    // #given
    const args = createMockHandlerArgs()
    const handler = createChatMessageHandler(args)
    const input = createMockInput("sisyphus", { providerID: "openai", modelID: "gpt-5.4" })
    const output: ChatMessageHandlerOutput = {
      message: {},
      parts: [{ type: "image", mime: "image/png" }],
    }

    // #when
    await handler(input, output)

    // #then
    expect(output.parts).toHaveLength(1)
    expect(output.parts[0].type).toBe("image")
  })

  test("does not inject hidden internal prompt content for bare ulw", async () => {
    // #given
    const args = createMockHandlerArgs()
    const handler = createChatMessageHandler(args)
    const input = createMockInput("sisyphus", { providerID: "openai", modelID: "gpt-5.4" })
    const output: ChatMessageHandlerOutput = {
      message: {},
      parts: [{ type: "text", text: "ulw" }],
    }

    // #when
    await handler(input, output)

    // #then
    expect(output.parts).toHaveLength(1)
    expect(output.parts[0].text).toBe("ulw")
    expect(output.parts[0].text).not.toContain("OCO_INTERNAL_INITIATOR")
  })

  test("does not inject lightweight execution bias for non-Sisyphus agents", async () => {
    // #given
    const args = createMockHandlerArgs()
    const handler = createChatMessageHandler(args)
    const input = createMockInput("oracle", { providerID: "openai", modelID: "gpt-5.4" })
    const output: ChatMessageHandlerOutput = {
      message: {},
      parts: [{ type: "text", text: "ulw inspect this regression" }],
    }

    // #when
    await handler(input, output)

    // #then
    expect(output.parts).toHaveLength(1)
    expect(output.parts[0].text).toBe("ulw inspect this regression")
    expect(args._toastCalls.some((call) => call.body.title === "Ultrawork Mode Activated")).toBe(false)
  })

  test("injects configured reasoningEffort for the active agent", async () => {
    // #given
    const args = createMockHandlerArgs({
      pluginConfig: {
        agents: {
          sisyphus: { reasoningEffort: "high" },
        },
      },
    })
    const handler = createChatMessageHandler(args)
    const input = createMockInput("sisyphus", { providerID: "openai", modelID: "gpt-5.4" })
    const output = createMockOutput()

    // #when
    await handler(input, output)

    // #then
    expect(output.message["reasoningEffort"]).toBe("high")
  })

  test("preserves existing reasoningEffort when already present", async () => {
    // #given
    const args = createMockHandlerArgs({
      pluginConfig: {
        agents: {
          sisyphus: { reasoningEffort: "high" },
        },
      },
    })
    const handler = createChatMessageHandler(args)
    const input = createMockInput("sisyphus", { providerID: "openai", modelID: "gpt-5.4" })
    const output: ChatMessageHandlerOutput = {
      message: { reasoningEffort: "xhigh" },
      parts: [],
    }

    // #when
    await handler(input, output)

    // #then
    expect(output.message["reasoningEffort"]).toBe("xhigh")
  })
})
