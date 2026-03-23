import { describe, expect, test } from "bun:test"
import { sanitizeShellPath } from "./shell-path"

describe("sanitizeShellPath", () => {
	test("#given shell path wrapped in curly quotes #when sanitizing #then removes the wrapper", () => {
		expect(sanitizeShellPath("'/bin/zsh’")).toBe("/bin/zsh")
	})

	test("#given whitespace-only shell path #when sanitizing #then returns undefined", () => {
		expect(sanitizeShellPath("   ")).toBeUndefined()
	})
})
