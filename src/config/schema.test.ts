import { describe, expect, test } from "bun:test"
import {
  AgentOverrideConfigSchema,
  BrowserAutomationConfigSchema,
  BrowserAutomationProviderSchema,
  BuiltinCategoryNameSchema,
  CategoryConfigSchema,
  ExperimentalConfigSchema,
  HookNameSchema,
  OpenCodeCodexOrchConfigSchema,
} from "./schema"
import { OverridableAgentNameSchema } from "./schema/agent-names"

const retiredOrchestratorKey = ["si", "syphus"].join("")
const retiredOrchestratorAgentKey = [retiredOrchestratorKey, "agent"].join("_")
const retiredExecutorKey = [retiredOrchestratorKey, "junior"].join("-")

describe("disabled_mcps schema", () => {
  test("should accept built-in MCP names", () => {
    // given
    const config = {
      disabled_mcps: ["context7", "grep_app"],
    }

    // when
    const result = OpenCodeCodexOrchConfigSchema.safeParse(config)

    // then
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.disabled_mcps).toEqual(["context7", "grep_app"])
    }
  })

  test("should accept custom MCP names", () => {
    // given
    const config = {
      disabled_mcps: ["playwright", "sqlite", "custom-mcp"],
    }

    // when
    const result = OpenCodeCodexOrchConfigSchema.safeParse(config)

    // then
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.disabled_mcps).toEqual(["playwright", "sqlite", "custom-mcp"])
    }
  })

  test("should accept mixed built-in and custom names", () => {
    // given
    const config = {
      disabled_mcps: ["context7", "playwright", "custom-server"],
    }

    // when
    const result = OpenCodeCodexOrchConfigSchema.safeParse(config)

    // then
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.disabled_mcps).toEqual(["context7", "playwright", "custom-server"])
    }
  })

  test("should accept empty array", () => {
    // given
    const config = {
      disabled_mcps: [],
    }

    // when
    const result = OpenCodeCodexOrchConfigSchema.safeParse(config)

    // then
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.disabled_mcps).toEqual([])
    }
  })

  test("should reject non-string values", () => {
    // given
    const config = {
      disabled_mcps: [123, true, null],
    }

    // when
    const result = OpenCodeCodexOrchConfigSchema.safeParse(config)

    // then
    expect(result.success).toBe(false)
  })

  test("should accept undefined (optional field)", () => {
    // given
    const config = {}

    // when
    const result = OpenCodeCodexOrchConfigSchema.safeParse(config)

    // then
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.disabled_mcps).toBeUndefined()
    }
  })

  test("should reject empty strings", () => {
    // given
    const config = {
      disabled_mcps: [""],
    }

    // when
    const result = OpenCodeCodexOrchConfigSchema.safeParse(config)

    // then
    expect(result.success).toBe(false)
  })

  test("should accept MCP names with various naming patterns", () => {
    // given
    const config = {
      disabled_mcps: [
        "my-custom-mcp",
        "my_custom_mcp",
        "myCustomMcp",
        "my.custom.mcp",
        "my-custom-mcp-123",
      ],
    }

    // when
    const result = OpenCodeCodexOrchConfigSchema.safeParse(config)

    // then
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.disabled_mcps).toEqual([
        "my-custom-mcp",
        "my_custom_mcp",
        "myCustomMcp",
        "my.custom.mcp",
        "my-custom-mcp-123",
      ])
    }
  })
})

