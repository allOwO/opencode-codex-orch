import { readFileSync } from "node:fs";
import {
	parseOcoConfigJson,
	resolveExistingOcoConfigFilePath,
	resolveExistingProjectOcoConfigFilePath,
} from "../../../shared/oco-config-file";
import { getOpenCodeConfigPaths } from "../../../shared/opencode-config-dir";
import type { OcoConfig } from "./model-resolution-types";

export function loadOcoConfig(): OcoConfig | null {
	const userConfigPath = resolveExistingOcoConfigFilePath(
		getOpenCodeConfigPaths({
			binary: "opencode",
			version: null,
		}).configDir,
	);
	const projectConfigPath = resolveExistingProjectOcoConfigFilePath(process.cwd());

	try {
		const content = readFileSync(projectConfigPath, "utf-8");
		return parseOcoConfigJson<OcoConfig>(content);
	} catch {
		// Fall back to user config.
	}

	try {
		const content = readFileSync(userConfigPath, "utf-8");
		return parseOcoConfigJson<OcoConfig>(content);
	} catch {
		return null;
	}
}
