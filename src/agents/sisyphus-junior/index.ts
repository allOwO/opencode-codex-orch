export { buildDefaultSisyphusJuniorPrompt } from "./default"
export { buildGptSisyphusJuniorPrompt } from "./gpt"
export { buildGpt54SisyphusJuniorPrompt } from "./gpt-5-4"
export { buildGpt53CodexSisyphusJuniorPrompt } from "./gpt-5-3-codex"
export { buildGeminiSisyphusJuniorPrompt } from "./gemini"
export { buildKimiSisyphusJuniorPrompt } from "../kimi"

export {
  SISYPHUS_JUNIOR_DEFAULTS,
  getSisyphusJuniorPromptSource,
  buildSisyphusJuniorPrompt,
  createSisyphusJuniorAgentWithOverrides,
} from "./agent"
export type { SisyphusJuniorPromptSource } from "./agent"