describe("AgentOverrideConfigSchema", () => {
  describe("legacy simplification rename surface", () => {
    test("accepts canonical orchestrator and reviewer agent override keys", () => {
      const config = {
        agents: {
          orchestrator: { model: "openai/gpt-5.4" },
          reviewer: { model: "google/gemini-2.5-pro" },
        },
      }

      const result = OpenCodeCodexOrchConfigSchema.safeParse(config)

      expect(result.success).toBe(true)
    })

    test("rejects retired top-level orchestrator config key", () => {
      const config = {
        [retiredOrchestratorKey]: {
          enabled: true,
        },
      }

      const result = OpenCodeCodexOrchConfigSchema.safeParse(config)

      expect(result.success).toBe(false)
    })

    test("rejects retired top-level orchestrator agent config key", () => {
      const config = {
        [retiredOrchestratorAgentKey]: {
          disabled: false,
        },
      }

      const result = OpenCodeCodexOrchConfigSchema.safeParse(config)

      expect(result.success).toBe(false)
    })

    test("accepts canonical orchestrator config keys only", () => {
      const config = {
        orchestrator: {
          tasks: {
            storage_path: ".orchestrator/tasks.json",
          },
        },
        orchestrator_agent: {
          disabled: false,
        },
      }

      const result = OpenCodeCodexOrchConfigSchema.safeParse(config)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.orchestrator?.tasks?.storage_path).toBe(".orchestrator/tasks.json")
        expect(result.data.orchestrator?.tasks?.claude_code_compat).toBe(false)
        expect(result.data.orchestrator_agent).toEqual(config.orchestrator_agent)
      }
    })
  })

  describe("category field", () => {
    test("accepts canonical category names", () => {
      // given
      const config = { category: "designer" }

      // when
      const result = AgentOverrideConfigSchema.safeParse(config)

      // then
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.category).toBe("designer")
      }
    })

    test("rejects legacy category aliases in the public schema", () => {
      const result = AgentOverrideConfigSchema.safeParse({ category: "visual-engineering" })

      expect(result.success).toBe(false)
    })

    test("accepts config without category", () => {
      // given
      const config = { temperature: 0.5 }

      // when
      const result = AgentOverrideConfigSchema.safeParse(config)

      // then
      expect(result.success).toBe(true)
    })

    test("rejects non-string category", () => {
      // given
      const config = { category: 123 }

      // when
      const result = AgentOverrideConfigSchema.safeParse(config)

      // then
      expect(result.success).toBe(false)
    })
  })

  describe("variant field", () => {
    test("accepts variant as optional string", () => {
      // given
      const config = { variant: "high" }

      // when
      const result = AgentOverrideConfigSchema.safeParse(config)

      // then
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.variant).toBe("high")
      }
    })

    test("rejects non-string variant", () => {
      // given
      const config = { variant: 123 }

      // when
      const result = AgentOverrideConfigSchema.safeParse(config)

      // then
      expect(result.success).toBe(false)
    })
  })

  describe("skills field", () => {
    test("accepts skills as optional string array", () => {
      // given
      const config = { skills: ["frontend-ui-ux", "code-reviewer"] }

      // when
      const result = AgentOverrideConfigSchema.safeParse(config)

      // then
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.skills).toEqual(["frontend-ui-ux", "code-reviewer"])
      }
    })

    test("accepts empty skills array", () => {
      // given
      const config = { skills: [] }

      // when
      const result = AgentOverrideConfigSchema.safeParse(config)

      // then
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.skills).toEqual([])
      }
    })

    test("accepts config without skills", () => {
      // given
      const config = { temperature: 0.5 }

      // when
      const result = AgentOverrideConfigSchema.safeParse(config)

      // then
      expect(result.success).toBe(true)
    })

    test("rejects non-array skills", () => {
      // given
      const config = { skills: "frontend-ui-ux" }

      // when
      const result = AgentOverrideConfigSchema.safeParse(config)

      // then
      expect(result.success).toBe(false)
    })
  })

  describe("backward compatibility", () => {
    test("still accepts model field (deprecated)", () => {
      // given
      const config = { model: "openai/gpt-5.4" }

      // when
      const result = AgentOverrideConfigSchema.safeParse(config)

      // then
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.model).toBe("openai/gpt-5.4")
      }
    })

    test("accepts both model and category (deprecated usage)", () => {
      // given - category should take precedence at runtime, but both should validate
      const config = {
        model: "openai/gpt-5.4",
        category: "hard",
      }

      // when
      const result = AgentOverrideConfigSchema.safeParse(config)

      // then
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.model).toBe("openai/gpt-5.4")
        expect(result.data.category).toBe("hard")
      }
    })
  })

  describe("combined fields", () => {
    test("accepts category with skills", () => {
      // given
      const config = {
        category: "designer",
        skills: ["frontend-ui-ux"],
      }

      // when
      const result = AgentOverrideConfigSchema.safeParse(config)

      // then
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.category).toBe("designer")
        expect(result.data.skills).toEqual(["frontend-ui-ux"])
      }
    })

    test("accepts category with skills and other fields", () => {
      // given
      const config = {
        category: "hard",
        skills: ["code-reviewer"],
        temperature: 0.3,
        prompt_append: "Extra instructions",
      }

      // when
      const result = AgentOverrideConfigSchema.safeParse(config)

      // then
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.category).toBe("hard")
        expect(result.data.skills).toEqual(["code-reviewer"])
        expect(result.data.temperature).toBe(0.3)
        expect(result.data.prompt_append).toBe("Extra instructions")
      }
    })
  })
})

