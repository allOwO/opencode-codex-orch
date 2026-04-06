type OutputPart = {
  type: string
  text?: string
  [key: string]: unknown
}

export function applyUltraworkModeOnMessage(
  _agentName: string | undefined,
  _output: { parts: OutputPart[] },
): boolean {
  return false
}
