import { prependKimiPrompt } from "./kimi"
import { isKimiModel } from "./types"

export function maybePrependKimiPrompt(model: string, prompt: string): string {
  if (!isKimiModel(model)) return prompt
  return prependKimiPrompt(prompt)
}
