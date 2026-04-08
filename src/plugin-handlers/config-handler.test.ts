/// <reference types="bun-types" />

import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import * as agents from "../agents";
import * as executor from "../agents/executor";
import type { OpenCodeCodexOrchConfig } from "../config";
import type { CategoryConfig } from "../config/schema";
import * as builtinCommands from "../features/builtin-commands";
import * as agentLoader from "../features/claude-code-agent-loader";
import * as commandLoader from "../features/claude-code-command-loader";
import * as mcpLoader from "../features/claude-code-mcp-loader";
import * as pluginLoader from "../features/claude-code-plugin-loader";
import * as skillLoader from "../features/opencode-skill-loader";
import * as mcpModule from "../mcp";
import * as shared from "../shared";
import { getAgentDisplayName } from "../shared/agent-display-names";
import * as modelResolver from "../shared/model-resolver";
import * as configDir from "../shared/opencode-config-dir";
import * as permissionCompat from "../shared/permission-compat";
import { createConfigHandler, resolveCategoryConfig } from "./config-handler";

beforeEach(() => {
	spyOn(agents, "createBuiltinAgents" as any).mockResolvedValue({
		orchestrator: { name: "orchestrator", prompt: "test", mode: "primary" },
		oracle: { name: "oracle", prompt: "test", mode: "subagent" },
	});

	spyOn(commandLoader, "loadUserCommands" as any).mockResolvedValue({});
	spyOn(commandLoader, "loadProjectCommands" as any).mockResolvedValue({});
	spyOn(commandLoader, "loadOpencodeGlobalCommands" as any).mockResolvedValue(
		{},
	);
	spyOn(commandLoader, "loadOpencodeProjectCommands" as any).mockResolvedValue(
		{},
	);

	spyOn(builtinCommands, "loadBuiltinCommands" as any).mockReturnValue({});

	spyOn(skillLoader, "loadUserSkills" as any).mockResolvedValue({});
	spyOn(skillLoader, "loadProjectSkills" as any).mockResolvedValue({});
	spyOn(skillLoader, "loadOpencodeGlobalSkills" as any).mockResolvedValue({});
	spyOn(skillLoader, "loadOpencodeProjectSkills" as any).mockResolvedValue({});
	spyOn(skillLoader, "discoverUserClaudeSkills" as any).mockResolvedValue([]);
	spyOn(skillLoader, "discoverProjectClaudeSkills" as any).mockResolvedValue(
		[],
	);
	spyOn(skillLoader, "discoverOpencodeGlobalSkills" as any).mockResolvedValue(
		[],
	);
	spyOn(skillLoader, "discoverOpencodeProjectSkills" as any).mockResolvedValue(
		[],
	);

	spyOn(agentLoader, "loadUserAgents" as any).mockReturnValue({});
	spyOn(agentLoader, "loadProjectAgents" as any).mockReturnValue({});

	spyOn(mcpLoader, "loadMcpConfigs" as any).mockResolvedValue({ servers: {} });

	spyOn(pluginLoader, "loadAllPluginComponents" as any).mockResolvedValue({
		commands: {},
		agents: {},
		mcpServers: {},
		hooksConfigs: [],
		plugins: [],
		errors: [],
	});

	spyOn(mcpModule, "createBuiltinMcps" as any).mockReturnValue({});

	spyOn(shared, "log" as any).mockImplementation(() => {});
	spyOn(shared, "fetchAvailableModels" as any).mockResolvedValue(
		new Set(["anthropic/claude-opus-4-6"]),
	);
	spyOn(shared, "readConnectedProvidersCache" as any).mockReturnValue(null);

	spyOn(configDir, "getOpenCodeConfigPaths" as any).mockReturnValue({
		global: "/tmp/.config/opencode",
		project: "/tmp/.opencode",
	});

	spyOn(permissionCompat, "migrateAgentConfig" as any).mockImplementation(
		(config: Record<string, unknown>) => config,
	);

	spyOn(modelResolver, "resolveModelWithFallback" as any).mockReturnValue({
		model: "anthropic/claude-opus-4-6",
	});
});

afterEach(() => {
	(agents.createBuiltinAgents as any)?.mockRestore?.();
	(executor.createExecutorAgentWithOverrides as any)?.mockRestore?.();
	(commandLoader.loadUserCommands as any)?.mockRestore?.();
	(commandLoader.loadProjectCommands as any)?.mockRestore?.();
	(commandLoader.loadOpencodeGlobalCommands as any)?.mockRestore?.();
	(commandLoader.loadOpencodeProjectCommands as any)?.mockRestore?.();
	(builtinCommands.loadBuiltinCommands as any)?.mockRestore?.();
	(skillLoader.loadUserSkills as any)?.mockRestore?.();
	(skillLoader.loadProjectSkills as any)?.mockRestore?.();
	(skillLoader.loadOpencodeGlobalSkills as any)?.mockRestore?.();
	(skillLoader.loadOpencodeProjectSkills as any)?.mockRestore?.();
	(skillLoader.discoverUserClaudeSkills as any)?.mockRestore?.();
	(skillLoader.discoverProjectClaudeSkills as any)?.mockRestore?.();
	(skillLoader.discoverOpencodeGlobalSkills as any)?.mockRestore?.();
	(skillLoader.discoverOpencodeProjectSkills as any)?.mockRestore?.();
	(agentLoader.loadUserAgents as any)?.mockRestore?.();
	(agentLoader.loadProjectAgents as any)?.mockRestore?.();
	(mcpLoader.loadMcpConfigs as any)?.mockRestore?.();
	(pluginLoader.loadAllPluginComponents as any)?.mockRestore?.();
	(mcpModule.createBuiltinMcps as any)?.mockRestore?.();
	(shared.log as any)?.mockRestore?.();
	(shared.fetchAvailableModels as any)?.mockRestore?.();
	(shared.readConnectedProvidersCache as any)?.mockRestore?.();
	(configDir.getOpenCodeConfigPaths as any)?.mockRestore?.();
	(permissionCompat.migrateAgentConfig as any)?.mockRestore?.();
	(modelResolver.resolveModelWithFallback as any)?.mockRestore?.();
});

