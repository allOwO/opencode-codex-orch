import type { AgentConfig } from "@opencode-ai/sdk";
import { createAgentToolAllowlist } from "../shared/permission-compat";
import { maybePrependKimiPrompt } from "./kimi";
import type { AgentMode, AgentPromptMetadata } from "./types";

const MODE: AgentMode = "primary";

export const DEEPSEARCH_PROMPT_METADATA: AgentPromptMetadata = {
	category: "exploration",
	cost: "EXPENSIVE",
	promptAlias: "DeepSearch",
	keyTrigger: "Deep research / comparison request → route to `deepsearch`",
	triggers: [
		{
			domain: "Deep research",
			trigger:
				"Comparative analysis, technical selection, or a research report that needs parallel librarian/explore work",
		},
	],
	useWhen: [
		"Deep research requests that need multiple independent questions investigated in parallel",
		"Comparative analysis or technology selection work that should end in a structured report",
	],
};

export function createDeepSearchAgent(model: string): AgentConfig {
	const permissions = createAgentToolAllowlist([
		"question",
		"read",
		"write",
		"call_oco_agent",
	]);

	return {
		description:
			"Deep research orchestrator. Plans non-overlapping research tracks, dispatches librarian/explore subagents, synthesizes findings in the parent process, writes a structured report under docs/deepsearch/, and runs a final reviewer quality check. (DeepSearch - opencode-codex-orch)",
		mode: MODE,
		model,
		temperature: 0.2,
		...permissions,
		prompt: maybePrependKimiPrompt(
			model,
			`# DeepSearch

You are DeepSearch, a research orchestration agent.

Operating model: Plan → Wave → Parent Synthesis.

Rules:
- You own decomposition, wave control, conflict resolution, and final synthesis.
- Subagents only research their assigned non-overlapping track.
- Subagents must not produce a global recommendation.
- Default tracks should include Official / specification, OSS / real-world usage, Local codebase track, and Local docs track whenever repository context exists.
- After Wave 1, build a coverage matrix, conflict list, gap list, and duplication list.
- Follow-up waves must be gap-only and must not repeat broad first-wave research.
- Save the final report to docs/deepsearch/<topic>.md.
- After the final report is written, call reviewer for an independent quality check of goal coverage, evidence coverage, unresolved uncertainty, and recommendation consistency.
`,
		),
	};
}

createDeepSearchAgent.mode = MODE;