describe("CategoryConfigSchema", () => {
  test("accepts variant as optional string", () => {
    // given
    const config = { model: "openai/gpt-5.4", variant: "xhigh" }

    // when
    const result = CategoryConfigSchema.safeParse(config)

    // then
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.variant).toBe("xhigh")
    }
  })

  test("accepts reasoningEffort as optional string with xhigh", () => {
    // given
    const config = { reasoningEffort: "xhigh" }

    // when
    const result = CategoryConfigSchema.safeParse(config)

    // then
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.reasoningEffort).toBe("xhigh")
    }
  })

  test("rejects non-string variant", () => {
    // given
    const config = { model: "openai/gpt-5.4", variant: 123 }

    // when
    const result = CategoryConfigSchema.safeParse(config)

    // then
    expect(result.success).toBe(false)
  })
})

describe("BuiltinCategoryNameSchema", () => {
  test("accepts all builtin category names", () => {
    // given
      const categories = ["designer", "hard", "quick"]

    // when / #then
    for (const cat of categories) {
      const result = BuiltinCategoryNameSchema.safeParse(cat)
      expect(result.success).toBe(true)
    }
  })
})

describe("HookNameSchema", () => {
  test("rejects removed beast-mode-system hook name", () => {
    //#given
    const input = "beast-mode-system"

    //#when
    const result = HookNameSchema.safeParse(input)

    //#then
    expect(result.success).toBe(false)
  })
})

describe("canonical agent override surface", () => {
  test("schema accepts agents['executor'] and retains the canonical key after parsing", () => {
    // given
    const config = {
      agents: {
        executor: {
          model: "openai/gpt-5.4",
          temperature: 0.2,
        },
      },
    }

    // when
    const result = OpenCodeCodexOrchConfigSchema.safeParse(config)

      // then
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.agents?.executor).toBeDefined()
        expect(result.data.agents?.executor?.model).toBe("openai/gpt-5.4")
        expect(result.data.agents?.executor?.temperature).toBe(0.2)
      }
    })

  test("schema rejects retired executor aliases from the public schema surface", () => {
    const config = {
      agents: {
        [retiredExecutorKey]: {
          model: "openai/gpt-5.4",
        },
      },
    }

    const result = OpenCodeCodexOrchConfigSchema.safeParse(config)

    expect(result.success).toBe(false)
  })

  test("schema accepts executor with prompt_append", () => {
    // given
    const config = {
      agents: {
        executor: {
          prompt_append: "Additional instructions for executor",
        },
      },
    }

    // when
    const result = OpenCodeCodexOrchConfigSchema.safeParse(config)

      // then
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.agents?.executor?.prompt_append).toBe("Additional instructions for executor")
      }
    })

  test("schema accepts executor with tools override", () => {
    // given
    const config = {
      agents: {
        executor: {
          tools: {
            read: true,
            write: false,
          },
        },
      },
    }

    // when
    const result = OpenCodeCodexOrchConfigSchema.safeParse(config)

      // then
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.agents?.executor?.tools).toEqual({
          read: true,
          write: false,
        })
    }
  })

  test("schema accepts kept agent names including deepsearch", () => {
    // given
    const config = {
      agents: {
        orchestrator: {
          temperature: 0.1,
        },
        deepsearch: {
          temperature: 0.2,
        },
        reviewer: {
          temperature: 0.3,
        },
      },
    }

    // when
    const result = OpenCodeCodexOrchConfigSchema.safeParse(config)

      // then
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.agents?.orchestrator?.temperature).toBe(0.1)
        expect(result.data.agents?.deepsearch?.temperature).toBe(0.2)
        expect(result.data.agents?.reviewer?.temperature).toBe(0.3)
      }
  })

  test("overridable agent name schema rejects retired agent names", () => {
    expect(OverridableAgentNameSchema.safeParse("metis").success).toBe(false)
    expect(OverridableAgentNameSchema.safeParse("atlas").success).toBe(false)
    expect(OverridableAgentNameSchema.safeParse("prometheus").success).toBe(false)
  })
})

