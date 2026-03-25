const MODIFICATION_TOOL_NAMES = new Set([
  "write",
  "edit",
  "multiedit",
  "patch",
  "apply_patch",
])

export function isModificationTool(toolName: string | undefined): boolean {
  if (!toolName) return false
  return MODIFICATION_TOOL_NAMES.has(toolName)
}

export function isTrackedFileStateTool(toolName: string | undefined): boolean {
  return toolName === "read" || isModificationTool(toolName)
}
