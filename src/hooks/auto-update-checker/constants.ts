import { join } from "node:path"

import { PLUGIN_PACKAGE_NAME } from "../../cli/plugin-reference"
import { getOpenCodeCacheDir } from "../../shared/data-path"
import { getOpenCodeConfigDir } from "../../shared/opencode-config-dir"

export const PACKAGE_NAME = PLUGIN_PACKAGE_NAME
export const NPM_REGISTRY_URL = `https://registry.npmjs.org/-/package/${PACKAGE_NAME}/dist-tags`
export const NPM_FETCH_TIMEOUT = 5000

export const CACHE_DIR = getOpenCodeCacheDir()
export const USER_CONFIG_DIR = getOpenCodeConfigDir({ binary: "opencode" })
export const INSTALLED_PACKAGE_JSON = join(CACHE_DIR, "node_modules", PACKAGE_NAME, "package.json")
