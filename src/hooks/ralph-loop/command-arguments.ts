import {
  DEFAULT_RALPH_COMPLETION_PROMISE,
  DEFAULT_RALPH_MAX_ITERATIONS,
} from "./constants"

export interface RalphLoopArguments {
  prompt: string
  completionPromise: string
  maxIterations: number
  strategy: "reset" | "continue"
}

function extractFlag(input: string, name: string): { value: string | null; rest: string } {
  const pattern = new RegExp(`(?:^|\\s)--${name}=("[^"]*"|'[^']*'|\\S+)`, "i")
  const match = input.match(pattern)
  if (!match || match.index === undefined) {
    return { value: null, rest: input }
  }

  const rawValue = match[1]
  const unquoted = rawValue.replace(/^['"]|['"]$/g, "")
  const rest = `${input.slice(0, match.index)} ${input.slice(match.index + match[0].length)}`.trim()
  return { value: unquoted, rest }
}

function normalizePrompt(input: string): string {
  const trimmed = input.trim()
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1).trim()
  }
  return trimmed
}

export function parseRalphLoopArguments(rawInput: string): RalphLoopArguments {
  let remaining = rawInput.trim()

  const completion = extractFlag(remaining, "completion-promise")
  remaining = completion.rest

  const maxIterations = extractFlag(remaining, "max-iterations")
  remaining = maxIterations.rest

  const strategy = extractFlag(remaining, "strategy")
  remaining = strategy.rest

  const parsedMaxIterations = Number.parseInt(maxIterations.value ?? "", 10)
  const parsedStrategy = strategy.value === "reset" ? "reset" : "continue"

  return {
    prompt: normalizePrompt(remaining),
    completionPromise: completion.value?.trim() || DEFAULT_RALPH_COMPLETION_PROMISE,
    maxIterations: Number.isFinite(parsedMaxIterations) && parsedMaxIterations > 0
      ? parsedMaxIterations
      : DEFAULT_RALPH_MAX_ITERATIONS,
    strategy: parsedStrategy,
  }
}
