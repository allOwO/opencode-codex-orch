export function isPrereleaseVersion(version: string): boolean {
  return version.includes("-")
}

export function isDistTag(version: string): boolean {
  return !/^\d/.test(version)
}

export function isPrereleaseOrDistTag(pinnedVersion: string | null): boolean {
  if (!pinnedVersion) return false
  return isPrereleaseVersion(pinnedVersion) || isDistTag(pinnedVersion)
}

export function extractChannel(version: string | null): string {
  if (!version) return "latest"
  if (isDistTag(version)) return version

  if (isPrereleaseVersion(version)) {
    const prereleasePart = version.split("-")[1]
    const channelMatch = prereleasePart?.match(/^(alpha|beta|rc|canary|next)/)
    if (channelMatch) {
      return channelMatch[1]
    }
  }

  return "latest"
}
