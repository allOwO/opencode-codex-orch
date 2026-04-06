/// <reference types="bun-types" />

import { describe, expect, test, beforeEach, afterEach, spyOn } from "bun:test"
import {
  applyUltraworkModelOverrideOnMessage,
  resolveUltraworkOverride,
  detectUltrawork,
} from "./ultrawork-model-override"
import * as sharedModule from "../shared"
import * as dbOverrideModule from "./ultrawork-db-model-override"
import * as sessionStateModule from "../features/claude-code-session-state"

describe("detectUltrawork", () => {
  test("returns false for retired ultrawork keyword", () => {
    expect(detectUltrawork("ultrawork do something")).toBe(false)
  })

  test("returns false for retired ulw keyword", () => {
    expect(detectUltrawork("ulw fix the bug")).toBe(false)
  })

  test("returns false for retired ultrawork keyword regardless of case", () => {
    expect(detectUltrawork("ULTRAWORK do something")).toBe(false)
  })

  test("should not detect in code blocks", () => {
    const textWithCodeBlock = [
      "check this:",
      "```",
      "ultrawork mode",
      "```",
    ].join("\n")
    expect(detectUltrawork(textWithCodeBlock)).toBe(false)
  })

  test("should not detect in inline code", () => {
    expect(detectUltrawork("the `ultrawork` mode is cool")).toBe(false)
  })

  test("should not detect when keyword absent", () => {
    expect(detectUltrawork("just do something normal")).toBe(false)
  })
})

describe("resolveUltraworkOverride", () => {
  function createOutput(text: string, agentName?: string) {
    return {
      message: {
        ...(agentName ? { agent: agentName } : {}),
      } as Record<string, unknown>,
      parts: [{ type: "text", text }],
    }
  }

  function createConfig(agentName: string, ultrawork: { model?: string; variant?: string }) {
    return {
      agents: {
        [agentName]: { ultrawork },
      },
    } as unknown as Parameters<typeof resolveUltraworkOverride>[0]
  }

  test("returns null for retired ultrawork overrides even when keyword is detected", () => {
    //#given
    const config = createConfig("sisyphus", { model: "anthropic/claude-opus-4-6", variant: "max" })
    const output = createOutput("ultrawork do something")

    //#when
    const result = resolveUltraworkOverride(config, "sisyphus", output)

    //#then
    expect(result).toBeNull()
  })

  test("should return null when no keyword detected", () => {
    //#given
    const config = createConfig("sisyphus", { model: "anthropic/claude-opus-4-6" })
    const output = createOutput("just do something normal")

    //#when
    const result = resolveUltraworkOverride(config, "sisyphus", output)

    //#then
    expect(result).toBeNull()
  })

  test("should return null when ultrawork is only mentioned mid-sentence", () => {
    //#given
    const config = createConfig("sisyphus", { model: "anthropic/claude-opus-4-6" })
    const output = createOutput("why is ultrawork mode gone in this fork")

    //#when
    const result = resolveUltraworkOverride(config, "sisyphus", output)

    //#then
    expect(result).toBeNull()
  })

  test("should return null for bare ulw prefix", () => {
    //#given
    const config = createConfig("sisyphus", { model: "anthropic/claude-opus-4-6" })
    const output = createOutput("ulw")

    //#when
    const result = resolveUltraworkOverride(config, "sisyphus", output)

    //#then
    expect(result).toBeNull()
  })

  test("should return null when agent name is undefined", () => {
    //#given
    const config = createConfig("sisyphus", { model: "anthropic/claude-opus-4-6" })
    const output = createOutput("ultrawork do something")

    //#when
    const result = resolveUltraworkOverride(config, undefined, output)

    //#then
    expect(result).toBeNull()
  })

  test("returns null when using message.agent after ultrawork retirement", () => {
    //#given
    const config = createConfig("sisyphus", { model: "anthropic/claude-opus-4-6" })
    const output = createOutput("ultrawork do something", "sisyphus")

    //#when
    const result = resolveUltraworkOverride(config, undefined, output)

    //#then
    expect(result).toBeNull()
  })

  test("should return null when agents config is missing", () => {
    //#given
    const config = {} as Parameters<typeof resolveUltraworkOverride>[0]
    const output = createOutput("ultrawork do something")

    //#when
    const result = resolveUltraworkOverride(config, "sisyphus", output)

    //#then
    expect(result).toBeNull()
  })

  test("should return null when agent has no ultrawork config", () => {
    //#given
    const config = {
      agents: { sisyphus: { model: "anthropic/claude-sonnet-4-6" } },
    } as unknown as Parameters<typeof resolveUltraworkOverride>[0]
    const output = createOutput("ultrawork do something")

    //#when
    const result = resolveUltraworkOverride(config, "sisyphus", output)

    //#then
    expect(result).toBeNull()
  })

  test("returns null for variant-only ultrawork override after retirement", () => {
    //#given
    const config = createConfig("sisyphus", { variant: "max" })
    const output = createOutput("ultrawork do something")

    //#when
    const result = resolveUltraworkOverride(config, "sisyphus", output)

    //#then
    expect(result).toBeNull()
  })

  test("returns null even when retired ultrawork config has multi-slash model", () => {
    //#given
    const config = createConfig("sisyphus", { model: "openai/gpt-5.3/codex" })
    const output = createOutput("ultrawork do something")

    //#when
    const result = resolveUltraworkOverride(config, "sisyphus", output)

    //#then
    expect(result).toBeNull()
  })

  test("should return null when model string has no slash", () => {
    //#given
    const config = createConfig("sisyphus", { model: "just-a-model" })
    const output = createOutput("ultrawork do something")

    //#when
    const result = resolveUltraworkOverride(config, "sisyphus", output)

    //#then
    expect(result).toBeNull()
  })

  test("returns null for legacy display names after ultrawork retirement", () => {
    //#given
    const config = createConfig("sisyphus", { model: "anthropic/claude-opus-4-6", variant: "max" })
    const output = createOutput("ulw do something")

    //#when
    const result = resolveUltraworkOverride(config, "Sisyphus (Ultraworker)", output)

    //#then
    expect(result).toBeNull()
  })

  test("returns null for joined text parts after ultrawork retirement", () => {
    //#given
    const config = createConfig("sisyphus", { model: "anthropic/claude-opus-4-6" })
    const output = {
      message: {} as Record<string, unknown>,
      parts: [
        { type: "text", text: "ulw" },
        { type: "image", text: undefined },
        { type: "text", text: " fix the bug" },
      ],
    }

    //#when
    const result = resolveUltraworkOverride(config, "sisyphus", output)

    //#then
    expect(result).toBeNull()
  })

  test("returns null without consulting session agent after ultrawork retirement", () => {
    //#given
    const config = createConfig("sisyphus", { model: "anthropic/claude-opus-4-6", variant: "max" })
    const output = createOutput("ultrawork do something")
    const getSessionAgentSpy = spyOn(sessionStateModule, "getSessionAgent").mockReturnValue("sisyphus")

    //#when
    const result = resolveUltraworkOverride(config, undefined, output, "ses_test")

    //#then
    expect(getSessionAgentSpy).not.toHaveBeenCalled()
    expect(result).toBeNull()

    getSessionAgentSpy.mockRestore()
  })
})

