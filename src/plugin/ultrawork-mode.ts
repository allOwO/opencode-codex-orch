import { createSystemDirective } from "../shared"
import { getAgentConfigKey } from "../shared/agent-display-names"

import { detectBareUltraworkPrefix, detectUltraworkIntent } from "./ultrawork-intent"

type OutputPart = {
  type: string
  text?: string
  [key: string]: unknown
}

const EXECUTION_BIAS_HEADER = createSystemDirective("EXECUTION BIAS")
const EXECUTION_BIAS_DIRECTIVE = [
  EXECUTION_BIAS_HEADER,
  "Execution-biased mode is active for this turn.",
  "- If the request is action-oriented, optimize for execution over discussion.",
  "- On non-trivial work, begin with parallel exploration before editing code.",
  "- Prefer delegation for multi-file work, UI work, or external-library uncertainty.",
  "- Ask only when blocked, unsafe, or materially ambiguous.",
  "- After code changes, run diagnostics, relevant tests, and a build when applicable.",
  "- Never commit or push unless the user explicitly asks.",
].join("\n")

function extractPromptText(parts: OutputPart[]): string {
  return parts.filter((part) => part.type === "text").map((part) => part.text ?? "").join("\n")
}

function isSisyphusAgent(agentName: string | undefined): boolean {
  if (!agentName) return false
  return getAgentConfigKey(agentName) === "sisyphus"
}

/**
 * Injects execution bias by prepending to the first text part's content.
 * Matches the upstream keyword-detector pattern: modify existing part text
 * instead of inserting a new synthetic part (which OpenCode cannot handle).
 */
function injectExecutionBias(parts: OutputPart[]): void {
  const textPartIndex = parts.findIndex((p) => p.type === "text" && p.text !== undefined)
  if (textPartIndex === -1) return

  const originalText = parts[textPartIndex].text ?? ""
  parts[textPartIndex] = {
    ...parts[textPartIndex],
    text: `${EXECUTION_BIAS_DIRECTIVE}\n\n---\n\n${originalText}`,
  }
}

export function applyUltraworkModeOnMessage(
  agentName: string | undefined,
  output: { parts: OutputPart[] },
): boolean {
  if (!isSisyphusAgent(agentName)) return false

  const promptText = extractPromptText(output.parts)
  if (promptText.trim().length === 0) return false
  if (detectBareUltraworkPrefix(promptText)) return false
  if (!detectUltraworkIntent(promptText)) return false
  if (promptText.includes(EXECUTION_BIAS_HEADER)) return false

  injectExecutionBias(output.parts)
  return true
}
