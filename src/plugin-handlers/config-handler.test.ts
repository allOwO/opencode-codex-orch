/// <reference types="bun-types" />

import { describe, test, expect, spyOn, beforeEach, afterEach } from "bun:test"
import { resolveCategoryConfig, createConfigHandler } from "./config-handler"
import type { CategoryConfig } from "../config/schema"
import type { OpenCodeCodexOrchConfig } from "../config"
import { getAgentDisplayName } from "../shared/agent-display-names"

import * as agents from "../agents"
import * as sisyphusJunior from "../agents/sisyphus-junior"
import * as commandLoader from "../features/claude-code-command-loader"
import * as builtinCommands from "../features/builtin-commands"
import * as skillLoader from "../features/opencode-skill-loader"
import * as agentLoader from "../features/claude-code-agent-loader"
import * as mcpLoader from "../features/claude-code-mcp-loader"
import * as pluginLoader from "../features/claude-code-plugin-loader"
import * as mcpModule from "../mcp"
import * as shared from "../shared"
import * as configDir from "../shared/opencode-config-dir"
import * as permissionCompat from "../shared/permission-compat"
import * as modelResolver from "../shared/model-resolver"

beforeEach(() => {
  spyOn(agents, "createBuiltinAgents" as any).mockResolvedValue({
    sisyphus: { name: "sisyphus", prompt: "test", mode: "primary" },
    oracle: { name: "oracle", prompt: "test", mode: "subagent" },
  })

  spyOn(commandLoader, "loadUserCommands" as any).mockResolvedValue({})
  spyOn(commandLoader, "loadProjectCommands" as any).mockResolvedValue({})
  spyOn(commandLoader, "loadOpencodeGlobalCommands" as any).mockResolvedValue({})
  spyOn(commandLoader, "loadOpencodeProjectCommands" as any).mockResolvedValue({})

  spyOn(builtinCommands, "loadBuiltinCommands" as any).mockReturnValue({})

  spyOn(skillLoader, "loadUserSkills" as any).mockResolvedValue({})
  spyOn(skillLoader, "loadProjectSkills" as any).mockResolvedValue({})
  spyOn(skillLoader, "loadOpencodeGlobalSkills" as any).mockResolvedValue({})
  spyOn(skillLoader, "loadOpencodeProjectSkills" as any).mockResolvedValue({})
  spyOn(skillLoader, "discoverUserClaudeSkills" as any).mockResolvedValue([])
  spyOn(skillLoader, "discoverProjectClaudeSkills" as any).mockResolvedValue([])
  spyOn(skillLoader, "discoverOpencodeGlobalSkills" as any).mockResolvedValue([])
  spyOn(skillLoader, "discoverOpencodeProjectSkills" as any).mockResolvedValue([])

  spyOn(agentLoader, "loadUserAgents" as any).mockReturnValue({})
  spyOn(agentLoader, "loadProjectAgents" as any).mockReturnValue({})

  spyOn(mcpLoader, "loadMcpConfigs" as any).mockResolvedValue({ servers: {} })

  spyOn(pluginLoader, "loadAllPluginComponents" as any).mockResolvedValue({
    commands: {},
    agents: {},
    mcpServers: {},
    hooksConfigs: [],
    plugins: [],
    errors: [],
  })

  spyOn(mcpModule, "createBuiltinMcps" as any).mockReturnValue({})

  spyOn(shared, "log" as any).mockImplementation(() => {})
  spyOn(shared, "fetchAvailableModels" as any).mockResolvedValue(new Set(["anthropic/claude-opus-4-6"]))
  spyOn(shared, "readConnectedProvidersCache" as any).mockReturnValue(null)

  spyOn(configDir, "getOpenCodeConfigPaths" as any).mockReturnValue({
    global: "/tmp/.config/opencode",
    project: "/tmp/.opencode",
  })

  spyOn(permissionCompat, "migrateAgentConfig" as any).mockImplementation((config: Record<string, unknown>) => config)

  spyOn(modelResolver, "resolveModelWithFallback" as any).mockReturnValue({ model: "anthropic/claude-opus-4-6" })
})

