import { existsSync, readFileSync } from "node:fs"

import { OpenCodeCodexOrchConfigSchema } from "../../../config"
import {
	parseOcoConfigJson,
	resolveExistingOcoConfigFilePath,
	resolveExistingProjectOcoConfigFilePath,
} from "../../../shared/oco-config-file"
import { getOpenCodeConfigDir } from "../../../shared/opencode-config-dir"
import type { OcoConfig } from "./model-resolution-types"

export interface ConfigValidationResult {
  exists: boolean
  path: string | null
  valid: boolean
  config: OcoConfig | null
  errors: string[]
}

export function findConfigPath(): string | null {
  const projectConfigPath = resolveExistingProjectOcoConfigFilePath(process.cwd())
  const userConfigPath = resolveExistingOcoConfigFilePath(
    getOpenCodeConfigDir({ binary: "opencode" })
  )

  if (existsSync(projectConfigPath)) {
    return projectConfigPath
  }

  if (existsSync(userConfigPath)) {
    return userConfigPath
  }

  return null
}

export function validateConfig(): ConfigValidationResult {
  const configPath = findConfigPath()
  if (!configPath) {
    return { exists: false, path: null, valid: true, config: null, errors: [] }
  }

  try {
    const rawConfig = parseOcoConfigJson<OcoConfig>(readFileSync(configPath, "utf-8"))
    const schemaResult = OpenCodeCodexOrchConfigSchema.safeParse(rawConfig)

    if (!schemaResult.success) {
      return {
        exists: true,
        path: configPath,
        valid: false,
        config: rawConfig,
        errors: schemaResult.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`),
      }
    }

    return { exists: true, path: configPath, valid: true, config: rawConfig, errors: [] }
  } catch (error) {
    return {
      exists: true,
      path: configPath,
      valid: false,
      config: null,
      errors: [error instanceof Error ? error.message : "Failed to parse config"],
    }
  }
}
