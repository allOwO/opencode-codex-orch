import { describe, expect, it } from "bun:test"

import {
  extractChannel,
  isDistTag,
  isPrereleaseOrDistTag,
  isPrereleaseVersion,
} from "./version-channel"

describe("version-channel", () => {
  it("extracts the prerelease channel from semantic versions", () => {
    expect(extractChannel("1.2.3-canary.4")).toBe("canary")
    expect(extractChannel("1.2.3-beta.1")).toBe("beta")
  })

  it("treats dist tags as direct channels", () => {
    expect(isDistTag("next")).toBe(true)
    expect(extractChannel("next")).toBe("next")
  })

  it("detects prerelease and dist-tag pins", () => {
    expect(isPrereleaseVersion("1.2.3-rc.1")).toBe(true)
    expect(isPrereleaseOrDistTag("beta")).toBe(true)
    expect(isPrereleaseOrDistTag("1.2.3")).toBe(false)
  })
})