afterEach(() => {
  (agents.createBuiltinAgents as any)?.mockRestore?.()
  ;(sisyphusJunior.createSisyphusJuniorAgentWithOverrides as any)?.mockRestore?.()
  ;(commandLoader.loadUserCommands as any)?.mockRestore?.()
  ;(commandLoader.loadProjectCommands as any)?.mockRestore?.()
  ;(commandLoader.loadOpencodeGlobalCommands as any)?.mockRestore?.()
  ;(commandLoader.loadOpencodeProjectCommands as any)?.mockRestore?.()
  ;(builtinCommands.loadBuiltinCommands as any)?.mockRestore?.()
  ;(skillLoader.loadUserSkills as any)?.mockRestore?.()
  ;(skillLoader.loadProjectSkills as any)?.mockRestore?.()
  ;(skillLoader.loadOpencodeGlobalSkills as any)?.mockRestore?.()
  ;(skillLoader.loadOpencodeProjectSkills as any)?.mockRestore?.()
  ;(skillLoader.discoverUserClaudeSkills as any)?.mockRestore?.()
  ;(skillLoader.discoverProjectClaudeSkills as any)?.mockRestore?.()
  ;(skillLoader.discoverOpencodeGlobalSkills as any)?.mockRestore?.()
  ;(skillLoader.discoverOpencodeProjectSkills as any)?.mockRestore?.()
  ;(agentLoader.loadUserAgents as any)?.mockRestore?.()
  ;(agentLoader.loadProjectAgents as any)?.mockRestore?.()
  ;(mcpLoader.loadMcpConfigs as any)?.mockRestore?.()
  ;(pluginLoader.loadAllPluginComponents as any)?.mockRestore?.()
  ;(mcpModule.createBuiltinMcps as any)?.mockRestore?.()
  ;(shared.log as any)?.mockRestore?.()
  ;(shared.fetchAvailableModels as any)?.mockRestore?.()
  ;(shared.readConnectedProvidersCache as any)?.mockRestore?.()
  ;(configDir.getOpenCodeConfigPaths as any)?.mockRestore?.()
  ;(permissionCompat.migrateAgentConfig as any)?.mockRestore?.()
  ;(modelResolver.resolveModelWithFallback as any)?.mockRestore?.()
})

describe("Sisyphus-Junior model inheritance", () => {
  test("does not inherit UI-selected model as system default", async () => {
    // #given
    const pluginConfig: OpenCodeCodexOrchConfig = {}
    const config: Record<string, unknown> = {
      model: "opencode/kimi-k2.5-free",
      agent: {},
    }
    const handler = createConfigHandler({
      ctx: { directory: "/tmp" },
      pluginConfig,
      modelCacheState: {
        anthropicContext1MEnabled: false,
        modelContextLimitsCache: new Map(),
      },
    })

    // #when
    await handler(config)

    // #then
    const agentConfig = config.agent as Record<string, { model?: string }>
    expect(agentConfig[getAgentDisplayName("sisyphus-junior")]?.model).toBe(
      sisyphusJunior.SISYPHUS_JUNIOR_DEFAULTS.model
    )
  })

  test("uses explicitly configured sisyphus-junior model", async () => {
    // #given
    const pluginConfig: OpenCodeCodexOrchConfig = {
      agents: {
        "sisyphus-junior": {
          model: "openai/gpt-5.3-codex",
        },
      },
    }
    const config: Record<string, unknown> = {
      model: "opencode/kimi-k2.5-free",
      agent: {},
    }
    const handler = createConfigHandler({
      ctx: { directory: "/tmp" },
      pluginConfig,
      modelCacheState: {
        anthropicContext1MEnabled: false,
        modelContextLimitsCache: new Map(),
      },
    })

    // #when
    await handler(config)

    // #then
    const agentConfig = config.agent as Record<string, { model?: string }>
    expect(agentConfig[getAgentDisplayName("sisyphus-junior")]?.model).toBe(
      "openai/gpt-5.3-codex"
    )
  })
})

