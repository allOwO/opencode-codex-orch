#!/usr/bin/env bun
import { createOpenCodeCodexOrchJsonSchema } from "./build-schema-document"

const SCHEMA_OUTPUT_PATH = "assets/opencode-codex-orch.schema.json"
const DIST_SCHEMA_OUTPUT_PATH = "dist/opencode-codex-orch.schema.json"

async function main() {
  console.log("Generating JSON Schema...")

  const finalSchema = createOpenCodeCodexOrchJsonSchema()

  await Bun.write(SCHEMA_OUTPUT_PATH, JSON.stringify(finalSchema, null, 2))
  await Bun.write(DIST_SCHEMA_OUTPUT_PATH, JSON.stringify(finalSchema, null, 2))

  console.log(`✓ JSON Schema generated: ${SCHEMA_OUTPUT_PATH}`)
}

main()
