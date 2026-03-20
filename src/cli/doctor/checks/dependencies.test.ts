import { describe, it, expect } from "bun:test"
import * as deps from "./dependencies"
import { findSgCliPathSync } from "../../../tools/ast-grep/sg-cli-path"

describe("dependencies check", () => {
  describe("checkAstGrepCli", () => {
    it("returns valid dependency info", async () => {
      //#given ast-grep cli check
      //#when checking
      const info = await deps.checkAstGrepCli()

      //#then should return valid DependencyInfo
      expect(info.name).toBe("AST-Grep CLI")
      expect(info.required).toBe(false)
      expect(typeof info.installed).toBe("boolean")
      expect(typeof info.version === "string" || info.version === null).toBe(true)
      expect(typeof info.path === "string" || info.path === null).toBe(true)
    })

    it("uses the same cli resolution path as the ast-grep tool", async () => {
      //#given ast-grep cli resolver
      const resolvedPath = findSgCliPathSync()

      //#when checking doctor dependency info
      const info = await deps.checkAstGrepCli()

      //#then should reflect the tool's resolver result
      expect(info.installed).toBe(resolvedPath !== null)
      expect(info.path).toBe(resolvedPath)
    })
  })

  describe("checkAstGrepNapi", () => {
    it("returns valid dependency info", async () => {
      //#given ast-grep napi check
      //#when checking
      const info = await deps.checkAstGrepNapi()

      //#then should return valid DependencyInfo
      expect(info.name).toBe("AST-Grep NAPI")
      expect(info.required).toBe(false)
      expect(typeof info.installed).toBe("boolean")
    })
  })

  describe("checkCommentChecker", () => {
    it("returns valid dependency info", async () => {
      //#given comment checker check
      //#when checking
      const info = await deps.checkCommentChecker()

      //#then should return valid DependencyInfo
      expect(info.name).toBe("Comment Checker")
      expect(info.required).toBe(false)
      expect(typeof info.installed).toBe("boolean")
    })
  })
})