describe("Executor model inheritance", () => {
	// Executor remains available in config so it can be selected or mentioned directly
	test("executor remains available in assembled config", async () => {
		// #given
		const pluginConfig: OpenCodeCodexOrchConfig = {};
		const config: Record<string, unknown> = {
			model: "opencode/kimi-k2.5-free",
			agent: {},
		};
		const handler = createConfigHandler({
			ctx: { directory: "/tmp" },
			pluginConfig,
			modelCacheState: {
				anthropicContext1MEnabled: false,
				modelContextLimitsCache: new Map(),
			},
		});

		// #when
		await handler(config);

		// #then - Executor is present and not force-hidden
		const agentConfig = config.agent as Record<string, { hidden?: boolean }>;
		const executor = agentConfig[getAgentDisplayName("executor")];
		expect(executor).toBeDefined();
		expect(executor.hidden).toBeUndefined();
	});
});

describe("canonical builtin runtime names", () => {
	test("accepts canonical builtin agent keys from createBuiltinAgents", async () => {
		const createBuiltinAgentsMock = agents.createBuiltinAgents as unknown as {
			mockResolvedValue: (value: Record<string, unknown>) => void;
		};
		createBuiltinAgentsMock.mockResolvedValue({
			orchestrator: { name: "orchestrator", prompt: "test", mode: "primary" },
			reviewer: { name: "reviewer", prompt: "review", mode: "subagent" },
			deepsearch: { name: "deepsearch", prompt: "research", mode: "subagent" },
		});

		const pluginConfig: OpenCodeCodexOrchConfig = {};
		const config: Record<string, unknown> = {
			model: "anthropic/claude-opus-4-6",
			agent: {},
		};
		const handler = createConfigHandler({
			ctx: { directory: "/tmp" },
			pluginConfig,
			modelCacheState: {
				anthropicContext1MEnabled: false,
				modelContextLimitsCache: new Map(),
			},
		});

		await handler(config);

		// Builtin agents remain present for runtime use and @mention availability
		const agentConfig = config.agent as Record<string, unknown>;
		expect(agentConfig.Orchestrator).toBeDefined();
		expect(agentConfig.DeepSearch).toBeDefined();
		expect((agentConfig.Reviewer as { hidden?: boolean })?.hidden).toBeUndefined();
		expect((agentConfig.Executor as { hidden?: boolean })?.hidden).toBeUndefined();
		expect(config.default_agent).toBe(getAgentDisplayName("orchestrator"));
	});
});

