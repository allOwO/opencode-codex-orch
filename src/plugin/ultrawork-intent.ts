import { isSystemDirective, removeSystemReminders } from "../shared"

const CODE_BLOCK = /```[\s\S]*?```/g
const INLINE_CODE = /`[^`]+`/g
const ULTRAWORK_KEYWORD_PATTERN = /\b(ultrawork|ulw)\b/i
const ULTRAWORK_PREFIX_PATTERN = /^[\s\n]*(ultrawork|ulw)(?:\b|[!,:;-])([\s\S]*)$/i

function cleanUltraworkText(text: string): string {
  const strippedText = removeSystemReminders(text)
    .replace(CODE_BLOCK, "")
    .replace(INLINE_CODE, "")

  return strippedText
    .split("\n")
    .filter((line) => !isSystemDirective(line))
    .join("\n")
    .trim()
}

export function detectUltrawork(text: string): boolean {
  return ULTRAWORK_KEYWORD_PATTERN.test(cleanUltraworkText(text))
}

function getUltraworkPrefixRemainder(text: string): string | null {
  const cleanedText = cleanUltraworkText(text)
  const match = cleanedText.match(ULTRAWORK_PREFIX_PATTERN)
  if (!match) return null
  return match[2]?.trim() ?? ""
}

export function detectUltraworkIntent(text: string): boolean {
  const remainder = getUltraworkPrefixRemainder(text)
  return remainder !== null && remainder.length > 0
}

export function detectBareUltraworkPrefix(text: string): boolean {
  return getUltraworkPrefixRemainder(text) === ""
}
