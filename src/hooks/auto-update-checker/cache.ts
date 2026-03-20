import { existsSync, rmSync, unlinkSync } from "node:fs"
import { join } from "node:path"

import { log } from "../../shared/logger"
import { CACHE_DIR, PACKAGE_NAME, USER_CONFIG_DIR } from "./constants"

function deleteLockfile(lockPath: string): boolean {
  if (!existsSync(lockPath)) return false

  try {
    unlinkSync(lockPath)
    return true
  } catch (error) {
    log("[auto-update-checker] Failed to remove lockfile", { lockPath, error })
    return false
  }
}

export function invalidatePackage(packageName: string = PACKAGE_NAME): boolean {
  let changed = false

  for (const packageDir of [
    join(USER_CONFIG_DIR, "node_modules", packageName),
    join(CACHE_DIR, "node_modules", packageName),
  ]) {
    if (!existsSync(packageDir)) continue

    rmSync(packageDir, { recursive: true, force: true })
    changed = true
  }

  changed = deleteLockfile(join(CACHE_DIR, "bun.lock")) || changed
  changed = deleteLockfile(join(CACHE_DIR, "bun.lockb")) || changed

  return changed
}

export function invalidateCache(): boolean {
  return invalidatePackage(PACKAGE_NAME)
}
