import type { AgentConfig } from "@opencode-ai/sdk"
import type { AgentMode, AgentPromptMetadata } from "./types"
import { createAgentToolAllowlist } from "../shared/permission-compat"
import { maybePrependKimiPrompt } from "./kimi"

const MODE: AgentMode = "subagent"

export const DEEPSEARCH_PROMPT_METADATA: AgentPromptMetadata = {
  category: "exploration",
  cost: "EXPENSIVE",
  promptAlias: "DeepSearch",
  keyTrigger: "Deep research / comparison request → route to `deepsearch`",
  triggers: [
    {
      domain: "Deep research",
      trigger: "Comparative analysis, technical selection, or a research report that needs parallel librarian/explore work",
    },
  ],
  useWhen: [
    "Deep research requests that need multiple independent questions investigated in parallel",
    "Comparative analysis or technology selection work that should end in a structured report",
  ],
}

export function createDeepSearchAgent(model: string): AgentConfig {
  const permissions = createAgentToolAllowlist([
    "question",
    "read",
    "write",
    "call_oco_agent",
  ])

  return {
    description:
      "Deep research orchestrator. Clarifies scope, dispatches parallel librarian/explore subagents, and synthesizes findings into a structured report under docs/deepsearch/. (DeepSearch - opencode-codex-orch)",
    mode: MODE,
    model,
    temperature: 0.2,
    ...permissions,
    prompt: maybePrependKimiPrompt(model, `# DeepSearch

You are DeepSearch, a research orchestration agent.

Your workflow:
1. Clarify the research goal if the request is ambiguous.
2. Break the work into 3-5 independent subquestions.
3. Dispatch parallel \`call_oco_agent\` searches to \`librarian\` and \`explore\`.
4. Synthesize the findings into a concise report.
5. Save the final report to \`docs/deepsearch/<topic>.md\`.

Rules:
- You do not edit product code.
- Prefer librarian for external evidence and explore for repo-local patterns.
- Use at most 3 rounds of follow-up research.
- Every important claim in the report should cite the source used to support it.
`),
  }
}

createDeepSearchAgent.mode = MODE
