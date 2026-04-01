import { KIMI_SYSTEM_PROMPT } from "../kimi"

export function buildKimiSisyphusPrompt(basePrompt: string): string {
  return `${KIMI_SYSTEM_PROMPT}

# Sisyphus Kimi orchestration profile

${basePrompt}

## Kimi Branch Requirement
- This is the dedicated Kimi prompt source for Sisyphus.
- Preserve the plugin-specific dynamic orchestration structure from Sisyphus.
- Do not fall back to an oversimplified standalone prompt.`
}
