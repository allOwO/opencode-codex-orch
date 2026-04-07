import type { PluginInput } from "@opencode-ai/plugin"
import { tmpdir } from "node:os"
import { BackgroundManager } from "./manager"
import type { BackgroundTask } from "./types"

const { describe, test, expect } = require("bun:test")

describe("BackgroundManager model settings propagation", () => {
  test("launch forwards category model settings to prompt body", async () => {
    //#given
    const promptCalls: Array<{ body: Record<string, unknown> }> = []
    const client = {
      session: {
        get: async () => ({ data: { directory: tmpdir() } }),
        create: async () => ({ data: { id: "ses_child_1" } }),
        prompt: async () => ({}),
        promptAsync: async (args: { body: Record<string, unknown> }) => {
          promptCalls.push(args)
          return {}
        },
        abort: async () => ({}),
        status: async () => ({ data: {} }),
        messages: async () => ({ data: [] }),
      },
    }
    const manager = new BackgroundManager({ client, directory: tmpdir() } as unknown as PluginInput)

    //#when
    await manager.launch({
      description: "settings launch",
      prompt: "test",
      agent: "executor",
      parentSessionID: "ses_parent",
      parentMessageID: "msg_parent",
      model: {
        providerID: "openai",
        modelID: "gpt-5.3-codex",
        variant: "high",
        temperature: 0.2,
        top_p: 0.7,
        maxTokens: 12345,
        thinking: { type: "enabled", budgetTokens: 2222 },
        reasoningEffort: "high",
        textVerbosity: "high",
      },
    })

    let attempts = 0
    while (promptCalls.length === 0 && attempts < 20) {
      await new Promise(resolve => setTimeout(resolve, 5))
      attempts += 1
    }

    //#then
    expect(promptCalls.length).toBeGreaterThanOrEqual(1)
    const body = promptCalls[0].body
    expect(body.model).toEqual({ providerID: "openai", modelID: "gpt-5.3-codex" })
    expect(body.variant).toBe("high")
    expect(body.temperature).toBe(0.2)
    expect(body.top_p).toBe(0.7)
    expect(body.maxTokens).toBe(12345)
    expect(body.thinking).toEqual({ type: "enabled", budgetTokens: 2222 })
    expect(body.reasoningEffort).toBe("high")
    expect(body.textVerbosity).toBe("high")

    manager.shutdown()
  })

  test("resume forwards persisted category model settings to prompt body", async () => {
    //#given
    const promptCalls: Array<{ body: Record<string, unknown> }> = []
    const client = {
      session: {
        prompt: async () => ({}),
        promptAsync: async (args: { body: Record<string, unknown> }) => {
          promptCalls.push(args)
          return {}
        },
        abort: async () => ({}),
      },
    }
    const manager = new BackgroundManager({ client, directory: tmpdir() } as unknown as PluginInput)

    const existingTask: BackgroundTask = {
      id: "task-settings-resume",
      sessionID: "ses_child_2",
      parentSessionID: "ses_parent",
      parentMessageID: "msg_parent",
      description: "settings resume",
      prompt: "old",
      agent: "executor",
      status: "completed",
      startedAt: new Date(),
      completedAt: new Date(),
      concurrencyGroup: "executor",
      model: {
        providerID: "openai",
        modelID: "gpt-5.3-codex",
        variant: "high",
        temperature: 0.2,
        top_p: 0.7,
        maxTokens: 12345,
        thinking: { type: "enabled", budgetTokens: 2222 },
        reasoningEffort: "high",
        textVerbosity: "high",
      },
    }

    const taskStore = (manager as unknown as { tasks: Map<string, BackgroundTask> }).tasks
    taskStore.set(existingTask.id, existingTask)

    //#when
    await manager.resume({
      sessionId: "ses_child_2",
      prompt: "continue",
      parentSessionID: "ses_parent_2",
      parentMessageID: "msg_parent_2",
    })

    //#then
    expect(promptCalls).toHaveLength(1)
    const body = promptCalls[0].body
    expect(body.model).toEqual({ providerID: "openai", modelID: "gpt-5.3-codex" })
    expect(body.variant).toBe("high")
    expect(body.temperature).toBe(0.2)
    expect(body.top_p).toBe(0.7)
    expect(body.maxTokens).toBe(12345)
    expect(body.thinking).toEqual({ type: "enabled", budgetTokens: 2222 })
    expect(body.reasoningEffort).toBe("high")
    expect(body.textVerbosity).toBe("high")

    manager.shutdown()
  })
})