describe("retired planning agents", () => {
  test("orders orchestrator before the remaining builtin agents", async () => {
    // #given
    const createBuiltinAgentsMock = agents.createBuiltinAgents as unknown as {
      mockResolvedValue: (value: Record<string, unknown>) => void
    }
    createBuiltinAgentsMock.mockResolvedValue({
      sisyphus: { name: "sisyphus", prompt: "test", mode: "primary" },
      oracle: { name: "oracle", prompt: "test", mode: "subagent" },
    })
    const pluginConfig: OpenCodeCodexOrchConfig = {
      sisyphus_agent: {
        planner_enabled: true,
      },
    }
    const config: Record<string, unknown> = {
      model: "anthropic/claude-opus-4-6",
      agent: {},
    }
    const handler = createConfigHandler({
      ctx: { directory: "/tmp" },
      pluginConfig,
      modelCacheState: {
        anthropicContext1MEnabled: false,
        modelContextLimitsCache: new Map(),
      },
    })

    // #when
    await handler(config)

    // #then
    const keys = Object.keys(config.agent as Record<string, unknown>)
    expect(keys[0]).toBe(getAgentDisplayName("sisyphus"))
    expect(keys).toContain(getAgentDisplayName("sisyphus-junior"))
    expect(keys).toContain(getAgentDisplayName("oracle"))
  })

  test("planner flags no longer demote the plan agent", async () => {
    // #given
    const pluginConfig: OpenCodeCodexOrchConfig = {
      sisyphus_agent: {
        planner_enabled: true,
        replace_plan: true,
      },
    }
    const config: Record<string, unknown> = {
      model: "anthropic/claude-opus-4-6",
      agent: {
        plan: {
          name: "plan",
          mode: "primary",
          prompt: "original plan prompt",
        },
      },
    }
    const handler = createConfigHandler({
      ctx: { directory: "/tmp" },
      pluginConfig,
      modelCacheState: {
        anthropicContext1MEnabled: false,
        modelContextLimitsCache: new Map(),
      },
    })

    // #when
    await handler(config)

    // #then
    const agents = config.agent as Record<string, { mode?: string; name?: string; prompt?: string }>
    expect(agents.plan).toBeDefined()
    expect(agents.plan.mode).toBe("primary")
    expect(agents.plan.prompt).toBe("original plan prompt")
    expect(agents[getAgentDisplayName("prometheus")]).toBeUndefined()
  })

  test("plan agent remains unchanged when planner is disabled", async () => {
    // #given
    const pluginConfig: OpenCodeCodexOrchConfig = {
      sisyphus_agent: {
        planner_enabled: false,
      },
    }
    const config: Record<string, unknown> = {
      model: "anthropic/claude-opus-4-6",
      agent: {
        plan: {
          name: "plan",
          mode: "primary",
          prompt: "original plan prompt",
        },
      },
    }
    const handler = createConfigHandler({
      ctx: { directory: "/tmp" },
      pluginConfig,
      modelCacheState: {
        anthropicContext1MEnabled: false,
        modelContextLimitsCache: new Map(),
      },
    })

    // #when
    await handler(config)

    // #then - plan is not touched, prometheus is not created
    const agents = config.agent as Record<string, { mode?: string; name?: string; prompt?: string }>
    expect(agents[getAgentDisplayName("prometheus")]).toBeUndefined()
    expect(agents.plan).toBeDefined()
    expect(agents.plan.mode).toBe("primary")
    expect(agents.plan.prompt).toBe("original plan prompt")
  })

  test("planner flags do not create a prometheus agent", async () => {
    const pluginConfig: OpenCodeCodexOrchConfig = {
      sisyphus_agent: {
        planner_enabled: true,
      },
    }
    const config: Record<string, unknown> = {
      model: "anthropic/claude-opus-4-6",
      agent: {},
    }
    const handler = createConfigHandler({
      ctx: { directory: "/tmp" },
      pluginConfig,
      modelCacheState: {
        anthropicContext1MEnabled: false,
        modelContextLimitsCache: new Map(),
      },
    })

    await handler(config)

    const agents = config.agent as Record<string, { mode?: string }>
    expect(agents[getAgentDisplayName("prometheus")]).toBeUndefined()
  })
})

