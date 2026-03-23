import { statSync } from "fs"

type FileSnapshot = {
  size: number
  mtimeMs: number
  ino?: number
}

export function readFileSnapshot(filePath: string): FileSnapshot | undefined {
  try {
    const stat = statSync(filePath)
    return {
      size: stat.size,
      mtimeMs: stat.mtimeMs,
      ino: typeof stat.ino === "number" ? stat.ino : undefined,
    }
  } catch {
    return undefined
  }
}

export function snapshotsMatch(left: FileSnapshot, right: FileSnapshot | undefined): boolean {
  return !!right
    && left.size === right.size
    && left.mtimeMs === right.mtimeMs
    && left.ino === right.ino
}

export type { FileSnapshot }
