import { afterEach, beforeEach, describe, expect, test } from "bun:test"

import { READ_REQUIRED_MESSAGE } from "./constants"
import { createHookHarness } from "./test-helpers"

describe("createWriteExistingFileGuardHook compatibility behavior", () => {
  let harness: ReturnType<typeof createHookHarness>

  beforeEach(() => {
    harness = createHookHarness()
  })

  afterEach(() => {
    harness.cleanup()
  })

  test("#given non-existing file #when write executes #then allows", async () => {
    await expect(
      harness.invoke({
        tool: "write",
        outputArgs: { filePath: `${harness.tempDir}/new-file.txt`, content: "new content" },
      })
    ).resolves.toBeDefined()
  })

  test("#given read in another session #when write executes #then blocks", async () => {
    const existingFile = harness.createFile("cross-session.txt")

    await harness.invoke({
      tool: "read",
      sessionID: "ses_reader",
      outputArgs: { filePath: existingFile },
    })

    await expect(
      harness.runBefore({
        tool: "write",
        sessionID: "ses_writer",
        outputArgs: { filePath: existingFile, content: "new content" },
      })
    ).rejects.toThrow(READ_REQUIRED_MESSAGE)
  })

  test("#given overwrite true variants #when write executes #then bypasses guard and strips overwrite", async () => {
    for (const overwrite of [true, "true"] as const) {
      const existingFile = harness.createFile(`overwrite-${String(overwrite)}.txt`)

      const result = await harness.invoke({
        tool: "write",
        outputArgs: { filePath: existingFile, content: "new content", overwrite },
      })

      expect(result.output.args.overwrite).toBeUndefined()
    }
  })

  test("#given overwrite falsy values #when write executes #then does not bypass guard", async () => {
    const existingFile = harness.createFile("overwrite-falsy.txt")

    for (const overwrite of [false, "false"] as const) {
      await expect(
        harness.runBefore({
          tool: "write",
          outputArgs: { filePath: existingFile, content: "new content", overwrite },
        })
      ).rejects.toThrow(READ_REQUIRED_MESSAGE)
    }
  })

  test("#given existing file under .sisyphus #when write executes #then always allows", async () => {
    const existingFile = harness.createFile(".sisyphus/plans/plan.txt")

    await expect(
      harness.invoke({
        tool: "write",
        outputArgs: { filePath: existingFile, content: "new plan" },
      })
    ).resolves.toBeDefined()
  })

  test("#given non-tracked tool #when it executes #then does not grant baseline", async () => {
    const existingFile = harness.createFile("ignored-tool.txt")
    const sessionID = "ses_ignored_tool"

    await harness.invoke({
      tool: "edit_preview",
      sessionID,
      outputArgs: { filePath: existingFile },
    })

    await expect(
      harness.runBefore({
        tool: "write",
        sessionID,
        outputArgs: { filePath: existingFile, content: "should block" },
      })
    ).rejects.toThrow(READ_REQUIRED_MESSAGE)
  })

  test("#given session baseline #when session deleted #then later writes are blocked", async () => {
    const existingFile = harness.createFile("cleanup.txt")
    const sessionID = "ses_cleanup"

    await harness.invoke({ tool: "read", sessionID, outputArgs: { filePath: existingFile } })
    await harness.emitSessionDeleted(sessionID)

    await expect(
      harness.runBefore({
        tool: "write",
        sessionID,
        outputArgs: { filePath: existingFile, content: "after cleanup" },
      })
    ).rejects.toThrow(READ_REQUIRED_MESSAGE)
  })
})