describe("default_agent behavior with Sisyphus orchestration", () => {
  test("canonicalizes configured default_agent with surrounding whitespace", async () => {
    // given
    const pluginConfig: OpenCodeCodexOrchConfig = {}
    const config: Record<string, unknown> = {
      model: "anthropic/claude-opus-4-6",
      default_agent: "  prometheus  ",
      agent: {},
    }
    const handler = createConfigHandler({
      ctx: { directory: "/tmp" },
      pluginConfig,
      modelCacheState: {
        anthropicContext1MEnabled: false,
        modelContextLimitsCache: new Map(),
      },
    })

    // when
    await handler(config)

    // then
    expect(config.default_agent).toBe(getAgentDisplayName("prometheus"))
  })

  test("canonicalizes configured default_agent when key uses mixed case", async () => {
    // given
    const pluginConfig: OpenCodeCodexOrchConfig = {}
    const config: Record<string, unknown> = {
      model: "anthropic/claude-opus-4-6",
      default_agent: "PrOmEtHeUs",
      agent: {},
    }
    const handler = createConfigHandler({
      ctx: { directory: "/tmp" },
      pluginConfig,
      modelCacheState: {
        anthropicContext1MEnabled: false,
        modelContextLimitsCache: new Map(),
      },
    })

    // when
    await handler(config)

    // then
    expect(config.default_agent).toBe(getAgentDisplayName("prometheus"))
  })

  test("canonicalizes configured default_agent key to display name", async () => {
    // #given
    const pluginConfig: OpenCodeCodexOrchConfig = {}
    const config: Record<string, unknown> = {
      model: "anthropic/claude-opus-4-6",
      default_agent: "prometheus",
      agent: {},
    }
    const handler = createConfigHandler({
      ctx: { directory: "/tmp" },
      pluginConfig,
      modelCacheState: {
        anthropicContext1MEnabled: false,
        modelContextLimitsCache: new Map(),
      },
    })

    // #when
    await handler(config)

    // #then
    expect(config.default_agent).toBe(getAgentDisplayName("prometheus"))
  })

  test("preserves existing display-name default_agent", async () => {
    // #given
    const pluginConfig: OpenCodeCodexOrchConfig = {}
    const displayName = getAgentDisplayName("prometheus")
    const config: Record<string, unknown> = {
      model: "anthropic/claude-opus-4-6",
      default_agent: displayName,
      agent: {},
    }
    const handler = createConfigHandler({
      ctx: { directory: "/tmp" },
      pluginConfig,
      modelCacheState: {
        anthropicContext1MEnabled: false,
        modelContextLimitsCache: new Map(),
      },
    })

    // #when
    await handler(config)

    // #then
    expect(config.default_agent).toBe(displayName)
  })

  test("sets default_agent to sisyphus when missing", async () => {
    // #given
    const pluginConfig: OpenCodeCodexOrchConfig = {}
    const config: Record<string, unknown> = {
      model: "anthropic/claude-opus-4-6",
      agent: {},
    }
    const handler = createConfigHandler({
      ctx: { directory: "/tmp" },
      pluginConfig,
      modelCacheState: {
        anthropicContext1MEnabled: false,
        modelContextLimitsCache: new Map(),
      },
    })

    // #when
    await handler(config)

    // #then
    expect(config.default_agent).toBe(getAgentDisplayName("sisyphus"))
  })

  test("sets default_agent to sisyphus when configured default_agent is empty after trim", async () => {
    // given
    const pluginConfig: OpenCodeCodexOrchConfig = {}
    const config: Record<string, unknown> = {
      model: "anthropic/claude-opus-4-6",
      default_agent: "    ",
      agent: {},
    }
    const handler = createConfigHandler({
      ctx: { directory: "/tmp" },
      pluginConfig,
      modelCacheState: {
        anthropicContext1MEnabled: false,
        modelContextLimitsCache: new Map(),
      },
    })

    // when
    await handler(config)

    // then
    expect(config.default_agent).toBe(getAgentDisplayName("sisyphus"))
  })

  test("preserves custom default_agent names while trimming whitespace", async () => {
    // given
    const pluginConfig: OpenCodeCodexOrchConfig = {}
    const config: Record<string, unknown> = {
      model: "anthropic/claude-opus-4-6",
      default_agent: "  Custom Agent  ",
      agent: {},
    }
    const handler = createConfigHandler({
      ctx: { directory: "/tmp" },
      pluginConfig,
      modelCacheState: {
        anthropicContext1MEnabled: false,
        modelContextLimitsCache: new Map(),
      },
    })

    // when
    await handler(config)

    // then
    expect(config.default_agent).toBe("Custom Agent")
  })

  test("does not normalize configured default_agent when Sisyphus is disabled", async () => {
    // given
    const pluginConfig: OpenCodeCodexOrchConfig = {
      sisyphus_agent: {
        disabled: true,
      },
    }
    const config: Record<string, unknown> = {
      model: "anthropic/claude-opus-4-6",
      default_agent: "  PrOmEtHeUs  ",
      agent: {},
    }
    const handler = createConfigHandler({
      ctx: { directory: "/tmp" },
      pluginConfig,
      modelCacheState: {
        anthropicContext1MEnabled: false,
        modelContextLimitsCache: new Map(),
      },
    })

    // when
    await handler(config)

    // then
    expect(config.default_agent).toBe("  PrOmEtHeUs  ")
  })
})