describe("retired planning agents", () => {
	test("orders orchestrator first in picker-facing surface", async () => {
		// #given
		const createBuiltinAgentsMock = agents.createBuiltinAgents as unknown as {
			mockResolvedValue: (value: Record<string, unknown>) => void;
		};
		createBuiltinAgentsMock.mockResolvedValue({
			orchestrator: { name: "orchestrator", prompt: "test", mode: "primary" },
			oracle: { name: "oracle", prompt: "test", mode: "subagent" },
		});
		const pluginConfig: OpenCodeCodexOrchConfig = {
			orchestrator_agent: {
				planner_enabled: true,
			},
		};
		const config: Record<string, unknown> = {
			model: "anthropic/claude-opus-4-6",
			agent: {},
		};
		const handler = createConfigHandler({
			ctx: { directory: "/tmp" },
			pluginConfig,
			modelCacheState: {
				anthropicContext1MEnabled: false,
				modelContextLimitsCache: new Map(),
			},
		});

		// #when
		await handler(config);

		// #then - Orchestrator is first and builtin team agents remain mentionable
		const keys = Object.keys(config.agent as Record<string, unknown>);
		expect(keys[0]).toBe(getAgentDisplayName("orchestrator"));
		// Builtin team agents remain present and not force-hidden
		const agentConfig = config.agent as Record<string, { hidden?: boolean }>;
		expect(
			(agentConfig[getAgentDisplayName("executor")] as { hidden?: boolean })
				?.hidden,
		).toBeUndefined();
		expect(
			(agentConfig[getAgentDisplayName("oracle")] as { hidden?: boolean })
				?.hidden,
		).toBeUndefined();
	});

	test("planner flags no longer demote the plan agent", async () => {
		// #given
		const pluginConfig: OpenCodeCodexOrchConfig = {
			orchestrator_agent: {
				planner_enabled: true,
				replace_plan: true,
			},
		};
		const config: Record<string, unknown> = {
			model: "anthropic/claude-opus-4-6",
			agent: {
				plan: {
					name: "plan",
					mode: "primary",
					prompt: "original plan prompt",
				},
			},
		};
		const handler = createConfigHandler({
			ctx: { directory: "/tmp" },
			pluginConfig,
			modelCacheState: {
				anthropicContext1MEnabled: false,
				modelContextLimitsCache: new Map(),
			},
		});

		// #when
		await handler(config);

		// #then - user-defined plan agent is preserved, prometheus is not created
		const agents = config.agent as Record<
			string,
			{ mode?: string; name?: string; prompt?: string; hidden?: boolean }
		>;
		expect(agents.plan).toBeDefined();
		expect(agents.plan.mode).toBe("primary");
		expect(agents.plan.prompt).toBe("original plan prompt");
		expect(agents[getAgentDisplayName("prometheus")]).toBeUndefined();
		// Builtin team agents remain present and not force-hidden
		expect(
			(agents[getAgentDisplayName("executor")] as { hidden?: boolean })?.hidden,
		).toBeUndefined();
	});

	test("plan agent remains unchanged when planner is disabled", async () => {
		// #given
		const pluginConfig: OpenCodeCodexOrchConfig = {
			orchestrator_agent: {
				planner_enabled: false,
			},
		};
		const config: Record<string, unknown> = {
			model: "anthropic/claude-opus-4-6",
			agent: {
				plan: {
					name: "plan",
					mode: "primary",
					prompt: "original plan prompt",
				},
			},
		};
		const handler = createConfigHandler({
			ctx: { directory: "/tmp" },
			pluginConfig,
			modelCacheState: {
				anthropicContext1MEnabled: false,
				modelContextLimitsCache: new Map(),
			},
		});

		// #when
		await handler(config);

		// #then - plan is not touched, prometheus is not created
		const agents = config.agent as Record<
			string,
			{ mode?: string; name?: string; prompt?: string }
		>;
		expect(agents[getAgentDisplayName("prometheus")]).toBeUndefined();
		expect(agents.plan).toBeDefined();
		expect(agents.plan.mode).toBe("primary");
		expect(agents.plan.prompt).toBe("original plan prompt");
	});

	test("picker hides plan and exposes build instead", async () => {
		const pluginConfig: OpenCodeCodexOrchConfig = {
			orchestrator_agent: {
				planner_enabled: true,
				replace_plan: true,
			},
		};
		const config: Record<string, unknown> = {
			model: "anthropic/claude-opus-4-6",
			agent: {
				plan: {
					name: "plan",
					mode: "primary",
					prompt: "original plan prompt",
				},
			},
		};
		const handler = createConfigHandler({
			ctx: { directory: "/tmp" },
			pluginConfig,
			modelCacheState: {
				anthropicContext1MEnabled: false,
				modelContextLimitsCache: new Map(),
			},
		});

		await handler(config);

		const agents = config.agent as Record<
			string,
			{ mode?: string; hidden?: boolean; prompt?: string }
		>;
		expect(agents.plan).toBeDefined();
		expect(agents.plan.hidden).toBe(true);
		expect(agents.build).toBeDefined();
		expect(agents.build.hidden).toBeUndefined();
		expect(agents.build.mode).toBe("all");
	});

	test("planner flags do not create a prometheus agent", async () => {
		const pluginConfig: OpenCodeCodexOrchConfig = {
			orchestrator_agent: {
				planner_enabled: true,
			},
		};
		const config: Record<string, unknown> = {
			model: "anthropic/claude-opus-4-6",
			agent: {},
		};
		const handler = createConfigHandler({
			ctx: { directory: "/tmp" },
			pluginConfig,
			modelCacheState: {
				anthropicContext1MEnabled: false,
				modelContextLimitsCache: new Map(),
			},
		});

		await handler(config);

		const agents = config.agent as Record<string, { mode?: string }>;
		expect(agents[getAgentDisplayName("prometheus")]).toBeUndefined();
	});
});

