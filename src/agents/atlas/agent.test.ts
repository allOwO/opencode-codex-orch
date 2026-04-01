import { describe, expect, test } from "bun:test"
import { getAtlasPrompt, getAtlasPromptSource } from "./agent"

describe("Atlas Kimi prompt routing", () => {
  test("routes provider-based Kimi models to 'kimi' prompt source", () => {
    const source = getAtlasPromptSource("kimi-for-coding/k2p5")

    expect(source).toBe("kimi")
  })

  test("routes model-based Kimi models to 'kimi' prompt source", () => {
    const source = getAtlasPromptSource("opencode/kimi-k2.5-free")

    expect(source).toBe("kimi")
  })

  test("uses dedicated Kimi prompt instead of default prompt", () => {
    const prompt = getAtlasPrompt("kimi-for-coding/k2p5")

    expect(prompt).toContain("You are OpenCode, an interactive general AI agent running on a user's computer.")
    expect(prompt).toContain("Atlas Kimi delegation profile")
    expect(prompt).not.toContain("In Greek mythology, Atlas holds up the celestial heavens")
  })
})
