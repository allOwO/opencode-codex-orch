import type { OpenCodeCodexOrchConfig, HookName } from "../../config"
import type { ModelCacheState } from "../../plugin-state"
import type { PluginContext } from "../types"

import {
  createAutoUpdateCheckerHook,
  createEditErrorRecoveryHook,
  createModelFallbackHook,
  createRuntimeFallbackHook,
  createSessionRecoveryHook,
} from "../../hooks"
import {
  normalizeSDKResponse,
} from "../../shared"
import { safeCreateHook } from "../../shared/safe-create-hook"

export type SessionHooks = {
  autoUpdateChecker: ReturnType<typeof createAutoUpdateCheckerHook> | null
  sessionRecovery: ReturnType<typeof createSessionRecoveryHook> | null
  modelFallback: ReturnType<typeof createModelFallbackHook> | null
  editErrorRecovery: ReturnType<typeof createEditErrorRecoveryHook> | null
  runtimeFallback: ReturnType<typeof createRuntimeFallbackHook> | null
}

export function createSessionHooks(args: {
  ctx: PluginContext
  pluginConfig: OpenCodeCodexOrchConfig
  modelCacheState: ModelCacheState
  isHookEnabled: (hookName: HookName) => boolean
  safeHookEnabled: boolean
}): SessionHooks {
  const { ctx, pluginConfig, isHookEnabled, safeHookEnabled } = args
  const safeHook = <T>(hookName: HookName, factory: () => T): T | null =>
    safeCreateHook(hookName, factory, { enabled: safeHookEnabled })

  const sessionRecovery = isHookEnabled("session-recovery")
    ? safeHook("session-recovery", () =>
      createSessionRecoveryHook(ctx, { experimental: pluginConfig.experimental }))
    : null

  const enableFallbackTitle = pluginConfig.experimental?.model_fallback_title ?? false
  const fallbackTitleMaxEntries = 200
  const fallbackTitleState = new Map<string, { baseTitle?: string; lastKey?: string }>()
  const updateFallbackTitle = async (input: {
    sessionID: string
    providerID: string
    modelID: string
    variant?: string
  }) => {
    if (!enableFallbackTitle) return
    const key = `${input.providerID}/${input.modelID}${input.variant ? `:${input.variant}` : ""}`
    const existing = fallbackTitleState.get(input.sessionID) ?? {}
    if (existing.lastKey === key) return

    if (!existing.baseTitle) {
      const sessionResp = await ctx.client.session.get({ path: { id: input.sessionID } }).catch(() => null)
      const sessionInfo = sessionResp
        ? normalizeSDKResponse(sessionResp, null as { title?: string } | null, { preferResponseOnMissingData: true })
        : null
      const rawTitle = sessionInfo?.title
      if (typeof rawTitle === "string" && rawTitle.length > 0) {
        existing.baseTitle = rawTitle.replace(/\s*\[fallback:[^\]]+\]$/i, "").trim()
      } else {
        existing.baseTitle = "Session"
      }
    }

    const variantLabel = input.variant ? ` ${input.variant}` : ""
    const newTitle = `${existing.baseTitle} [fallback: ${input.providerID}/${input.modelID}${variantLabel}]`

    await ctx.client.session
      .update({
        path: { id: input.sessionID },
        body: { title: newTitle },
        query: { directory: ctx.directory },
      })
      .catch(() => { })

    existing.lastKey = key
    fallbackTitleState.set(input.sessionID, existing)
    if (fallbackTitleState.size > fallbackTitleMaxEntries) {
      const oldestKey = fallbackTitleState.keys().next().value
      if (oldestKey) fallbackTitleState.delete(oldestKey)
    }
  }

  // Model fallback hook (configurable via model_fallback config + disabled_hooks)
  const isModelFallbackConfigEnabled = pluginConfig.model_fallback ?? false
  const modelFallback = isModelFallbackConfigEnabled && isHookEnabled("model-fallback")
    ? safeHook("model-fallback", () =>
      createModelFallbackHook({
        toast: async ({ title, message, variant, duration }) => {
          await ctx.client.tui
            .showToast({
              body: {
                title,
                message,
                variant: variant ?? "warning",
                duration: duration ?? 5000,
              },
            })
            .catch(() => { })
        },
        onApplied: enableFallbackTitle ? updateFallbackTitle : undefined,
      }))
    : null

  const editErrorRecovery = isHookEnabled("edit-error-recovery")
    ? safeHook("edit-error-recovery", () => createEditErrorRecoveryHook(ctx))
    : null

  const runtimeFallbackConfig =
    typeof pluginConfig.runtime_fallback === "boolean"
      ? { enabled: pluginConfig.runtime_fallback }
      : pluginConfig.runtime_fallback

  const runtimeFallback = isHookEnabled("runtime-fallback")
    ? safeHook("runtime-fallback", () =>
      createRuntimeFallbackHook(ctx, {
        config: runtimeFallbackConfig,
        pluginConfig,
      }))
    : null

  const autoUpdateChecker = isHookEnabled("auto-update-checker")
    ? safeHook("auto-update-checker", () =>
      createAutoUpdateCheckerHook(ctx, {
        autoUpdate: pluginConfig.auto_update ?? true,
      }))
    : null

  return {
    autoUpdateChecker,
    sessionRecovery,
    modelFallback,
    editErrorRecovery,
    runtimeFallback,
  }
}
