import { existsSync, statSync } from "node:fs"
import { createRequire } from "node:module"
import { dirname, join } from "node:path"

function isValidBinary(filePath: string): boolean {
  try {
    return statSync(filePath).size > 10_000
  } catch {
    return false
  }
}

function findWithBunWhich(binaryName: string): string | null {
  try {
    const filePath = Bun.which(binaryName)
    if (filePath && isValidBinary(filePath)) {
      return filePath
    }
  } catch {
    // Binary unavailable on PATH.
  }

  return null
}

function findBundledCliBinary(): string | null {
  const binaryName = process.platform === "win32" ? "sg.exe" : "sg"

  try {
    const require = createRequire(import.meta.url)
    const packageJsonPath = require.resolve("@ast-grep/cli/package.json")
    const packageDir = dirname(packageJsonPath)
    const filePath = join(packageDir, binaryName)

    if (existsSync(filePath) && isValidBinary(filePath)) {
      return filePath
    }
  } catch {
    // Package dependency unavailable.
  }

  return null
}

function findHomebrewBinary(): string | null {
  if (process.platform !== "darwin") {
    return null
  }

  for (const filePath of ["/opt/homebrew/bin/sg", "/usr/local/bin/sg"]) {
    if (existsSync(filePath) && isValidBinary(filePath)) {
      return filePath
    }
  }

  return null
}

let resolvedCliPath: string | null = null

export function findSgCliPathSync(): string | null {
  return (
    findWithBunWhich("sg") ??
    findWithBunWhich("ast-grep") ??
    findBundledCliBinary() ??
    findHomebrewBinary()
  )
}

export function getSgCliPath(): string | null {
  if (resolvedCliPath !== null && isValidBinary(resolvedCliPath)) {
    return resolvedCliPath
  }

  resolvedCliPath = findSgCliPathSync()
  return resolvedCliPath
}
