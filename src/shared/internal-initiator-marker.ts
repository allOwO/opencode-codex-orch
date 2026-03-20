export const OCO_INTERNAL_INITIATOR_MARKER = "<!-- OCO_INTERNAL_INITIATOR -->"

export function createInternalAgentTextPart(text: string): {
  type: "text"
  text: string
} {
  return {
    type: "text",
    text: `${text}\n${OCO_INTERNAL_INITIATOR_MARKER}`,
  }
}
