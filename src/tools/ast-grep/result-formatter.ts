import type { SgResult } from "./types"

function getTruncationMessage(result: SgResult): string | null {
  if (!result.truncated) {
    return null
  }

  if (result.truncatedReason === "max_matches") {
    return `[TRUNCATED] showing first ${result.matches.length} of ${result.totalMatches} matches`
  }

  if (result.truncatedReason === "max_output_bytes") {
    return "[TRUNCATED] output exceeded 1MB limit"
  }

  if (result.truncatedReason === "timeout") {
    return "[TRUNCATED] search timed out"
  }

  return "[TRUNCATED] results truncated"
}

export function formatSearchResult(result: SgResult): string {
  if (result.error) {
    return `Error: ${result.error}`
  }

  if (result.matches.length === 0) {
    return "No matches found"
  }

  const lines: string[] = []
  const truncationMessage = getTruncationMessage(result)

  if (truncationMessage) {
    lines.push(truncationMessage, "")
  }

  lines.push(
    `Found ${result.matches.length} match(es)${result.truncated ? ` (truncated from ${result.totalMatches})` : ""}:`,
    "",
  )

  for (const match of result.matches) {
    lines.push(`${match.file}:${match.range.start.line + 1}:${match.range.start.column + 1}`)
    lines.push(`  ${match.lines.trim()}`)
    lines.push("")
  }

  return lines.join("\n")
}
