/**
 * Orchestrator agent — multi-model orchestrator.
 *
 * This directory contains model-specific prompt variants:
 * - default.ts: Shared task/todo management section
 * - gemini.ts: Corrective overlays for Gemini's aggressive tendencies
 * - gpt-5-4.ts: Native GPT-5.4 prompt with block-structured guidance
 */

export { buildTaskManagementSection } from "./default";
export {
  buildGeminiToolMandate,
  buildGeminiDelegationOverride,
  buildGeminiVerificationOverride,
  buildGeminiIntentGateEnforcement,
  buildGeminiToolGuide,
  buildGeminiToolCallExamples,
} from "./gemini";
export { buildGpt54OrchestratorPrompt } from "./gpt-5-4";
export { buildKimiOrchestratorPrompt } from "./kimi";
