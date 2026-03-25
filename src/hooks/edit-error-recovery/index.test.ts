import { describe, it, expect, beforeEach } from "bun:test"
import {
  createEditErrorRecoveryHook,
  EDIT_ERROR_REMINDER,
  EDIT_ERROR_PATTERNS,
  MODIFICATION_CONFLICT_REMINDER,
} from "./index"
import {
  FILE_MUTATION_BUSY_MESSAGE,
  READ_REQUIRED_MESSAGE,
  STALE_SNAPSHOT_MESSAGE,
} from "../write-existing-file-guard/constants"

describe("createEditErrorRecoveryHook", () => {
  let hook: ReturnType<typeof createEditErrorRecoveryHook>

  beforeEach(() => {
    hook = createEditErrorRecoveryHook({} as never)
  })

  describe("tool.execute.after", () => {
    const createInput = (tool: string) => ({
      tool,
      sessionID: "test-session",
      callID: "test-call-id",
    })

    const createOutput = (outputText: string) => ({
      title: "Edit",
      output: outputText,
      metadata: {},
    })

    describe("#given Edit tool with oldString/newString same error", () => {
      describe("#when the error message is detected", () => {
        it("#then should append the recovery reminder", async () => {
          const input = createInput("Edit")
          const output = createOutput("Error: oldString and newString must be different")

          await hook["tool.execute.after"](input, output)

          expect(output.output).toContain(EDIT_ERROR_REMINDER)
          expect(output.output).toContain("oldString and newString must be different")
        })
      })

      describe("#when the error appears without Error prefix", () => {
        it("#then should still detect and append reminder", async () => {
          const input = createInput("Edit")
          const output = createOutput("oldString and newString must be different")

          await hook["tool.execute.after"](input, output)

          expect(output.output).toContain(EDIT_ERROR_REMINDER)
        })
      })
    })

    describe("#given Edit tool with oldString not found error", () => {
      describe("#when oldString not found in content", () => {
        it("#then should append the recovery reminder", async () => {
          const input = createInput("Edit")
          const output = createOutput("Error: oldString not found in content")

          await hook["tool.execute.after"](input, output)

          expect(output.output).toContain(EDIT_ERROR_REMINDER)
        })
      })
    })

    describe("#given Edit tool with multiple matches error", () => {
      describe("#when oldString found multiple times", () => {
        it("#then should append the recovery reminder", async () => {
          const input = createInput("Edit")
          const output = createOutput(
            "Error: oldString found multiple times and requires more code context to uniquely identify the intended match"
          )

          await hook["tool.execute.after"](input, output)

          expect(output.output).toContain(EDIT_ERROR_REMINDER)
        })
      })
    })

    describe("#given non-Edit tool", () => {
      describe("#when tool is not Edit", () => {
        it("#then should not modify output", async () => {
          const input = createInput("Read")
          const originalOutput = "some output"
          const output = createOutput(originalOutput)

          await hook["tool.execute.after"](input, output)

          expect(output.output).toBe(originalOutput)
        })
      })
    })

    describe("#given Edit tool with successful output", () => {
      describe("#when no error in output", () => {
        it("#then should not modify output", async () => {
          const input = createInput("Edit")
          const originalOutput = "File edited successfully"
          const output = createOutput(originalOutput)

          await hook["tool.execute.after"](input, output)

          expect(output.output).toBe(originalOutput)
        })
      })
    })

    describe("#given Edit tool blocked by stale snapshot", () => {
      describe("#when stale snapshot message appears", () => {
        it("#then should append modification conflict reminder", async () => {
          const input = createInput("Edit")
          const output = createOutput(`Error: ${STALE_SNAPSHOT_MESSAGE}`)

          await hook["tool.execute.after"](input, output)

          expect(output.output).toContain(MODIFICATION_CONFLICT_REMINDER)
        })
      })
    })

    describe("#given Edit tool blocked without prior read", () => {
      describe("#when read-required message appears", () => {
        it("#then should append modification conflict reminder", async () => {
          const input = createInput("Edit")
          const output = createOutput(`Error: ${READ_REQUIRED_MESSAGE}`)

          await hook["tool.execute.after"](input, output)

          expect(output.output).toContain(MODIFICATION_CONFLICT_REMINDER)
        })
      })
    })

    describe("#given Write tool blocked by in-flight modification", () => {
      describe("#when busy message appears", () => {
        it("#then should append modification conflict reminder", async () => {
          const input = createInput("write")
          const output = createOutput(`Error: ${FILE_MUTATION_BUSY_MESSAGE}`)

          await hook["tool.execute.after"](input, output)

          expect(output.output).toContain(MODIFICATION_CONFLICT_REMINDER)
        })
      })
    })

    describe("#given MCP tool with undefined output.output", () => {
      describe("#when output.output is undefined", () => {
        it("#then should not crash", async () => {
          const input = createInput("Edit")
          const output = {
            title: "Edit",
            output: undefined as unknown as string,
            metadata: {},
          }

          await hook["tool.execute.after"](input, output)

          expect(output.output).toBeUndefined()
        })
      })
    })

    describe("#given case insensitive tool name", () => {
      describe("#when tool is 'edit' lowercase", () => {
        it("#then should still detect and append reminder", async () => {
          const input = createInput("edit")
          const output = createOutput("oldString and newString must be different")

          await hook["tool.execute.after"](input, output)

          expect(output.output).toContain(EDIT_ERROR_REMINDER)
        })
      })
    })
  })

  describe("EDIT_ERROR_PATTERNS", () => {
    it("#then should contain all known Edit error patterns", () => {
      expect(EDIT_ERROR_PATTERNS).toContain("oldString and newString must be different")
      expect(EDIT_ERROR_PATTERNS).toContain("oldString not found")
      expect(EDIT_ERROR_PATTERNS).toContain("oldString found multiple times")
    })
  })
})
