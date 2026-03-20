import { describe, expect, test } from "bun:test"
import {
  AGENT_MODEL_REQUIREMENTS,
  CATEGORY_MODEL_REQUIREMENTS,
  type FallbackEntry,
  type ModelRequirement,
} from "./model-requirements"

describe("AGENT_MODEL_REQUIREMENTS", () => {
  test("oracle has valid fallbackChain with gpt-5.4 as primary", () => {
    // given - oracle agent requirement
    const oracle = AGENT_MODEL_REQUIREMENTS["oracle"]

    // when - accessing oracle requirement
    // then - fallbackChain exists with gpt-5.4 as first entry
    expect(oracle).toBeDefined()
    expect(oracle.fallbackChain).toBeArray()
    expect(oracle.fallbackChain.length).toBeGreaterThan(0)

    const primary = oracle.fallbackChain[0]
    expect(primary.providers).toContain("openai")
    expect(primary.model).toBe("gpt-5.4")
    expect(primary.variant).toBe("high")
  })

  test("sisyphus has claude-opus-4-6 as primary with Kimi and GPT/GLM fallbacks", () => {
    // #given - sisyphus agent requirement
    const sisyphus = AGENT_MODEL_REQUIREMENTS["sisyphus"]

    // #when - accessing Sisyphus requirement
    // #then - fallbackChain has 6 entries with correct ordering
    expect(sisyphus).toBeDefined()
    expect(sisyphus.fallbackChain).toBeArray()
    expect(sisyphus.fallbackChain).toHaveLength(6)
    expect(sisyphus.requiresAnyModel).toBe(true)

    const primary = sisyphus.fallbackChain[0]
    expect(primary.providers).toEqual(["anthropic", "github-copilot", "opencode"])
    expect(primary.model).toBe("claude-opus-4-6")
    expect(primary.variant).toBe("max")

    const second = sisyphus.fallbackChain[1]
    expect(second.providers).toEqual(["kimi-for-coding"])
    expect(second.model).toBe("k2p5")

    const third = sisyphus.fallbackChain[2]
    expect(third.providers).toContain("moonshotai")
    expect(third.model).toBe("kimi-k2.5")

    const fourth = sisyphus.fallbackChain[3]
    expect(fourth.providers).toContain("openai")
    expect(fourth.model).toBe("gpt-5.4")
    expect(fourth.variant).toBe("medium")

    const fifth = sisyphus.fallbackChain[4]
    expect(fifth.providers).toContain("zai-coding-plan")
    expect(fifth.model).toBe("glm-5")

    const last = sisyphus.fallbackChain[5]
    expect(last.providers[0]).toBe("opencode")
    expect(last.model).toBe("big-pickle")
  })

  test("librarian has valid fallbackChain with ZAI GLM as primary", () => {
    // given - librarian agent requirement
    const librarian = AGENT_MODEL_REQUIREMENTS["librarian"]

    // when - accessing librarian requirement
    // then - fallbackChain exists with ZAI GLM as first entry
    expect(librarian).toBeDefined()
    expect(librarian.fallbackChain).toBeArray()
    expect(librarian.fallbackChain.length).toBeGreaterThan(0)

    const primary = librarian.fallbackChain[0]
    expect(primary.providers[0]).toBe("zai-coding-plan")
    expect(primary.model).toBe("glm-4.7")
  })

  test("explore has valid fallbackChain with grok-code-fast-1 as primary", () => {
    // given - explore agent requirement
    const explore = AGENT_MODEL_REQUIREMENTS["explore"]

    // when - accessing explore requirement
    // then - fallbackChain: grok → minimax-free → haiku → nano
    expect(explore).toBeDefined()
    expect(explore.fallbackChain).toBeArray()
    expect(explore.fallbackChain).toHaveLength(4)

    const primary = explore.fallbackChain[0]
    expect(primary.providers).toContain("github-copilot")
    expect(primary.model).toBe("grok-code-fast-1")

    const secondary = explore.fallbackChain[1]
    expect(secondary.providers).toContain("opencode")
    expect(secondary.model).toBe("minimax-m2.5-free")

    const tertiary = explore.fallbackChain[2]
    expect(tertiary.providers).toContain("anthropic")
    expect(tertiary.model).toBe("claude-haiku-4-5")

    const quaternary = explore.fallbackChain[3]
    expect(quaternary.providers).toContain("opencode")
    expect(quaternary.model).toBe("gpt-5-nano")
  })

  test("multimodal-looker has valid fallbackChain with gpt-5.4 as primary", () => {
    // given - multimodal-looker agent requirement
    const multimodalLooker = AGENT_MODEL_REQUIREMENTS["multimodal-looker"]

    // when - accessing multimodal-looker requirement
    // then - fallbackChain: gpt-5.4 -> k2p5 -> official kimi -> gemini-3-flash -> glm-4.6v -> gpt-5-nano
    expect(multimodalLooker).toBeDefined()
    expect(multimodalLooker.fallbackChain).toBeArray()
    expect(multimodalLooker.fallbackChain).toHaveLength(6)

    const primary = multimodalLooker.fallbackChain[0]
    expect(primary.providers).toEqual(["openai", "opencode"])
    expect(primary.model).toBe("gpt-5.4")
    expect(primary.variant).toBe("medium")
    const secondary = multimodalLooker.fallbackChain[1]
    expect(secondary.providers).toEqual(["kimi-for-coding"])
    expect(secondary.model).toBe("k2p5")

    const tertiary = multimodalLooker.fallbackChain[2]
    expect(tertiary.providers).toContain("moonshotai")
    expect(tertiary.model).toBe("kimi-k2.5")

    const quaternary = multimodalLooker.fallbackChain[3]
    expect(quaternary.model).toBe("gemini-3-flash")
    const last = multimodalLooker.fallbackChain[5]
    expect(last.providers).toEqual(["openai", "github-copilot", "opencode"])
    expect(last.model).toBe("gpt-5-nano")
  })

  test("prometheus has claude-opus-4-6 as primary", () => {
    // #given - prometheus agent requirement
    const prometheus = AGENT_MODEL_REQUIREMENTS["prometheus"]

    // #when - accessing Prometheus requirement
    // #then - claude-opus-4-6 is first
    expect(prometheus).toBeDefined()
    expect(prometheus.fallbackChain).toBeArray()
    expect(prometheus.fallbackChain.length).toBeGreaterThan(1)

    const primary = prometheus.fallbackChain[0]
    expect(primary.model).toBe("claude-opus-4-6")
    expect(primary.providers).toEqual(["anthropic", "github-copilot", "opencode"])
    expect(primary.variant).toBe("max")

    const secondary = prometheus.fallbackChain[1]
    expect(secondary).toEqual({ providers: ["kimi-for-coding"], model: "k2p5" })
  })

  test("metis has claude-opus-4-6 as primary", () => {
    // #given - metis agent requirement
    const metis = AGENT_MODEL_REQUIREMENTS["metis"]

    // #when - accessing Metis requirement
    // #then - claude-opus-4-6 is first
    expect(metis).toBeDefined()
    expect(metis.fallbackChain).toBeArray()
    expect(metis.fallbackChain.length).toBeGreaterThan(1)

    const primary = metis.fallbackChain[0]
    expect(primary.model).toBe("claude-opus-4-6")
    expect(primary.providers).toEqual(["anthropic", "github-copilot", "opencode"])
    expect(primary.variant).toBe("max")

    const secondary = metis.fallbackChain[1]
    expect(secondary).toEqual({ providers: ["kimi-for-coding"], model: "k2p5" })
  })

  test("momus has valid fallbackChain with gpt-5.4 as primary", () => {
    // given - momus agent requirement
    const momus = AGENT_MODEL_REQUIREMENTS["momus"]

    // when - accessing Momus requirement
    // then - fallbackChain exists with gpt-5.4 as first entry, variant xhigh
    expect(momus).toBeDefined()
    expect(momus.fallbackChain).toBeArray()
    expect(momus.fallbackChain.length).toBeGreaterThan(0)

    const primary = momus.fallbackChain[0]
    expect(primary.model).toBe("gpt-5.4")
    expect(primary.variant).toBe("xhigh")
    expect(primary.providers[0]).toBe("openai")
  })

  test("atlas has Kimi-first fallbackChain with official provider fallbacks", () => {
    // given - atlas agent requirement
    const atlas = AGENT_MODEL_REQUIREMENTS["atlas"]

    // when - accessing Atlas requirement
    // then - fallbackChain starts with Kimi and includes official provider fallbacks
    expect(atlas).toBeDefined()
    expect(atlas.fallbackChain).toBeArray()
    expect(atlas.fallbackChain.length).toBeGreaterThan(0)

    const primary = atlas.fallbackChain[0]
    expect(primary.model).toBe("k2p5")
    expect(primary.providers[0]).toBe("kimi-for-coding")

    const secondary = atlas.fallbackChain[1]
    expect(secondary.model).toBe("kimi-k2.5")
    expect(secondary.providers).toContain("moonshotai")

    const tertiary = atlas.fallbackChain[2]
    expect(tertiary.model).toBe("claude-sonnet-4-5")
    expect(tertiary.providers[0]).toBe("anthropic")

    const quaternary = atlas.fallbackChain[3]
    expect(quaternary.model).toBe("gpt-5.4")
    expect(quaternary.variant).toBe("medium")

    const fifth = atlas.fallbackChain[4]
    expect(fifth.model).toBe("gemini-3.1-pro")
  })

  test("librarian includes OpenCode MiniMax after official GLM entries", () => {
    // given - librarian agent requirement
    const librarian = AGENT_MODEL_REQUIREMENTS["librarian"]

    // when - accessing librarian requirement
    // then - OpenCode MiniMax follows GLM entries
    expect(librarian.fallbackChain[1]).toEqual({
      providers: ["google", "github-copilot", "opencode"],
      model: "gemini-3-flash",
    })
    expect(librarian.fallbackChain[2]).toEqual({ providers: ["opencode"], model: "minimax-m2.5-free" })
  })

  test("all 9 builtin agents have valid fallbackChain arrays", () => {
    // #given - list of 9 agent names
    const expectedAgents = [
      "sisyphus",
      "oracle",
      "librarian",
      "explore",
      "multimodal-looker",
      "prometheus",
      "metis",
      "momus",
      "atlas",
    ]

    // when - checking AGENT_MODEL_REQUIREMENTS
    const definedAgents = Object.keys(AGENT_MODEL_REQUIREMENTS)

    // #then - all agents present with valid fallbackChain
    expect(definedAgents).toHaveLength(9)
    for (const agent of expectedAgents) {
      const requirement = AGENT_MODEL_REQUIREMENTS[agent]
      expect(requirement).toBeDefined()
      expect(requirement.fallbackChain).toBeArray()
      expect(requirement.fallbackChain.length).toBeGreaterThan(0)

      for (const entry of requirement.fallbackChain) {
        expect(entry.providers).toBeArray()
        expect(entry.providers.length).toBeGreaterThan(0)
        expect(typeof entry.model).toBe("string")
        expect(entry.model.length).toBeGreaterThan(0)
      }
    }
  })
})

