import { isAbsolute, join } from "node:path"
import { getOpenCodeConfigDir } from "../../shared/opencode-config-dir"

type RuntimeConfigSkillPaths = {
  skills?: {
    paths?: unknown
  }
}

function parseRuntimeConfigContent(runtimeConfigContent: string | undefined): unknown {
  if (!runtimeConfigContent) return undefined

  try {
    return JSON.parse(runtimeConfigContent)
  } catch {
    return undefined
  }
}

export function readRuntimeConfigSkillPaths(options: {
  runtimeConfig?: unknown
  runtimeConfigContent?: string
} = {}): string[] {
  const parsedConfig = (options.runtimeConfig ??
    parseRuntimeConfigContent(options.runtimeConfigContent)) as RuntimeConfigSkillPaths | undefined

  const rawPaths = parsedConfig?.skills?.paths
  if (!Array.isArray(rawPaths)) return []

  return rawPaths
    .flatMap((entry) => {
      if (typeof entry === "string") return [entry]
      if (entry && typeof entry === "object" && "path" in entry && typeof entry.path === "string") {
        return [entry.path]
      }
      return []
    })
    .map((path) => path.trim())
    .filter((path) => path.length > 0)
}

export function resolveRuntimeSkillPathCandidates(path: string, directory: string): string[] {
  if (isAbsolute(path)) return [path]

  const opencodeConfigDir = getOpenCodeConfigDir({ binary: "opencode" })
  return [join(directory, path), join(opencodeConfigDir, path)]
}
