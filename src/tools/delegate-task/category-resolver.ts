import type { ModelFallbackInfo } from "../../features/task-toast-manager/types"
import type { DelegateTaskArgs, DelegatedTaskModelConfig } from "./types"
import type { ExecutorContext } from "./executor-types"
import type { FallbackEntry } from "../../shared/model-requirements"
import { mergeCategories } from "../../shared/merge-categories"
import { EXECUTOR_AGENT } from "./executor-agent"
import { resolveCategoryConfig } from "./categories"
import { getCanonicalCategoryName } from "./constants"
import { parseModelString } from "./model-string-parser"
import { CATEGORY_MODEL_REQUIREMENTS } from "../../shared/model-requirements"
import { normalizeFallbackModels } from "../../shared/model-resolver"
import { buildFallbackChainFromModels } from "../../shared/fallback-chain-from-models"
import { getAvailableModelsForDelegateTask } from "./available-models"
import { resolveModelForDelegateTask } from "./model-selection"

export interface CategoryResolutionResult {
  agentToUse: string
  categoryModel: DelegatedTaskModelConfig | undefined
  categoryPromptAppend: string | undefined
  maxPromptTokens?: number
  modelInfo: ModelFallbackInfo | undefined
  actualModel: string | undefined
  isUnstableAgent: boolean
  fallbackChain?: FallbackEntry[]  // For runtime retry on model errors
  error?: string
}

function buildDelegatedTaskModelConfig(
  parsedModel: { providerID: string; modelID: string } | undefined,
  variant: string | undefined,
  config: {
    temperature?: number
    top_p?: number
    maxTokens?: number
    thinking?: { type: "enabled" | "disabled"; budgetTokens?: number }
    reasoningEffort?: "low" | "medium" | "high" | "xhigh"
    textVerbosity?: "low" | "medium" | "high"
  }
): DelegatedTaskModelConfig | undefined {
  if (!parsedModel) {
    return undefined
  }

  return {
    ...parsedModel,
    ...(variant ? { variant } : {}),
    ...(config.temperature !== undefined ? { temperature: config.temperature } : {}),
    ...(config.top_p !== undefined ? { top_p: config.top_p } : {}),
    ...(config.maxTokens !== undefined ? { maxTokens: config.maxTokens } : {}),
    ...(config.thinking !== undefined ? { thinking: config.thinking } : {}),
    ...(config.reasoningEffort !== undefined ? { reasoningEffort: config.reasoningEffort } : {}),
    ...(config.textVerbosity !== undefined ? { textVerbosity: config.textVerbosity } : {}),
  }
}

