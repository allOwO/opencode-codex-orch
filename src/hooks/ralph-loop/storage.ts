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

function getStatePath(directory: string): string {
  return join(directory, ".sisyphus", "ralph-loop-state.json")
}

export function readState(directory: string): RalphLoopState | null {
  const statePath = getStatePath(directory)
  if (!existsSync(statePath)) return null

  try {
    return JSON.parse(readFileSync(statePath, "utf-8")) as RalphLoopState
  } catch {
    return null
  }
}

export function writeState(directory: string, state: RalphLoopState): void {
  const statePath = getStatePath(directory)
  mkdirSync(join(directory, ".sisyphus"), { recursive: true })
  writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`, "utf-8")
}

export function clearState(directory: string): void {
  rmSync(getStatePath(directory), { force: true })
}
