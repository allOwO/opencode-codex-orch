const { describe, test, expect, mock } = require("bun:test")
const { sendSyncPrompt } = require("./sync-prompt-sender")

describe("sendSyncPrompt category model settings propagation", () => {
  test("forwards category runtime model settings to prompt body", async () => {
    //#given
    let promptArgs: { body: Record<string, unknown> } | undefined
    const promptWithModelSuggestionRetry = mock(async (_client: unknown, args: { body: Record<string, unknown> }) => {
      promptArgs = args
    })

    const input = {
      sessionID: "test-session",
      agentToUse: "sisyphus-junior",
      args: {
        description: "test task",
        prompt: "test prompt",
        category: "deep",
        run_in_background: false,
        load_skills: [],
      },
      systemContent: undefined,
      categoryModel: {
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
      toastManager: null,
      taskId: undefined,
    }

    //#when
    await sendSyncPrompt(
      { session: { promptAsync: mock(async () => ({ data: {} })) } },
      input,
      {
        promptWithModelSuggestionRetry,
        promptSyncWithModelSuggestionRetry: mock(async () => ({})),
      },
    )

    //#then
    expect(promptArgs?.body.model).toEqual({ providerID: "openai", modelID: "gpt-5.3-codex" })
    expect(promptArgs?.body.variant).toBe("high")
    expect(promptArgs?.body.temperature).toBe(0.2)
    expect(promptArgs?.body.top_p).toBe(0.7)
    expect(promptArgs?.body.maxTokens).toBe(12345)
    expect(promptArgs?.body.thinking).toEqual({ type: "enabled", budgetTokens: 2222 })
    expect(promptArgs?.body.reasoningEffort).toBe("high")
    expect(promptArgs?.body.textVerbosity).toBe("high")
  })
})
