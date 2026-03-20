import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"

export const OCO_CONFIG_FILENAME = "opencode-codex-orch.json"

export function getOcoConfigFilePath(directory: string): string {
  return join(directory, OCO_CONFIG_FILENAME)
}

export function resolveExistingOcoConfigFilePath(directory: string): string {
  return getOcoConfigFilePath(directory)
}

export function getProjectOcoConfigFilePath(projectRoot: string): string {
  return getOcoConfigFilePath(join(projectRoot, ".opencode"))
}

export function resolveExistingProjectOcoConfigFilePath(projectRoot: string): string {
  return resolveExistingOcoConfigFilePath(join(projectRoot, ".opencode"))
}

export function parseOcoConfigJson<T = unknown>(content: string): T {
  return JSON.parse(content) as T
}

export function readOcoConfigFile<T = unknown>(filePath: string): T | null {
  if (!existsSync(filePath)) {
    return null
  }

  try {
    return parseOcoConfigJson<T>(readFileSync(filePath, "utf-8"))
  } catch {
    return null
  }
}