describe("Prometheus category config resolution", () => {
  test("resolves deep category config", () => {
    // given
    const categoryName = "deep"

    // when
    const config = resolveCategoryConfig(categoryName)

    // then
    expect(config).toBeDefined()
    expect(config?.model).toBe("openai/gpt-5.3-codex")
    expect(config?.variant).toBe("medium")
  })

  test("resolves visual-engineering category config", () => {
    // given
    const categoryName = "visual-engineering"

    // when
    const config = resolveCategoryConfig(categoryName)

    // then
    expect(config).toBeDefined()
    expect(config?.model).toBe("google/gemini-3.1-pro")
  })

  test("user categories override default categories", () => {
    // given
    const categoryName = "deep"
    const userCategories: Record<string, CategoryConfig> = {
      deep: {
        model: "google/antigravity-claude-opus-4-5-thinking",
        temperature: 0.1,
      },
    }

    // when
    const config = resolveCategoryConfig(categoryName, userCategories)

    // then
    expect(config).toBeDefined()
    expect(config?.model).toBe("google/antigravity-claude-opus-4-5-thinking")
    expect(config?.temperature).toBe(0.1)
  })

  test("returns undefined for unknown category", () => {
    // given
    const categoryName = "nonexistent-category"

    // when
    const config = resolveCategoryConfig(categoryName)

    // then
    expect(config).toBeUndefined()
  })

  test("falls back to default when user category has no entry", () => {
    // given
    const categoryName = "deep"
    const userCategories: Record<string, CategoryConfig> = {
      "visual-engineering": {
        model: "custom/visual-model",
      },
    }

    // when
    const config = resolveCategoryConfig(categoryName, userCategories)

    // then - falls back to DEFAULT_CATEGORIES
    expect(config).toBeDefined()
    expect(config?.model).toBe("openai/gpt-5.3-codex")
    expect(config?.variant).toBe("medium")
  })

  test("preserves all category properties (temperature, top_p, tools, etc.)", () => {
    // given
    const categoryName = "custom-category"
    const userCategories: Record<string, CategoryConfig> = {
      "custom-category": {
        model: "test/model",
        temperature: 0.5,
        top_p: 0.9,
        maxTokens: 32000,
        tools: { tool1: true, tool2: false },
      },
    }

    // when
    const config = resolveCategoryConfig(categoryName, userCategories)

    // then
    expect(config).toBeDefined()
    expect(config?.model).toBe("test/model")
    expect(config?.temperature).toBe(0.5)
    expect(config?.top_p).toBe(0.9)
    expect(config?.maxTokens).toBe(32000)
    expect(config?.tools).toEqual({ tool1: true, tool2: false })
  })
})

describe("retired prometheus config", () => {
  test("ignores prometheus overrides even when categories are configured", async () => {
    const pluginConfig: OpenCodeCodexOrchConfig = {
      sisyphus_agent: {
        planner_enabled: true,
      },
      categories: {
        "test-planning": {
          model: "openai/gpt-5.4",
          reasoningEffort: "xhigh",
        },
      },
      agents: {
        prometheus: {
          category: "test-planning",
          reasoningEffort: "low",
        },
      },
    }
    const config: Record<string, unknown> = {
      model: "anthropic/claude-opus-4-6",
      agent: {},
    }
    const handler = createConfigHandler({
      ctx: { directory: "/tmp" },
      pluginConfig,
      modelCacheState: {
        anthropicContext1MEnabled: false,
        modelContextLimitsCache: new Map(),
      },
    })

    await handler(config)

    const agents = config.agent as Record<string, unknown>
    expect(agents[getAgentDisplayName("prometheus")]).toBeUndefined()
  })
})

