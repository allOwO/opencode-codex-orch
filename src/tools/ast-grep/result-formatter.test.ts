/// <reference types="bun-types" />

import { describe, expect, test } from "bun:test"

import { formatSearchResult } from "./result-formatter"
import type { SgResult } from "./types"

describe("formatSearchResult", () => {
  test("returns error output", () => {
    const result: SgResult = {
      matches: [],
      totalMatches: 0,
      truncated: false,
      error: "sg failed",
    }

    expect(formatSearchResult(result)).toBe("Error: sg failed")
  })

  test("returns no matches output", () => {
    const result: SgResult = {
      matches: [],
      totalMatches: 0,
      truncated: false,
    }

    expect(formatSearchResult(result)).toBe("No matches found")
  })

  test("formats matches with locations", () => {
    const result: SgResult = {
      matches: [
        {
          text: "function hello(name) {}",
          range: {
            byteOffset: { start: 0, end: 22 },
            start: { line: 4, column: 0 },
            end: { line: 4, column: 22 },
          },
          file: "src/example.ts",
          lines: "function hello(name) {}",
          charCount: { leading: 0, trailing: 0 },
          language: "TypeScript",
        },
      ],
      totalMatches: 1,
      truncated: false,
    }

    expect(formatSearchResult(result)).toBe(
      "Found 1 match(es):\n\nsrc/example.ts:5:1\n  function hello(name) {}\n",
    )
  })
})