describe("default_agent behavior with Sisyphus orchestration", () => {
	test("canonicalizes configured default_agent with surrounding whitespace", async () => {
		// given
		const pluginConfig: OpenCodeCodexOrchConfig = {};
		const config: Record<string, unknown> = {
			model: "anthropic/claude-opus-4-6",
			default_agent: "  prometheus  ",
			agent: {},
		};
		const handler = createConfigHandler({
			ctx: { directory: "/tmp" },
			pluginConfig,
			modelCacheState: {
				anthropicContext1MEnabled: false,
				modelContextLimitsCache: new Map(),
			},
		});

		// when
		await handler(config);

		// then
		expect(config.default_agent).toBe(getAgentDisplayName("prometheus"));
	});

	test("preserves retired mixed-case default_agent values as custom names", async () => {
		// given
		const pluginConfig: OpenCodeCodexOrchConfig = {};
		const config: Record<string, unknown> = {
			model: "anthropic/claude-opus-4-6",
			default_agent: "PrOmEtHeUs",
			agent: {},
		};
		const handler = createConfigHandler({
			ctx: { directory: "/tmp" },
			pluginConfig,
			modelCacheState: {
				anthropicContext1MEnabled: false,
				modelContextLimitsCache: new Map(),
			},
		});

		// when
		await handler(config);

		// then
		expect(config.default_agent).toBe("PrOmEtHeUs");
	});

	test("canonicalizes configured default_agent key to display name", async () => {
		// #given
		const pluginConfig: OpenCodeCodexOrchConfig = {};
		const config: Record<string, unknown> = {
			model: "anthropic/claude-opus-4-6",
			default_agent: "prometheus",
			agent: {},
		};
		const handler = createConfigHandler({
			ctx: { directory: "/tmp" },
			pluginConfig,
			modelCacheState: {
				anthropicContext1MEnabled: false,
				modelContextLimitsCache: new Map(),
			},
		});

		// #when
		await handler(config);

		// #then
		expect(config.default_agent).toBe(getAgentDisplayName("prometheus"));
	});

	test("preserves existing display-name default_agent", async () => {
		// #given
		const pluginConfig: OpenCodeCodexOrchConfig = {};
		const displayName = getAgentDisplayName("prometheus");
		const config: Record<string, unknown> = {
			model: "anthropic/claude-opus-4-6",
			default_agent: displayName,
			agent: {},
		};
		const handler = createConfigHandler({
			ctx: { directory: "/tmp" },
			pluginConfig,
			modelCacheState: {
				anthropicContext1MEnabled: false,
				modelContextLimitsCache: new Map(),
			},
		});

		// #when
		await handler(config);

		// #then
		expect(config.default_agent).toBe(displayName);
	});

	test("sets default_agent to orchestrator when missing", async () => {
		// #given
		const pluginConfig: OpenCodeCodexOrchConfig = {};
		const config: Record<string, unknown> = {
			model: "anthropic/claude-opus-4-6",
			agent: {},
		};
		const handler = createConfigHandler({
			ctx: { directory: "/tmp" },
			pluginConfig,
			modelCacheState: {
				anthropicContext1MEnabled: false,
				modelContextLimitsCache: new Map(),
			},
		});

		// #when
		await handler(config);

		// #then
		expect(config.default_agent).toBe(getAgentDisplayName("orchestrator"));
	});

	test("sets default_agent to orchestrator when configured default_agent is empty after trim", async () => {
		// given
		const pluginConfig: OpenCodeCodexOrchConfig = {};
		const config: Record<string, unknown> = {
			model: "anthropic/claude-opus-4-6",
			default_agent: "    ",
			agent: {},
		};
		const handler = createConfigHandler({
			ctx: { directory: "/tmp" },
			pluginConfig,
			modelCacheState: {
				anthropicContext1MEnabled: false,
				modelContextLimitsCache: new Map(),
			},
		});

		// when
		await handler(config);

		// then
		expect(config.default_agent).toBe(getAgentDisplayName("orchestrator"));
	});

	test("preserves custom default_agent names while trimming whitespace", async () => {
		// given
		const pluginConfig: OpenCodeCodexOrchConfig = {};
		const config: Record<string, unknown> = {
			model: "anthropic/claude-opus-4-6",
			default_agent: "  Custom Agent  ",
			agent: {},
		};
		const handler = createConfigHandler({
			ctx: { directory: "/tmp" },
			pluginConfig,
			modelCacheState: {
				anthropicContext1MEnabled: false,
				modelContextLimitsCache: new Map(),
			},
		});

		// when
		await handler(config);

		// then
		expect(config.default_agent).toBe("Custom Agent");
	});

	test("does not normalize configured default_agent when Sisyphus is disabled", async () => {
		// given
		const pluginConfig: OpenCodeCodexOrchConfig = {
			orchestrator_agent: {
				disabled: true,
			},
		};
		const config: Record<string, unknown> = {
			model: "anthropic/claude-opus-4-6",
			default_agent: "  PrOmEtHeUs  ",
			agent: {},
		};
		const handler = createConfigHandler({
			ctx: { directory: "/tmp" },
			pluginConfig,
			modelCacheState: {
				anthropicContext1MEnabled: false,
				modelContextLimitsCache: new Map(),
			},
		});

		// when
		await handler(config);

		// then
		expect(config.default_agent).toBe("  PrOmEtHeUs  ");
	});
});

describe("Prometheus category config resolution", () => {
	test("resolves deep category config", () => {
		// given
		const categoryName = "deep";

		// when
		const config = resolveCategoryConfig(categoryName);

		// then
		expect(config).toBeDefined();
		expect(config?.model).toBe("openai/gpt-5.3-codex");
		expect(config?.variant).toBe("medium");
	});

	test("resolves visual-engineering category config", () => {
		// given
		const categoryName = "visual-engineering";

		// when
		const config = resolveCategoryConfig(categoryName);

		// then
		expect(config).toBeDefined();
		expect(config?.model).toBe("google/gemini-3.1-pro");
	});

	test("user categories override default categories", () => {
		// given
		const categoryName = "deep";
		const userCategories: Record<string, CategoryConfig> = {
			deep: {
				model: "google/antigravity-claude-opus-4-5-thinking",
				temperature: 0.1,
			},
		};

		// when
		const config = resolveCategoryConfig(categoryName, userCategories);

		// then
		expect(config).toBeDefined();
		expect(config?.model).toBe("google/antigravity-claude-opus-4-5-thinking");
		expect(config?.temperature).toBe(0.1);
	});

	test("returns undefined for unknown category", () => {
		// given
		const categoryName = "nonexistent-category";

		// when
		const config = resolveCategoryConfig(categoryName);

		// then
		expect(config).toBeUndefined();
	});

	test("falls back to default when user category has no entry", () => {
		// given
		const categoryName = "deep";
		const userCategories: Record<string, CategoryConfig> = {
			"visual-engineering": {
				model: "custom/visual-model",
			},
		};

		// when
		const config = resolveCategoryConfig(categoryName, userCategories);

		// then - falls back to DEFAULT_CATEGORIES
		expect(config).toBeDefined();
		expect(config?.model).toBe("openai/gpt-5.3-codex");
		expect(config?.variant).toBe("medium");
	});

	test("preserves all category properties (temperature, top_p, tools, etc.)", () => {
		// given
		const categoryName = "custom-category";
		const userCategories: Record<string, CategoryConfig> = {
			"custom-category": {
				model: "test/model",
				temperature: 0.5,
				top_p: 0.9,
				maxTokens: 32000,
				tools: { tool1: true, tool2: false },
			},
		};

		// when
		const config = resolveCategoryConfig(categoryName, userCategories);

		// then
		expect(config).toBeDefined();
		expect(config?.model).toBe("test/model");
		expect(config?.temperature).toBe(0.5);
		expect(config?.top_p).toBe(0.9);
		expect(config?.maxTokens).toBe(32000);
		expect(config?.tools).toEqual({ tool1: true, tool2: false });
	});
});

