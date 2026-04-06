import type { OpenCodeCodexOrchConfig } from "../config"

export function detectUltrawork(_text: string): boolean {
  return false
}

export type UltraworkOverrideResult = {
  providerID?: string
  modelID?: string
  variant?: string
}

export function resolveUltraworkOverride(
  _pluginConfig: OpenCodeCodexOrchConfig,
  _inputAgentName: string | undefined,
  _output: {
    message: Record<string, unknown>
    parts: Array<{ type: string; text?: string; [key: string]: unknown }>
  },
  _sessionID?: string,
): UltraworkOverrideResult | null {
  return null
}

export function applyUltraworkModelOverrideOnMessage(
  _pluginConfig: OpenCodeCodexOrchConfig,
  _inputAgentName: string | undefined,
  _output: {
    message: Record<string, unknown>
    parts: Array<{ type: string; text?: string; [key: string]: unknown }>
  },
  _tui: unknown,
  _sessionID?: string,
): void {}
