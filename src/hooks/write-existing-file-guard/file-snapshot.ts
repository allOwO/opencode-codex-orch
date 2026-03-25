import { readFileSync, statSync } from "node:fs"

export const STRONG_SNAPSHOT_MAX_BYTES = 2 * 1024 * 1024

type MetadataSnapshot = {
  size: number
  mtimeMs: number
  tokenType: "metadata"
}

type StrongSnapshot = {
  size: number
  mtimeMs: number
  tokenType: "strong"
  contentHash: string
}

type FileSnapshot = MetadataSnapshot | StrongSnapshot

function readStrongContentHash(filePath: string): string {
  return Bun.hash.xxHash3(readFileSync(filePath)).toString(16)
}

export function readFileSnapshot(filePath: string): FileSnapshot | undefined {
  try {
    const stat = statSync(filePath)
    if (stat.size > STRONG_SNAPSHOT_MAX_BYTES) {
      return {
        size: stat.size,
        mtimeMs: stat.mtimeMs,
        tokenType: "metadata",
      }
    }

    return {
      size: stat.size,
      mtimeMs: stat.mtimeMs,
      tokenType: "strong",
      contentHash: readStrongContentHash(filePath),
    }
  } catch {
    return undefined
  }
}

export function snapshotsMatch(left: FileSnapshot, right: FileSnapshot | undefined): boolean {
  if (!right) {
    return false
  }

  if (left.size !== right.size || left.mtimeMs !== right.mtimeMs) {
    return false
  }

  if (left.tokenType === "metadata") {
    return true
  }

  return right.tokenType === "strong" && left.contentHash === right.contentHash
}

export type { FileSnapshot }
