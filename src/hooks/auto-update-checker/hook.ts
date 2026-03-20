import type { PluginInput } from "@opencode-ai/plugin"

import { runBunInstall } from "../../cli/config-manager"
import { log } from "../../shared/logger"
import { invalidatePackage } from "./cache"
import { PACKAGE_NAME } from "./constants"
import type { AutoUpdateCheckerOptions } from "./types"
import { checkForUpdate, findPluginEntry } from "./checker"

type ToastVariant = "info" | "success" | "warning" | "error"

type ToastClient = {
  tui?: {
    showToast?: (input: {
      body: {
        title: string
        message: string
        variant: ToastVariant
        duration: number
      }
    }) => Promise<unknown>
  }
}

async function showToast(client: PluginInput["client"], title: string, message: string, variant: ToastVariant): Promise<void> {
  const toastClient = client as ToastClient
  await toastClient.tui?.showToast?.({
    body: { title, message, variant, duration: 5000 },
  })
}

async function runBackgroundUpdateCheck(ctx: PluginInput, autoUpdate: boolean): Promise<void> {
  const result = await checkForUpdate(ctx.directory)
  if (!result.needsUpdate || !result.latestVersion || !result.currentVersion) return

  if (!autoUpdate || result.isPinned) {
    await showToast(
      ctx.client,
      "Plugin update available",
      `Update available: ${result.currentVersion} -> ${result.latestVersion}`,
      "info"
    ).catch(() => {})
    return
  }

  const pluginInfo = findPluginEntry(ctx.directory)
  if (!pluginInfo) return

  invalidatePackage(PACKAGE_NAME)
  const installSuccess = await runBunInstall().catch(() => false)

  if (installSuccess) {
    await showToast(
      ctx.client,
      "Plugin updated",
      `Updated ${result.currentVersion} -> ${result.latestVersion}. Restart OpenCode to use the new version.`,
      "success"
    ).catch(() => {})
    return
  }

  log("[auto-update-checker] Auto-update failed", { from: result.currentVersion, to: result.latestVersion })
  await showToast(
    ctx.client,
    "Plugin update failed",
    `Failed to auto-update to ${result.latestVersion}. Try running bun install in the OpenCode cache directory.`,
    "warning"
  ).catch(() => {})
}

export function createAutoUpdateCheckerHook(ctx: PluginInput, options: AutoUpdateCheckerOptions = {}) {
  const autoUpdate = options.autoUpdate ?? true
  const isCliRunMode = process.env.OPENCODE_CLI_RUN_MODE === "true"
  let hasChecked = false

  return {
    event: ({ event }: { event: { type: string; properties?: unknown } }): void => {
      if (event.type !== "session.created") return
      if (isCliRunMode || hasChecked) return

      const props = event.properties as { info?: { parentID?: string } } | undefined
      if (props?.info?.parentID) return

      hasChecked = true

      setTimeout(() => {
        runBackgroundUpdateCheck(ctx, autoUpdate).catch((error) => {
          log("[auto-update-checker] Background update check failed", { error })
        })
      }, 0)
    },
  }
}
