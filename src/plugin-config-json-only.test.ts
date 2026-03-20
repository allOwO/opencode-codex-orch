import { afterEach, beforeEach, describe, expect, it } from "bun:test"
import { mkdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { loadConfigFromPath, loadPluginConfig } from "./plugin-config"

describe("plugin config JSON-only loading", () => {
  let tempDir = ""
  let originalConfigDir: string | undefined

  beforeEach(() => {
    tempDir = join(tmpdir(), `oco-plugin-config-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    mkdirSync(tempDir, { recursive: true })
    originalConfigDir = process.env.OPENCODE_CONFIG_DIR
    process.env.OPENCODE_CONFIG_DIR = join(tempDir, "user-config")
    mkdirSync(process.env.OPENCODE_CONFIG_DIR, { recursive: true })
  })

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true })
    if (originalConfigDir === undefined) {
      delete process.env.OPENCODE_CONFIG_DIR
      return
    }

    process.env.OPENCODE_CONFIG_DIR = originalConfigDir
  })

  it("rejects plugin config comments and trailing commas", () => {
    const configPath = join(tempDir, "invalid.json")
    writeFileSync(configPath, '{\n  // comment\n  "disabled_hooks": ["foo"],\n}\n', "utf-8")

    expect(loadConfigFromPath(configPath, null)).toBeNull()
  })

  it("ignores .jsonc plugin config files during discovery", () => {
    const projectDir = join(tempDir, "project")
    mkdirSync(join(projectDir, ".opencode"), { recursive: true })
    writeFileSync(
      join(projectDir, ".opencode", "opencode-codex-orch.jsonc"),
      '{\n  "disabled_hooks": ["jsonc-only"]\n}\n',
      "utf-8"
    )

    expect(loadPluginConfig(projectDir, null)).toEqual({})
  })
})
