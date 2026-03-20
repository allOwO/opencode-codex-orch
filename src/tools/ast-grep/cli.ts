import { spawn } from "bun"

import { DEFAULT_TIMEOUT_MS } from "./language-support"
import { createSgResultFromStdout } from "./sg-compact-json-output"
import { getSgCliPath } from "./sg-cli-path"
import type { CliLanguage, SgResult } from "./types"

export interface RunOptions {
  pattern: string
  lang: CliLanguage
  paths?: string[]
  globs?: string[]
  context?: number
}

function buildRunArgs(options: RunOptions): string[] {
  const args = ["run", "-p", options.pattern, "--lang", options.lang, "--json=compact"]

  if (options.context && options.context > 0) {
    args.push("-C", String(Math.min(options.context, 10)))
  }

  for (const glob of options.globs ?? []) {
    args.push("--globs", glob)
  }

  const paths = options.paths?.length ? options.paths : ["."]
  args.push(...paths)
  return args
}

export async function runSg(options: RunOptions): Promise<SgResult> {
  const cliPath = getSgCliPath()
  if (!cliPath) {
    return {
      matches: [],
      totalMatches: 0,
      truncated: false,
      error:
        "ast-grep (sg) binary not found. Install @ast-grep/cli or make `sg` available on PATH.",
    }
  }

  try {
    const proc = spawn([cliPath, ...buildRunArgs(options)], {
      stdout: "pipe",
      stderr: "pipe",
    })

    const timeoutPromise = new Promise<never>((_, reject) => {
      const timer = setTimeout(() => {
        proc.kill()
        reject(new Error(`Search timeout after ${DEFAULT_TIMEOUT_MS}ms`))
      }, DEFAULT_TIMEOUT_MS)

      proc.exited.finally(() => clearTimeout(timer))
    })

    const stdout = await Promise.race([new Response(proc.stdout).text(), timeoutPromise])
    const stderr = await new Response(proc.stderr).text()
    const exitCode = await proc.exited

    if (exitCode !== 0 && stdout.trim() === "") {
      if (stderr.includes("No files found")) {
        return { matches: [], totalMatches: 0, truncated: false }
      }

      return {
        matches: [],
        totalMatches: 0,
        truncated: false,
        error: stderr.trim() || `ast-grep exited with code ${exitCode}`,
      }
    }

    return createSgResultFromStdout(stdout)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      matches: [],
      totalMatches: 0,
      truncated: message.includes("timeout"),
      truncatedReason: message.includes("timeout") ? "timeout" : undefined,
      error: message,
    }
  }
}
