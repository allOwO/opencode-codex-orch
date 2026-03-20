/// <reference types="bun-types" />

import { describe, expect, test } from "bun:test"

import { createSgResultFromStdout } from "./sg-compact-json-output"

describe("createSgResultFromStdout", () => {
  test("returns empty result for blank output", () => {
    expect(createSgResultFromStdout("   \n")).toEqual({
      matches: [],
      totalMatches: 0,
      truncated: false,
    })
  })

  test("parses compact json output", () => {
    const result = createSgResultFromStdout(
      JSON.stringify([
        {
          text: "console.log(message)",
          range: {
            byteOffset: { start: 0, end: 20 },
            start: { line: 2, column: 4 },
            end: { line: 2, column: 24 },
          },
          file: "src/logger.ts",
          lines: "    console.log(message)",
          charCount: { leading: 4, trailing: 0 },
          language: "TypeScript",
        },
      ]),
    )

    expect(result.totalMatches).toBe(1)
    expect(result.truncated).toBe(false)
    expect(result.matches[0]?.file).toBe("src/logger.ts")
  })

  test("truncates match count beyond the safety cap", () => {
    const stdout = JSON.stringify(
      Array.from({ length: 501 }, (_, index) => ({
        text: `console.log(${index})`,
        range: {
          byteOffset: { start: index, end: index + 1 },
          start: { line: index, column: 0 },
          end: { line: index, column: 1 },
        },
        file: `src/file-${index}.ts`,
        lines: `console.log(${index})`,
        charCount: { leading: 0, trailing: 0 },
        language: "TypeScript",
      })),
    )

    const result = createSgResultFromStdout(stdout)

    expect(result.matches).toHaveLength(500)
    expect(result.totalMatches).toBe(501)
    expect(result.truncated).toBe(true)
    expect(result.truncatedReason).toBe("max_matches")
  })

  test("reports output-byte truncation for oversized output", () => {
    const stdout = JSON.stringify(
      Array.from({ length: 1500 }, (_, index) => ({
        text: `console.log(${index})`,
        range: {
          byteOffset: { start: index, end: index + 1 },
          start: { line: index, column: 0 },
          end: { line: index, column: 1 },
        },
        file: `src/file-${index}.ts`,
        lines: "x".repeat(1200),
        charCount: { leading: 0, trailing: 0 },
        language: "TypeScript",
      })),
    )

    const result = createSgResultFromStdout(stdout)

    expect(result.truncated).toBe(true)
    expect(result.truncatedReason).toBe("max_output_bytes")
    expect(result.matches.length).toBeGreaterThan(0)
  })
})