describe("BrowserAutomationProviderSchema", () => {
  test("accepts 'playwright' as valid provider", () => {
    // given
    const input = "playwright"

    // when
    const result = BrowserAutomationProviderSchema.safeParse(input)

    // then
    expect(result.success).toBe(true)
    expect(result.data).toBe("playwright")
  })

  test("accepts 'agent-browser' as valid provider", () => {
    // given
    const input = "agent-browser"

    // when
    const result = BrowserAutomationProviderSchema.safeParse(input)

    // then
    expect(result.success).toBe(true)
    expect(result.data).toBe("agent-browser")
  })

  test("rejects invalid provider", () => {
    // given
    const input = "invalid-provider"

    // when
    const result = BrowserAutomationProviderSchema.safeParse(input)

    // then
    expect(result.success).toBe(false)
  })

  test("accepts 'playwright-cli' as valid provider", () => {
    // given
    const input = "playwright-cli"

    // when
    const result = BrowserAutomationProviderSchema.safeParse(input)

    // then
    expect(result.success).toBe(true)
    expect(result.data).toBe("playwright-cli")
  })
})

describe("BrowserAutomationConfigSchema", () => {
  test("defaults provider to 'playwright' when not specified", () => {
    // given
    const input = {}

    // when
    const result = BrowserAutomationConfigSchema.parse(input)

    // then
    expect(result.provider).toBe("playwright")
  })

  test("accepts agent-browser provider", () => {
    // given
    const input = { provider: "agent-browser" }

    // when
    const result = BrowserAutomationConfigSchema.parse(input)

    // then
    expect(result.provider).toBe("agent-browser")
  })

  test("accepts playwright-cli provider in config", () => {
    // given
    const input = { provider: "playwright-cli" }

    // when
    const result = BrowserAutomationConfigSchema.parse(input)

    // then
    expect(result.provider).toBe("playwright-cli")
  })
})

describe("OpenCodeCodexOrchConfigSchema - browser_automation_engine", () => {
  test("accepts browser_automation_engine config", () => {
    // given
    const input = {
      browser_automation_engine: {
        provider: "agent-browser",
      },
    }

    // when
    const result = OpenCodeCodexOrchConfigSchema.safeParse(input)

    // then
    expect(result.success).toBe(true)
    expect(result.data?.browser_automation_engine?.provider).toBe("agent-browser")
  })

  test("accepts config without browser_automation_engine", () => {
    // given
    const input = {}

    // when
    const result = OpenCodeCodexOrchConfigSchema.safeParse(input)

    // then
    expect(result.success).toBe(true)
    expect(result.data?.browser_automation_engine).toBeUndefined()
  })

  test("accepts browser_automation_engine with playwright-cli", () => {
    // given
    const input = { browser_automation_engine: { provider: "playwright-cli" } }

    // when
    const result = OpenCodeCodexOrchConfigSchema.safeParse(input)

    // then
    expect(result.success).toBe(true)
    expect(result.data?.browser_automation_engine?.provider).toBe("playwright-cli")
  })
})

