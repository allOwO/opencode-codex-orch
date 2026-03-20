import { describe, expect, it } from "bun:test"

import {
  extractPinnedVersionFromPluginEntry,
  getPluginEntrySource,
  getPreferredPluginEntry,
  isManagedPluginEntry,
} from "./plugin-reference"

describe("plugin-reference", () => {
  it("returns the package name as the preferred install source", () => {
    expect(getPreferredPluginEntry()).toBe("opencode-codex-orch@latest")
  })

  it("matches package and local file entries for this fork", () => {
    expect(isManagedPluginEntry("opencode-codex-orch@0.0.1")).toBe(true)
    expect(isManagedPluginEntry("file:///tmp/opencode-codex-orch/dist/index.js")).toBe(true)
  })

  it("extracts pinned versions from managed package entries", () => {
    expect(extractPinnedVersionFromPluginEntry("opencode-codex-orch@1.2.3")).toBe("1.2.3")
  })

  it("classifies plugin entry sources", () => {
    expect(getPluginEntrySource("github:allOwO/opencode-codex-orch")).toBe("github")
    expect(getPluginEntrySource("file:///tmp/opencode-codex-orch/dist/index.js")).toBe("file")
    expect(getPluginEntrySource("opencode-codex-orch")).toBe("package")
  })
})
