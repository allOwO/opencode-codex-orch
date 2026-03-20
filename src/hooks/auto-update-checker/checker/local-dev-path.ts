import { existsSync, readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"

import { getPluginEntrySource, isManagedPluginEntry } from "../../../cli/plugin-reference"
import { parseJsonc } from "../../../shared/jsonc-parser"
import { getConfigPaths } from "./config-paths"

interface OpencodeConfig {
  plugin?: string[]
}

export function getLocalDevPath(directory: string): string | null {
  for (const configPath of getConfigPaths(directory)) {
    try {
      if (!existsSync(configPath)) continue

      const config = parseJsonc<OpencodeConfig>(readFileSync(configPath, "utf-8"))
      for (const entry of config.plugin ?? []) {
        if (!isManagedPluginEntry(entry)) continue
        if (getPluginEntrySource(entry) !== "file") continue

        try {
          return fileURLToPath(entry)
        } catch {
          return entry.replace(/^file:\/\//, "")
        }
      }
    } catch {
      continue
    }
  }

  return null
}

export function isLocalDevMode(directory: string): boolean {
  return getLocalDevPath(directory) !== null
}
