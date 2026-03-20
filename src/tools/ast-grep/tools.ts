import { resolve } from "node:path"

import type { PluginInput } from "@opencode-ai/plugin"
import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool"

import { runSg } from "./cli"
import { CLI_LANGUAGES } from "./language-support"
import { formatSearchResult } from "./result-formatter"
import type { CliLanguage } from "./types"

function getEmptyResultHint(pattern: string, lang: CliLanguage): string | null {
  const source = pattern.trim()

  if (lang === "python") {
    if (source.startsWith("class ") && source.endsWith(":")) {
      return `Hint: remove the trailing colon. Try: "${source.slice(0, -1)}"`
    }

    if ((source.startsWith("def ") || source.startsWith("async def ")) && source.endsWith(":")) {
      return `Hint: remove the trailing colon. Try: "${source.slice(0, -1)}"`
    }
  }

  if (["javascript", "typescript", "tsx"].includes(lang)) {
    if (/^(export\s+)?(async\s+)?function\s+\$[A-Z_]+\s*$/i.test(source)) {
      return "Hint: function patterns need params and body. Try: \"function $NAME($$$) { $$$ }\""
    }
  }

  return null
}

export function createAstGrepTools(ctx: PluginInput): Record<string, ToolDefinition> {
  const ast_grep_search: ToolDefinition = tool({
    description:
      "Search code patterns with AST-aware matching. Supports meta-variables like $VAR and $$$. " +
      "Patterns must be complete AST nodes, such as 'console.log($MSG)' or 'function $NAME($$$) { $$$ }'.",
    args: {
      pattern: tool.schema
        .string()
        .describe("AST pattern with meta-variables ($VAR, $$$). Must be a complete AST node."),
      lang: tool.schema.enum(CLI_LANGUAGES).describe("Target language"),
      paths: tool.schema.array(tool.schema.string()).optional().describe("Paths to search"),
      globs: tool.schema.array(tool.schema.string()).optional().describe("Include or exclude globs (prefix ! to exclude)"),
      context: tool.schema.number().optional().describe("Context lines around matches"),
    },
    execute: async (args, context) => {
      const runtimeCtx = context as Record<string, unknown>
      const baseDir = typeof runtimeCtx.directory === "string" ? runtimeCtx.directory : ctx.directory
      const paths = args.paths?.length
        ? args.paths.map((filePath) => resolve(baseDir, filePath))
        : [baseDir]

      const result = await runSg({
        pattern: args.pattern,
        lang: args.lang as CliLanguage,
        paths,
        globs: args.globs,
        context: args.context,
      })

      let output = formatSearchResult(result)
      if (!result.error && result.matches.length === 0) {
        const hint = getEmptyResultHint(args.pattern, args.lang as CliLanguage)
        if (hint) {
          output += `\n\n${hint}`
        }
      }

      return output
    },
  })

  return { ast_grep_search }
}
