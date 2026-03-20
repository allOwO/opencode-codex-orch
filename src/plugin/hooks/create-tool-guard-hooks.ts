import type { HookName, OpenCodeCodexOrchConfig } from "../../config"
import type { ModelCacheState } from "../../plugin-state"
import type { PluginContext } from "../types"

import {
  createToolOutputTruncatorHook,
  createDirectoryAgentsInjectorHook,
  createDirectoryReadmeInjectorHook,
  createRulesInjectorHook,
  createWriteExistingFileGuardHook,
  createHashlineReadEnhancerHook,
} from "../../hooks"
import {
  getOpenCodeVersion,
  isOpenCodeVersionAtLeast,
  log,
  OPENCODE_NATIVE_AGENTS_INJECTION_VERSION,
} from "../../shared"
import { safeCreateHook } from "../../shared/safe-create-hook"

export type ToolGuardHooks = {
  toolOutputTruncator: ReturnType<typeof createToolOutputTruncatorHook> | null
  directoryAgentsInjector: ReturnType<typeof createDirectoryAgentsInjectorHook> | null
  directoryReadmeInjector: ReturnType<typeof createDirectoryReadmeInjectorHook> | null
  rulesInjector: ReturnType<typeof createRulesInjectorHook> | null
  writeExistingFileGuard: ReturnType<typeof createWriteExistingFileGuardHook> | null
  hashlineReadEnhancer: ReturnType<typeof createHashlineReadEnhancerHook> | null
}

export function createToolGuardHooks(args: {
  ctx: PluginContext
  pluginConfig: OpenCodeCodexOrchConfig
  modelCacheState: ModelCacheState
  isHookEnabled: (hookName: HookName) => boolean
  safeHookEnabled: boolean
}): ToolGuardHooks {
  const { ctx, pluginConfig, modelCacheState, isHookEnabled, safeHookEnabled } = args
  const safeHook = <T>(hookName: HookName, factory: () => T): T | null =>
    safeCreateHook(hookName, factory, { enabled: safeHookEnabled })

  const toolOutputTruncator = isHookEnabled("tool-output-truncator")
    ? safeHook("tool-output-truncator", () =>
      createToolOutputTruncatorHook(ctx, {
        modelCacheState,
        experimental: pluginConfig.experimental,
      }))
    : null

  let directoryAgentsInjector: ReturnType<typeof createDirectoryAgentsInjectorHook> | null = null
  if (isHookEnabled("directory-agents-injector")) {
    const currentVersion = getOpenCodeVersion()
    const hasNativeSupport =
      currentVersion !== null && isOpenCodeVersionAtLeast(OPENCODE_NATIVE_AGENTS_INJECTION_VERSION)
    if (hasNativeSupport) {
      log("directory-agents-injector auto-disabled due to native OpenCode support", {
        currentVersion,
        nativeVersion: OPENCODE_NATIVE_AGENTS_INJECTION_VERSION,
      })
    } else {
      directoryAgentsInjector = safeHook("directory-agents-injector", () =>
        createDirectoryAgentsInjectorHook(ctx, modelCacheState))
    }
  }

  const directoryReadmeInjector = isHookEnabled("directory-readme-injector")
    ? safeHook("directory-readme-injector", () =>
      createDirectoryReadmeInjectorHook(ctx, modelCacheState))
    : null

  const rulesInjector = isHookEnabled("rules-injector")
    ? safeHook("rules-injector", () =>
      createRulesInjectorHook(ctx, modelCacheState))
    : null

  const writeExistingFileGuard = isHookEnabled("write-existing-file-guard")
    ? safeHook("write-existing-file-guard", () => createWriteExistingFileGuardHook(ctx))
    : null

  const hashlineReadEnhancer = isHookEnabled("hashline-read-enhancer")
    ? safeHook("hashline-read-enhancer", () => createHashlineReadEnhancerHook(ctx, { hashline_edit: { enabled: pluginConfig.hashline_edit ?? false } }))
    : null

  return {
    toolOutputTruncator,
    directoryAgentsInjector,
    directoryReadmeInjector,
    rulesInjector,
    writeExistingFileGuard,
    hashlineReadEnhancer,
  }
}