export async function resolveCategoryExecution(
  args: DelegateTaskArgs,
  executorCtx: ExecutorContext,
  inheritedModel: string | undefined,
  systemDefaultModel: string | undefined
): Promise<CategoryResolutionResult> {
  const { client, userCategories, executorModel } = executorCtx

  const availableModels = await getAvailableModelsForDelegateTask(client)

  const categoryName = getCanonicalCategoryName(args.category!)
  const enabledCategories = mergeCategories(userCategories)
  const categoryExists = enabledCategories[categoryName] !== undefined

  const resolved = resolveCategoryConfig(categoryName, {
    userCategories,
    inheritedModel,
    systemDefaultModel,
    availableModels,
  })

  if (!resolved) {
    const requirement = CATEGORY_MODEL_REQUIREMENTS[categoryName]
    const allCategoryNames = Object.keys(enabledCategories).join(", ")

    if (categoryExists && requirement?.requiresModel) {
      return {
        agentToUse: "",
        categoryModel: undefined,
        categoryPromptAppend: undefined,
        maxPromptTokens: undefined,
        modelInfo: undefined,
        actualModel: undefined,
        isUnstableAgent: false,
        error: `Category "${categoryName}" requires model "${requirement.requiresModel}" which is not available.

To use this category:
1. Connect a provider with this model: ${requirement.requiresModel}
2. Or configure an alternative model in your opencode-codex-orch.json for this category

Available categories: ${allCategoryNames}`,
      }
    }

    return {
      agentToUse: "",
      categoryModel: undefined,
      categoryPromptAppend: undefined,
      maxPromptTokens: undefined,
      modelInfo: undefined,
      actualModel: undefined,
      isUnstableAgent: false,
      error: `Unknown category: "${categoryName}". Available: ${allCategoryNames}`,
    }
  }

  const requirement = CATEGORY_MODEL_REQUIREMENTS[categoryName]
  const normalizedConfiguredFallbackModels = normalizeFallbackModels(resolved.config.fallback_models)
  let actualModel: string | undefined
  let modelInfo: ModelFallbackInfo | undefined
  let categoryModel: DelegatedTaskModelConfig | undefined

  const overrideModel = executorModel
  const explicitCategoryModel = userCategories?.[categoryName]?.model ?? userCategories?.[args.category!]?.model

  if (!requirement) {
    // Precedence: explicit category model > executor default > category resolved model
    // This keeps `executor.model` useful as a global default while allowing
    // per-category overrides via `categories[category].model`.
    actualModel = explicitCategoryModel ?? overrideModel ?? resolved.model
    if (actualModel) {
      modelInfo = explicitCategoryModel || overrideModel
        ? { model: actualModel, type: "user-defined", source: "override" }
        : { model: actualModel, type: "system-default", source: "system-default" }
    }
  } else {
    const resolution = resolveModelForDelegateTask({
      userModel: explicitCategoryModel ?? overrideModel,
      userFallbackModels: normalizedConfiguredFallbackModels,
      categoryDefaultModel: resolved.model,
      fallbackChain: requirement.fallbackChain,
      availableModels,
      systemDefaultModel,
    })

    if (resolution) {
      const { model: resolvedModel, variant: resolvedVariant } = resolution
      actualModel = resolvedModel

      if (!parseModelString(actualModel)) {
        return {
          agentToUse: "",
          categoryModel: undefined,
          categoryPromptAppend: undefined,
          maxPromptTokens: undefined,
          modelInfo: undefined,
          actualModel: undefined,
          isUnstableAgent: false,
          error: `Invalid model format "${actualModel}". Expected "provider/model" format (e.g., "anthropic/claude-sonnet-4-6").`,
        }
      }

      const type: "user-defined" | "inherited" | "category-default" | "system-default" =
        (explicitCategoryModel || overrideModel)
          ? "user-defined"
          : (systemDefaultModel && actualModel === systemDefaultModel)
              ? "system-default"
              : "category-default"

      const source: "override" | "category-default" | "system-default" =
        type === "user-defined"
          ? "override"
          : type === "system-default"
              ? "system-default"
              : "category-default"

      modelInfo = { model: actualModel, type, source }

      const parsedModel = parseModelString(actualModel)
       const variantToUse = userCategories?.[categoryName]?.variant ?? userCategories?.[args.category!]?.variant ?? resolvedVariant ?? resolved.config.variant
      categoryModel = buildDelegatedTaskModelConfig(parsedModel ?? undefined, variantToUse, resolved.config)
    }
  }

  if (!categoryModel && actualModel) {
    const parsedModel = parseModelString(actualModel)
    const variantToUse = userCategories?.[args.category!]?.variant ?? resolved.config.variant
    categoryModel = buildDelegatedTaskModelConfig(parsedModel ?? undefined, variantToUse, resolved.config)
  }
  const categoryPromptAppend = resolved.promptAppend || undefined

  if (!categoryModel && !actualModel) {
    const categoryNames = Object.keys(enabledCategories)
    return {
      agentToUse: "",
      categoryModel: undefined,
      categoryPromptAppend: undefined,
      maxPromptTokens: undefined,
      modelInfo: undefined,
      actualModel: undefined,
      isUnstableAgent: false,
      error: `Model not configured for category "${categoryName}".

Configure in one of:
1. OpenCode: Set "model" in opencode.json
2. opencode-codex-orch: Set category model in opencode-codex-orch.json
3. Provider: Connect a provider with available models

Current category: ${categoryName}
Available categories: ${categoryNames.join(", ")}`,
    }
  }

  const unstableModel = actualModel?.toLowerCase()
  const categoryConfigModel = resolved.config.model?.toLowerCase()
  const isUnstableAgent = resolved.config.is_unstable_agent === true || [unstableModel, categoryConfigModel].some(m => m ? m.includes("gemini") || m.includes("minimax") || m.includes("kimi") : false)

  const defaultProviderID = categoryModel?.providerID
    ?? parseModelString(actualModel ?? "")?.providerID
    ?? "opencode"
  const configuredFallbackChain = buildFallbackChainFromModels(
    normalizedConfiguredFallbackModels,
    defaultProviderID,
  )

  return {
    agentToUse: EXECUTOR_AGENT,
    categoryModel,
    categoryPromptAppend,
    maxPromptTokens: resolved.config.max_prompt_tokens,
    modelInfo,
    actualModel,
    isUnstableAgent,
    fallbackChain: configuredFallbackChain ?? requirement?.fallbackChain,
  }
}