describe("plan agent without prometheus", () => {
  test("keeps explicit plan agent configuration intact", async () => {
    const pluginConfig: OpenCodeCodexOrchConfig = {
      sisyphus_agent: {
        planner_enabled: true,
        replace_plan: true,
      },
    }
    const config: Record<string, unknown> = {
      model: "anthropic/claude-opus-4-6",
      agent: {
        plan: {
          name: "plan",
          mode: "primary",
          prompt: "original plan prompt",
        },
      },
    }
    const handler = createConfigHandler({
      ctx: { directory: "/tmp" },
      pluginConfig,
      modelCacheState: {
        anthropicContext1MEnabled: false,
        modelContextLimitsCache: new Map(),
      },
    })

    await handler(config)

    const agents = config.agent as Record<string, { mode?: string; prompt?: string }>
    expect(agents.plan).toBeDefined()
    expect(agents.plan.mode).toBe("primary")
    expect(agents.plan.prompt).toBe("original plan prompt")
    expect(agents[getAgentDisplayName("prometheus") as keyof typeof agents]).toBeUndefined()
  })
})

describe("Deadlock prevention - fetchAvailableModels must not receive client", () => {
  test("handler completes without consulting the OpenCode client during agent loading", async () => {
    const pluginConfig: OpenCodeCodexOrchConfig = {
      sisyphus_agent: {
        planner_enabled: true,
      },
    }
    const config: Record<string, unknown> = {
      model: "anthropic/claude-opus-4-6",
      agent: {},
    }
    const mockClient = {
      provider: { list: () => Promise.resolve({ data: { connected: [] } }) },
      model: { list: () => Promise.resolve({ data: [] }) },
    }
    const providerList = spyOn(mockClient.provider, "list")
    const modelList = spyOn(mockClient.model, "list")
    const handler = createConfigHandler({
      ctx: { directory: "/tmp", client: mockClient },
      pluginConfig,
      modelCacheState: {
        anthropicContext1MEnabled: false,
        modelContextLimitsCache: new Map(),
      },
    })

    // when
    await handler(config)

    expect(providerList).not.toHaveBeenCalled()
    expect(modelList).not.toHaveBeenCalled()
  })
})

