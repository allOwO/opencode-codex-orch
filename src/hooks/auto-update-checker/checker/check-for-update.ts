import { log } from "../../../shared/logger"
import type { UpdateCheckResult } from "../types"
import { extractChannel } from "../version-channel"
import { findPluginEntry } from "./plugin-entry"
import { getCachedVersion } from "./cached-version"
import { getLatestVersion } from "./latest-version"
import { isLocalDevMode } from "./local-dev-path"

export async function checkForUpdate(directory: string): Promise<UpdateCheckResult> {
  if (isLocalDevMode(directory)) {
    return {
      needsUpdate: false,
      currentVersion: null,
      latestVersion: null,
      isLocalDev: true,
      isPinned: false,
    }
  }

  const pluginInfo = findPluginEntry(directory)
  if (!pluginInfo) {
    return {
      needsUpdate: false,
      currentVersion: null,
      latestVersion: null,
      isLocalDev: false,
      isPinned: false,
    }
  }

  const currentVersion = getCachedVersion() ?? pluginInfo.pinnedVersion
  if (!currentVersion) {
    return {
      needsUpdate: false,
      currentVersion: null,
      latestVersion: null,
      isLocalDev: false,
      isPinned: pluginInfo.isPinned,
    }
  }

  const channel = extractChannel(pluginInfo.pinnedVersion ?? currentVersion)
  const latestVersion = await getLatestVersion(channel)
  if (!latestVersion) {
    log("[auto-update-checker] Failed to fetch latest version", { channel })
    return {
      needsUpdate: false,
      currentVersion,
      latestVersion: null,
      isLocalDev: false,
      isPinned: pluginInfo.isPinned,
    }
  }

  return {
    needsUpdate: currentVersion !== latestVersion,
    currentVersion,
    latestVersion,
    isLocalDev: false,
    isPinned: pluginInfo.isPinned,
  }
}
