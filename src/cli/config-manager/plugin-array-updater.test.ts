import { describe, expect, it } from "bun:test"

import { upsertManagedPluginEntry } from "./plugin-array-updater"

describe("upsertManagedPluginEntry", () => {
  it("adds the fork package when no managed entry exists", () => {
    expect(upsertManagedPluginEntry(["opencode-notifier"], "opencode-codex-orch")).toEqual([
      "opencode-notifier",
      "opencode-codex-orch",
    ])
  })

  it("keeps the array unchanged when the fork package is already present", () => {
    expect(upsertManagedPluginEntry(["opencode-codex-orch", "opencode-notifier"], "opencode-codex-orch"))
      .toEqual(["opencode-codex-orch", "opencode-notifier"])
  })
})
