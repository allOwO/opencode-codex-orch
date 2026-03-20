import { existsSync, readFileSync } from "node:fs"

import {
  extractPinnedVersionFromPluginEntry,
  getPluginEntrySource,
  isManagedPluginEntry,
} from "../../plugin-reference"
import { getOpenCodeConfigPaths } from "../../../shared/opencode-config-dir"
import { parseJsonc } from "../../../shared/jsonc-parser"

export interface PluginInfo {
  registered: boolean
  configPath: string | null
  entry: string | null
  isPinned: boolean
  pinnedVersion: string | null
  isLocalDev: boolean
  source: "package" | "github" | "file" | null
}

interface OpenCodeConfigShape {
  plugin?: string[]
}

function detectConfigPath(): string | null {
  const paths = getOpenCodeConfigPaths({ binary: "opencode", version: null })
  if (existsSync(paths.configJsonc)) return paths.configJsonc
  if (existsSync(paths.configJson)) return paths.configJson
  return null
}

function findPluginEntry(entries: string[]): {
  entry: string
  isLocalDev: boolean
  source: "package" | "github" | "file"
} | null {
  for (const entry of entries) {
    if (!isManagedPluginEntry(entry)) continue
    const source = getPluginEntrySource(entry)
    return { entry, isLocalDev: source === "file", source }
  }

  return null
}

export function getPluginInfo(): PluginInfo {
  const configPath = detectConfigPath()
  if (!configPath) {
    return {
      registered: false,
      configPath: null,
      entry: null,
      isPinned: false,
      pinnedVersion: null,
      isLocalDev: false,
      source: null,
    }
  }

  try {
    const content = readFileSync(configPath, "utf-8")
    const parsedConfig = parseJsonc<OpenCodeConfigShape>(content)
    const pluginEntry = findPluginEntry(parsedConfig.plugin ?? [])
    if (!pluginEntry) {
      return {
        registered: false,
        configPath,
        entry: null,
        isPinned: false,
        pinnedVersion: null,
        isLocalDev: false,
        source: null,
      }
    }

    const pinnedVersion = extractPinnedVersionFromPluginEntry(pluginEntry.entry)
    return {
      registered: true,
      configPath,
      entry: pluginEntry.entry,
      isPinned: pinnedVersion !== null && /^\d+\.\d+\.\d+/.test(pinnedVersion),
      pinnedVersion,
      isLocalDev: pluginEntry.isLocalDev,
      source: pluginEntry.source,
    }
  } catch {
    return {
      registered: false,
      configPath,
      entry: null,
      isPinned: false,
      pinnedVersion: null,
      isLocalDev: false,
      source: null,
    }
  }
}

export { detectConfigPath, findPluginEntry }
