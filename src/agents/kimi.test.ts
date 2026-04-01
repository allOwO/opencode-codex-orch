import { describe, expect, test } from "bun:test"
import { createOracleAgent } from "./oracle"
import { createMomusAgent } from "./momus"
import { createMetisAgent } from "./metis"
import { createLibrarianAgent } from "./librarian"
import { createExploreAgent } from "./explore"

const KIMI_PROVIDER_MODEL = "kimi-for-coding/k2p5"
const KIMI_MODEL_ID = "opencode/kimi-k2.5-free"

describe("Kimi prompt augmentation for subagents", () => {
  test("Oracle prepends Kimi system prompt while preserving Oracle instructions", () => {
    const prompt = createOracleAgent(KIMI_PROVIDER_MODEL).prompt ?? ""

    expect(prompt).toContain("You are OpenCode, an interactive general AI agent running on a user's computer.")
    expect(prompt).toContain("strategic technical advisor")
  })

  test("Momus prepends Kimi system prompt while preserving Momus instructions", () => {
    const prompt = createMomusAgent(KIMI_MODEL_ID).prompt ?? ""

    expect(prompt).toContain("You are OpenCode, an interactive general AI agent running on a user's computer.")
    expect(prompt).toContain("APPROVAL BIAS")
  })

  test("Metis prepends Kimi system prompt while preserving Metis instructions", () => {
    const prompt = createMetisAgent(KIMI_PROVIDER_MODEL).prompt ?? ""

    expect(prompt).toContain("You are OpenCode, an interactive general AI agent running on a user's computer.")
    expect(prompt).toContain("# Metis - Pre-Planning Consultant")
  })

  test("Librarian prepends Kimi system prompt while preserving Librarian instructions", () => {
    const prompt = createLibrarianAgent(KIMI_MODEL_ID).prompt ?? ""

    expect(prompt).toContain("You are OpenCode, an interactive general AI agent running on a user's computer.")
    expect(prompt).toContain("# THE LIBRARIAN")
  })

  test("Explore prepends Kimi system prompt while preserving Explore instructions", () => {
    const prompt = createExploreAgent(KIMI_PROVIDER_MODEL).prompt ?? ""

    expect(prompt).toContain("You are OpenCode, an interactive general AI agent running on a user's computer.")
    expect(prompt).toContain("You are a codebase search specialist.")
  })
})
