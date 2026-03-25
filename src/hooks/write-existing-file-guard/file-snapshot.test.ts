import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, beforeEach, describe, expect, test } from "bun:test"

import {
  readFileSnapshot,
  snapshotsMatch,
  STRONG_SNAPSHOT_MAX_BYTES,
  type FileSnapshot,
} from "./file-snapshot"

describe("file snapshot tokens", () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "write-existing-file-guard-snapshot-"))
  })

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true })
  })

  test("#given file at or under 2MB #when reading snapshot #then returns strong token snapshot", () => {
    const filePath = join(tempDir, "small.txt")
    writeFileSync(filePath, Buffer.alloc(STRONG_SNAPSHOT_MAX_BYTES, 97))

    const snapshot = readFileSnapshot(filePath)
    expect(snapshot).toBeDefined()
    expect(snapshot?.tokenType).toBe("strong")
    if (snapshot?.tokenType === "strong") {
      expect(snapshot.contentHash.length).toBeGreaterThan(0)
    }
  })

  test("#given file above 2MB #when reading snapshot #then returns metadata-only snapshot", () => {
    const filePath = join(tempDir, "large.txt")
    writeFileSync(filePath, Buffer.alloc(STRONG_SNAPSHOT_MAX_BYTES + 1, 98))

    const snapshot = readFileSnapshot(filePath)
    expect(snapshot).toBeDefined()
    expect(snapshot?.tokenType).toBe("metadata")
  })

  test("#given strong snapshots with matching metadata but different hash #when matching #then reports stale", () => {
    const previous: FileSnapshot = {
      size: 128,
      mtimeMs: 1234,
      tokenType: "strong",
      contentHash: "aaa",
    }
    const current: FileSnapshot = {
      size: 128,
      mtimeMs: 1234,
      tokenType: "strong",
      contentHash: "bbb",
    }

    expect(snapshotsMatch(previous, current)).toBe(false)
  })

  test("#given metadata snapshots with matching stat fields #when matching #then allows", () => {
    const previous: FileSnapshot = {
      size: STRONG_SNAPSHOT_MAX_BYTES + 10,
      mtimeMs: 777,
      tokenType: "metadata",
    }
    const current: FileSnapshot = {
      size: STRONG_SNAPSHOT_MAX_BYTES + 10,
      mtimeMs: 777,
      tokenType: "metadata",
    }

    expect(snapshotsMatch(previous, current)).toBe(true)
  })
})
