import type { HookName, OpenCodeCodexOrchConfig } from "../../config"
import type { BackgroundManager } from "../../features/background-agent"
import type { PluginContext } from "../types"

// Continuation hooks stripped to empty — all removed hooks:
// stop-continuation-guard, compaction-context-injector, compaction-todo-preserver,
// todo-continuation-enforcer, unstable-agent-babysitter, background-notification, atlas

export type ContinuationHooks = Record<string, never>

type SessionRecovery = {
  setOnAbortCallback: (callback: (sessionID: string) => void) => void
  setOnRecoveryCompleteCallback: (callback: (sessionID: string) => void) => void
} | null

export function createContinuationHooks(_args: {
  ctx: PluginContext
  pluginConfig: OpenCodeCodexOrchConfig
  isHookEnabled: (hookName: HookName) => boolean
  safeHookEnabled: boolean
  backgroundManager: BackgroundManager
  sessionRecovery: SessionRecovery
}): ContinuationHooks {
  return {}
}
