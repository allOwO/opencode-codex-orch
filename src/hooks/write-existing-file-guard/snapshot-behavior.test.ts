import { writeFileSync } from "node:fs"
import { afterEach, beforeEach, describe, expect, test } from "bun:test"

import {
  FILE_MUTATION_BUSY_MESSAGE,
  READ_REQUIRED_MESSAGE,
  STALE_SNAPSHOT_MESSAGE,
} from "./constants"
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

  test("#given existing file without baseline #when apply_patch executes #then blocks", async () => {
    const existingFile = harness.createFile("existing-apply-patch.txt")

    await expect(
      harness.runBefore({
        tool: "apply_patch",
        outputArgs: { filePath: existingFile, patch: "*** Begin Patch\n*** End Patch" },
      })
    ).rejects.toThrow(READ_REQUIRED_MESSAGE)
  })

  test("#given read baseline #when patch executes #then allows", async () => {
    const existingFile = harness.createFile("patch-after-read.txt")
    const sessionID = "ses_patch_after_read"

    await harness.invoke({ tool: "read", sessionID, outputArgs: { path: existingFile } })
    await expect(
      harness.invoke({
        tool: "patch",
        sessionID,
        outputArgs: { file_path: existingFile, patch: "@@\n-old\n+new" },
      })
    ).resolves.toBeDefined()
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
    expect(String(failures[0]?.reason)).toContain(FILE_MUTATION_BUSY_MESSAGE)
  })

  test("#given queued same-file write #when first write completes quickly #then second write reuses refreshed baseline", async () => {
    const existingFile = harness.createFile("queued-write.txt")
    const sessionID = "ses_queued_write"

    await harness.invoke({ tool: "read", sessionID, outputArgs: { filePath: existingFile } })
    const firstWrite = await harness.runBefore({
      tool: "write",
      sessionID,
      outputArgs: { filePath: existingFile, content: "first overwrite" },
    })

    const queuedWrite = harness.runBefore({
      tool: "write",
      sessionID,
      outputArgs: { filePath: existingFile, content: "second overwrite" },
    })

    await new Promise((resolvePromise) => setTimeout(resolvePromise, 50))
    await harness.runAfter(firstWrite, "write success")

    await expect(queuedWrite).resolves.toBeDefined()
  })

  test("#given stale snapshot #when apply_patch executes #then blocks with stale message", async () => {
    const existingFile = harness.createFile("stale-apply-patch.txt", "before")
    const sessionID = "ses_stale_apply_patch"

    await harness.invoke({ tool: "read", sessionID, outputArgs: { filePath: existingFile } })
    writeFileSync(existingFile, "changed externally")

    await expect(
      harness.runBefore({
        tool: "apply_patch",
        sessionID,
        outputArgs: { filePath: existingFile, patch: "@@\n-before\n+after" },
      })
    ).rejects.toThrow(STALE_SNAPSHOT_MESSAGE)
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