describe("plan agent without prometheus", () => {
	test("keeps explicit plan agent configuration intact", async () => {
		const pluginConfig: OpenCodeCodexOrchConfig = {
			orchestrator_agent: {
				planner_enabled: true,
				replace_plan: true,
			},
		};
		const config: Record<string, unknown> = {
			model: "anthropic/claude-opus-4-6",
			agent: {
				plan: {
					name: "plan",
					mode: "primary",
					prompt: "original plan prompt",
				},
			},
		};
		const handler = createConfigHandler({
			ctx: { directory: "/tmp" },
			pluginConfig,
			modelCacheState: {
				anthropicContext1MEnabled: false,
				modelContextLimitsCache: new Map(),
			},
		});

		await handler(config);

		const agents = config.agent as Record<
			string,
			{ mode?: string; prompt?: string }
		>;
		expect(agents.plan).toBeDefined();
		expect(agents.plan.mode).toBe("primary");
		expect(agents.plan.prompt).toBe("original plan prompt");
		expect(
			agents[getAgentDisplayName("prometheus") as keyof typeof agents],
		).toBeUndefined();
	});
});

describe("Deadlock prevention - fetchAvailableModels must not receive client", () => {
	test("handler completes without consulting the OpenCode client during agent loading", async () => {
		const pluginConfig: OpenCodeCodexOrchConfig = {
			orchestrator_agent: {
				planner_enabled: true,
			},
		};
		const config: Record<string, unknown> = {
			model: "anthropic/claude-opus-4-6",
			agent: {},
		};
		const mockClient = {
			provider: { list: () => Promise.resolve({ data: { connected: [] } }) },
			model: { list: () => Promise.resolve({ data: [] }) },
		};
		const providerList = spyOn(mockClient.provider, "list");
		const modelList = spyOn(mockClient.model, "list");
		const handler = createConfigHandler({
			ctx: { directory: "/tmp", client: mockClient },
			pluginConfig,
			modelCacheState: {
				anthropicContext1MEnabled: false,
				modelContextLimitsCache: new Map(),
			},
		});

		// when
		await handler(config);

		expect(providerList).not.toHaveBeenCalled();
		expect(modelList).not.toHaveBeenCalled();
	});
});

describe("config-handler plugin loading error boundary (#1559)", () => {
	test("returns empty defaults when loadAllPluginComponents throws", async () => {
		//#given
		(pluginLoader.loadAllPluginComponents as any).mockRestore?.();
		spyOn(pluginLoader, "loadAllPluginComponents" as any).mockRejectedValue(
			new Error("crash"),
		);
		const pluginConfig: OpenCodeCodexOrchConfig = {};
		const config: Record<string, unknown> = {
			model: "anthropic/claude-opus-4-6",
			agent: {},
		};
		const handler = createConfigHandler({
			ctx: { directory: "/tmp" },
			pluginConfig,
			modelCacheState: {
				anthropicContext1MEnabled: false,
				modelContextLimitsCache: new Map(),
			},
		});

		//#when
		await handler(config);

		//#then
		expect(config.agent).toBeDefined();
	});

	test("returns empty defaults when loadAllPluginComponents times out", async () => {
		//#given
		(pluginLoader.loadAllPluginComponents as any).mockRestore?.();
		spyOn(pluginLoader, "loadAllPluginComponents" as any).mockImplementation(
			() => new Promise(() => {}),
		);
		const pluginConfig: OpenCodeCodexOrchConfig = {
			experimental: { plugin_load_timeout_ms: 100 },
		};
		const config: Record<string, unknown> = {
			model: "anthropic/claude-opus-4-6",
			agent: {},
		};
		const handler = createConfigHandler({
			ctx: { directory: "/tmp" },
			pluginConfig,
			modelCacheState: {
				anthropicContext1MEnabled: false,
				modelContextLimitsCache: new Map(),
			},
		});

		//#when
		await handler(config);

		//#then
		expect(config.agent).toBeDefined();
	}, 5000);

	test("logs error when loadAllPluginComponents fails", async () => {
		//#given
		(pluginLoader.loadAllPluginComponents as any).mockRestore?.();
		spyOn(pluginLoader, "loadAllPluginComponents" as any).mockRejectedValue(
			new Error("crash"),
		);
		const logSpy = shared.log as ReturnType<typeof spyOn>;
		const pluginConfig: OpenCodeCodexOrchConfig = {};
		const config: Record<string, unknown> = {
			model: "anthropic/claude-opus-4-6",
			agent: {},
		};
		const handler = createConfigHandler({
			ctx: { directory: "/tmp" },
			pluginConfig,
			modelCacheState: {
				anthropicContext1MEnabled: false,
				modelContextLimitsCache: new Map(),
			},
		});

		//#when
		await handler(config);

		//#then
		const logCalls = logSpy.mock.calls.map((c: unknown[]) => c[0]);
		const hasPluginFailureLog = logCalls.some(
			(msg: string) =>
				typeof msg === "string" && msg.includes("Plugin loading failed"),
		);
		expect(hasPluginFailureLog).toBe(true);
	});

	test("passes through plugin data on successful load (identity test)", async () => {
		//#given
		(pluginLoader.loadAllPluginComponents as any).mockRestore?.();
		spyOn(pluginLoader, "loadAllPluginComponents" as any).mockResolvedValue({
			commands: { "test-cmd": { description: "test", template: "test" } },
			agents: {},
			mcpServers: {},
			hooksConfigs: [],
			plugins: [{ name: "test-plugin", version: "1.0.0" }],
			errors: [],
		});
		const pluginConfig: OpenCodeCodexOrchConfig = {};
		const config: Record<string, unknown> = {
			model: "anthropic/claude-opus-4-6",
			agent: {},
		};
		const handler = createConfigHandler({
			ctx: { directory: "/tmp" },
			pluginConfig,
			modelCacheState: {
				anthropicContext1MEnabled: false,
				modelContextLimitsCache: new Map(),
			},
		});

		//#when
		await handler(config);

		//#then
		const commands = config.command as Record<string, unknown>;
		expect(commands["test-cmd"]).toBeDefined();
	});
});

