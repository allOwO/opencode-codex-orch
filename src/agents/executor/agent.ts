/**
 * Executor - Focused Task Executor
 *
 * Executes delegated tasks directly without spawning other agents.
 * Category-spawned executor with domain-specific configurations.
 *
 * Routing:
 * 1. GPT models (openai/*, github-copilot/gpt-*) -> gpt.ts (GPT-optimized)
 * 2. Gemini models (google/*, google-vertex/*) -> gemini.ts (Gemini-optimized)
 * 3. Kimi models -> kimi.ts (Kimi-specialized)
 * 4. Default (Claude, etc.) -> default.ts (Claude-optimized)
 */

import type { AgentConfig } from "@opencode-ai/sdk"
import type { AgentMode } from "../types"
import { isGptModel, isGeminiModel, isKimiModel } from "../types"
import type { AgentOverrideConfig } from "../../config/schema"
import {
  createAgentToolRestrictions,
  type PermissionValue,
} from "../../shared/permission-compat"

import { buildDefaultExecutorPrompt } from "./default"
import { buildGptExecutorPrompt } from "./gpt"
import { buildGpt54ExecutorPrompt } from "./gpt-5-4"
import { buildGpt53CodexExecutorPrompt } from "./gpt-5-3-codex"
import { buildGeminiExecutorPrompt } from "./gemini"
import { buildKimiExecutorPrompt } from "./kimi"

const MODE: AgentMode = "subagent"

// Core tools that Executor must NEVER have access to
// Note: call_oco_agent is ALLOWED so subagents can spawn explore/librarian
const BLOCKED_TOOLS = ["task"]

export const EXECUTOR_DEFAULTS = {
  model: "openai/gpt-5.3-codex",
  temperature: 0.1,
} as const

export type ExecutorPromptSource = "default" | "gpt" | "gpt-5-4" | "gpt-5-3-codex" | "gemini" | "kimi"

export function getExecutorPromptSource(model?: string): ExecutorPromptSource {
  if (model && isKimiModel(model)) {
    return "kimi"
  }

  if (model && isGptModel(model)) {
    const lower = model.toLowerCase()
    if (lower.includes("gpt-5.4") || lower.includes("gpt-5-4")) return "gpt-5-4"
    if (lower.includes("gpt-5.3-codex") || lower.includes("gpt-5-3-codex")) return "gpt-5-3-codex"
    return "gpt"
  }
  if (model && isGeminiModel(model)) {
    return "gemini"
  }
  return "default"
}

/**
 * Builds the appropriate Executor prompt based on model.
 */
export function buildExecutorPrompt(
  model: string | undefined,
  useTaskSystem: boolean,
  promptAppend?: string
): string {
  const source = getExecutorPromptSource(model)

  switch (source) {
    case "gpt-5-4":
      return buildGpt54ExecutorPrompt(useTaskSystem, promptAppend)
    case "gpt-5-3-codex":
      return buildGpt53CodexExecutorPrompt(useTaskSystem, promptAppend)
    case "gpt":
      return buildGptExecutorPrompt(useTaskSystem, promptAppend)
    case "gemini":
      return buildGeminiExecutorPrompt(useTaskSystem, promptAppend)
    case "kimi":
      return buildKimiExecutorPrompt(useTaskSystem, promptAppend)
    case "default":
    default:
      return buildDefaultExecutorPrompt(useTaskSystem, promptAppend)
  }
}

export function createExecutorAgentWithOverrides(
  override: AgentOverrideConfig | undefined,
  systemDefaultModel?: string,
  useTaskSystem = false
): AgentConfig {
  if (override?.disable) {
    override = undefined
  }

  const overrideModel = (override as { model?: string } | undefined)?.model
  const model = overrideModel ?? systemDefaultModel ?? EXECUTOR_DEFAULTS.model
  const temperature = override?.temperature ?? EXECUTOR_DEFAULTS.temperature

  const promptAppend = override?.prompt_append
  const prompt = buildExecutorPrompt(model, useTaskSystem, promptAppend)

  const baseRestrictions = createAgentToolRestrictions(BLOCKED_TOOLS)

  const userPermission = (override?.permission ?? {}) as Record<string, PermissionValue>
  const basePermission = baseRestrictions.permission
  const merged: Record<string, PermissionValue> = { ...userPermission }
  for (const tool of BLOCKED_TOOLS) {
    merged[tool] = "deny"
  }
  merged.call_oco_agent = "allow"
  const toolsConfig = { permission: { ...merged, ...basePermission } }

  const base: AgentConfig = {
    description: override?.description ??
      "Focused task executor. Same discipline, no delegation. (Executor - opencode-codex-orch)",
    mode: MODE,
    model,
    temperature,
    maxTokens: 64000,
    prompt,
    color: override?.color ?? "#20B2AA",
    ...toolsConfig,
  }

  if (override?.top_p !== undefined) {
    base.top_p = override.top_p
  }

  if (isGptModel(model)) {
    return { ...base, reasoningEffort: override?.reasoningEffort ?? "medium" } as AgentConfig
  }

  return {
    ...base,
    thinking: { type: "enabled", budgetTokens: 32000 },
  } as AgentConfig
}

createExecutorAgentWithOverrides.mode = MODE
