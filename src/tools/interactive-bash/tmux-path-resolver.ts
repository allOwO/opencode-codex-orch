import { which } from "bun"

export async function getTmuxPath(): Promise<string | null> {
  return which("tmux") ?? null
}
