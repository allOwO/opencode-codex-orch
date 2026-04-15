export function applyRequiredPromptOverlay(
  prompt: string,
  anchor: string,
  overlay: string,
  label: string,
): string {
  if (!prompt.includes(anchor)) {
    throw new Error(`Missing orchestrator prompt anchor for ${label}: ${anchor}`)
  }

  return prompt.replace(anchor, `${anchor}${overlay}`)
}
