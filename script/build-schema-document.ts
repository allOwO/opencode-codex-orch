import * as z from "zod"
import { OpenCodeCodexOrchConfigSchema } from "../src/config/schema"

export function createOpenCodeCodexOrchJsonSchema(): Record<string, unknown> {
  const jsonSchema = z.toJSONSchema(OpenCodeCodexOrchConfigSchema, {
    target: "draft-7",
    unrepresentable: "any",
  })

  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    $id: "https://raw.githubusercontent.com/allOwO/opencode-codex-orch/main/assets/opencode-codex-orch.schema.json",
  title: "opencode-codex-orch Configuration",
    description: "Configuration schema for opencode-codex-orch plugin",
    ...jsonSchema,
  }
}
