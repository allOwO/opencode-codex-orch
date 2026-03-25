export const MAX_TRACKED_SESSIONS = 256
export const MAX_TRACKED_PATHS_PER_SESSION = 1024
export const FILE_MUTATION_LEASE_WAIT_TIMEOUT_MS = 500

export const READ_REQUIRED_MESSAGE =
  "Read the current file contents before editing or writing it."
export const STALE_SNAPSHOT_MESSAGE =
  "Modification conflict: file changed since your last read or write. Read it again before retrying the edit or write."
export const FILE_MUTATION_BUSY_MESSAGE =
  "Modification conflict: another edit or write for this file is already in progress. Wait for it to finish, then read the file again before retrying."