describe("OpenCodeCodexOrchConfigSchema - hashline_edit", () => {
  test("accepts hashline_edit as true", () => {
    //#given
    const input = { hashline_edit: true }

    //#when
    const result = OpenCodeCodexOrchConfigSchema.safeParse(input)

    //#then
    expect(result.success).toBe(true)
    expect(result.data?.hashline_edit).toBe(true)
  })

  test("accepts hashline_edit as false", () => {
    //#given
    const input = { hashline_edit: false }

    //#when
    const result = OpenCodeCodexOrchConfigSchema.safeParse(input)

    //#then
    expect(result.success).toBe(true)
    expect(result.data?.hashline_edit).toBe(false)
  })

  test("hashline_edit is optional", () => {
    //#given
    const input = { auto_update: true }

    //#when
    const result = OpenCodeCodexOrchConfigSchema.safeParse(input)

    //#then
    expect(result.success).toBe(true)
    expect(result.data?.hashline_edit).toBeUndefined()
  })

  test("rejects non-boolean hashline_edit", () => {
    //#given
    const input = { hashline_edit: "true" }

    //#when
    const result = OpenCodeCodexOrchConfigSchema.safeParse(input)

    //#then
    expect(result.success).toBe(false)
  })
})

describe("ExperimentalConfigSchema feature flags", () => {
  test("accepts plugin_load_timeout_ms as number", () => {
    //#given
    const config = { plugin_load_timeout_ms: 5000 }

    //#when
    const result = ExperimentalConfigSchema.safeParse(config)

    //#then
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.plugin_load_timeout_ms).toBe(5000)
    }
  })

  test("rejects plugin_load_timeout_ms below 1000", () => {
    //#given
    const config = { plugin_load_timeout_ms: 500 }

    //#when
    const result = ExperimentalConfigSchema.safeParse(config)

    //#then
    expect(result.success).toBe(false)
  })

  test("accepts safe_hook_creation as boolean", () => {
    //#given
    const config = { safe_hook_creation: false }

    //#when
    const result = ExperimentalConfigSchema.safeParse(config)

    //#then
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.safe_hook_creation).toBe(false)
    }
  })

  test("both fields are optional", () => {
    //#given
    const config = {}

    //#when
    const result = ExperimentalConfigSchema.safeParse(config)

    //#then
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.plugin_load_timeout_ms).toBeUndefined()
      expect(result.data.safe_hook_creation).toBeUndefined()
    }
  })

  test("accepts disable_oco_env as true", () => {
    //#given
    const config = { disable_oco_env: true }

    //#when
    const result = ExperimentalConfigSchema.safeParse(config)

    //#then
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.disable_oco_env).toBe(true)
    }
  })

  test("accepts disable_oco_env as false", () => {
    //#given
    const config = { disable_oco_env: false }

    //#when
    const result = ExperimentalConfigSchema.safeParse(config)

    //#then
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.disable_oco_env).toBe(false)
    }
  })

  test("disable_oco_env is optional", () => {
    //#given
    const config = { safe_hook_creation: true }

    //#when
    const result = ExperimentalConfigSchema.safeParse(config)

    //#then
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.disable_oco_env).toBeUndefined()
    }
  })

  test("rejects non-boolean disable_oco_env", () => {
    //#given
    const config = { disable_oco_env: "true" }

    //#when
    const result = ExperimentalConfigSchema.safeParse(config)

    //#then
    expect(result.success).toBe(false)
  })

})

describe("skills schema", () => {
  test("accepts skills.sources configuration", () => {
    //#given
    const config = {
      skills: {
        sources: [{ path: "skill/", recursive: true }],
      },
    }

    //#when
    const result = OpenCodeCodexOrchConfigSchema.safeParse(config)

    //#then
    expect(result.success).toBe(true)
  })
})
