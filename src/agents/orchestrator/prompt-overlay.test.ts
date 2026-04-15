/// <reference types="bun-types" />

import { describe, expect, it } from "bun:test"
import { applyRequiredPromptOverlay } from "./prompt-overlay"

describe("applyRequiredPromptOverlay", () => {
  it("injects overlay immediately after the required anchor", () => {
    const result = applyRequiredPromptOverlay("before</tag>after", "</tag>", "\nOVERLAY", "test overlay")

    expect(result).toBe("before</tag>\nOVERLAYafter")
  })

  it("throws when the required anchor is missing", () => {
    expect(() =>
      applyRequiredPromptOverlay("before after", "</tag>", "\nOVERLAY", "test overlay")
    ).toThrow("Missing orchestrator prompt anchor for test overlay: </tag>")
  })
})
