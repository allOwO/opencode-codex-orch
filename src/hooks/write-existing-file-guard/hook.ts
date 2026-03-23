import type { Hooks, PluginInput } from "@opencode-ai/plugin"

import { log } from "../../shared"
import {
  MAX_TRACKED_PATHS_PER_SESSION,
  MAX_TRACKED_SESSIONS,
  READ_REQUIRED_MESSAGE,
  STALE_SNAPSHOT_MESSAGE,
} from "./constants"
import { readFileSnapshot, snapshotsMatch, type FileSnapshot } from "./file-snapshot"
import { asRecord, getPathFromArgs, isOverwriteEnabled, type GuardArgs } from "./guard-args"
import { isPathInsideDirectory, resolveInputPath, toCanonicalPath } from "./path-utils"
import { createSessionSnapshotStore } from "./session-snapshot-store"

type PendingModification = {
  sessionID: string
  resolvedPath: string
  snapshotBeforeCall?: FileSnapshot
}

export { MAX_TRACKED_PATHS_PER_SESSION } from "./constants"

function isModificationTool(toolName: string | undefined): boolean {
  return toolName === "write" || toolName === "edit" || toolName === "multiedit"
}

function isTrackedTool(toolName: string | undefined): boolean {
  return toolName === "read" || isModificationTool(toolName)
}

export function createWriteExistingFileGuardHook(ctx: PluginInput): Hooks {
  const snapshots = createSessionSnapshotStore({
    maxSessions: MAX_TRACKED_SESSIONS,
    maxPathsPerSession: MAX_TRACKED_PATHS_PER_SESSION,
  })
  const pendingByCall = new Map<string, PendingModification>()
  const canonicalSessionRoot = toCanonicalPath(resolveInputPath(ctx, ctx.directory))

  const queuePendingModification = (
    input: { callID?: string; sessionID?: string },
    resolvedPath: string,
    snapshotBeforeCall?: FileSnapshot
  ): void => {
    if (!input.callID || !input.sessionID) {
      return
    }

    pendingByCall.set(input.callID, {
      sessionID: input.sessionID,
      resolvedPath,
      snapshotBeforeCall,
    })
  }

  return {
    "tool.execute.before": async (input, output) => {
      const toolName = input.tool?.toLowerCase()
      if (!isTrackedTool(toolName)) {
        return
      }

      const argsRecord = asRecord(output.args)
      const args = argsRecord as GuardArgs | undefined
      const filePath = getPathFromArgs(args)
      if (!filePath) {
        return
      }

      const resolvedPath = resolveInputPath(ctx, filePath)
      const canonicalPath = toCanonicalPath(resolvedPath)
      const isInsideSessionDirectory = isPathInsideDirectory(canonicalPath, canonicalSessionRoot)

      if (!isInsideSessionDirectory) {
        return
      }

      if (toolName === "read") {
        if (!input.sessionID) {
          return
        }

        const currentSnapshot = readFileSnapshot(resolvedPath)
        if (!currentSnapshot) {
          return
        }

        snapshots.remember(input.sessionID, canonicalPath, currentSnapshot)
        return
      }

      const overwriteEnabled = isOverwriteEnabled(args?.overwrite)

      if (argsRecord && "overwrite" in argsRecord) {
        // Intentionally mutate output args so overwrite bypass remains hook-only.
        delete argsRecord.overwrite
      }

      const currentSnapshot = readFileSnapshot(resolvedPath)
      if (!currentSnapshot) {
        queuePendingModification(input, resolvedPath, currentSnapshot)
        return
      }

      const isSisyphusPath = canonicalPath.includes("/.sisyphus/")
      if (isSisyphusPath) {
        log("[write-existing-file-guard] Allowing .sisyphus/** overwrite", {
          sessionID: input.sessionID,
          filePath,
        })
        queuePendingModification(input, resolvedPath, currentSnapshot)
        return
      }

      if (overwriteEnabled) {
        log("[write-existing-file-guard] Allowing overwrite flag bypass", {
          sessionID: input.sessionID,
          filePath,
          resolvedPath,
        })
        queuePendingModification(input, resolvedPath)
        return
      }

      if (!input.sessionID) {
        throw new Error(READ_REQUIRED_MESSAGE)
      }

      const previousSnapshot = snapshots.get(input.sessionID, canonicalPath)
      if (!previousSnapshot) {
        log("[write-existing-file-guard] Blocking modification without snapshot", {
          sessionID: input.sessionID,
          filePath,
          resolvedPath,
          toolName,
        })
        throw new Error(READ_REQUIRED_MESSAGE)
      }

      if (!snapshotsMatch(previousSnapshot, currentSnapshot)) {
        snapshots.delete(input.sessionID, canonicalPath)
        log("[write-existing-file-guard] Blocking modification with stale snapshot", {
          sessionID: input.sessionID,
          filePath,
          resolvedPath,
          toolName,
        })
        throw new Error(STALE_SNAPSHOT_MESSAGE)
      }

      snapshots.delete(input.sessionID, canonicalPath)
      queuePendingModification(input, resolvedPath, currentSnapshot)
      log("[write-existing-file-guard] Allowing modification after snapshot match", {
        sessionID: input.sessionID,
        filePath,
        resolvedPath,
        toolName,
      })
    },
    "tool.execute.after": async (input) => {
      const toolName = input.tool?.toLowerCase()
      if (!isModificationTool(toolName) || !input.callID || !input.sessionID) {
        return
      }

      const pending = pendingByCall.get(input.callID)
      if (!pending || pending.sessionID !== input.sessionID) {
        return
      }

      pendingByCall.delete(input.callID)

      const canonicalPath = toCanonicalPath(pending.resolvedPath)
      const nextSnapshot = readFileSnapshot(pending.resolvedPath)
      if (!nextSnapshot) {
        if (pending.snapshotBeforeCall) {
          snapshots.remember(input.sessionID, canonicalPath, pending.snapshotBeforeCall)
        } else {
          snapshots.delete(input.sessionID, canonicalPath)
        }
        return
      }

      if (pending.snapshotBeforeCall && snapshotsMatch(pending.snapshotBeforeCall, nextSnapshot)) {
        snapshots.remember(input.sessionID, canonicalPath, pending.snapshotBeforeCall)
        return
      }

      snapshots.remember(input.sessionID, canonicalPath, nextSnapshot)
    },
    event: async ({ event }: { event: { type: string; properties?: unknown } }) => {
      if (event.type !== "session.deleted") {
        return
      }

      const props = event.properties as { info?: { id?: string } } | undefined
      const sessionID = props?.info?.id
      if (!sessionID) {
        return
      }

      snapshots.removeSession(sessionID)
      for (const [callID, pending] of pendingByCall.entries()) {
        if (pending.sessionID === sessionID) {
          pendingByCall.delete(callID)
        }
      }
    },
  }
}