describe("per-agent todowrite/todoread deny when task_system enabled", () => {
	// Orchestrator keeps todo denial while builtin agents remain directly addressable
	const AGENTS_WITH_TODO_DENY = new Set([getAgentDisplayName("orchestrator")]);

	test("denies todowrite and todoread for primary agents when task_system is enabled", async () => {
		//#given
		const createBuiltinAgentsMock = agents.createBuiltinAgents as unknown as {
			mockResolvedValue: (value: Record<string, unknown>) => void;
		};
		createBuiltinAgentsMock.mockResolvedValue({
			orchestrator: { name: "orchestrator", prompt: "test", mode: "primary" },
			executor: { name: "executor", prompt: "test", mode: "subagent" },
			oracle: { name: "oracle", prompt: "test", mode: "subagent" },
		});

		const pluginConfig: OpenCodeCodexOrchConfig = {
			experimental: { task_system: true },
		};
		const config: Record<string, unknown> = {
			model: "anthropic/claude-opus-4-6",
			agent: {},
		};
		const handler = createConfigHandler({
			ctx: { directory: "/tmp" },
			pluginConfig,
			modelCacheState: {
				anthropicContext1MEnabled: false,
				modelContextLimitsCache: new Map(),
			},
		});

		//#when
		await handler(config);

		//#then - Orchestrator has todo deny, executor remains present with permissions
		const agentResult = config.agent as Record<
			string,
			{ permission?: Record<string, unknown>; hidden?: boolean }
		>;
		for (const agentName of AGENTS_WITH_TODO_DENY) {
			expect(agentResult[agentName]?.permission?.todowrite).toBe("deny");
			expect(agentResult[agentName]?.permission?.todoread).toBe("deny");
		}
		// Executor is present and remains directly addressable
		const executor = agentResult[getAgentDisplayName("executor")];
		expect(executor).toBeDefined();
		expect(executor.hidden).toBeUndefined();
		expect(executor.permission?.task).toBe("allow");
	});

	test("does not deny todowrite/todoread when task_system is disabled", async () => {
		//#given
		const createBuiltinAgentsMock = agents.createBuiltinAgents as unknown as {
			mockResolvedValue: (value: Record<string, unknown>) => void;
		};
		createBuiltinAgentsMock.mockResolvedValue({
			orchestrator: { name: "orchestrator", prompt: "test", mode: "primary" },
		});

		const pluginConfig: OpenCodeCodexOrchConfig = {
			experimental: { task_system: false },
		};
		const config: Record<string, unknown> = {
			model: "anthropic/claude-opus-4-6",
			agent: {},
		};
		const handler = createConfigHandler({
			ctx: { directory: "/tmp" },
			pluginConfig,
			modelCacheState: {
				anthropicContext1MEnabled: false,
				modelContextLimitsCache: new Map(),
			},
		});

		//#when
		await handler(config);

		//#then
		const agentResult = config.agent as Record<
			string,
			{ permission?: Record<string, unknown> }
		>;
		expect(
			agentResult[getAgentDisplayName("orchestrator")]?.permission?.todowrite,
		).toBeUndefined();
		expect(
			agentResult[getAgentDisplayName("orchestrator")]?.permission?.todoread,
		).toBeUndefined();
	});

	test("does not deny todowrite/todoread when task_system is undefined", async () => {
		//#given
		const createBuiltinAgentsMock = agents.createBuiltinAgents as unknown as {
			mockResolvedValue: (value: Record<string, unknown>) => void;
		};
		createBuiltinAgentsMock.mockResolvedValue({
			orchestrator: { name: "orchestrator", prompt: "test", mode: "primary" },
		});

		const pluginConfig: OpenCodeCodexOrchConfig = {};
		const config: Record<string, unknown> = {
			model: "anthropic/claude-opus-4-6",
			agent: {},
		};
		const handler = createConfigHandler({
			ctx: { directory: "/tmp" },
			pluginConfig,
			modelCacheState: {
				anthropicContext1MEnabled: false,
				modelContextLimitsCache: new Map(),
			},
		});

		//#when
		await handler(config);

		//#then
		const agentResult = config.agent as Record<
			string,
			{ permission?: Record<string, unknown> }
		>;
		expect(
			agentResult[getAgentDisplayName("orchestrator")]?.permission?.todowrite,
		).toBeUndefined();
		expect(
			agentResult[getAgentDisplayName("orchestrator")]?.permission?.todoread,
		).toBeUndefined();
	});
});

