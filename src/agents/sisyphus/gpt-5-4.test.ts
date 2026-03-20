/// <reference types="bun-types" />

import { describe, expect, it } from "bun:test"
import type { AvailableAgent, AvailableTool } from "../dynamic-agent-prompt-builder"
import { buildGpt54SisyphusPrompt } from "./gpt-5-4"

function createAgent(name: string): AvailableAgent {
  return {
    name,
    description: `${name} agent`,
    metadata: {
      category: "specialist",
      cost: "CHEAP",
      triggers: [],
      useWhen: [`use ${name}`],
      avoidWhen: [`avoid ${name}`],
    },
  }
}

const searchTools: AvailableTool[] = [
  { name: "glob", category: "search" },
  { name: "grep", category: "search" },
  { name: "lsp_find_references", category: "lsp" },
]

describe("buildGpt54SisyphusPrompt", () => {
  it("uses task_create and task_update when task system is enabled", () => {
    const result = buildGpt54SisyphusPrompt("openai/gpt-5.4", [], [], [], [], true)

    expect(result).toContain("`task_create / task_update`")
    expect(result).not.toContain("TaskCreate")
    expect(result).not.toContain("TaskUpdate")
  })

  it("uses repo-native search wording instead of rg", () => {
    const result = buildGpt54SisyphusPrompt(
      "openai/gpt-5.4",
      [],
      searchTools,
    )

    expect(result).toContain("Use repo-native search first")
    expect(result).toContain("`glob`")
    expect(result).toContain("`grep`")
    expect(result).not.toContain("Use `rg` for searching")
  })

  it("removes explore and librarian guidance cleanly when those agents are unavailable", () => {
    const result = buildGpt54SisyphusPrompt(
      "openai/gpt-5.4",
      [],
      searchTools,
    )

    expect(result).not.toContain("Explore Agent = Contextual Grep")
    expect(result).not.toContain("Librarian Agent = Reference Grep")
    expect(result).toContain("Use repo-native tools aggressively for discovery")
    expect(result).toContain("need to discover files, symbols, or patterns first → use repo-native tools")
  })

  it("keeps explore and librarian guidance strong when both agents are available", () => {
    const agents = [createAgent("explore"), createAgent("librarian")]
    const result = buildGpt54SisyphusPrompt(
      "openai/gpt-5.4",
      agents,
      searchTools,
    )

    expect(result).toContain("Explore Agent = Contextual Grep")
    expect(result).toContain("Librarian Agent = Reference Grep")
    expect(result).toContain("Fire 2-5 explore/librarian agents")
    expect(result).toContain("unfamiliar or version-sensitive library/API behavior → `librarian`")
  })
})
