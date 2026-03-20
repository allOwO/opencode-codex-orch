import { beforeEach, describe, expect, it, mock } from "bun:test"

const mockValidateConfig = mock((): {
  exists: boolean
  path: string | null
  valid: boolean
  config: unknown
  errors: string[]
} => ({
  exists: false,
  path: null,
  valid: true,
  config: null,
  errors: [],
}))

const mockGetModelResolutionInfoWithOverrides = mock((): {
  agents: Array<{ name: string; userOverride?: string }>
  categories: Array<{ name: string; userOverride?: string }>
} => ({
  agents: [],
  categories: [],
}))

const mockLoadAvailableModelsFromCache = mock((): {
  providers: string[]
  modelCount: number
  cacheExists: boolean
} => ({
  providers: [],
  modelCount: 0,
  cacheExists: false,
}))

const mockDetectConfigFormat = mock((): { format: "json" | "jsonc" | "none"; path: string } => ({
  format: "none",
  path: "/tmp/opencode.json",
}))

const mockParseOpenCodeConfigFileWithError = mock((): { config: unknown } => ({
  config: null,
}))

mock.module("./config-validation", () => ({
  validateConfig: mockValidateConfig,
}))

mock.module("./model-resolution", () => ({
  getModelResolutionInfoWithOverrides: mockGetModelResolutionInfoWithOverrides,
}))

mock.module("./model-resolution-cache", () => ({
  loadAvailableModelsFromCache: mockLoadAvailableModelsFromCache,
}))

mock.module("../../config-manager/opencode-config-format", () => ({
  detectConfigFormat: mockDetectConfigFormat,
}))

mock.module("../../config-manager/parse-opencode-config-file", () => ({
  parseOpenCodeConfigFileWithError: mockParseOpenCodeConfigFileWithError,
}))

const { checkConfig } = await import("./config")

describe("config check", () => {
  beforeEach(() => {
    mockValidateConfig.mockReset()
    mockGetModelResolutionInfoWithOverrides.mockReset()
    mockLoadAvailableModelsFromCache.mockReset()
    mockDetectConfigFormat.mockReset()
    mockParseOpenCodeConfigFileWithError.mockReset()

    mockValidateConfig.mockReturnValue({
      exists: false,
      path: null,
      valid: true,
      config: null,
      errors: [],
    })

    mockGetModelResolutionInfoWithOverrides.mockReturnValue({
      agents: [],
      categories: [],
    })

    mockLoadAvailableModelsFromCache.mockReturnValue({
      providers: [],
      modelCount: 0,
      cacheExists: false,
    })

    mockDetectConfigFormat.mockReturnValue({
      format: "none",
      path: "/tmp/opencode.json",
    })

    mockParseOpenCodeConfigFileWithError.mockReturnValue({
      config: null,
    })
  })

  describe("checkConfig", () => {
    it("returns a valid CheckResult", async () => {
      const result = await checkConfig()

      expect(result.name).toBe("Configuration")
      expect(["pass", "fail", "warn", "skip"]).toContain(result.status)
      expect(typeof result.message).toBe("string")
      expect(Array.isArray(result.issues)).toBe(true)
    })

    it("includes issues array even when config is valid", async () => {
      const result = await checkConfig()

      expect(Array.isArray(result.issues)).toBe(true)
    })

    it("does not warn for providers declared in the OpenCode config", async () => {
      mockValidateConfig.mockReturnValue({
        exists: true,
        path: "/tmp/opencode-codex-orch.json",
        valid: true,
        config: {
          agents: {
            sisyphus: { model: "volcengine-ark-api/kimi-k2.5" },
          },
          categories: {
            writing: { model: "baishan-cloud/GLM-5" },
          },
        },
        errors: [],
      })

      mockGetModelResolutionInfoWithOverrides.mockReturnValue({
        agents: [{ name: "sisyphus", userOverride: "volcengine-ark-api/kimi-k2.5" }],
        categories: [{ name: "writing", userOverride: "baishan-cloud/GLM-5" }],
      })

      mockLoadAvailableModelsFromCache.mockReturnValue({
        providers: ["openai", "anthropic"],
        modelCount: 2,
        cacheExists: true,
      })

      mockDetectConfigFormat.mockReturnValue({
        format: "json",
        path: "/tmp/opencode.json",
      })

      mockParseOpenCodeConfigFileWithError.mockReturnValue({
        config: {
          provider: {
            "volcengine-ark-api": {},
            "baishan-cloud": {},
          },
        },
      })

      const result = await checkConfig()

      expect(result.status).toBe("pass")
      expect(result.issues).toHaveLength(0)
    })
  })
})