describe("config-handler plugin loading error boundary (#1559)", () => {
  test("returns empty defaults when loadAllPluginComponents throws", async () => {
    //#given
    ;(pluginLoader.loadAllPluginComponents as any).mockRestore?.()
    spyOn(pluginLoader, "loadAllPluginComponents" as any).mockRejectedValue(new Error("crash"))
    const pluginConfig: OpenCodeCodexOrchConfig = {}
    const config: Record<string, unknown> = {
      model: "anthropic/claude-opus-4-6",
      agent: {},
    }
    const handler = createConfigHandler({
      ctx: { directory: "/tmp" },
      pluginConfig,
      modelCacheState: {
        anthropicContext1MEnabled: false,
        modelContextLimitsCache: new Map(),
      },
    })

    //#when
    await handler(config)

    //#then
    expect(config.agent).toBeDefined()
  })

  test("returns empty defaults when loadAllPluginComponents times out", async () => {
    //#given
    ;(pluginLoader.loadAllPluginComponents as any).mockRestore?.()
    spyOn(pluginLoader, "loadAllPluginComponents" as any).mockImplementation(
      () => new Promise(() => {})
    )
    const pluginConfig: OpenCodeCodexOrchConfig = {
      experimental: { plugin_load_timeout_ms: 100 },
    }
    const config: Record<string, unknown> = {
      model: "anthropic/claude-opus-4-6",
      agent: {},
    }
    const handler = createConfigHandler({
      ctx: { directory: "/tmp" },
      pluginConfig,
      modelCacheState: {
        anthropicContext1MEnabled: false,
        modelContextLimitsCache: new Map(),
      },
    })

    //#when
    await handler(config)

    //#then
    expect(config.agent).toBeDefined()
  }, 5000)

  test("logs error when loadAllPluginComponents fails", async () => {
    //#given
    ;(pluginLoader.loadAllPluginComponents as any).mockRestore?.()
    spyOn(pluginLoader, "loadAllPluginComponents" as any).mockRejectedValue(new Error("crash"))
    const logSpy = shared.log as ReturnType<typeof spyOn>
    const pluginConfig: OpenCodeCodexOrchConfig = {}
    const config: Record<string, unknown> = {
      model: "anthropic/claude-opus-4-6",
      agent: {},
    }
    const handler = createConfigHandler({
      ctx: { directory: "/tmp" },
      pluginConfig,
      modelCacheState: {
        anthropicContext1MEnabled: false,
        modelContextLimitsCache: new Map(),
      },
    })

    //#when
    await handler(config)

    //#then
    const logCalls = logSpy.mock.calls.map((c: unknown[]) => c[0])
    const hasPluginFailureLog = logCalls.some(
      (msg: string) => typeof msg === "string" && msg.includes("Plugin loading failed")
    )
    expect(hasPluginFailureLog).toBe(true)
  })

  test("passes through plugin data on successful load (identity test)", async () => {
    //#given
    ;(pluginLoader.loadAllPluginComponents as any).mockRestore?.()
    spyOn(pluginLoader, "loadAllPluginComponents" as any).mockResolvedValue({
      commands: { "test-cmd": { description: "test", template: "test" } },
      agents: {},
      mcpServers: {},
      hooksConfigs: [],
      plugins: [{ name: "test-plugin", version: "1.0.0" }],
      errors: [],
    })
    const pluginConfig: OpenCodeCodexOrchConfig = {}
    const config: Record<string, unknown> = {
      model: "anthropic/claude-opus-4-6",
      agent: {},
    }
    const handler = createConfigHandler({
      ctx: { directory: "/tmp" },
      pluginConfig,
      modelCacheState: {
        anthropicContext1MEnabled: false,
        modelContextLimitsCache: new Map(),
      },
    })

    //#when
    await handler(config)

    //#then
    const commands = config.command as Record<string, unknown>
    expect(commands["test-cmd"]).toBeDefined()
  })
})

describe("per-agent todowrite/todoread deny when task_system enabled", () => {
  const AGENTS_WITH_TODO_DENY = new Set([
    getAgentDisplayName("sisyphus"),
    getAgentDisplayName("sisyphus-junior"),
  ])

  test("denies todowrite and todoread for primary agents when task_system is enabled", async () => {
    //#given
    const createBuiltinAgentsMock = agents.createBuiltinAgents as unknown as {
      mockResolvedValue: (value: Record<string, unknown>) => void
    }
    createBuiltinAgentsMock.mockResolvedValue({
      sisyphus: { name: "sisyphus", prompt: "test", mode: "primary" },
      "sisyphus-junior": { name: "sisyphus-junior", prompt: "test", mode: "subagent" },
      oracle: { name: "oracle", prompt: "test", mode: "subagent" },
    })

    const pluginConfig: OpenCodeCodexOrchConfig = {
      experimental: { task_system: true },
    }
    const config: Record<string, unknown> = {
      model: "anthropic/claude-opus-4-6",
      agent: {},
    }
    const handler = createConfigHandler({
      ctx: { directory: "/tmp" },
      pluginConfig,
      modelCacheState: {
        anthropicContext1MEnabled: false,
        modelContextLimitsCache: new Map(),
      },
    })

    //#when
    await handler(config)

    //#then
    const agentResult = config.agent as Record<string, { permission?: Record<string, unknown> }>
    for (const agentName of AGENTS_WITH_TODO_DENY) {
      expect(agentResult[agentName]?.permission?.todowrite).toBe("deny")
      expect(agentResult[agentName]?.permission?.todoread).toBe("deny")
    }
  })

  test("does not deny todowrite/todoread when task_system is disabled", async () => {
    //#given
    const createBuiltinAgentsMock = agents.createBuiltinAgents as unknown as {
      mockResolvedValue: (value: Record<string, unknown>) => void
    }
    createBuiltinAgentsMock.mockResolvedValue({
      sisyphus: { name: "sisyphus", prompt: "test", mode: "primary" },
    })

    const pluginConfig: OpenCodeCodexOrchConfig = {
      experimental: { task_system: false },
    }
    const config: Record<string, unknown> = {
      model: "anthropic/claude-opus-4-6",
      agent: {},
    }
    const handler = createConfigHandler({
      ctx: { directory: "/tmp" },
      pluginConfig,
      modelCacheState: {
        anthropicContext1MEnabled: false,
        modelContextLimitsCache: new Map(),
      },
    })

    //#when
    await handler(config)

    //#then
    const agentResult = config.agent as Record<string, { permission?: Record<string, unknown> }>
    expect(agentResult[getAgentDisplayName("sisyphus")]?.permission?.todowrite).toBeUndefined()
    expect(agentResult[getAgentDisplayName("sisyphus")]?.permission?.todoread).toBeUndefined()
  })

  test("does not deny todowrite/todoread when task_system is undefined", async () => {
    //#given
    const createBuiltinAgentsMock = agents.createBuiltinAgents as unknown as {
      mockResolvedValue: (value: Record<string, unknown>) => void
    }
    createBuiltinAgentsMock.mockResolvedValue({
      sisyphus: { name: "sisyphus", prompt: "test", mode: "primary" },
    })

    const pluginConfig: OpenCodeCodexOrchConfig = {}
    const config: Record<string, unknown> = {
      model: "anthropic/claude-opus-4-6",
      agent: {},
    }
    const handler = createConfigHandler({
      ctx: { directory: "/tmp" },
      pluginConfig,
      modelCacheState: {
        anthropicContext1MEnabled: false,
        modelContextLimitsCache: new Map(),
      },
    })

    //#when
    await handler(config)

    //#then
    const agentResult = config.agent as Record<string, { permission?: Record<string, unknown> }>
    expect(agentResult[getAgentDisplayName("sisyphus")]?.permission?.todowrite).toBeUndefined()
    expect(agentResult[getAgentDisplayName("sisyphus")]?.permission?.todoread).toBeUndefined()
  })
})

