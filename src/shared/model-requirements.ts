export type FallbackEntry = {
  providers: string[];
  model: string;
  variant?: string; // Entry-specific variant (e.g., GPT→high, Opus→max)
};

export type ModelRequirement = {
  fallbackChain: FallbackEntry[];
  variant?: string; // Default variant (used when entry doesn't specify one)
  requiresModel?: string; // If set, only activates when this model is available (fuzzy match)
  requiresAnyModel?: boolean; // If true, requires at least ONE model in fallbackChain to be available (or empty availability treated as unavailable)
  requiresProvider?: string[]; // If set, only activates when any of these providers is connected
};

export const AGENT_MODEL_REQUIREMENTS: Record<string, ModelRequirement> = {
  orchestrator: {
    fallbackChain: [
      {
        providers: ["anthropic", "github-copilot", "opencode"],
        model: "claude-opus-4-6",
        variant: "max",
      },
      { providers: ["kimi-for-coding"], model: "k2p5" },
      {
        providers: [
          "opencode",
          "moonshotai",
          "moonshotai-cn",
          "firmware",
          "ollama-cloud",
          "aihubmix",
        ],
        model: "kimi-k2.5",
      },
      { providers: ["openai", "github-copilot", "opencode"], model: "gpt-5.4", variant: "medium" },
      { providers: ["zai-coding-plan", "opencode"], model: "glm-5" },
      { providers: ["opencode"], model: "big-pickle" },
    ],
    requiresAnyModel: true,
  },
  sisyphus: {
    fallbackChain: [
      {
        providers: ["anthropic", "github-copilot", "opencode"],
        model: "claude-opus-4-6",
        variant: "max",
      },
      { providers: ["kimi-for-coding"], model: "k2p5" },
      {
        providers: [
          "opencode",
          "moonshotai",
          "moonshotai-cn",
          "firmware",
          "ollama-cloud",
          "aihubmix",
        ],
        model: "kimi-k2.5",
      },
      { providers: ["openai", "github-copilot", "opencode"], model: "gpt-5.4", variant: "medium" },
      { providers: ["zai-coding-plan", "opencode"], model: "glm-5" },
      { providers: ["opencode"], model: "big-pickle" },
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
  momus: {
    fallbackChain: [
      {
        providers: ["openai", "github-copilot", "opencode"],
        model: "gpt-5.4",
        variant: "xhigh",
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
  },
  reviewer: {
    fallbackChain: [
      {
        providers: ["openai", "github-copilot", "opencode"],
        model: "gpt-5.4",
        variant: "xhigh",
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
  },
};

export const CATEGORY_MODEL_REQUIREMENTS: Record<string, ModelRequirement> = {
  designer: {
    fallbackChain: [
      {
        providers: ["google", "github-copilot", "opencode"],
        model: "gemini-3.1-pro",
        variant: "high",
      },
      { providers: ["zai-coding-plan", "opencode"], model: "glm-5" },
      { providers: ["kimi-for-coding"], model: "k2p5" },
      {
        providers: ["anthropic", "github-copilot", "opencode"],
        model: "claude-opus-4-6",
        variant: "max",
      },
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

CATEGORY_MODEL_REQUIREMENTS["visual-engineering"] = CATEGORY_MODEL_REQUIREMENTS.designer;
CATEGORY_MODEL_REQUIREMENTS.deep = CATEGORY_MODEL_REQUIREMENTS.hard;
CATEGORY_MODEL_REQUIREMENTS.writing = CATEGORY_MODEL_REQUIREMENTS.hard;
