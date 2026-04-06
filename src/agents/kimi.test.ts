import { describe, expect, test } from "bun:test"
import { createOracleAgent } from "./oracle"
import { createMomusAgent } from "./momus"
import { createLibrarianAgent } from "./librarian"
import { createExploreAgent } from "./explore"
import { createDeepSearchAgent } from "./deepsearch"
import { KIMI_SYSTEM_PROMPT, prependKimiPrompt, maybePrependKimiPrompt } from "./kimi"

const KIMI_PROVIDER_MODEL = "kimi-for-coding/k2p5"
const KIMI_MODEL_ID = "opencode/kimi-k2.5-free"
const NON_KIMI_MODEL = "anthropic/claude-sonnet-4-6"

// The compact intro that KIMI_SYSTEM_PROMPT starts with
const KIMI_INTRO = "You are operating as a specialized subagent on a Kimi model."

// Content from the old bloated KIMI_SYSTEM_PROMPT that should NOT appear
const REMOVED_OPENCODE_BASE_PROMPT = "You are OpenCode, an interactive general AI agent running on a user's computer."
const REMOVED_SUBAGENT_BRIDGE = "# opencode-codex-orch Subagent Context"

describe("KIMI_SYSTEM_PROMPT content", () => {
  test("contains compact role anchor", () => {
    expect(KIMI_SYSTEM_PROMPT).toContain(KIMI_INTRO)
  })

  test("contains instruction priority guidance", () => {
    expect(KIMI_SYSTEM_PROMPT).toContain("role-specific instructions below narrow your scope")
  })

  test("does NOT duplicate the OpenCode base prompt", () => {
    expect(KIMI_SYSTEM_PROMPT).not.toContain(REMOVED_OPENCODE_BASE_PROMPT)
    expect(KIMI_SYSTEM_PROMPT).not.toContain("# General Guidelines for Coding")
    expect(KIMI_SYSTEM_PROMPT).not.toContain("# Project Information")
    expect(KIMI_SYSTEM_PROMPT).not.toContain("## Working Directory")
    expect(KIMI_SYSTEM_PROMPT).not.toContain("git commit")
  })

  test("does NOT contain the old subagent bridge section", () => {
    expect(KIMI_SYSTEM_PROMPT).not.toContain(REMOVED_SUBAGENT_BRIDGE)
    expect(KIMI_SYSTEM_PROMPT).not.toContain("opencode-codex-orch")
  })
})

describe("prependKimiPrompt", () => {
  test("prepends KIMI_SYSTEM_PROMPT before the given prompt", () => {
    const agentPrompt = "You are a specialist agent."
    const result = prependKimiPrompt(agentPrompt)

    expect(result).toStartWith(KIMI_INTRO)
    expect(result).toContain(agentPrompt)
    expect(result.indexOf(KIMI_INTRO)).toBeLessThan(result.indexOf(agentPrompt))
  })

  test("separates system prompt and agent prompt with blank lines", () => {
    const agentPrompt = "Agent instructions here."
    const result = prependKimiPrompt(agentPrompt)

    expect(result).toBe(`${KIMI_SYSTEM_PROMPT}\n\n${agentPrompt}`)
  })
})

describe("maybePrependKimiPrompt", () => {
  test("prepends for kimi-for-coding provider models", () => {
    const prompt = "Original prompt"
    const result = maybePrependKimiPrompt(KIMI_PROVIDER_MODEL, prompt)

    expect(result).toContain(KIMI_INTRO)
    expect(result).toContain(prompt)
  })

  test("prepends for opencode/kimi-* model IDs", () => {
    const prompt = "Original prompt"
    const result = maybePrependKimiPrompt(KIMI_MODEL_ID, prompt)

    expect(result).toContain(KIMI_INTRO)
    expect(result).toContain(prompt)
  })

  test("returns original prompt unchanged for non-Kimi models", () => {
    const prompt = "Original prompt"
    const result = maybePrependKimiPrompt(NON_KIMI_MODEL, prompt)

    expect(result).toBe(prompt)
    expect(result).not.toContain(KIMI_INTRO)
  })

  test("returns original prompt unchanged for GPT models", () => {
    const prompt = "Original prompt"
    const result = maybePrependKimiPrompt("openai/gpt-5.4", prompt)

    expect(result).toBe(prompt)
  })

  test("returns original prompt unchanged for Gemini models", () => {
    const prompt = "Original prompt"
    const result = maybePrependKimiPrompt("google/gemini-3.1-pro", prompt)

    expect(result).toBe(prompt)
  })
})

describe("Kimi prompt integration with subagents", () => {
  test("Oracle prepends compact Kimi intro while preserving Oracle instructions", () => {
    const prompt = createOracleAgent(KIMI_PROVIDER_MODEL).prompt ?? ""

    expect(prompt).toContain(KIMI_INTRO)
    expect(prompt).toContain("strategic technical advisor")
    expect(prompt).toContain("role-specific instructions below narrow your scope")
    expect(prompt).not.toContain(REMOVED_OPENCODE_BASE_PROMPT)
    expect(prompt).not.toContain(REMOVED_SUBAGENT_BRIDGE)
  })

  test("Oracle with non-Kimi model does NOT have Kimi intro", () => {
    const prompt = createOracleAgent(NON_KIMI_MODEL).prompt ?? ""

    expect(prompt).not.toContain(KIMI_INTRO)
    expect(prompt).toContain("strategic technical advisor")
  })

  test("Momus prepends compact Kimi intro while preserving Momus instructions", () => {
    const prompt = createMomusAgent(KIMI_MODEL_ID).prompt ?? ""

    expect(prompt).toContain(KIMI_INTRO)
    expect(prompt).toContain("APPROVAL BIAS")
    expect(prompt).not.toContain(REMOVED_OPENCODE_BASE_PROMPT)
  })

  test("DeepSearch prepends compact Kimi intro while preserving DeepSearch instructions", () => {
    const prompt = createDeepSearchAgent(KIMI_PROVIDER_MODEL).prompt ?? ""

    expect(prompt).toContain(KIMI_INTRO)
    expect(prompt).toContain("# DeepSearch")
    expect(prompt).not.toContain(REMOVED_OPENCODE_BASE_PROMPT)
  })

  test("Librarian prepends compact Kimi intro while preserving Librarian instructions", () => {
    const prompt = createLibrarianAgent(KIMI_MODEL_ID).prompt ?? ""

    expect(prompt).toContain(KIMI_INTRO)
    expect(prompt).toContain("# THE LIBRARIAN")
    expect(prompt).not.toContain(REMOVED_OPENCODE_BASE_PROMPT)
  })

  test("Explore prepends compact Kimi intro while preserving Explore instructions", () => {
    const prompt = createExploreAgent(KIMI_PROVIDER_MODEL).prompt ?? ""

    expect(prompt).toContain(KIMI_INTRO)
    expect(prompt).toContain("You are a codebase search specialist.")
    expect(prompt).not.toContain(REMOVED_OPENCODE_BASE_PROMPT)
  })
})
