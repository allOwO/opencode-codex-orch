import type { OpenCodeCodexOrchConfig } from "../config"
import type { PluginContext } from "./types"

import type { BackgroundManager } from "../features/background-agent"

export function createUnstableAgentBabysitter(args: {
  ctx: PluginContext
  backgroundManager: BackgroundManager
  pluginConfig: OpenCodeCodexOrchConfig
}) {
  void args
  return null
}
