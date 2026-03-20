import { existsSync, readFileSync } from "node:fs"

import {
  extractPinnedVersionFromPluginEntry,
  getPluginEntrySource,
  isManagedPluginEntry,
} from "../../../cli/plugin-reference"
import { parseJsonc } from "../../../shared/jsonc-parser"
import type { PluginEntryInfo } from "../types"
import { getConfigPaths } from "./config-paths"

interface OpencodeConfig {
  plugin?: string[]
}

function isExplicitVersionPin(version: string | null): boolean {
  return version !== null && /^\d+\.\d+\.\d+/.test(version)
}

export function findPluginEntry(directory: string): PluginEntryInfo | null {
  for (const configPath of getConfigPaths(directory)) {
    try {
      if (!existsSync(configPath)) continue

      const config = parseJsonc<OpencodeConfig>(readFileSync(configPath, "utf-8"))
      for (const entry of config.plugin ?? []) {
        if (!isManagedPluginEntry(entry)) continue
        if (getPluginEntrySource(entry) === "github") continue

        const pinnedVersion = extractPinnedVersionFromPluginEntry(entry)
        return {
          entry,
          isPinned: isExplicitVersionPin(pinnedVersion),
          pinnedVersion,
          configPath,
        }
      }
    } catch {
      continue
    }
  }

  return null
}
