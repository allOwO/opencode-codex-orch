import type { Hooks, PluginInput } from "@opencode-ai/plugin"

import { log } from "../../shared"
import { isModificationTool, isTrackedFileStateTool } from "../shared/modification-tools"
import {
  FILE_MUTATION_BUSY_MESSAGE,
  FILE_MUTATION_LEASE_WAIT_TIMEOUT_MS,
  MAX_TRACKED_PATHS_PER_SESSION,
  MAX_TRACKED_SESSIONS,
  READ_REQUIRED_MESSAGE,
  STALE_SNAPSHOT_MESSAGE,
} from "./constants"
import { createFileMutationLeaseStore } from "./file-mutation-lease-store"
import { readFileSnapshot, snapshotsMatch, type FileSnapshot } from "./file-snapshot"
import { asRecord, getPathFromArgs, isOverwriteEnabled, type GuardArgs } from "./guard-args"
import { isPathInsideDirectory, resolveInputPath, toCanonicalPath } from "./path-utils"
import { createSessionSnapshotStore } from "./session-snapshot-store"

type PendingModification = {
  canonicalPath: string
  sessionID: string
  resolvedPath: string
  snapshotBeforeCall?: FileSnapshot
}

export { MAX_TRACKED_PATHS_PER_SESSION } from "./constants"

export function createWriteExistingFileGuardHook(ctx: PluginInput): Hooks {
  const snapshots = createSessionSnapshotStore({
    maxSessions: MAX_TRACKED_SESSIONS,
    maxPathsPerSession: MAX_TRACKED_PATHS_PER_SESSION,
  })
  const fileMutationLeases = createFileMutationLeaseStore({
    waitTimeoutMs: FILE_MUTATION_LEASE_WAIT_TIMEOUT_MS,
  })
  const pendingByCall = new Map<string, PendingModification>()
  const canonicalSessionRoot = toCanonicalPath(resolveInputPath(ctx, ctx.directory))

  return {
    "tool.execute.before": async (input, output) => {
      const toolName = input.tool?.toLowerCase()
      if (!isTrackedFileStateTool(toolName)) {
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

      const leaseOwnerID = input.callID
      if (leaseOwnerID) {
        const acquiredLease = await fileMutationLeases.acquire(canonicalPath, leaseOwnerID)
        if (!acquiredLease) {
          throw new Error(FILE_MUTATION_BUSY_MESSAGE)
        }
      }

      const queuePendingModification = (snapshotBeforeCall?: FileSnapshot): void => {
        if (!input.callID || !input.sessionID) {
          return
        }

        pendingByCall.set(input.callID, {
          canonicalPath,
          sessionID: input.sessionID,
          resolvedPath,
          snapshotBeforeCall,
        })
      }

      const releaseLeaseIfHeld = (): void => {
        if (leaseOwnerID) {
          fileMutationLeases.release(canonicalPath, leaseOwnerID)
        }
      }

      try {
        const overwriteEnabled = isOverwriteEnabled(args?.overwrite)

        if (argsRecord && "overwrite" in argsRecord) {
          // Intentionally mutate output args so overwrite bypass remains hook-only.
          delete argsRecord.overwrite
        }

        const currentSnapshot = readFileSnapshot(resolvedPath)
        if (!currentSnapshot) {
          queuePendingModification(currentSnapshot)
          return
        }

        const isOpencodePath = canonicalPath.includes("/.opencode/")
        if (isOpencodePath) {
          log("[write-existing-file-guard] Allowing .opencode/** overwrite", {
            sessionID: input.sessionID,
            filePath,
          })
          queuePendingModification(currentSnapshot)
          return
        }

        if (overwriteEnabled) {
          log("[write-existing-file-guard] Allowing overwrite flag bypass", {
            sessionID: input.sessionID,
            filePath,
            resolvedPath,
          })
          queuePendingModification()
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
        queuePendingModification(currentSnapshot)
        log("[write-existing-file-guard] Allowing modification after snapshot match", {
          sessionID: input.sessionID,
          filePath,
          resolvedPath,
          toolName,
        })
      } catch (error) {
        releaseLeaseIfHeld()
        throw error
      }
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

      try {
        const nextSnapshot = readFileSnapshot(pending.resolvedPath)
        if (!nextSnapshot) {
          if (pending.snapshotBeforeCall) {
            snapshots.remember(input.sessionID, pending.canonicalPath, pending.snapshotBeforeCall)
          } else {
            snapshots.delete(input.sessionID, pending.canonicalPath)
          }
          return
        }

        if (pending.snapshotBeforeCall && snapshotsMatch(pending.snapshotBeforeCall, nextSnapshot)) {
          snapshots.remember(input.sessionID, pending.canonicalPath, pending.snapshotBeforeCall)
          return
        }

        snapshots.remember(input.sessionID, pending.canonicalPath, nextSnapshot)
      } finally {
        fileMutationLeases.release(pending.canonicalPath, input.callID)
      }
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
          fileMutationLeases.release(pending.canonicalPath, callID)
          pendingByCall.delete(callID)
        }
      }
    },
  }
}
