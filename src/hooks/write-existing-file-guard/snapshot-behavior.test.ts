import { afterEach, beforeEach, describe, expect, test } from "bun:test"

import { READ_REQUIRED_MESSAGE } from "./constants"
import { createHookHarness } from "./test-helpers"

describe("createWriteExistingFileGuardHook snapshot behavior", () => {
  let harness: ReturnType<typeof createHookHarness>

  beforeEach(() => {
    harness = createHookHarness()
  })

  afterEach(() => {
    harness.cleanup()
  })

  test("#given existing file without baseline #when write executes #then blocks", async () => {
    const existingFile = harness.createFile("existing.txt")

    await expect(
      harness.runBefore({
        tool: "write",
        outputArgs: { filePath: existingFile, content: "new content" },
      })
    ).rejects.toThrow(READ_REQUIRED_MESSAGE)
  })

  test("#given read baseline #when repeated writes execute #then they succeed without reread", async () => {
    const existingFile = harness.createFile("repeat-write.txt")
    const sessionID = "ses_repeat_write"

    await harness.invoke({ tool: "read", sessionID, outputArgs: { filePath: existingFile } })
    await expect(
      harness.invoke({
        tool: "write",
        sessionID,
        outputArgs: { filePath: existingFile, content: "first overwrite" },
      })
    ).resolves.toBeDefined()

    await expect(
      harness.invoke({
        tool: "write",
        sessionID,
        outputArgs: { filePath: existingFile, content: "second overwrite" },
      })
    ).resolves.toBeDefined()
  })

  test("#given edit success #when write executes #then updated baseline is reused", async () => {
    const existingFile = harness.createFile("edit-then-write.txt")
    const sessionID = "ses_edit_then_write"

    await harness.invoke({ tool: "read", sessionID, outputArgs: { filePath: existingFile } })
    await expect(
      harness.invoke({
        tool: "edit",
        sessionID,
        outputArgs: { filePath: existingFile, oldString: "old", newString: "new" },
      })
    ).resolves.toBeDefined()

    await expect(
      harness.invoke({
        tool: "write",
        sessionID,
        outputArgs: { filePath: existingFile, content: "after edit" },
      })
    ).resolves.toBeDefined()
  })

  test("#given new file write #when subsequent write executes #then stored baseline allows it", async () => {
    const filePath = `${harness.tempDir}/created.txt`
    const sessionID = "ses_new_file"

    await expect(
      harness.invoke({
        tool: "write",
        sessionID,
        outputArgs: { filePath, content: "created" },
      })
    ).resolves.toBeDefined()

    await expect(
      harness.invoke({
        tool: "write",
        sessionID,
        outputArgs: { filePath, content: "updated" },
      })
    ).resolves.toBeDefined()
  })

  test("#given same-session concurrent writes #when one baseline is in flight #then only one before-call succeeds", async () => {
    const existingFile = harness.createFile("concurrent.txt")
    const sessionID = "ses_concurrent"

    await harness.invoke({ tool: "read", sessionID, outputArgs: { filePath: existingFile } })

    const results = await Promise.allSettled([
      harness.runBefore({
        tool: "write",
        sessionID,
        outputArgs: { filePath: existingFile, content: "first attempt" },
      }),
      harness.runBefore({
        tool: "write",
        sessionID,
        outputArgs: { filePath: existingFile, content: "second attempt" },
      }),
    ])

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1)
    const failures = results.filter(
      (result): result is PromiseRejectedResult => result.status === "rejected"
    )
    expect(String(failures[0]?.reason)).toContain(READ_REQUIRED_MESSAGE)
  })

  test("#given failed write #when later write executes #then previous baseline is restored", async () => {
    const existingFile = harness.createFile("restore-after-failure.txt")
    const sessionID = "ses_restore"

    await harness.invoke({ tool: "read", sessionID, outputArgs: { filePath: existingFile } })
    const failedWrite = await harness.runBefore({
      tool: "write",
      sessionID,
      outputArgs: { filePath: existingFile, content: "attempt" },
    })
    await harness.runAfter(failedWrite, undefined)

    await expect(
      harness.invoke({
        tool: "write",
        sessionID,
        outputArgs: { filePath: existingFile, content: "retry" },
      })
    ).resolves.toBeDefined()
  })

  test("#given failed write with unchanged file and non-error text #when later write executes #then baseline is still restored", async () => {
    const existingFile = harness.createFile("restore-without-error-text.txt")
    const sessionID = "ses_restore_no_text"

    await harness.invoke({ tool: "read", sessionID, outputArgs: { filePath: existingFile } })
    const failedWrite = await harness.runBefore({
      tool: "write",
      sessionID,
      outputArgs: { filePath: existingFile, content: "attempt" },
    })
    await harness.runAfter(failedWrite, "permission denied")

    await expect(
      harness.invoke({
        tool: "write",
        sessionID,
        outputArgs: { filePath: existingFile, content: "retry" },
      })
    ).resolves.toBeDefined()
  })
})