describe("CATEGORY_MODEL_REQUIREMENTS", () => {
  test("deep has valid fallbackChain with gpt-5.3-codex as primary", () => {
    // given - deep category requirement
    const deep = CATEGORY_MODEL_REQUIREMENTS["deep"]

    // when - accessing deep requirement
    // then - fallbackChain exists with gpt-5.3-codex as first entry, medium variant
    expect(deep).toBeDefined()
    expect(deep.fallbackChain).toBeArray()
    expect(deep.fallbackChain.length).toBeGreaterThan(0)

    const primary = deep.fallbackChain[0]
    expect(primary.variant).toBe("medium")
    expect(primary.model).toBe("gpt-5.3-codex")
    expect(primary.providers[0]).toBe("openai")
  })

  test("visual-engineering has valid fallbackChain with gemini-3.1-pro high as primary", () => {
    // given - visual-engineering category requirement
    const visualEngineering = CATEGORY_MODEL_REQUIREMENTS["visual-engineering"]

    // when - accessing visual-engineering requirement
    // then - fallbackChain: gemini-3.1-pro(high) → glm-5 → opus-4-6(max)
    expect(visualEngineering).toBeDefined()
    expect(visualEngineering.fallbackChain).toBeArray()
    expect(visualEngineering.fallbackChain).toHaveLength(3)

    const primary = visualEngineering.fallbackChain[0]
    expect(primary.providers[0]).toBe("google")
    expect(primary.model).toBe("gemini-3.1-pro")
    expect(primary.variant).toBe("high")

    const second = visualEngineering.fallbackChain[1]
    expect(second.providers[0]).toBe("zai-coding-plan")
    expect(second.model).toBe("glm-5")

    const third = visualEngineering.fallbackChain[2]
    expect(third.model).toBe("claude-opus-4-6")
    expect(third.variant).toBe("max")

  })

  test("quick has valid fallbackChain with claude-haiku-4-5 as primary", () => {
    // given - quick category requirement
    const quick = CATEGORY_MODEL_REQUIREMENTS["quick"]

    // when - accessing quick requirement
    // then - fallbackChain exists with claude-haiku-4-5 as first entry
    expect(quick).toBeDefined()
    expect(quick.fallbackChain).toBeArray()
    expect(quick.fallbackChain.length).toBeGreaterThan(0)

    const primary = quick.fallbackChain[0]
    expect(primary.model).toBe("claude-haiku-4-5")
    expect(primary.providers[0]).toBe("anthropic")
  })

  test("writing has valid fallbackChain with official Kimi-first fallbacks", () => {
    // given - writing category requirement
    const writing = CATEGORY_MODEL_REQUIREMENTS["writing"]

    // when - accessing writing requirement
    // then - fallbackChain: k2p5 -> official kimi -> gemini-3-flash -> claude-sonnet-4-6
    expect(writing).toBeDefined()
    expect(writing.fallbackChain).toBeArray()
    expect(writing.fallbackChain).toHaveLength(4)

    const primary = writing.fallbackChain[0]
    expect(primary.model).toBe("k2p5")
    expect(primary.providers[0]).toBe("kimi-for-coding")

    const second = writing.fallbackChain[1]
    expect(second.model).toBe("kimi-k2.5")
    expect(second.providers).toContain("moonshotai")

    const third = writing.fallbackChain[2]
    expect(third.model).toBe("gemini-3-flash")
    expect(third.providers[0]).toBe("google")

    const fourth = writing.fallbackChain[3]
    expect(fourth.model).toBe("claude-sonnet-4-6")
    expect(fourth.providers[0]).toBe("anthropic")
  })

  test("all 4 categories have valid fallbackChain arrays", () => {
    // given - list of 4 category names
    const expectedCategories = [
      "visual-engineering",
      "deep",
      "quick",
      "writing",
    ]

    // when - checking CATEGORY_MODEL_REQUIREMENTS
    const definedCategories = Object.keys(CATEGORY_MODEL_REQUIREMENTS)

    // then - all categories present with valid fallbackChain
    expect(definedCategories).toHaveLength(4)
    for (const category of expectedCategories) {
      const requirement = CATEGORY_MODEL_REQUIREMENTS[category]
      expect(requirement).toBeDefined()
      expect(requirement.fallbackChain).toBeArray()
      expect(requirement.fallbackChain.length).toBeGreaterThan(0)

      for (const entry of requirement.fallbackChain) {
        expect(entry.providers).toBeArray()
        expect(entry.providers.length).toBeGreaterThan(0)
        expect(typeof entry.model).toBe("string")
        expect(entry.model.length).toBeGreaterThan(0)
      }
    }
  })
})

