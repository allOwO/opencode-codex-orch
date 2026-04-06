import { describe, expect, test, beforeEach, afterEach } from "bun:test"
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { clearState, readState, writeState, type RalphLoopState } from "./storage"

describe("ralph-loop storage", () => {
  const testDir = join(tmpdir(), `ralph-loop-storage-${Date.now()}`)
  const canonicalDir = join(testDir, ".opencode")
  const legacyDir = join(testDir, ".sisyphus")

  const sampleState: RalphLoopState = {
    active: true,
    iteration: 2,
    completion_promise: "DONE",
    initial_completion_promise: "DONE",
    started_at: "2026-04-07T00:00:00.000Z",
    prompt: "keep going",
    session_id: "ses-1",
  }

  beforeEach(() => {
    mkdirSync(testDir, { recursive: true })
    clearState(testDir)
  })

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true })
  })

  test("writes new state to the canonical .opencode directory", () => {
    writeState(testDir, sampleState)

    expect(existsSync(join(canonicalDir, "ralph-loop-state.json"))).toBe(true)
    expect(existsSync(join(legacyDir, "ralph-loop-state.json"))).toBe(false)
  })

  test("reads legacy .sisyphus state when canonical state is absent", () => {
    mkdirSync(legacyDir, { recursive: true })
    writeFileSync(join(legacyDir, "ralph-loop-state.json"), `${JSON.stringify(sampleState, null, 2)}\n`, "utf-8")

    expect(readState(testDir)).toEqual(sampleState)
  })

  test("keeps legacy state untouched when canonical state is written", () => {
    mkdirSync(legacyDir, { recursive: true })
    const legacyState: RalphLoopState = { ...sampleState, session_id: "legacy-session" }
    writeFileSync(join(legacyDir, "ralph-loop-state.json"), `${JSON.stringify(legacyState, null, 2)}\n`, "utf-8")

    writeState(testDir, sampleState)

    expect(JSON.parse(readFileSync(join(legacyDir, "ralph-loop-state.json"), "utf-8"))).toEqual(legacyState)
    expect(JSON.parse(readFileSync(join(canonicalDir, "ralph-loop-state.json"), "utf-8"))).toEqual(sampleState)
  })
})
