import type { AvailableSkill } from "../../agents/dynamic-agent-prompt-builder"
import type { HookName, OpenCodeCodexOrchConfig } from "../../config"
import type { LoadedSkill } from "../../features/opencode-skill-loader/types"
import type { PluginContext } from "../types"

// Removed: category-skill-reminder, auto-slash-command

export type SkillHooks = Record<string, never>

export function createSkillHooks(_args: {
  ctx: PluginContext
  pluginConfig: OpenCodeCodexOrchConfig
  isHookEnabled: (hookName: HookName) => boolean
  safeHookEnabled: boolean
  mergedSkills: LoadedSkill[]
  availableSkills: AvailableSkill[]
}): SkillHooks {
  return {}
}
