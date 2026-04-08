import { createBuiltinAgents } from "../agents";
import { createExecutorAgentWithOverrides } from "../agents/executor";
import type { OpenCodeCodexOrchConfig } from "../config";
import { log, migrateAgentConfig } from "../shared";
import { getAgentDisplayName } from "../shared/agent-display-names";
import { AGENT_NAME_MAP } from "../shared/migration";
import {
  discoverConfigSourceSkills,
  discoverOpencodeGlobalSkills,
  discoverOpencodeProjectSkills,
  discoverProjectClaudeSkills,
  discoverRuntimeConfiguredSkills,
  discoverUserClaudeSkills,
} from "../features/opencode-skill-loader";
import { loadProjectAgents, loadUserAgents } from "../features/claude-code-agent-loader";
import type { PluginComponents } from "./plugin-components-loader";
import { reorderAgentsByPriority } from "./agent-priority-order";
import { remapAgentKeysToDisplayNames } from "./agent-key-remapper";

type AgentConfigRecord = Record<string, Record<string, unknown> | undefined> & {
  build?: Record<string, unknown>;
  plan?: Record<string, unknown>;
};

function alignAgentPickerVisibility(
  agents: Record<string, unknown>
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(agents).map(([name, value]) => {
      if (!value || typeof value !== "object") {
        return [name, value]
      }

      const config = value as Record<string, unknown>

      if (name === "deepsearch") {
        return [name, { ...config, mode: "primary", hidden: undefined }]
      }

      if (name === "build") {
        return [name, { ...config, mode: "all", hidden: undefined }]
      }

      if (name === "plan") {
        return [name, { ...config, hidden: true }]
      }

      return [name, value]
    }),
  )
}

function getConfiguredDefaultAgent(config: Record<string, unknown>): string | undefined {
  const defaultAgent = config.default_agent;
  if (typeof defaultAgent !== "string") return undefined;

  const trimmedDefaultAgent = defaultAgent.trim();
  return trimmedDefaultAgent.length > 0 ? trimmedDefaultAgent : undefined;
}

function getBuiltinPrimaryAgent(
  builtinAgents: Record<string, unknown>
): Record<string, unknown> | undefined {
  const orchestrator = builtinAgents.orchestrator
  if (orchestrator && typeof orchestrator === "object") {
    return orchestrator as Record<string, unknown>
  }

  return undefined
}

