import { existsSync, readFileSync } from "node:fs"

import packageJson from "../../../../package.json" with { type: "json" }
import { INSTALLED_PACKAGE_JSON } from "../constants"

interface PackageJsonLike {
  version?: string
}

export function getCachedVersion(): string | null {
  try {
    if (existsSync(INSTALLED_PACKAGE_JSON)) {
      const installedPackage = JSON.parse(readFileSync(INSTALLED_PACKAGE_JSON, "utf-8")) as PackageJsonLike
      if (installedPackage.version) return installedPackage.version
    }
  } catch {
  }

  return packageJson.version ?? null
}
