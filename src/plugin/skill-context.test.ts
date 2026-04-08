import { afterEach, beforeEach, describe, expect, it } from "bun:test"
import { mkdirSync, rmSync, writeFileSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"

let testDir: string
let originalConfigContent: string | undefined
let originalOpenCodeConfigDir: string | undefined
let originalClaudeConfigDir: string | undefined

describe("createSkillContext runtime-configured skill paths", () => {
  beforeEach(() => {
    testDir = join(tmpdir(), `skill-context-test-${Date.now()}-${Math.random().toString(16).slice(2)}`)
    mkdirSync(testDir, { recursive: true })

    originalConfigContent = process.env.OPENCODE_CONFIG_CONTENT
    originalOpenCodeConfigDir = process.env.OPENCODE_CONFIG_DIR
    originalClaudeConfigDir = process.env.CLAUDE_CONFIG_DIR
  })

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true })

    if (originalConfigContent === undefined) {
      delete process.env.OPENCODE_CONFIG_CONTENT
    } else {
      process.env.OPENCODE_CONFIG_CONTENT = originalConfigContent
    }

    if (originalOpenCodeConfigDir === undefined) {
      delete process.env.OPENCODE_CONFIG_DIR
    } else {
      process.env.OPENCODE_CONFIG_DIR = originalOpenCodeConfigDir
    }

    if (originalClaudeConfigDir === undefined) {
      delete process.env.CLAUDE_CONFIG_DIR
    } else {
      process.env.CLAUDE_CONFIG_DIR = originalClaudeConfigDir
    }
  })

  it("includes skills from runtime config.skills.paths in merged and available skill lists", async () => {
    const runtimeSkillsDir = join(testDir, "runtime-skills")
    const runtimeSkillDir = join(runtimeSkillsDir, "runtime-context-skill")
    mkdirSync(runtimeSkillDir, { recursive: true })
    writeFileSync(
      join(runtimeSkillDir, "SKILL.md"),
      `---
name: runtime-context-skill
description: Skill loaded from runtime config path
---
runtime-context body
`
    )

    process.env.OPENCODE_CONFIG_DIR = join(testDir, "opencode-config")
    process.env.CLAUDE_CONFIG_DIR = join(testDir, "claude-config")
    process.env.OPENCODE_CONFIG_CONTENT = JSON.stringify({
      skills: {
        paths: [runtimeSkillsDir],
      },
    })

    const { createSkillContext } = await import("./skill-context")
    const context = await createSkillContext({
      directory: testDir,
      pluginConfig: {},
      runtimeConfig: {
        skills: {
          paths: [runtimeSkillsDir],
        },
      },
    })

    expect(context.mergedSkills.some((skill) => skill.name === "runtime-context-skill")).toBe(true)
    expect(context.availableSkills.some((skill) => skill.name === "runtime-context-skill")).toBe(true)
  })

  it("filters disabled skills from merged and available skill lists even when discovered from external paths", async () => {
    const opencodeSkillsDir = join(testDir, "opencode-config", "skills", "writing-skills")
    mkdirSync(opencodeSkillsDir, { recursive: true })
    writeFileSync(
      join(opencodeSkillsDir, "SKILL.md"),
      `---
name: writing-skills
description: External doctrine skill
---
writing-skills body
`
    )

    process.env.OPENCODE_CONFIG_DIR = join(testDir, "opencode-config")
    process.env.CLAUDE_CONFIG_DIR = join(testDir, "claude-config")

    const { createSkillContext } = await import("./skill-context")
    const context = await createSkillContext({
      directory: testDir,
      pluginConfig: {
        disabled_skills: ["writing-skills"],
      },
    })

    expect(context.mergedSkills.some((skill) => skill.name === "writing-skills")).toBe(false)
    expect(context.availableSkills.some((skill) => skill.name === "writing-skills")).toBe(false)
  })

  it("hard-disables writing-skills by default even without user config", async () => {
    const opencodeSkillsDir = join(testDir, "opencode-config", "skills", "writing-skills")
    mkdirSync(opencodeSkillsDir, { recursive: true })
    writeFileSync(
      join(opencodeSkillsDir, "SKILL.md"),
      `---
name: writing-skills
description: External doctrine skill
---
writing-skills body
`
    )

    process.env.OPENCODE_CONFIG_DIR = join(testDir, "opencode-config")
    process.env.CLAUDE_CONFIG_DIR = join(testDir, "claude-config")

    const { createSkillContext } = await import("./skill-context")
    const context = await createSkillContext({
      directory: testDir,
      pluginConfig: {},
    })

    expect(context.disabledSkills.has("writing-skills")).toBe(true)
    expect(context.mergedSkills.some((skill) => skill.name === "writing-skills")).toBe(false)
    expect(context.availableSkills.some((skill) => skill.name === "writing-skills")).toBe(false)
  })
})
