import { DEFAULT_MAX_MATCHES, DEFAULT_MAX_OUTPUT_BYTES } from "./language-support"
import type { CliMatch, SgResult } from "./types"

function parsePossiblyTruncatedJson(stdout: string): CliMatch[] | null {
  try {
    return JSON.parse(stdout) as CliMatch[]
  } catch {
    // Find the last occurrence of "}," to cut off cleanly, but if that fails,
    // keep trying earlier positions
    let lastSeparator = stdout.lastIndexOf("},")

    while (lastSeparator > 0) {
      try {
        const candidate = `${stdout.slice(0, lastSeparator + 1)}]`
        return JSON.parse(candidate) as CliMatch[]
      } catch {
        // Try the previous occurrence of "},"
        lastSeparator = stdout.lastIndexOf("},", lastSeparator - 1)
      }
    }

    return null
  }
}

export function createSgResultFromStdout(stdout: string): SgResult {
  if (!stdout.trim()) {
    return { matches: [], totalMatches: 0, truncated: false }
  }

  const outputWasTruncated = stdout.length >= DEFAULT_MAX_OUTPUT_BYTES
  const candidateOutput = outputWasTruncated
    ? stdout.slice(0, DEFAULT_MAX_OUTPUT_BYTES)
    : stdout

  const parsedMatches = parsePossiblyTruncatedJson(candidateOutput)
  if (parsedMatches === null) {
    return {
      matches: [],
      totalMatches: 0,
      truncated: outputWasTruncated,
      truncatedReason: outputWasTruncated ? "max_output_bytes" : undefined,
      error: outputWasTruncated
        ? "Output too large and could not be parsed"
        : "Failed to parse ast-grep output",
    }
  }

  const matchesWereTruncated = parsedMatches.length > DEFAULT_MAX_MATCHES
  const matches = matchesWereTruncated
    ? parsedMatches.slice(0, DEFAULT_MAX_MATCHES)
    : parsedMatches

  return {
    matches,
    totalMatches: parsedMatches.length,
    truncated: outputWasTruncated || matchesWereTruncated,
    truncatedReason: outputWasTruncated
      ? "max_output_bytes"
      : matchesWereTruncated
        ? "max_matches"
        : undefined,
  }
}
