import { afterEach, beforeEach, describe, expect, it } from "bun:test"
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import type { InstallConfig } from "../types"
import { resetConfigContext } from "./config-context"
import { generateOcoConfig } from "./generate-oco-config"
import { writeOcoConfig } from "./write-oco-config"

const installConfig: InstallConfig = {
  hasClaude: true,
  isMax20: true,
  hasOpenAI: true,
  hasGemini: true,
  hasCopilot: false,
  hasOpencodeZen: false,
  hasZaiCodingPlan: false,
  hasKimiForCoding: false,
}

function getRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }

  return {}
}

describe("writeOcoConfig", () => {
  let testConfigDir = ""
  let testConfigPath = ""

  beforeEach(() => {
    testConfigDir = join(tmpdir(), `oco-write-config-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    testConfigPath = join(testConfigDir, "opencode-codex-orch.json")

    mkdirSync(testConfigDir, { recursive: true })
    process.env.OPENCODE_CONFIG_DIR = testConfigDir
    resetConfigContext()
  })

  afterEach(() => {
    rmSync(testConfigDir, { recursive: true, force: true })
    resetConfigContext()
    delete process.env.OPENCODE_CONFIG_DIR
  })

  it("preserves existing user values while adding new defaults", () => {
    // given
    const existingConfig = {
      agents: {
        orchestrator: {
          model: "custom/provider-model",
        },
      },
      disabled_hooks: ["comment-checker"],
    }
    writeFileSync(testConfigPath, `${JSON.stringify(existingConfig, null, 2)}\n`, "utf-8")

    const generatedDefaults = generateOcoConfig(installConfig)

    // when
    const result = writeOcoConfig(installConfig)

    // then
    expect(result.success).toBe(true)

    const savedConfig = JSON.parse(readFileSync(testConfigPath, "utf-8")) as Record<string, unknown>
    const savedAgents = getRecord(savedConfig.agents)
    const savedSisyphus = getRecord(savedAgents.orchestrator)
    expect(savedSisyphus.model).toBe("custom/provider-model")
    expect(savedConfig.disabled_hooks).toEqual(["comment-checker"])

    for (const defaultKey of Object.keys(generatedDefaults)) {
      expect(savedConfig).toHaveProperty(defaultKey)
    }
  })

  it("replaces invalid JSONC-style content with valid JSON", () => {
    writeFileSync(testConfigPath, '{\n  // invalid json\n  "agents": {}\n}\n', "utf-8")

    const result = writeOcoConfig(installConfig)

    expect(result.success).toBe(true)
    expect(() => JSON.parse(readFileSync(testConfigPath, "utf-8"))).not.toThrow()
  })
})