describe("FallbackEntry type", () => {
  test("FallbackEntry structure is correct", () => {
    // given - a valid FallbackEntry object
    const entry: FallbackEntry = {
      providers: ["anthropic", "github-copilot", "opencode"],
      model: "claude-opus-4-6",
      variant: "high",
    }

    // when - accessing properties
    // then - all properties are accessible
    expect(entry.providers).toEqual(["anthropic", "github-copilot", "opencode"])
    expect(entry.model).toBe("claude-opus-4-6")
    expect(entry.variant).toBe("high")
  })

  test("FallbackEntry variant is optional", () => {
    // given - a FallbackEntry without variant
    const entry: FallbackEntry = {
      providers: ["opencode", "anthropic"],
      model: "big-pickle",
    }

    // when - accessing variant
    // then - variant is undefined
    expect(entry.variant).toBeUndefined()
  })
})

describe("ModelRequirement type", () => {
  test("ModelRequirement structure with fallbackChain is correct", () => {
    // given - a valid ModelRequirement object
    const requirement: ModelRequirement = {
      fallbackChain: [
        { providers: ["anthropic", "github-copilot"], model: "claude-opus-4-6", variant: "max" },
        { providers: ["openai", "github-copilot"], model: "gpt-5.4", variant: "high" },
      ],
    }

    // when - accessing properties
    // then - fallbackChain is accessible with correct structure
    expect(requirement.fallbackChain).toBeArray()
    expect(requirement.fallbackChain).toHaveLength(2)
    expect(requirement.fallbackChain[0].model).toBe("claude-opus-4-6")
    expect(requirement.fallbackChain[1].model).toBe("gpt-5.4")
  })

  test("ModelRequirement variant is optional", () => {
    // given - a ModelRequirement without top-level variant
    const requirement: ModelRequirement = {
      fallbackChain: [{ providers: ["opencode"], model: "big-pickle" }],
    }

    // when - accessing variant
    // then - variant is undefined
    expect(requirement.variant).toBeUndefined()
  })

  test("no model in fallbackChain has provider prefix", () => {
    // given - all agent and category requirements
    const allRequirements = [
      ...Object.values(AGENT_MODEL_REQUIREMENTS),
      ...Object.values(CATEGORY_MODEL_REQUIREMENTS),
    ]

    // when - checking each model in fallbackChain
    // then - none contain "/" (provider prefix)
    for (const req of allRequirements) {
      for (const entry of req.fallbackChain) {
        expect(entry.model).not.toContain("/")
      }
    }
  })

   test("all fallbackChain entries have non-empty providers array", () => {
     // given - all agent and category requirements
     const allRequirements = [
       ...Object.values(AGENT_MODEL_REQUIREMENTS),
       ...Object.values(CATEGORY_MODEL_REQUIREMENTS),
     ]

     // when - checking each entry in fallbackChain
     // then - all have non-empty providers array
     for (const req of allRequirements) {
       for (const entry of req.fallbackChain) {
         expect(entry.providers).toBeArray()
         expect(entry.providers.length).toBeGreaterThan(0)
       }
     }
   })
})

