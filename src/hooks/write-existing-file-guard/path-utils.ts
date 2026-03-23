import type { PluginInput } from "@opencode-ai/plugin"

import { existsSync, realpathSync } from "fs"
import { basename, dirname, isAbsolute, join, normalize, relative, resolve } from "path"

export function resolveInputPath(ctx: PluginInput, inputPath: string): string {
  return normalize(isAbsolute(inputPath) ? inputPath : resolve(ctx.directory, inputPath))
}

export function isPathInsideDirectory(pathToCheck: string, directory: string): boolean {
  const relativePath = relative(directory, pathToCheck)
  return relativePath === "" || (!relativePath.startsWith("..") && !isAbsolute(relativePath))
}

export function toCanonicalPath(absolutePath: string): string {
  if (existsSync(absolutePath)) {
    try {
      return normalize(realpathSync.native(absolutePath))
    } catch {
      return normalize(absolutePath)
    }
  }

  const absoluteDir = dirname(absolutePath)
  const resolvedDir = existsSync(absoluteDir) ? realpathSync.native(absoluteDir) : absoluteDir
  return normalize(join(resolvedDir, basename(absolutePath)))
}
