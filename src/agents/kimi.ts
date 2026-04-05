import { isKimiModel } from "./types"

export const KIMI_SYSTEM_PROMPT = `You are operating as a specialized subagent on a Kimi model.

The role-specific instructions below narrow your scope, tool permissions, and output style for this task.
Use them as the primary source of truth, and when they are stricter than general model behavior, follow the stricter instructions.`

export function prependKimiPrompt(prompt: string): string {
  return `${KIMI_SYSTEM_PROMPT}\n\n${prompt}`
}

export function maybePrependKimiPrompt(model: string, prompt: string): string {
  if (!isKimiModel(model)) return prompt
  return prependKimiPrompt(prompt)
}