describe("requiresModel field in categories", () => {
  test("deep category has requiresModel set to gpt-5.3-codex", () => {
    // given
    const deep = CATEGORY_MODEL_REQUIREMENTS["deep"]

    // when / #then
    expect(deep.requiresModel).toBe("gpt-5.3-codex")
  })

})

describe("gpt-5.3-codex provider restrictions", () => {
  test("no gpt-5.3-codex entry in AGENT_MODEL_REQUIREMENTS includes github-copilot as provider", () => {
    // given - all agent requirements
    const allAgentEntries = Object.values(AGENT_MODEL_REQUIREMENTS).flatMap(
      (req) => req.fallbackChain
    )

    // when - filtering entries with gpt-5.3-codex model
    const codexEntries = allAgentEntries.filter((entry) => entry.model === "gpt-5.3-codex")

    // then - none of them include github-copilot as a provider
    for (const entry of codexEntries) {
      expect(entry.providers).not.toContain("github-copilot")
    }
  })

  test("no gpt-5.3-codex entry in CATEGORY_MODEL_REQUIREMENTS includes github-copilot as provider", () => {
    // given - all category requirements
    const allCategoryEntries = Object.values(CATEGORY_MODEL_REQUIREMENTS).flatMap(
      (req) => req.fallbackChain
    )

    // when - filtering entries with gpt-5.3-codex model
    const codexEntries = allCategoryEntries.filter((entry) => entry.model === "gpt-5.3-codex")

    // then - none of them include github-copilot as a provider
    for (const entry of codexEntries) {
      expect(entry.providers).not.toContain("github-copilot")
    }
  })
})
