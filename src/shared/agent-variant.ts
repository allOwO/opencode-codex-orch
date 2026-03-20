import type { OpenCodeCodexOrchConfig } from "../config"
import { AGENT_MODEL_REQUIREMENTS, CATEGORY_MODEL_REQUIREMENTS } from "./model-requirements"

export function resolveAgentVariant(
  config: OpenCodeCodexOrchConfig,
  agentName?: string
): string | undefined {
  if (!agentName) {
    return undefined
  }

  const agentOverrides = config.agents as
    | Record<string, { variant?: string; category?: string }>
    | undefined
  const agentOverride = agentOverrides
    ? agentOverrides[agentName]
      ?? Object.entries(agentOverrides).find(([key]) => key.toLowerCase() === agentName.toLowerCase())?.[1]
    : undefined
  if (!agentOverride) {
    return undefined
  }

  if (agentOverride.variant) {
    return agentOverride.variant
  }

  const categoryName = agentOverride.category
  if (!categoryName) {
    return undefined
  }

  return config.categories?.[categoryName]?.variant
}

const BUILTIN_AGENT_REASONING_EFFORT: Record<string, string> = {
  sisyphus: "high",
  oracle: "medium",
  momus: "medium",
  "sisyphus-junior": "medium",
}

export function resolveAgentReasoningEffort(
  config: OpenCodeCodexOrchConfig,
  agentName?: string,
): string | undefined {
  if (!agentName) {
    return undefined
  }

  const agentOverrides = config.agents as
    | Record<string, { reasoningEffort?: string; category?: string }>
    | undefined
  const agentOverride = agentOverrides
    ? agentOverrides[agentName]
      ?? Object.entries(agentOverrides).find(([key]) => key.toLowerCase() === agentName.toLowerCase())?.[1]
    : undefined

  if (agentOverride?.reasoningEffort) {
    return agentOverride.reasoningEffort
  }

  const categoryName = agentOverride?.category
  if (categoryName) {
    const categoryEffort = config.categories?.[categoryName]?.reasoningEffort
    if (categoryEffort) {
      return categoryEffort
    }
  }

  // Fall back to builtin defaults when no plugin config override is set
  const normalizedName = agentName.toLowerCase()
  return BUILTIN_AGENT_REASONING_EFFORT[normalizedName]
}

export function resolveVariantForModel(
  config: OpenCodeCodexOrchConfig,
  agentName: string,
  currentModel: { providerID: string; modelID: string },
): string | undefined {
  const agentOverrides = config.agents as
    | Record<string, { variant?: string; category?: string }>
    | undefined
  const agentOverride = agentOverrides
    ? agentOverrides[agentName]
      ?? Object.entries(agentOverrides).find(([key]) => key.toLowerCase() === agentName.toLowerCase())?.[1]
    : undefined
  if (agentOverride?.variant) {
    return agentOverride.variant
  }

  const agentRequirement = AGENT_MODEL_REQUIREMENTS[agentName]
  if (agentRequirement) {
    return findVariantInChain(agentRequirement.fallbackChain, currentModel)
  }
  const categoryName = agentOverride?.category
  if (categoryName) {
    const categoryRequirement = CATEGORY_MODEL_REQUIREMENTS[categoryName]
    if (categoryRequirement) {
      return findVariantInChain(categoryRequirement.fallbackChain, currentModel)
    }
  }

  return undefined
}

function findVariantInChain(
  fallbackChain: { providers: string[]; model: string; variant?: string }[],
  currentModel: { providerID: string; modelID: string },
): string | undefined {
  for (const entry of fallbackChain) {
    if (
      entry.providers.includes(currentModel.providerID)
      && entry.model === currentModel.modelID
    ) {
      return entry.variant
    }
  }

  // Some providers expose identical model IDs (e.g. OpenAI models via different providers).
  // If we didn't find an exact provider+model match, fall back to model-only matching.
  for (const entry of fallbackChain) {
    if (entry.model === currentModel.modelID) {
      return entry.variant
    }
  }
  return undefined
}

export function applyAgentVariant(
  config: OpenCodeCodexOrchConfig,
  agentName: string | undefined,
  message: { variant?: string }
): void {
  const variant = resolveAgentVariant(config, agentName)
  if (variant !== undefined && message.variant === undefined) {
    message.variant = variant
  }
}

export function applyAgentReasoningEffort(
  config: OpenCodeCodexOrchConfig,
  agentName: string | undefined,
  message: { reasoningEffort?: string },
): void {
  const reasoningEffort = resolveAgentReasoningEffort(config, agentName)
  if (reasoningEffort !== undefined && message.reasoningEffort === undefined) {
    message.reasoningEffort = reasoningEffort
  }
}
