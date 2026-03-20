import type { OpenCodeCodexOrchConfig } from "../../config"
import type { PluginContext } from "../types"

import {
  contextCollector,
  createContextInjectorMessagesTransformHook,
} from "../../features/context-injector"

// Removed: claude-code-hooks, keyword-detector, thinking-block-validator

export type TransformHooks = {
  contextInjectorMessagesTransform: ReturnType<typeof createContextInjectorMessagesTransformHook>
}

export function createTransformHooks(args: {
  ctx: PluginContext
  pluginConfig: OpenCodeCodexOrchConfig
  isHookEnabled: (hookName: string) => boolean
  safeHookEnabled?: boolean
}): TransformHooks {
  const contextInjectorMessagesTransform =
    createContextInjectorMessagesTransformHook(contextCollector)

  return {
    contextInjectorMessagesTransform,
  }
}
