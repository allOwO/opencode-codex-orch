import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { existsSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"

import { MAX_TRACKED_PATHS_PER_SESSION, READ_REQUIRED_MESSAGE } from "./constants"
import { createHookHarness } from "./test-helpers"

function isCaseInsensitiveFilesystem(directory: string): boolean {
  const probeName = `CaseProbe_${Date.now()}_A.txt`
  const upperPath = join(directory, probeName)
  const lowerPath = join(directory, probeName.toLowerCase())

  writeFileSync(upperPath, "probe")
  try {
    return existsSync(lowerPath)
  } finally {
    rmSync(upperPath, { force: true })
  }
}

describe("createWriteExistingFileGuardHook path behavior", () => {
  let harness: ReturnType<typeof createHookHarness>

  beforeEach(() => {
    harness = createHookHarness()
  })

  afterEach(() => {
    harness.cleanup()
  })

  test("#given file arg variants #when read then write executes #then supports all variants", async () => {
    const existingFile = harness.createFile("variants.txt")

    for (const variant of ["filePath", "path", "file_path"] as const) {
      const sessionID = `ses_${variant}`
      await harness.invoke({ tool: "read", sessionID, outputArgs: { [variant]: existingFile } })
      await expect(
        harness.invoke({
          tool: "write",
          sessionID,
          outputArgs: { [variant]: existingFile, content: `overwrite via ${variant}` },
        })
      ).resolves.toBeDefined()
    }
  })

  test("#given relative read and absolute write #when same session writes #then allows", async () => {
    harness.createFile("relative-absolute.txt")
    const sessionID = "ses_relative_absolute"

    await harness.invoke({
      tool: "read",
      sessionID,
      outputArgs: { filePath: "relative-absolute.txt" },
    })

    await expect(
      harness.invoke({
        tool: "write",
        sessionID,
        outputArgs: { filePath: resolve(harness.tempDir, "relative-absolute.txt"), content: "updated" },
      })
    ).resolves.toBeDefined()
  })

  test("#given existing file outside session directory #when write executes #then allows", async () => {
    const outsideDir = mkdtempSync(join(tmpdir(), "write-existing-file-guard-outside-"))

    try {
      const outsideFile = join(outsideDir, "outside.txt")
      writeFileSync(outsideFile, "outside")

      await expect(
        harness.invoke({
          tool: "write",
          outputArgs: { filePath: outsideFile, content: "allowed overwrite" },
        })
      ).resolves.toBeDefined()
    } finally {
      rmSync(outsideDir, { recursive: true, force: true })
    }
  })

  test("#given case-different read path #when writing canonical path #then follows platform behavior", async () => {
    const canonicalFile = harness.createFile("CaseFile.txt")
    const lowerCasePath = join(harness.tempDir, "casefile.txt")
    const sessionID = "ses_case"

    await harness.invoke({ tool: "read", sessionID, outputArgs: { filePath: lowerCasePath } })

    const writeAttempt = harness.invoke({
      tool: "write",
      sessionID,
      outputArgs: { filePath: canonicalFile, content: "updated" },
    })

    if (isCaseInsensitiveFilesystem(harness.tempDir)) {
      await expect(writeAttempt).resolves.toBeDefined()
      return
    }

    await expect(writeAttempt).rejects.toThrow(READ_REQUIRED_MESSAGE)
  })

  test("#given read via symlink #when write via real path #then allows overwrite", async () => {
    const targetFile = harness.createFile("real/target.txt")
    const symlinkPath = join(harness.tempDir, "linked-target.txt")
    const sessionID = "ses_symlink"

    try {
      symlinkSync(targetFile, symlinkPath)
    } catch {
      return
    }

    await harness.invoke({ tool: "read", sessionID, outputArgs: { filePath: symlinkPath } })
    await expect(
      harness.invoke({
        tool: "write",
        sessionID,
        outputArgs: { filePath: targetFile, content: "updated via symlink read" },
      })
    ).resolves.toBeDefined()
  })

  test("#given session reads beyond path cap #when writing oldest and newest #then only newest is authorized", async () => {
    const sessionID = "ses_path_cap"
    const oldestFile = harness.createFile("path-cap/0.txt")
    let newestFile = oldestFile

    await harness.invoke({ tool: "read", sessionID, outputArgs: { filePath: oldestFile } })
    for (let index = 1; index <= MAX_TRACKED_PATHS_PER_SESSION; index += 1) {
      newestFile = harness.createFile(`path-cap/${index}.txt`)
      await harness.invoke({ tool: "read", sessionID, outputArgs: { filePath: newestFile } })
    }

    await expect(
      harness.runBefore({
        tool: "write",
        sessionID,
        outputArgs: { filePath: oldestFile, content: "stale write" },
      })
    ).rejects.toThrow(READ_REQUIRED_MESSAGE)

    await expect(
      harness.invoke({
        tool: "write",
        sessionID,
        outputArgs: { filePath: newestFile, content: "fresh write" },
      })
    ).resolves.toBeDefined()
  })

  test("#given recently active session #when lru evicts #then keeps recent session baseline", async () => {
    const existingFile = harness.createFile("lru.txt")
    const hotSession = "ses_hot"

    await harness.invoke({ tool: "read", sessionID: hotSession, outputArgs: { filePath: existingFile } })
    for (let index = 0; index < 255; index += 1) {
      await harness.invoke({
        tool: "read",
        sessionID: `ses_${index}`,
        outputArgs: { filePath: existingFile },
      })
    }

    await new Promise((resolvePromise) => setTimeout(resolvePromise, 2))
    await harness.invoke({ tool: "read", sessionID: hotSession, outputArgs: { filePath: existingFile } })
    await harness.invoke({
      tool: "read",
      sessionID: "ses_overflow",
      outputArgs: { filePath: existingFile },
    })

    await expect(
      harness.invoke({
        tool: "write",
        sessionID: hotSession,
        outputArgs: { filePath: existingFile, content: "hot session write" },
      })
    ).resolves.toBeDefined()
  })
})
