import type { AgentConfig } from "@opencode-ai/sdk"
import type { CategoriesConfig } from "../config/schema"
import type { BrowserAutomationProvider } from "../config/schema"
import type { LoadedSkill } from "../features/opencode-skill-loader/types"
import {
  fetchAvailableModels,
  readConnectedProvidersCache,
  readProviderModelsCache,
} from "../shared"
import { mergeCategories } from "../shared/merge-categories"
import { CATEGORY_DESCRIPTIONS } from "../tools/delegate-task/constants"
import { createDeepSearchAgent, DEEPSEARCH_PROMPT_METADATA } from "./deepsearch"
import type { AvailableCategory } from "./dynamic-agent-prompt-builder"
import { createExploreAgent, EXPLORE_PROMPT_METADATA } from "./explore"
import { createLibrarianAgent, LIBRARIAN_PROMPT_METADATA } from "./librarian"
import { createOracleAgent, ORACLE_PROMPT_METADATA } from "./oracle"
import { createOrchestratorAgent } from "./orchestrator"
import { createReviewerAgent, reviewerPromptMetadata } from "./reviewer"
import type { AgentFactory, AgentOverrides, AgentPromptMetadata, BuiltinAgentName } from "./types"
import { maybeCreateOrchestratorConfig } from "./builtin-agents/orchestrator-agent"
import { buildAvailableSkills } from "./builtin-agents/available-skills"
import { collectPendingBuiltinAgents } from "./builtin-agents/general-agents"
import { buildCustomAgentMetadata, parseRegisteredAgentSummaries } from "./custom-agent-summaries"

type AgentSource = AgentFactory | AgentConfig

const agentSources: Partial<Record<BuiltinAgentName, AgentSource>> = {
  orchestrator: createOrchestratorAgent,
  oracle: createOracleAgent,
  librarian: createLibrarianAgent,
  explore: createExploreAgent,
  deepsearch: createDeepSearchAgent,
  reviewer: createReviewerAgent,
}

const agentMetadata: Partial<Record<BuiltinAgentName, AgentPromptMetadata>> = {
  oracle: ORACLE_PROMPT_METADATA,
  librarian: LIBRARIAN_PROMPT_METADATA,
  explore: EXPLORE_PROMPT_METADATA,
  deepsearch: DEEPSEARCH_PROMPT_METADATA,
  reviewer: reviewerPromptMetadata,
}

export async function createBuiltinAgents(
  disabledAgents: string[] = [],
  agentOverrides: AgentOverrides = {},
  directory?: string,
  systemDefaultModel?: string,
  categories?: CategoriesConfig,
  discoveredSkills: LoadedSkill[] = [],
  customAgentSummaries?: unknown,
  browserProvider?: BrowserAutomationProvider,
  uiSelectedModel?: string,
  disabledSkills?: Set<string>,
  useTaskSystem = false,
  disableOcoEnv = false,
): Promise<Record<string, AgentConfig>> {
  const connectedProviders = readConnectedProvidersCache()
  const providerModelsConnected = connectedProviders
    ? (readProviderModelsCache()?.connected ?? [])
    : []
  const mergedConnectedProviders = Array.from(
    new Set([...(connectedProviders ?? []), ...providerModelsConnected]),
  )
  const availableModels = await fetchAvailableModels(undefined, {
    connectedProviders: mergedConnectedProviders.length > 0 ? mergedConnectedProviders : undefined,
  })
  const isFirstRunNoCache =
    availableModels.size === 0 && mergedConnectedProviders.length === 0

  const result: Record<string, AgentConfig> = {}
  const mergedCategories = mergeCategories(categories)
  const availableCategories: AvailableCategory[] = Object.entries(mergedCategories).map(([name]) => ({
    name,
    description: categories?.[name]?.description ?? CATEGORY_DESCRIPTIONS[name] ?? "General tasks",
  }))
  const availableSkills = buildAvailableSkills(discoveredSkills, browserProvider, disabledSkills)

  const { pendingAgentConfigs, availableAgents } = collectPendingBuiltinAgents({
    agentSources,
    agentMetadata,
    disabledAgents,
    agentOverrides,
    directory,
    systemDefaultModel,
    mergedCategories,
    browserProvider,
    uiSelectedModel,
    availableModels,
    disabledSkills,
    disableOcoEnv,
  })

  const registeredAgents = parseRegisteredAgentSummaries(customAgentSummaries)
  const builtinAgentNames = new Set(Object.keys(agentSources).map((name) => name.toLowerCase()))
  const disabledAgentNames = new Set(disabledAgents.map((name) => name.toLowerCase()))

  for (const agent of registeredAgents) {
    const lowerName = agent.name.toLowerCase()
    if (builtinAgentNames.has(lowerName)) continue
    if (disabledAgentNames.has(lowerName)) continue
    if (availableAgents.some((availableAgent) => availableAgent.name.toLowerCase() === lowerName)) continue

    availableAgents.push({
      name: agent.name,
      description: agent.description,
      metadata: buildCustomAgentMetadata(agent.name, agent.description),
    })
  }

  const orchestratorConfig = maybeCreateOrchestratorConfig({
    disabledAgents,
    agentOverrides,
    uiSelectedModel,
    availableModels,
    systemDefaultModel,
    isFirstRunNoCache,
    availableAgents,
    availableSkills,
    availableCategories,
    mergedCategories,
    directory,
    userCategories: categories,
    useTaskSystem,
    disableOcoEnv,
  })
  if (orchestratorConfig) {
    result.orchestrator = orchestratorConfig
  }

  for (const [name, config] of pendingAgentConfigs) {
    result[name] = config
  }

  return result
}
