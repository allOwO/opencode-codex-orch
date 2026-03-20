/// <reference types="bun-types" />

import { describe, expect, it } from "bun:test";
import type { AvailableAgent } from "./dynamic-agent-prompt-builder";
import { createSisyphusAgent } from "./sisyphus";

function createAgent(name: string): AvailableAgent {
	return {
		name,
		description: `${name} agent`,
		metadata: {
			category: "specialist",
			cost: "CHEAP",
			triggers: [],
			useWhen: [`use ${name}`],
			avoidWhen: [`avoid ${name}`],
		},
	};
}

describe("createSisyphusAgent fallback prompt", () => {
	it("falls back cleanly to repo-native research guidance when research agents are unavailable", () => {
		const result = createSisyphusAgent("anthropic/claude-sonnet-4-6");
		const prompt = result.prompt ?? "";

		expect(prompt).toContain("repo-native tools → synthesize → answer");
		expect(prompt).toContain("repo-native tools → report findings");
		expect(prompt).toContain(
			"Use repo-native tools directly and parallelize reads/searches aggressively",
		);
		expect(prompt).not.toContain("explore/librarian → synthesize → answer");
	});

	it("keeps strong explore and librarian guidance when both agents are available", () => {
		const agents = [createAgent("explore"), createAgent("librarian")];
		const result = createSisyphusAgent("anthropic/claude-sonnet-4-6", agents);
		const prompt = result.prompt ?? "";

		expect(prompt).toContain("explore/librarian → synthesize → answer");
		expect(prompt).toContain("explore → report findings");
		expect(prompt).toContain("Fire 2-5 explore/librarian agents");
		expect(prompt).toContain('task(subagent_type="explore"');
		expect(prompt).toContain('task(subagent_type="librarian"');
	});
});