describe("disable_oco_env pass-through", () => {
  test("passes disable_oco_env=true to createBuiltinAgents", async () => {
    //#given
    const createBuiltinAgentsMock = agents.createBuiltinAgents as unknown as {
      mockResolvedValue: (value: Record<string, unknown>) => void
      mock: { calls: unknown[][] }
    }
    createBuiltinAgentsMock.mockResolvedValue({
      sisyphus: { name: "sisyphus", prompt: "without-env", mode: "primary" },
    })

    const pluginConfig: OpenCodeCodexOrchConfig = {
      experimental: { disable_oco_env: true },
    }
    const config: Record<string, unknown> = {
      model: "anthropic/claude-opus-4-6",
      agent: {},
    }
    const handler = createConfigHandler({
      ctx: { directory: "/tmp" },
      pluginConfig,
      modelCacheState: {
        anthropicContext1MEnabled: false,
        modelContextLimitsCache: new Map(),
      },
    })

    //#when
    await handler(config)

    //#then
    const lastCall =
      createBuiltinAgentsMock.mock.calls[createBuiltinAgentsMock.mock.calls.length - 1]
    expect(lastCall).toBeDefined()
    expect(lastCall?.[11]).toBe(true)
  })

  test("passes disable_oco_env=false to createBuiltinAgents when omitted", async () => {
    //#given
    const createBuiltinAgentsMock = agents.createBuiltinAgents as unknown as {
      mockResolvedValue: (value: Record<string, unknown>) => void
      mock: { calls: unknown[][] }
    }
    createBuiltinAgentsMock.mockResolvedValue({
      sisyphus: { name: "sisyphus", prompt: "with-env", mode: "primary" },
    })

    const pluginConfig: OpenCodeCodexOrchConfig = {}
    const config: Record<string, unknown> = {
      model: "anthropic/claude-opus-4-6",
      agent: {},
    }
    const handler = createConfigHandler({
      ctx: { directory: "/tmp" },
      pluginConfig,
      modelCacheState: {
        anthropicContext1MEnabled: false,
        modelContextLimitsCache: new Map(),
      },
    })

    //#when
    await handler(config)

    //#then
    const lastCall =
      createBuiltinAgentsMock.mock.calls[createBuiltinAgentsMock.mock.calls.length - 1]
    expect(lastCall).toBeDefined()
    expect(lastCall?.[11]).toBe(false)
  })
})