describe("agent picker primary surface", () => {
	test("picker surface exposes only orchestrator and deepsearch from builtin team agents", async () => {
		// #given - only orchestrator and deepsearch should remain picker-visible
		const createBuiltinAgentsMock = agents.createBuiltinAgents as unknown as {
			mockResolvedValue: (value: Record<string, unknown>) => void;
		};
		createBuiltinAgentsMock.mockResolvedValue({
			orchestrator: { name: "orchestrator", prompt: "test", mode: "primary" },
			deepsearch: { name: "deepsearch", prompt: "research", mode: "primary" },
			executor: { name: "executor", prompt: "execute", mode: "subagent" },
			reviewer: { name: "reviewer", prompt: "review", mode: "subagent" },
			oracle: { name: "oracle", prompt: "oracle", mode: "subagent" },
			librarian: { name: "librarian", prompt: "librarian", mode: "subagent" },
			explore: { name: "explore", prompt: "explore", mode: "subagent" },
		});

		const pluginConfig: OpenCodeCodexOrchConfig = {};
		const config: Record<string, unknown> = {
			model: "anthropic/claude-opus-4-6",
			agent: {},
		};
		const handler = createConfigHandler({
			ctx: { directory: "/tmp" },
			pluginConfig,
			modelCacheState: {
				anthropicContext1MEnabled: false,
				modelContextLimitsCache: new Map(),
			},
		});

		// #when
		await handler(config);

		// #then - only orchestrator/deepsearch stay picker-visible; other builtin agents stay internal
		const agentConfig = config.agent as Record<
			string,
			{ hidden?: boolean; mode?: string }
		>;
		expect(agentConfig[getAgentDisplayName("orchestrator")]?.hidden).toBeUndefined();
		expect(agentConfig[getAgentDisplayName("deepsearch")]?.hidden).toBeUndefined();
		expect(agentConfig[getAgentDisplayName("executor")]?.hidden).toBeUndefined();
		expect(agentConfig[getAgentDisplayName("reviewer")]?.hidden).toBeUndefined();
		expect(agentConfig[getAgentDisplayName("oracle")]?.hidden).toBeUndefined();
		expect(agentConfig[getAgentDisplayName("librarian")]?.hidden).toBeUndefined();
		expect(agentConfig[getAgentDisplayName("explore")]?.hidden).toBeUndefined();
		expect(agentConfig[getAgentDisplayName("executor")]?.mode).toBe("subagent");
		expect(agentConfig[getAgentDisplayName("reviewer")]?.mode).toBe("subagent");
		expect(agentConfig[getAgentDisplayName("oracle")]?.mode).toBe("subagent");
		expect(agentConfig[getAgentDisplayName("librarian")]?.mode).toBe("subagent");
		expect(agentConfig[getAgentDisplayName("explore")]?.mode).toBe("subagent");
	});

	test("DeepSearch has mode: primary in final config (like Orchestrator) for picker visibility", async () => {
		// #given - standard agent setup with full builtin agents
		const createBuiltinAgentsMock = agents.createBuiltinAgents as unknown as {
			mockResolvedValue: (value: Record<string, unknown>) => void;
		};
		createBuiltinAgentsMock.mockResolvedValue({
			orchestrator: { name: "orchestrator", prompt: "test", mode: "primary" },
			deepsearch: { name: "deepsearch", prompt: "research", mode: "primary" },
			executor: { name: "executor", prompt: "execute", mode: "subagent" },
			reviewer: { name: "reviewer", prompt: "review", mode: "subagent" },
			oracle: { name: "oracle", prompt: "oracle", mode: "subagent" },
			librarian: { name: "librarian", prompt: "librarian", mode: "subagent" },
			explore: { name: "explore", prompt: "explore", mode: "subagent" },
		});

		const pluginConfig: OpenCodeCodexOrchConfig = {};
		const config: Record<string, unknown> = {
			model: "anthropic/claude-opus-4-6",
			agent: {},
		};
		const handler = createConfigHandler({
			ctx: { directory: "/tmp" },
			pluginConfig,
			modelCacheState: {
				anthropicContext1MEnabled: false,
				modelContextLimitsCache: new Map(),
			},
		});

		// #when
		await handler(config);

		// #then - DeepSearch must have mode: "primary" so the picker considers it visible
		// (The picker filters by mode property, not just hidden flag)
		const agentConfig = config.agent as Record<
			string,
			{ mode?: string; hidden?: boolean }
		>;

		// Orchestrator has mode: "primary" or "all" - visible in picker
		const orchestratorMode =
			agentConfig[getAgentDisplayName("orchestrator")]?.mode;
		expect(orchestratorMode).toMatch(/^(primary|all)$/);

		// DeepSearch should also have mode: "primary" to be visible in picker
		const deepsearchMode = agentConfig[getAgentDisplayName("deepsearch")]?.mode;
		expect(deepsearchMode).toBe("primary");

		// Other builtin agents remain subagents so the picker hides them
		expect(agentConfig[getAgentDisplayName("executor")]?.mode).toBe("subagent");
		expect(agentConfig[getAgentDisplayName("reviewer")]?.mode).toBe("subagent");
		expect(agentConfig[getAgentDisplayName("oracle")]?.mode).toBe("subagent");
		expect(agentConfig[getAgentDisplayName("librarian")]?.mode).toBe("subagent");
		expect(agentConfig[getAgentDisplayName("explore")]?.mode).toBe("subagent");
	});

	test("picker-facing config promotes deepsearch but keeps other builtin agents internal", async () => {
		// #given - standard agent setup with full builtin agents
		const createBuiltinAgentsMock = agents.createBuiltinAgents as unknown as {
			mockResolvedValue: (value: Record<string, unknown>) => void;
		};
		createBuiltinAgentsMock.mockResolvedValue({
			orchestrator: { name: "orchestrator", prompt: "test", mode: "primary" },
			deepsearch: { name: "deepsearch", prompt: "research", mode: "subagent" },
			executor: { name: "executor", prompt: "execute", mode: "subagent" },
			reviewer: { name: "reviewer", prompt: "review", mode: "subagent" },
			oracle: { name: "oracle", prompt: "oracle", mode: "subagent" },
			librarian: { name: "librarian", prompt: "librarian", mode: "subagent" },
			explore: { name: "explore", prompt: "explore", mode: "subagent" },
		});

		const pluginConfig: OpenCodeCodexOrchConfig = {};
		const config: Record<string, unknown> = {
			model: "anthropic/claude-opus-4-6",
			agent: {},
		};
		const handler = createConfigHandler({
			ctx: { directory: "/tmp" },
			pluginConfig,
			modelCacheState: {
				anthropicContext1MEnabled: false,
				modelContextLimitsCache: new Map(),
			},
		});

		// #when
		await handler(config);

		// #then - deepsearch becomes visible while the rest stay hidden by mode
		const agentConfig = config.agent as Record<
			string,
			{ hidden?: boolean; mode?: string }
		>;

		// Primary agents should be present and not hidden
		expect(
			agentConfig[getAgentDisplayName("orchestrator")]?.hidden,
		).toBeUndefined();
		expect(
			agentConfig[getAgentDisplayName("deepsearch")]?.hidden,
		).toBeUndefined();

		// Builtin team agents stay internal-only
		expect(
			(agentConfig[getAgentDisplayName("executor")] as { hidden?: boolean })
				?.hidden,
		).toBeUndefined();
		expect(
			(agentConfig[getAgentDisplayName("reviewer")] as { hidden?: boolean })
				?.hidden,
		).toBeUndefined();
		expect(
			(agentConfig[getAgentDisplayName("oracle")] as { hidden?: boolean })
				?.hidden,
		).toBeUndefined();
		expect(
			(agentConfig[getAgentDisplayName("librarian")] as { hidden?: boolean })
				?.hidden,
		).toBeUndefined();
		expect(
			(agentConfig[getAgentDisplayName("explore")] as { hidden?: boolean })
				?.hidden,
		).toBeUndefined();
		expect(agentConfig[getAgentDisplayName("executor")]?.mode).toBe("subagent");
		expect(agentConfig[getAgentDisplayName("reviewer")]?.mode).toBe("subagent");
		expect(agentConfig[getAgentDisplayName("oracle")]?.mode).toBe("subagent");
		expect(agentConfig[getAgentDisplayName("librarian")]?.mode).toBe("subagent");
		expect(agentConfig[getAgentDisplayName("explore")]?.mode).toBe("subagent");
	});

	test("picker-facing config does not include retired agent names", async () => {
		// #given - ensure retired names cannot leak into picker surface
		const createBuiltinAgentsMock = agents.createBuiltinAgents as unknown as {
			mockResolvedValue: (value: Record<string, unknown>) => void;
		};
		createBuiltinAgentsMock.mockResolvedValue({
			orchestrator: { name: "orchestrator", prompt: "test", mode: "primary" },
			deepsearch: { name: "deepsearch", prompt: "research", mode: "subagent" },
		});

		const pluginConfig: OpenCodeCodexOrchConfig = {};
		const config: Record<string, unknown> = {
			model: "anthropic/claude-opus-4-6",
			agent: {},
		};
		const handler = createConfigHandler({
			ctx: { directory: "/tmp" },
			pluginConfig,
			modelCacheState: {
				anthropicContext1MEnabled: false,
				modelContextLimitsCache: new Map(),
			},
		});

		// #when
		await handler(config);

		// #then - no retired names in picker-facing output
		const agentConfig = config.agent as Record<string, unknown>;
		const agentKeys = Object.keys(agentConfig);

		// Retired names should not appear
		expect(agentKeys).not.toContain("Sisyphus");
		expect(agentKeys).not.toContain("Sisyphus-Junior");
		expect(agentKeys).not.toContain("Prometheus");
		expect(agentKeys).not.toContain("Atlas");
	});
});

