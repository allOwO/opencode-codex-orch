import { afterEach, beforeEach, describe, expect, it } from "bun:test"
import { mkdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { findPluginEntry } from "./plugin-entry"
import { getLocalDevPath, isLocalDevMode } from "./local-dev-path"

describe("plugin-entry", () => {
  let directory = ""

  beforeEach(() => {
    directory = join(tmpdir(), `oco-update-checker-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    mkdirSync(join(directory, ".opencode"), { recursive: true })
  })

  afterEach(() => {
    rmSync(directory, { recursive: true, force: true })
  })

  it("finds the managed package entry in project config", () => {
    writeFileSync(
      join(directory, ".opencode", "opencode.json"),
      `${JSON.stringify({ plugin: ["opencode-codex-orch", "opencode-notifier"] }, null, 2)}\n`,
      "utf-8"
    )

    expect(findPluginEntry(directory)).toEqual({
      entry: "opencode-codex-orch",
      isPinned: false,
      pinnedVersion: null,
      configPath: join(directory, ".opencode", "opencode.json"),
    })
  })

  it("detects local file installs as local development mode", () => {
    const localPath = "file:///tmp/opencode-codex-orch/dist/index.js"
    writeFileSync(
      join(directory, ".opencode", "opencode.json"),
      `${JSON.stringify({ plugin: [localPath] }, null, 2)}\n`,
      "utf-8"
    )

    expect(isLocalDevMode(directory)).toBe(true)
    expect(getLocalDevPath(directory)).toBe("/tmp/opencode-codex-orch/dist/index.js")
  })
})
