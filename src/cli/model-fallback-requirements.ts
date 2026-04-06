import type { ModelRequirement } from "../shared/model-requirements";

// NOTE: These requirements are used by the CLI config generator (`generateModelConfig`).
// They intentionally use "install-time" provider IDs (anthropic/openai/google/opencode/etc),
// not runtime-only providers like `nvidia`.

export const CLI_AGENT_MODEL_REQUIREMENTS: Record<string, ModelRequirement> = {
  orchestrator: {
    fallbackChain: [
      {
        providers: ["anthropic", "github-copilot", "opencode"],
        model: "claude-opus-4-6",
        variant: "max",
      },
      { providers: ["kimi-for-coding"], model: "k2p5" },
      { providers: ["openai", "github-copilot", "opencode"], model: "gpt-5.4", variant: "medium" },
      { providers: ["zai-coding-plan", "opencode"], model: "glm-5" },
    ],
    requiresAnyModel: true,
  },
  oracle: {
    fallbackChain: [
      {
        providers: ["openai", "github-copilot", "opencode"],
        model: "gpt-5.4",
        variant: "high",
      },
      { providers: ["kimi-for-coding"], model: "k2p5" },
      {
        providers: ["google", "github-copilot", "opencode"],
        model: "gemini-3.1-pro",
        variant: "high",
      },
      {
        providers: ["anthropic", "github-copilot", "opencode"],
        model: "claude-opus-4-6",
        variant: "max",
      },
    ],
  },
  librarian: {
    fallbackChain: [
      { providers: ["zai-coding-plan"], model: "glm-4.7" },
      {
        providers: ["google", "github-copilot", "opencode"],
        model: "gemini-3-flash",
      },
      { providers: ["opencode"], model: "minimax-m2.5-free" },
      { providers: ["opencode"], model: "big-pickle" },
    ],
  },
  explore: {
    fallbackChain: [
      { providers: ["github-copilot"], model: "grok-code-fast-1" },
      { providers: ["opencode"], model: "minimax-m2.5-free" },
      { providers: ["anthropic", "opencode"], model: "claude-haiku-4-5" },
      { providers: ["opencode"], model: "gpt-5-nano" },
    ],
  },
  deepsearch: {
    fallbackChain: [
      {
        providers: ["openai", "github-copilot", "opencode"],
        model: "gpt-5.4",
        variant: "high",
      },
      {
        providers: ["google", "github-copilot", "opencode"],
        model: "gemini-3.1-pro",
        variant: "high",
      },
      {
        providers: ["anthropic", "github-copilot", "opencode"],
        model: "claude-opus-4-6",
        variant: "max",
      },
    ],
  },
  reviewer: {
    fallbackChain: [
      {
        providers: ["openai", "github-copilot", "opencode"],
        model: "gpt-5.4",
        variant: "high",
      },
      {
        providers: ["anthropic", "github-copilot", "opencode"],
        model: "claude-opus-4-6",
        variant: "max",
      },
    ],
  },
  executor: {
    fallbackChain: [
      { providers: ["kimi-for-coding"], model: "k2p5" },
      {
        providers: ["anthropic", "github-copilot", "opencode"],
        model: "claude-sonnet-4-5",
      },
      {
        providers: ["openai", "github-copilot", "opencode"],
        model: "gpt-5.4",
        variant: "medium",
      },
      {
        providers: ["google", "github-copilot", "opencode"],
        model: "gemini-3.1-pro",
      },
    ],
  },
};

export const CLI_CATEGORY_MODEL_REQUIREMENTS: Record<string, ModelRequirement> =
{
  designer: {
    fallbackChain: [
      {
        providers: ["google", "github-copilot", "opencode"],
        model: "gemini-3.1-pro",
        variant: "high",
      },
      { providers: ["zai-coding-plan", "opencode"], model: "glm-5" },
      {
        providers: ["anthropic", "github-copilot", "opencode"],
        model: "claude-opus-4-6",
        variant: "max",
      },
      { providers: ["kimi-for-coding"], model: "k2p5" },
    ],
  },
  hard: {
    fallbackChain: [
      {
        providers: ["openai", "opencode"],
        model: "gpt-5.3-codex",
        variant: "medium",
      },
      {
        providers: ["anthropic", "github-copilot", "opencode"],
        model: "claude-opus-4-6",
        variant: "max",
      },
      {
        providers: ["google", "github-copilot", "opencode"],
        model: "gemini-3.1-pro",
        variant: "high",
      },
    ],
    requiresModel: "gpt-5.3-codex",
  },
  quick: {
    fallbackChain: [
      {
        providers: ["anthropic", "github-copilot", "opencode"],
        model: "claude-haiku-4-5",
      },
      {
        providers: ["google", "github-copilot", "opencode"],
        model: "gemini-3-flash",
      },
      { providers: ["opencode"], model: "gpt-5-nano" },
    ],
  },
};

CLI_CATEGORY_MODEL_REQUIREMENTS["visual-engineering"] = CLI_CATEGORY_MODEL_REQUIREMENTS.designer;
CLI_CATEGORY_MODEL_REQUIREMENTS.deep = CLI_CATEGORY_MODEL_REQUIREMENTS.hard;
CLI_CATEGORY_MODEL_REQUIREMENTS.writing = CLI_CATEGORY_MODEL_REQUIREMENTS.hard;
