import { existsSync, readFileSync } from "node:fs"
import { dirname, join } from "node:path"

import { getLocalDevPath } from "./local-dev-path"

interface PackageJsonLike {
  version?: string
}

function findPackageJsonUp(startPath: string): string | null {
  let current = startPath

  while (true) {
    const candidate = join(current, "package.json")
    if (existsSync(candidate)) return candidate

    const parent = dirname(current)
    if (parent === current) return null
    current = parent
  }
}

export function getLocalDevVersion(directory: string): string | null {
  const localPath = getLocalDevPath(directory)
  if (!localPath) return null

  try {
    const packageJsonPath = findPackageJsonUp(localPath)
    if (!packageJsonPath) return null
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8")) as PackageJsonLike
    return packageJson.version ?? null
  } catch {
    return null
  }
}
