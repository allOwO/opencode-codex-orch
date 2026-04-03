/// <reference types="bun-types" />

import { describe, expect, test } from "bun:test"
import { mkdirSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import type { OpenCodeCodexOrchConfig } from "../config"

const EMPTY_PLUGIN_COMPONENTS = {
  commands: {},
  agents: {},
  mcpServers: {},
  hooksConfigs: [],
  plugins: [],
  errors: [],
}

describe("applyCommandConfig", () => {
  test("does not merge plugin skills into command config", async () => {
    const config: Record<string, unknown> = {}

    const { applyCommandConfig } = await import("./command-config-handler")
    await applyCommandConfig({
      config,
      pluginConfig: {} as OpenCodeCodexOrchConfig,
      ctx: { directory: process.cwd() },
      pluginComponents: {
        ...EMPTY_PLUGIN_COMPONENTS,
        skills: {
          "daplug:plugin-plan": {
            description: "plugin skill exposed as command",
            template: "skill content",
          },
        },
      } as typeof EMPTY_PLUGIN_COMPONENTS & { skills: Record<string, unknown> },
    })

    const commands = config.command as Record<string, unknown>
    expect(commands["daplug:plugin-plan"]).toBeUndefined()
  })

  test("adds runtime-configured skill paths without replacing fixed OpenCode skills", async () => {
    const rootDir = join(tmpdir(), `command-config-handler-${Date.now()}-${Math.random().toString(16).slice(2)}`)
    const originalOpenCodeConfigDir = process.env.OPENCODE_CONFIG_DIR

    const fixedSkillDir = join(rootDir, "opencode-config", "skills", "fixed-skill")
    const runtimeSkillDir = join(rootDir, "runtime-skills", "runtime-skill")

    mkdirSync(fixedSkillDir, { recursive: true })
    mkdirSync(runtimeSkillDir, { recursive: true })
    writeFileSync(join(fixedSkillDir, "SKILL.md"), `---\nname: fixed-skill\ndescription: Fixed skill\n---\nfixed`)
    writeFileSync(join(runtimeSkillDir, "SKILL.md"), `---\nname: runtime-skill\ndescription: Runtime skill\n---\nruntime`)

    process.env.OPENCODE_CONFIG_DIR = join(rootDir, "opencode-config")

    try {
      const config: Record<string, unknown> = {
        skills: {
          paths: [`${rootDir}/runtime-skills`],
        },
      }

      const { applyCommandConfig } = await import("./command-config-handler")
      await applyCommandConfig({
        config,
        pluginConfig: {} as OpenCodeCodexOrchConfig,
        ctx: { directory: rootDir },
        pluginComponents: EMPTY_PLUGIN_COMPONENTS,
      })

      const commands = config.command as Record<string, unknown>
      expect(commands["fixed-skill"]).toBeDefined()
      expect(commands["runtime-skill"]).toBeDefined()
    } finally {
      if (originalOpenCodeConfigDir === undefined) {
        delete process.env.OPENCODE_CONFIG_DIR
      } else {
        process.env.OPENCODE_CONFIG_DIR = originalOpenCodeConfigDir
      }
      rmSync(rootDir, { recursive: true, force: true })
    }
  })
})
