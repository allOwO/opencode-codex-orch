import type { OpenCodeCodexOrchConfig } from "../config";
import type { ModelCacheState, RuntimeConfigState } from "../plugin-state";
import { log } from "../shared";
import { applyAgentConfig } from "./agent-config-handler";
import { applyCommandConfig } from "./command-config-handler";
import { applyMcpConfig } from "./mcp-config-handler";
import { applyProviderConfig } from "./provider-config-handler";
import { loadPluginComponents } from "./plugin-components-loader";
import { applyToolConfig } from "./tool-config-handler";

export { resolveCategoryConfig } from "./category-config-resolver";

export interface ConfigHandlerDeps {
  ctx: { directory: string; client?: any };
  pluginConfig: OpenCodeCodexOrchConfig;
  modelCacheState: ModelCacheState;
  runtimeConfigState?: RuntimeConfigState;
}

export function createConfigHandler(deps: ConfigHandlerDeps) {
  const runtimeConfigState = deps.runtimeConfigState ?? { config: undefined, version: 0 };
  const { ctx, pluginConfig, modelCacheState } = deps;

  return async (config: Record<string, unknown>) => {
    runtimeConfigState.config = config;
    runtimeConfigState.version += 1;

    const formatterConfig = config.formatter;

    applyProviderConfig({ config, modelCacheState });

    const pluginComponents = await loadPluginComponents({ pluginConfig });

    const agentResult = await applyAgentConfig({
      config,
      pluginConfig,
      ctx,
      pluginComponents,
    });

    applyToolConfig({ config, pluginConfig, agentResult });
    await applyMcpConfig({ config, pluginConfig, pluginComponents });
    await applyCommandConfig({ config, pluginConfig, ctx, pluginComponents });

    config.formatter = formatterConfig;

    log("[config-handler] config handler applied", {
      agentCount: Object.keys(agentResult).length,
      commandCount: Object.keys((config.command as Record<string, unknown>) ?? {})
        .length,
    });
  };
}
