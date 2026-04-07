/// <reference types="bun-types" />

import { describe, expect, it } from "bun:test";
import type {
	AvailableAgent,
	AvailableCategory,
	AvailableSkill,
} from "./dynamic-agent-prompt-builder";
import { createOrchestratorAgent } from "./orchestrator";

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

function createSkill(
	name: string,
	location: AvailableSkill["location"],
): AvailableSkill {
	return {
		name,
		description: `${name} skill`,
		location,
	};
}

function createCategory(name: string): AvailableCategory {
	return {
		name,
		description: `${name} category`,
	};
}

describe("createOrchestratorAgent fallback prompt", () => {
	it("falls back cleanly to repo-native research guidance when research agents are unavailable", () => {
		const result = createOrchestratorAgent("anthropic/claude-sonnet-4-6");
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
		const result = createOrchestratorAgent("anthropic/claude-sonnet-4-6", agents);
		const prompt = result.prompt ?? "";

		expect(prompt).toContain("explore/librarian → synthesize → answer");
		expect(prompt).toContain("explore → report findings");
		expect(prompt).toContain("Fire 2-5 explore/librarian agents");
		expect(prompt).toContain('task(subagent_type="explore"');
		expect(prompt).toContain('task(subagent_type="librarian"');
	});

	it("routes provider-based Kimi models to dedicated Kimi prompt branch", () => {
		const result = createOrchestratorAgent("kimi-for-coding/k2p5");
		const prompt = result.prompt ?? "";

		expect(prompt).toContain("You are operating as a specialized subagent on a Kimi model.");
		expect(prompt).not.toContain("Orchestrator Kimi orchestration profile");
		expect(prompt).toContain("<Role>");
	});

	it("routes model-based Kimi models to dedicated Kimi prompt branch", () => {
		const result = createOrchestratorAgent("opencode/kimi-k2.5-free");
		const prompt = result.prompt ?? "";

		expect(prompt).toContain("You are operating as a specialized subagent on a Kimi model.");
		expect(prompt).not.toContain("Orchestrator Kimi orchestration profile");
		expect(prompt).toContain("<Role>");
	});

	it("preserves dynamic research-agent orchestration guidance in Kimi branch", () => {
		const agents = [createAgent("explore"), createAgent("librarian")];
		const result = createOrchestratorAgent("kimi-for-coding/k2p5", agents);
		const prompt = result.prompt ?? "";

		expect(prompt).toContain("explore/librarian → synthesize → answer");
		expect(prompt).toContain("explore → report findings");
		expect(prompt).toContain("Fire 2-5 explore/librarian agents");
	});

	it("preserves category/skill-aware delegation guidance in Kimi branch", () => {
		const skills: AvailableSkill[] = [
			createSkill("frontend-ui-ux", "plugin"),
			createSkill("my-project-skill", "project"),
		];
		const categories: AvailableCategory[] = [createCategory("deep")];
		const result = createOrchestratorAgent(
			"kimi-for-coding/k2p5",
			[],
			[],
			skills,
			categories,
		);
		const prompt = result.prompt ?? "";

		expect(prompt).toContain("### Category + Skills Delegation");
		expect(prompt).toContain("User-installed skills get PRIORITY");
		expect(prompt).toContain("`deep` — deep category");
	});
});
