export interface ModelCacheState {
  modelContextLimitsCache: Map<string, number>;
  anthropicContext1MEnabled: boolean;
}

export interface RuntimeConfigState {
  config?: Record<string, unknown>;
  version: number;
}

export function createModelCacheState(): ModelCacheState {
  return {
    modelContextLimitsCache: new Map<string, number>(),
    anthropicContext1MEnabled: false,
  };
}

export function createRuntimeConfigState(): RuntimeConfigState {
  return {
    config: undefined,
    version: 0,
  };
}
