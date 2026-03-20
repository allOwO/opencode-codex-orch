export interface NpmDistTags {
  latest: string
  [key: string]: string
}

export interface UpdateCheckResult {
  needsUpdate: boolean
  currentVersion: string | null
  latestVersion: string | null
  isLocalDev: boolean
  isPinned: boolean
}

export interface PluginEntryInfo {
  entry: string
  isPinned: boolean
  pinnedVersion: string | null
  configPath: string
}

export interface AutoUpdateCheckerOptions {
  autoUpdate?: boolean
}
