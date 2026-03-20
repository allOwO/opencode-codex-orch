import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs"
import { parseOcoConfigJson } from "../../shared"
import type { ConfigMergeResult, InstallConfig } from "../types"
import { getConfigDir, getOcoConfigPath } from "./config-context"
import { deepMergeRecord } from "./deep-merge-record"
import { ensureConfigDirectoryExists } from "./ensure-config-directory-exists"
import { formatErrorWithSuggestion } from "./format-error-with-suggestion"
import { generateOcoConfig } from "./generate-oco-config"

function isEmptyOrWhitespace(content: string): boolean {
  return content.trim().length === 0
}

export function writeOcoConfig(installConfig: InstallConfig): ConfigMergeResult {
  try {
    ensureConfigDirectoryExists()
  } catch (err) {
    return {
      success: false,
      configPath: getConfigDir(),
      error: formatErrorWithSuggestion(err, "create config directory"),
    }
  }

  const ocoConfigPath = getOcoConfigPath()

  try {
    const newConfig = generateOcoConfig(installConfig)

    if (existsSync(ocoConfigPath)) {
      try {
        const stat = statSync(ocoConfigPath)
        const content = readFileSync(ocoConfigPath, "utf-8")

        if (stat.size === 0 || isEmptyOrWhitespace(content)) {
          writeFileSync(ocoConfigPath, `${JSON.stringify(newConfig, null, 2)}\n`)
          return { success: true, configPath: ocoConfigPath }
        }

        const existing = parseOcoConfigJson<Record<string, unknown>>(content)
        if (!existing || typeof existing !== "object" || Array.isArray(existing)) {
          writeFileSync(ocoConfigPath, `${JSON.stringify(newConfig, null, 2)}\n`)
          return { success: true, configPath: ocoConfigPath }
        }

        const merged = deepMergeRecord(newConfig, existing)
        writeFileSync(ocoConfigPath, `${JSON.stringify(merged, null, 2)}\n`)
      } catch (parseErr) {
        if (parseErr instanceof SyntaxError) {
          writeFileSync(ocoConfigPath, `${JSON.stringify(newConfig, null, 2)}\n`)
          return { success: true, configPath: ocoConfigPath }
        }
        throw parseErr
      }
    } else {
      writeFileSync(ocoConfigPath, `${JSON.stringify(newConfig, null, 2)}\n`)
    }

    return { success: true, configPath: ocoConfigPath }
  } catch (err) {
    return {
      success: false,
      configPath: ocoConfigPath,
      error: formatErrorWithSuggestion(err, "write opencode-codex-orch config"),
    }
  }
}
