import { KIMI_SYSTEM_PROMPT } from "../kimi"

export function buildKimiSisyphusPrompt(basePrompt: string): string {
  return `${KIMI_SYSTEM_PROMPT}

${basePrompt}`
}
