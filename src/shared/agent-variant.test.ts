import { describe, expect, test } from "bun:test"
import type { OpenCodeCodexOrchConfig } from "../config"
import { applyAgentVariant, resolveAgentVariant, resolveVariantForModel } from "./agent-variant"

describe("resolveAgentVariant", () => {
  test("returns undefined when agent name missing", () => {
    // given
    const config = {} as OpenCodeCodexOrchConfig

    // when
    const variant = resolveAgentVariant(config)

    // then
    expect(variant).toBeUndefined()
  })

  test("returns agent override variant", () => {
    // given
    const config = {
      agents: {
        orchestrator: { variant: "low" },
      },
    } as OpenCodeCodexOrchConfig

    // when
    const variant = resolveAgentVariant(config, "orchestrator")

    // then
    expect(variant).toBe("low")
  })

  test("returns category variant when agent uses category", () => {
    // given
    const config = {
      agents: {
        orchestrator: { category: "deep" },
      },
      categories: {
        deep: { model: "openai/gpt-5.4", variant: "high" },
      },
    } as OpenCodeCodexOrchConfig

    // when
    const variant = resolveAgentVariant(config, "orchestrator")

    // then
    expect(variant).toBe("high")
  })
})

describe("applyAgentVariant", () => {
  test("sets variant when message is undefined", () => {
    // given
    const config = {
      agents: {
        orchestrator: { variant: "low" },
      },
    } as OpenCodeCodexOrchConfig
    const message: { variant?: string } = {}

    // when
    applyAgentVariant(config, "orchestrator", message)

    // then
    expect(message.variant).toBe("low")
  })

  test("does not override existing variant", () => {
    // given
    const config = {
      agents: {
        orchestrator: { variant: "low" },
      },
    } as OpenCodeCodexOrchConfig
    const message = { variant: "max" }

    // when
    applyAgentVariant(config, "orchestrator", message)

    // then
    expect(message.variant).toBe("max")
  })
})

describe("resolveVariantForModel", () => {
  test("returns agent override variant when configured", () => {
    // given - use a model in orchestrator chain (claude-opus-4-6 has default variant "max")
    // to verify override takes precedence over fallback chain
    const config = {
      agents: {
        orchestrator: { variant: "high" },
      },
    } as OpenCodeCodexOrchConfig
    const model = { providerID: "anthropic", modelID: "claude-opus-4-6" }

    // when
    const variant = resolveVariantForModel(config, "orchestrator", model)

    // then
    expect(variant).toBe("high")
  })

  test("returns correct variant for anthropic provider", () => {
    // given
    const config = {} as OpenCodeCodexOrchConfig
    const model = { providerID: "anthropic", modelID: "claude-opus-4-6" }

    // when
    const variant = resolveVariantForModel(config, "orchestrator", model)

    // then
    expect(variant).toBe("max")
  })

  test("returns medium for openai/gpt-5.4 in orchestrator chain", () => {
    // #given openai/gpt-5.4 is now in orchestrator fallback chain with variant medium
    const config = {} as OpenCodeCodexOrchConfig
    const model = { providerID: "openai", modelID: "gpt-5.4" }

    // when
    const variant = resolveVariantForModel(config, "orchestrator", model)

    // then
    expect(variant).toBe("medium")
  })

  test("returns undefined for provider not in chain", () => {
    // given
    const config = {} as OpenCodeCodexOrchConfig
    const model = { providerID: "unknown-provider", modelID: "some-model" }

    // when
    const variant = resolveVariantForModel(config, "orchestrator", model)

    // then
    expect(variant).toBeUndefined()
  })

  test("returns undefined for unknown agent", () => {
    // given
    const config = {} as OpenCodeCodexOrchConfig
    const model = { providerID: "anthropic", modelID: "claude-opus-4-6" }

    // when
    const variant = resolveVariantForModel(config, "nonexistent-agent", model)

    // then
    expect(variant).toBeUndefined()
  })

  test("returns variant for zai-coding-plan provider without variant", () => {
    // given
    const config = {} as OpenCodeCodexOrchConfig
    const model = { providerID: "zai-coding-plan", modelID: "glm-5" }

    // when
    const variant = resolveVariantForModel(config, "orchestrator", model)

    // then
    expect(variant).toBeUndefined()
  })

  test("falls back to category chain when agent has no requirement", () => {
    // given
    const config = {
      agents: {
        "custom-agent": { category: "deep" },
      },
    } as OpenCodeCodexOrchConfig
    const model = { providerID: "openai", modelID: "gpt-5.3-codex" }

    // when
    const variant = resolveVariantForModel(config, "custom-agent", model)

    // then
    expect(variant).toBe("medium")
  })

  test("returns correct variant for oracle agent with openai", () => {
    // given
    const config = {} as OpenCodeCodexOrchConfig
    const model = { providerID: "openai", modelID: "gpt-5.4" }

    // when
    const variant = resolveVariantForModel(config, "oracle", model)

    // then
    expect(variant).toBe("high")
  })

  test("returns correct variant for oracle agent with anthropic", () => {
    // given
    const config = {} as OpenCodeCodexOrchConfig
    const model = { providerID: "anthropic", modelID: "claude-opus-4-6" }

    // when
    const variant = resolveVariantForModel(config, "oracle", model)

    // then
    expect(variant).toBe("max")
  })
})