describe("disable_oco_env pass-through", () => {
	test("passes disable_oco_env=true to createBuiltinAgents", async () => {
		//#given
		const createBuiltinAgentsMock = agents.createBuiltinAgents as unknown as {
			mockResolvedValue: (value: Record<string, unknown>) => void;
			mock: { calls: unknown[][] };
		};
		createBuiltinAgentsMock.mockResolvedValue({
			orchestrator: {
				name: "orchestrator",
				prompt: "without-env",
				mode: "primary",
			},
		});

		const pluginConfig: OpenCodeCodexOrchConfig = {
			experimental: { disable_oco_env: true },
		};
		const config: Record<string, unknown> = {
			model: "anthropic/claude-opus-4-6",
			agent: {},
		};
		const handler = createConfigHandler({
			ctx: { directory: "/tmp" },
			pluginConfig,
			modelCacheState: {
				anthropicContext1MEnabled: false,
				modelContextLimitsCache: new Map(),
			},
		});

		//#when
		await handler(config);

		//#then
		const lastCall =
			createBuiltinAgentsMock.mock.calls[
				createBuiltinAgentsMock.mock.calls.length - 1
			];
		expect(lastCall).toBeDefined();
		expect(lastCall?.[11]).toBe(true);
	});

	test("passes disable_oco_env=false to createBuiltinAgents when omitted", async () => {
		//#given
		const createBuiltinAgentsMock = agents.createBuiltinAgents as unknown as {
			mockResolvedValue: (value: Record<string, unknown>) => void;
			mock: { calls: unknown[][] };
		};
		createBuiltinAgentsMock.mockResolvedValue({
			orchestrator: {
				name: "orchestrator",
				prompt: "with-env",
				mode: "primary",
			},
		});

		const pluginConfig: OpenCodeCodexOrchConfig = {};
		const config: Record<string, unknown> = {
			model: "anthropic/claude-opus-4-6",
			agent: {},
		};
		const handler = createConfigHandler({
			ctx: { directory: "/tmp" },
			pluginConfig,
			modelCacheState: {
				anthropicContext1MEnabled: false,
				modelContextLimitsCache: new Map(),
			},
		});

		//#when
		await handler(config);

		//#then
		const lastCall =
			createBuiltinAgentsMock.mock.calls[
				createBuiltinAgentsMock.mock.calls.length - 1
			];
		expect(lastCall).toBeDefined();
		expect(lastCall?.[11]).toBe(false);
	});
});
