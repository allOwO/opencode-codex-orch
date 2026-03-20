import packageJson from "../../package.json" with { type: "json" }

export const PLUGIN_PACKAGE_NAME = packageJson.name
export const CONFIG_BASENAME = PLUGIN_PACKAGE_NAME

const rawRepositoryUrl = typeof packageJson.repository === "string"
  ? packageJson.repository
  : packageJson.repository.url

export const PLUGIN_REPOSITORY_URL = rawRepositoryUrl.replace(/^git\+/, "")
export const PLUGIN_GITHUB_REPOSITORY = PLUGIN_REPOSITORY_URL
  .replace(/^https:\/\/github\.com\//, "")
  .replace(/\.git$/, "")

const CURRENT_PLUGIN_PREFIXES = [
  PLUGIN_PACKAGE_NAME,
  `${PLUGIN_PACKAGE_NAME}@`,
] as const

const FILE_REFERENCE_TOKENS = [
  PLUGIN_PACKAGE_NAME,
  PLUGIN_GITHUB_REPOSITORY.split("/")[1],
] as const

function matchesPrefix(entry: string, prefix: string): boolean {
  return entry === prefix || entry.startsWith(prefix)
}

function matchesFileReference(entry: string): boolean {
  return entry.startsWith("file://") && FILE_REFERENCE_TOKENS.some((token) => entry.includes(token))
}

export function getPreferredPluginEntry(_currentVersion?: string): string {
  return `${PLUGIN_PACKAGE_NAME}@latest`
}

export function isManagedPluginEntry(entry: string): boolean {
  return CURRENT_PLUGIN_PREFIXES.some((prefix) => matchesPrefix(entry, prefix)) ||
    matchesFileReference(entry)
}

export function extractPinnedVersionFromPluginEntry(entry: string): string | null {
  const packagePrefixes = [PLUGIN_PACKAGE_NAME]
  for (const prefix of packagePrefixes) {
    if (!entry.startsWith(`${prefix}@`)) continue
    const value = entry.slice(prefix.length + 1)
    if (!value || value === "latest") return null
    return value
  }
  return null
}

export function getPluginEntrySource(entry: string): "package" | "github" | "file" {
  if (entry.startsWith("file://")) return "file"
  if (entry.startsWith("github:") || entry.startsWith(PLUGIN_REPOSITORY_URL)) return "github"
  return "package"
}
