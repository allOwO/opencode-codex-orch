import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"

import { createWriteExistingFileGuardHook } from "./index"

type Hook = ReturnType<typeof createWriteExistingFileGuardHook>

type BeforeArgs = {
  tool: string
  sessionID?: string
  outputArgs: Record<string, unknown>
}

type Invocation = {
  input: { tool: string; sessionID: string; callID: string }
  output: { args: Record<string, unknown> }
}

export function createHookHarness(): {
  tempDir: string
  hook: Hook
  createFile: (relativePath: string, content?: string) => string
  runBefore: (args: BeforeArgs) => Promise<Invocation>
  runAfter: (invocation: Invocation, output?: string | undefined | null) => Promise<void>
  invoke: (args: BeforeArgs & { afterOutput?: string }) => Promise<Invocation>
  emitSessionDeleted: (sessionID: string) => Promise<void>
  cleanup: () => void
} {
  const tempDir = mkdtempSync(join(tmpdir(), "write-existing-file-guard-"))
  const hook = createWriteExistingFileGuardHook({ directory: tempDir } as never)
  let callCounter = 0

  const createFile = (relativePath: string, content = "existing content"): string => {
    const absolutePath = join(tempDir, relativePath)
    mkdirSync(dirname(absolutePath), { recursive: true })
    writeFileSync(absolutePath, content)
    return absolutePath
  }

  const runBefore = async (args: BeforeArgs): Promise<Invocation> => {
    callCounter += 1
    const input = {
      tool: args.tool,
      sessionID: args.sessionID ?? "ses_default",
      callID: `call_${callCounter}`,
    }
    const output = { args: { ...args.outputArgs } }
    await hook["tool.execute.before"]?.(input as never, output as never)
    return { input, output }
  }

  const runAfter = async (
    invocation: Invocation,
    output: string | undefined | null = `${invocation.input.tool} success`
  ): Promise<void> => {
    await hook["tool.execute.after"]?.(
      invocation.input as never,
      output == null
        ? (undefined as never)
        : ({ title: invocation.input.tool, output, metadata: {} } as never)
    )
  }

  return {
    tempDir,
    hook,
    createFile,
    runBefore,
    runAfter,
    invoke: async (args) => {
      const invocation = await runBefore(args)
      if (args.tool !== "read") {
        await runAfter(invocation, args.afterOutput)
      }
      return invocation
    },
    emitSessionDeleted: async (sessionID) => {
      await hook.event?.({
        event: { type: "session.deleted", properties: { info: { id: sessionID } } } as never,
      })
    },
    cleanup: () => {
      rmSync(tempDir, { recursive: true, force: true })
    },
  }
}
