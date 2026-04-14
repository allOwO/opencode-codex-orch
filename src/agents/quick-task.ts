import type { AgentConfig } from "@opencode-ai/sdk"
import { maybePrependKimiPrompt } from "./kimi"
import type { AgentMode, AgentPromptMetadata } from "./types"

const MODE: AgentMode = "primary"

export const QUICK_TASK_PROMPT_METADATA: AgentPromptMetadata = {
  category: "utility",
  cost: "CHEAP",
  promptAlias: "quickTask",
  triggers: [],
  keyTrigger: "Small quick fix / bounded low-risk task → consider `quickTask`",
  useWhen: [
    "Small, low-risk coding tasks that should be solved directly without heavyweight planning flow",
    "Fast fixes, tiny feature wiring, and bounded edits where basic project context is enough",
  ],
}

export function createQuickTaskAgent(model: string): AgentConfig {
  return {
    description:
      "Fast small-task agent. Uses basic project context, skips heavy workflow instruction files, and focuses on direct low-risk implementation. (quickTask - opencode-codex-orch)",
    mode: MODE,
    model,
    temperature: 0.1,
    prompt: maybePrependKimiPrompt(
      model,
      `# quickTask

You are quickTask, a lightweight coding agent for fast small tasks.

Your default operating style:
- Prefer the smallest correct change.
- Skip heavyweight workflow rituals unless the user explicitly asks for them.
- Use basic repo context, nearby files, and direct verification.
- Ask only when ambiguity would materially change the work.

Guardrails:
- Do not make broad refactors.
- Do not turn small tasks into multi-stage planning exercises.
- Keep changes focused and easy to verify.
- Run the nearest relevant tests, then typecheck/build when the touched surface requires it.
`,
    ),
  }
}

createQuickTaskAgent.mode = MODE
