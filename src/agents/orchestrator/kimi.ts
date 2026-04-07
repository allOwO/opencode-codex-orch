import { KIMI_SYSTEM_PROMPT } from "../kimi"

export function buildKimiOrchestratorPrompt(basePrompt: string): string {
  return `${KIMI_SYSTEM_PROMPT}

${basePrompt}`
}
