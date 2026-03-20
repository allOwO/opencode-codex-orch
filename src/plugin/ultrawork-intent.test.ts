/// <reference types="bun-types" />

import { describe, expect, test } from "bun:test"

import { detectBareUltraworkPrefix, detectUltrawork, detectUltraworkIntent } from "./ultrawork-intent"

describe("detectUltraworkIntent", () => {
  test("detects prefixed ulw intent", () => {
    expect(detectUltraworkIntent("ulw fix the failing tests")).toBe(true)
  })

  test("detects prefixed ultrawork intent with punctuation", () => {
    expect(detectUltraworkIntent("ultrawork: implement JWT auth")).toBe(true)
  })

  test("detects prefixed ulw intent after leading whitespace", () => {
    expect(detectUltraworkIntent("\n  ulw fix the failing tests")).toBe(true)
  })

  test("does not treat mid-sentence mention as intent", () => {
    expect(detectUltraworkIntent("why is ultrawork mode gone")).toBe(false)
  })

  test("does not treat bare ulw prefix as intent", () => {
    expect(detectUltraworkIntent("ulw")).toBe(false)
  })

  test("does not detect keywords inside system reminders", () => {
    const text = "<system-reminder>ulw fix this</system-reminder>\nplease explain the behavior"
    expect(detectUltraworkIntent(text)).toBe(false)
  })
})

describe("detectUltrawork", () => {
  test("still detects non-prefix keyword mentions", () => {
    expect(detectUltrawork("why is ultrawork mode gone")).toBe(true)
  })

  test("ignores inline code mentions", () => {
    expect(detectUltrawork("the `ulw` keyword is handy")).toBe(false)
  })
})

describe("detectBareUltraworkPrefix", () => {
  test("detects bare ulw prefix", () => {
    expect(detectBareUltraworkPrefix("ulw")).toBe(true)
  })

  test("does not detect concrete ultrawork task as bare prefix", () => {
    expect(detectBareUltraworkPrefix("ulw fix the failing tests")).toBe(false)
  })
})
