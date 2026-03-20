import { join } from "node:path"

import { getOpenCodeConfigPaths } from "../../../shared/opencode-config-dir"

export function getConfigPaths(directory: string): string[] {
  const userPaths = getOpenCodeConfigPaths({ binary: "opencode", version: null })

  return [
    join(directory, ".opencode", "opencode.jsonc"),
    join(directory, ".opencode", "opencode.json"),
    userPaths.configJsonc,
    userPaths.configJson,
  ]
}
