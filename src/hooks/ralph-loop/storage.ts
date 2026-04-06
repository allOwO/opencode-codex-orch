import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"

export interface RalphLoopState {
  active: boolean
  iteration: number
  completion_promise: string
  initial_completion_promise: string
  started_at: string
  prompt: string
  session_id?: string
  ultrawork?: boolean
  strategy?: "reset" | "continue"
  max_iterations?: number
  verification_pending?: boolean
  verification_attempt_id?: string
  verification_session_id?: string
}

function getCanonicalStatePath(directory: string): string {
  return join(directory, ".opencode", "ralph-loop-state.json")
}

function getLegacyStatePath(directory: string): string {
  return join(directory, ".sisyphus", "ralph-loop-state.json")
}

export function readState(directory: string): RalphLoopState | null {
  const statePath = [getCanonicalStatePath(directory), getLegacyStatePath(directory)].find((candidate) => existsSync(candidate))
  if (!statePath) return null

  try {
    return JSON.parse(readFileSync(statePath, "utf-8")) as RalphLoopState
  } catch {
    return null
  }
}

export function writeState(directory: string, state: RalphLoopState): void {
  const statePath = getCanonicalStatePath(directory)
  mkdirSync(join(directory, ".opencode"), { recursive: true })
  writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`, "utf-8")
}

export function clearState(directory: string): void {
  rmSync(getCanonicalStatePath(directory), { force: true })
  rmSync(getLegacyStatePath(directory), { force: true })
}