export async function applyAgentConfig(params: {
  config: Record<string, unknown>;
  pluginConfig: OpenCodeCodexOrchConfig;
  ctx: { directory: string; client?: any };
  pluginComponents: PluginComponents;
}): Promise<Record<string, unknown>> {
  const migratedDisabledAgents = (params.pluginConfig.disabled_agents ?? []).map(
    (agent) => {
      return AGENT_NAME_MAP[agent.toLowerCase()] ?? AGENT_NAME_MAP[agent] ?? agent;
    },
  ) as typeof params.pluginConfig.disabled_agents;

  const includeClaudeSkillsForAwareness = params.pluginConfig.claude_code?.skills ?? true;
  const [
    discoveredConfigSourceSkills,
    discoveredUserSkills,
    discoveredProjectSkills,
    discoveredOpencodeGlobalSkills,
    discoveredOpencodeProjectSkills,
    discoveredRuntimeConfiguredSkills,
  ] = await Promise.all([
    discoverConfigSourceSkills({
      config: params.pluginConfig.skills,
      configDir: params.ctx.directory,
    }),
    includeClaudeSkillsForAwareness ? discoverUserClaudeSkills() : Promise.resolve([]),
    includeClaudeSkillsForAwareness
       ? discoverProjectClaudeSkills(params.ctx.directory)
       : Promise.resolve([]),
    discoverOpencodeGlobalSkills(),
    discoverOpencodeProjectSkills(params.ctx.directory),
    discoverRuntimeConfiguredSkills({
      directory: params.ctx.directory,
      runtimeConfig: params.config,
    }),
  ]);

  const allDiscoveredSkills = [
    ...discoveredConfigSourceSkills,
    ...discoveredOpencodeProjectSkills,
    ...discoveredProjectSkills,
    ...discoveredOpencodeGlobalSkills,
    ...discoveredUserSkills,
    ...discoveredRuntimeConfiguredSkills,
  ];

  const browserProvider =
    params.pluginConfig.browser_automation_engine?.provider ?? "playwright";
  const currentModel = params.config.model as string | undefined;
  const disabledSkills = new Set<string>(params.pluginConfig.disabled_skills ?? []);
  const useTaskSystem = params.pluginConfig.experimental?.task_system ?? false;
  const disableOcoEnv =
    params.pluginConfig.experimental?.disable_oco_env
    ?? params.pluginConfig.experimental?.disable_omo_env
    ?? false;

  const builtinAgents = await createBuiltinAgents(
    migratedDisabledAgents,
    params.pluginConfig.agents,
    params.ctx.directory,
    currentModel,
    params.pluginConfig.categories,
    allDiscoveredSkills,
    params.ctx.client,
    browserProvider,
    currentModel,
    disabledSkills,
    useTaskSystem,
    disableOcoEnv,
  );

  const includeClaudeAgents = params.pluginConfig.claude_code?.agents ?? true;
  const userAgents = includeClaudeAgents ? loadUserAgents() : {};
  const projectAgents = includeClaudeAgents ? loadProjectAgents(params.ctx.directory) : {};

  const rawPluginAgents = params.pluginComponents.agents;
  const pluginAgents = Object.fromEntries(
    Object.entries(rawPluginAgents).map(([key, value]) => [
      key,
      value ? migrateAgentConfig(value as Record<string, unknown>) : value,
    ]),
  );

  const disabledAgentNames = new Set(
    (migratedDisabledAgents ?? []).map(a => a.toLowerCase())
  );

  const filterDisabledAgents = (agents: Record<string, unknown>) =>
    Object.fromEntries(
      Object.entries(agents).filter(([name]) => !disabledAgentNames.has(name.toLowerCase()))
    );

  const orchestratorAgentConfig = params.pluginConfig.orchestrator_agent
  const isOrchestratorEnabled = orchestratorAgentConfig?.disabled !== true;
  const builderEnabled =
    orchestratorAgentConfig?.default_builder_enabled ?? false;
  const configuredDefaultAgent = getConfiguredDefaultAgent(params.config);

  const configAgent = params.config.agent as AgentConfigRecord | undefined;

  const builtinPrimaryAgent = getBuiltinPrimaryAgent(builtinAgents)

  if (isOrchestratorEnabled && builtinPrimaryAgent) {
    if (configuredDefaultAgent) {
      (params.config as { default_agent?: string }).default_agent =
        getAgentDisplayName(configuredDefaultAgent);
    } else {
      (params.config as { default_agent?: string }).default_agent =
        getAgentDisplayName("orchestrator");
    }

    const agentConfig: Record<string, unknown> = {
      orchestrator: builtinPrimaryAgent,
    };

    agentConfig.executor = createExecutorAgentWithOverrides(
      params.pluginConfig.agents?.executor,
      undefined,
      useTaskSystem,
    );

    if (builderEnabled) {
      const { name: _buildName, ...buildConfigWithoutName } =
        configAgent?.build ?? {};
      const migratedBuildConfig = migrateAgentConfig(
        buildConfigWithoutName as Record<string, unknown>,
      );
      const override = params.pluginConfig.agents?.["OpenCode-Builder"];
      const base = {
        ...migratedBuildConfig,
        description: `${(configAgent?.build?.description as string) ?? "Build agent"} (OpenCode default)`,
      };
      agentConfig["OpenCode-Builder"] = override ? { ...base, ...override } : base;
    }

    const filteredConfigAgents = configAgent
      ? Object.fromEntries(
          Object.entries(configAgent)
            .filter(([key]) => {
              if (key === "build") return false;
              if (key in builtinAgents) return false;
              if (key === "executor") return false;
              return true;
            })
            .map(([key, value]) => [
              key,
              value ? migrateAgentConfig(value as Record<string, unknown>) : value,
            ]),
        )
      : {};

    const migratedBuild = configAgent?.build
      ? migrateAgentConfig(configAgent.build as Record<string, unknown>)
      : {};

    // Collect all builtin agent names to prevent user/project .md files from overriding them
    const builtinAgentNames = new Set([
        ...Object.keys(agentConfig),
        ...Object.keys(builtinAgents),
      ]);

    // Filter user/project agents that duplicate builtin agents (they have mode: "subagent" hardcoded
    // in loadAgentsFromDir which would incorrectly override the builtin mode: "primary")
    const filteredUserAgents = Object.fromEntries(
      Object.entries(userAgents).filter(([key]) => !builtinAgentNames.has(key)),
    );
    const filteredProjectAgents = Object.fromEntries(
      Object.entries(projectAgents).filter(([key]) => !builtinAgentNames.has(key)),
    );

    params.config.agent = {
      ...agentConfig,
      ...Object.fromEntries(
        Object.entries(builtinAgents).filter(([key]) => key !== "orchestrator"),
      ),
      ...filterDisabledAgents(filteredUserAgents),
      ...filterDisabledAgents(filteredProjectAgents),
      ...filterDisabledAgents(pluginAgents),
      ...filteredConfigAgents,
      build: { ...migratedBuild, mode: "subagent", hidden: true },
    };
  } else {
    // Filter user/project agents that duplicate builtin agents
    const builtinAgentNames = new Set(Object.keys(builtinAgents));
    const filteredUserAgents = Object.fromEntries(
      Object.entries(userAgents).filter(([key]) => !builtinAgentNames.has(key)),
    );
    const filteredProjectAgents = Object.fromEntries(
      Object.entries(projectAgents).filter(([key]) => !builtinAgentNames.has(key)),
    );

    params.config.agent = {
      ...builtinAgents,
      ...filterDisabledAgents(filteredUserAgents),
      ...filterDisabledAgents(filteredProjectAgents),
      ...filterDisabledAgents(pluginAgents),
      ...configAgent,
    };
  }

	if (params.config.agent) {
		params.config.agent = alignAgentPickerVisibility(
			params.config.agent as Record<string, unknown>,
		)
		params.config.agent = remapAgentKeysToDisplayNames(
			params.config.agent as Record<string, unknown>,
		);
		params.config.agent = reorderAgentsByPriority(
			params.config.agent as Record<string, unknown>,
		);
	}

  const agentResult = params.config.agent as Record<string, unknown>;
  log("[config-handler] agents loaded", { agentKeys: Object.keys(agentResult) });
  return agentResult;
}
