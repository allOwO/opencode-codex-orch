import type { AvailableCategory, AvailableSkill } from "./agents/dynamic-agent-prompt-builder"
import type { OpenCodeCodexOrchConfig } from "./config"
import type { BrowserAutomationProvider } from "./config/schema/browser-automation"
import type { LoadedSkill } from "./features/opencode-skill-loader/types"
import type { PluginContext, ToolsRecord } from "./plugin/types"
import type { Managers } from "./create-managers"

import { createAvailableCategories } from "./plugin/available-categories"
import { createSkillContext } from "./plugin/skill-context"
import { createToolRegistry } from "./plugin/tool-registry"

function extractRuntimeConfigData(configResult: unknown): unknown {
  if (!configResult || typeof configResult !== "object") return configResult
  if (!("data" in configResult)) return configResult
  return configResult.data
}

async function getRuntimeConfig(client: PluginContext["client"]): Promise<unknown> {
  const configApi = client.config
  if (!configApi || typeof configApi.get !== "function") return undefined

  try {
    return extractRuntimeConfigData(await configApi.get())
  } catch {
    return undefined
  }
}

export type CreateToolsResult = {
  filteredTools: ToolsRecord
  mergedSkills: LoadedSkill[]
  availableSkills: AvailableSkill[]
  availableCategories: AvailableCategory[]
  browserProvider: BrowserAutomationProvider
  disabledSkills: Set<string>
  taskSystemEnabled: boolean
}

export async function createTools(args: {
  ctx: PluginContext
  pluginConfig: OpenCodeCodexOrchConfig
  managers: Pick<Managers, "backgroundManager" | "tmuxSessionManager" | "skillMcpManager">
}): Promise<CreateToolsResult> {
  const { ctx, pluginConfig, managers } = args
  const runtimeConfig = await getRuntimeConfig(ctx.client)

  const skillContext = await createSkillContext({
    directory: ctx.directory,
    pluginConfig,
    runtimeConfig,
  })

  const availableCategories = createAvailableCategories(pluginConfig)

  const { filteredTools, taskSystemEnabled } = createToolRegistry({
    ctx,
    pluginConfig,
    managers,
    skillContext,
    availableCategories,
  })

  return {
    filteredTools,
    mergedSkills: skillContext.mergedSkills,
    availableSkills: skillContext.availableSkills,
    availableCategories,
    browserProvider: skillContext.browserProvider,
    disabledSkills: skillContext.disabledSkills,
    taskSystemEnabled,
  }
}
