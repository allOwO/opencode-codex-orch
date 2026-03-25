import type { PluginInput } from "@opencode-ai/plugin"

import { isModificationTool } from "../shared/modification-tools"
import {
  FILE_MUTATION_BUSY_MESSAGE,
  READ_REQUIRED_MESSAGE,
  STALE_SNAPSHOT_MESSAGE,
} from "../write-existing-file-guard/constants"

/**
 * Known Edit tool error patterns that indicate the AI made a mistake
 */
export const EDIT_ERROR_PATTERNS = [
  "oldString and newString must be different",
  "oldString not found",
  "oldString found multiple times",
] as const

/**
 * System reminder injected when Edit tool fails due to AI mistake
 * Short, direct, and commanding - forces immediate corrective action
 */
export const EDIT_ERROR_REMINDER = `
[EDIT ERROR - IMMEDIATE ACTION REQUIRED]

You made an Edit mistake. STOP and do this NOW:

1. READ the file immediately to see its ACTUAL current state
2. VERIFY what the content really looks like (your assumption was wrong)
3. APOLOGIZE briefly to the user for the error
4. CONTINUE with corrected action based on the real file content

DO NOT attempt another edit until you've read and verified the file state.
`

export const MODIFICATION_CONFLICT_REMINDER = `
[MODIFICATION CONFLICT - IMMEDIATE ACTION REQUIRED]

Your edit/write request was blocked because the file state is stale.

1. READ the file immediately to refresh your snapshot
2. RECHECK your intended change against the new content
3. RETRY the edit/write only after confirming the current state

Do not retry the same edit blindly with a stale snapshot.
`

const MODIFICATION_CONFLICT_PATTERNS = [
  FILE_MUTATION_BUSY_MESSAGE,
  READ_REQUIRED_MESSAGE,
  STALE_SNAPSHOT_MESSAGE,
] as const

/**
 * Detects Edit tool errors caused by AI mistakes and injects a recovery reminder
 *
 * This hook catches common Edit tool failures:
 * - oldString and newString must be different (trying to "edit" to same content)
 * - oldString not found (wrong assumption about file content)
 * - oldString found multiple times (ambiguous match, need more context)
 *
 * @see https://github.com/sst/opencode/issues/4718
 */
export function createEditErrorRecoveryHook(_ctx: PluginInput) {
  return {
    "tool.execute.after": async (
      input: { tool: string; sessionID: string; callID: string },
      output: { title: string; output: string; metadata: unknown }
    ) => {
      const toolName = input.tool.toLowerCase()
      if (!isModificationTool(toolName)) return
      if (typeof output.output !== "string") return

      const outputLower = (output.output ?? "").toLowerCase()
      const hasEditError =
        toolName === "edit"
        && EDIT_ERROR_PATTERNS.some((pattern) => outputLower.includes(pattern.toLowerCase()))

      const hasModificationConflict = MODIFICATION_CONFLICT_PATTERNS.some((pattern) =>
        outputLower.includes(pattern.toLowerCase())
      )

      if (hasEditError) {
        output.output += `\n${EDIT_ERROR_REMINDER}`
        return
      }

      if (hasModificationConflict) {
        output.output += `\n${MODIFICATION_CONFLICT_REMINDER}`
      }
    },
  }
}
