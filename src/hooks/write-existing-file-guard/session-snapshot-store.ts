import type { FileSnapshot } from "./file-snapshot"

type SessionSnapshots = Map<string, FileSnapshot>

export function createSessionSnapshotStore(args: {
  maxSessions: number
  maxPathsPerSession: number
}): {
  remember: (sessionID: string, canonicalPath: string, snapshot: FileSnapshot) => void
  get: (sessionID: string, canonicalPath: string) => FileSnapshot | undefined
  delete: (sessionID: string, canonicalPath: string) => void
  removeSession: (sessionID: string) => void
} {
  const { maxSessions, maxPathsPerSession } = args
  const snapshotsBySession = new Map<string, SessionSnapshots>()
  const sessionLastAccess = new Map<string, number>()

  const touchSession = (sessionID: string): void => {
    sessionLastAccess.set(sessionID, Date.now())
  }

  const evictLeastRecentlyUsedSession = (): void => {
    let oldestSessionID: string | undefined
    let oldestSeen = Number.POSITIVE_INFINITY

    for (const [sessionID, lastSeen] of sessionLastAccess.entries()) {
      if (lastSeen < oldestSeen) {
        oldestSeen = lastSeen
        oldestSessionID = sessionID
      }
    }

    if (!oldestSessionID) {
      return
    }

    snapshotsBySession.delete(oldestSessionID)
    sessionLastAccess.delete(oldestSessionID)
  }

  const ensureSessionSnapshots = (sessionID: string): SessionSnapshots => {
    let sessionSnapshots = snapshotsBySession.get(sessionID)
    if (!sessionSnapshots) {
      if (snapshotsBySession.size >= maxSessions) {
        evictLeastRecentlyUsedSession()
      }

      sessionSnapshots = new Map<string, FileSnapshot>()
      snapshotsBySession.set(sessionID, sessionSnapshots)
    }

    touchSession(sessionID)
    return sessionSnapshots
  }

  const trimSessionSnapshots = (sessionSnapshots: SessionSnapshots): void => {
    while (sessionSnapshots.size > maxPathsPerSession) {
      const oldestPath = sessionSnapshots.keys().next().value
      if (!oldestPath) {
        return
      }

      sessionSnapshots.delete(oldestPath)
    }
  }

  return {
    remember: (sessionID, canonicalPath, snapshot) => {
      const sessionSnapshots = ensureSessionSnapshots(sessionID)
      if (sessionSnapshots.has(canonicalPath)) {
        sessionSnapshots.delete(canonicalPath)
      }

      sessionSnapshots.set(canonicalPath, snapshot)
      trimSessionSnapshots(sessionSnapshots)
    },
    get: (sessionID, canonicalPath) => {
      const sessionSnapshots = snapshotsBySession.get(sessionID)
      if (!sessionSnapshots) {
        return undefined
      }

      touchSession(sessionID)
      return sessionSnapshots.get(canonicalPath)
    },
    delete: (sessionID, canonicalPath) => {
      const sessionSnapshots = snapshotsBySession.get(sessionID)
      if (!sessionSnapshots) {
        return
      }

      sessionSnapshots.delete(canonicalPath)
      touchSession(sessionID)
    },
    removeSession: (sessionID) => {
      snapshotsBySession.delete(sessionID)
      sessionLastAccess.delete(sessionID)
    },
  }
}