describe("applyUltraworkModelOverrideOnMessage", () => {
  let logSpy: ReturnType<typeof spyOn>
  let dbOverrideSpy: ReturnType<typeof spyOn>

  beforeEach(() => {
    logSpy = spyOn(sharedModule, "log").mockImplementation(() => {})
    dbOverrideSpy = spyOn(dbOverrideModule, "scheduleDeferredModelOverride").mockImplementation(() => {})
  })

  afterEach(() => {
    logSpy?.mockRestore()
    dbOverrideSpy?.mockRestore()
  })

  function createMockTui() {
    return {
      showToast: async () => {},
    }
  }

  function createOutput(
    text: string,
    options?: {
      existingModel?: { providerID: string; modelID: string }
      agentName?: string
      messageId?: string
    },
  ) {
    return {
      message: {
        ...(options?.existingModel ? { model: options.existingModel } : {}),
        ...(options?.agentName ? { agent: options.agentName } : {}),
        ...(options?.messageId ? { id: options.messageId } : {}),
      } as Record<string, unknown>,
      parts: [{ type: "text", text }],
    }
  }

  function createConfig(agentName: string, ultrawork: { model?: string; variant?: string }) {
    return {
      agents: {
        [agentName]: { ultrawork },
      },
    } as unknown as Parameters<typeof applyUltraworkModelOverrideOnMessage>[0]
  }

  test("does not schedule deferred DB override when ultrawork is retired", () => {
    //#given
    const config = createConfig("sisyphus", { model: "anthropic/claude-opus-4-6", variant: "max" })
    const output = createOutput("ultrawork do something", { messageId: "msg_123" })
    const tui = createMockTui()

    //#when
    applyUltraworkModelOverrideOnMessage(config, "sisyphus", output, tui)

    //#then
    expect(dbOverrideSpy).not.toHaveBeenCalled()
  })

  test("does not apply retired ultrawork variant override on deferred path", () => {
    //#given
    const config = createConfig("sisyphus", {
      model: "anthropic/claude-opus-4-6",
      variant: "extended",
    })
    const output = createOutput("ultrawork do something", { messageId: "msg_123" })
    output.message["variant"] = "max"
    output.message["thinking"] = "max"
    const tui = createMockTui()

    //#when
    applyUltraworkModelOverrideOnMessage(config, "sisyphus", output, tui)

    //#then
    expect(dbOverrideSpy).not.toHaveBeenCalled()
    expect(output.message["variant"]).toBe("max")
    expect(output.message["thinking"]).toBe("max")
  })

  test("should NOT mutate output.message.model when message ID present", () => {
    //#given
    const sonnetModel = { providerID: "anthropic", modelID: "claude-sonnet-4-6" }
    const config = createConfig("sisyphus", { model: "anthropic/claude-opus-4-6" })
    const output = createOutput("ultrawork do something", {
      existingModel: sonnetModel,
      messageId: "msg_123",
    })
    const tui = createMockTui()

    //#when
    applyUltraworkModelOverrideOnMessage(config, "sisyphus", output, tui)

    //#then
    expect(output.message.model).toEqual(sonnetModel)
  })

  test("does not fall back to direct mutation when ultrawork is retired", () => {
    //#given
    const config = createConfig("sisyphus", { model: "anthropic/claude-opus-4-6", variant: "max" })
    const output = createOutput("ultrawork do something")
    const tui = createMockTui()

    //#when
    applyUltraworkModelOverrideOnMessage(config, "sisyphus", output, tui)

    //#then
    expect(output.message.model).toBeUndefined()
    expect(output.message["variant"]).toBeUndefined()
    expect(dbOverrideSpy).not.toHaveBeenCalled()
  })

  test("does not apply variant-only ultrawork override when retired", () => {
    //#given
    const config = createConfig("sisyphus", { variant: "high" })
    const output = createOutput("ultrawork do something")
    const tui = createMockTui()

    //#when
    applyUltraworkModelOverrideOnMessage(config, "sisyphus", output, tui)

    //#then
    expect(output.message.model).toBeUndefined()
    expect(output.message["variant"]).toBeUndefined()
    expect(dbOverrideSpy).not.toHaveBeenCalled()
  })

  test("should not apply override when no keyword detected", () => {
    //#given
    const config = createConfig("sisyphus", { model: "anthropic/claude-opus-4-6" })
    const output = createOutput("just do something normal", { messageId: "msg_123" })
    const tui = createMockTui()

    //#when
    applyUltraworkModelOverrideOnMessage(config, "sisyphus", output, tui)

    //#then
    expect(dbOverrideSpy).not.toHaveBeenCalled()
  })

  test("does not log retired ultrawork model transitions", () => {
    //#given
    const config = createConfig("sisyphus", { model: "anthropic/claude-opus-4-6" })
    const existingModel = { providerID: "anthropic", modelID: "claude-sonnet-4-6" }
    const output = createOutput("ultrawork do something", {
      existingModel,
      messageId: "msg_123",
    })
    const tui = createMockTui()

    //#when
    applyUltraworkModelOverrideOnMessage(config, "sisyphus", output, tui)

    //#then
    expect(logSpy).not.toHaveBeenCalled()
  })

  test("does not call showToast for retired ultrawork override", () => {
    //#given
    const config = createConfig("sisyphus", { model: "anthropic/claude-opus-4-6" })
    const output = createOutput("ultrawork do something", { messageId: "msg_123" })
    let toastCalled = false
    const tui = {
      showToast: async () => {
        toastCalled = true
      },
    }

    //#when
    applyUltraworkModelOverrideOnMessage(config, "sisyphus", output, tui)

    //#then
    expect(toastCalled).toBe(false)
  })

  test("does not resolve legacy display name into retired ultrawork override", () => {
    //#given
    const config = createConfig("sisyphus", { model: "anthropic/claude-opus-4-6", variant: "max" })
    const output = createOutput("ulw do something", { messageId: "msg_123" })
    const tui = createMockTui()

    //#when
    applyUltraworkModelOverrideOnMessage(config, "Sisyphus (Ultraworker)", output, tui)

    //#then
    expect(dbOverrideSpy).not.toHaveBeenCalled()
  })

  test("should skip override trigger when current model already matches ultrawork model", () => {
    //#given
    const config = createConfig("sisyphus", { model: "anthropic/claude-opus-4-6", variant: "max" })
    const output = createOutput("ultrawork do something", {
      existingModel: { providerID: "anthropic", modelID: "claude-opus-4-6" },
      messageId: "msg_123",
    })
    let toastCalled = false
    const tui = {
      showToast: async () => {
        toastCalled = true
      },
    }

    //#when
    applyUltraworkModelOverrideOnMessage(config, "sisyphus", output, tui)

    //#then
    expect(dbOverrideSpy).not.toHaveBeenCalled()
    expect(toastCalled).toBe(false)
  })
})
