import { existsSync, readFileSync } from "node:fs";
import { dirname } from "node:path";
import {
	parseOcoConfigJson,
	resolveExistingOcoConfigFilePath,
} from "../../shared/oco-config-file";
import { isManagedPluginEntry } from "../plugin-reference";
import type { DetectedConfig } from "../types";
import { getOcoConfigPath } from "./config-context";
import { detectConfigFormat } from "./opencode-config-format";
import { parseOpenCodeConfigFileWithError } from "./parse-opencode-config-file";

function detectProvidersFromOcoConfig(): {
	hasOpenAI: boolean;
	hasOpencodeZen: boolean;
	hasZaiCodingPlan: boolean;
	hasKimiForCoding: boolean;
} {
	const ocoConfigPath = resolveExistingOcoConfigFilePath(dirname(getOcoConfigPath()));
	if (!existsSync(ocoConfigPath)) {
		return {
			hasOpenAI: true,
			hasOpencodeZen: true,
			hasZaiCodingPlan: false,
			hasKimiForCoding: false,
		};
	}

	try {
		const content = readFileSync(ocoConfigPath, "utf-8");
		const ocoConfig = parseOcoConfigJson<Record<string, unknown>>(content);
		if (!ocoConfig || typeof ocoConfig !== "object") {
			return {
				hasOpenAI: true,
				hasOpencodeZen: true,
				hasZaiCodingPlan: false,
				hasKimiForCoding: false,
			};
		}

		const configStr = JSON.stringify(ocoConfig);
		const hasOpenAI = configStr.includes('"openai/');
		const hasOpencodeZen = configStr.includes('"opencode/');
		const hasZaiCodingPlan = configStr.includes('"zai-coding-plan/');
		const hasKimiForCoding = configStr.includes('"kimi-for-coding/');

		return { hasOpenAI, hasOpencodeZen, hasZaiCodingPlan, hasKimiForCoding };
	} catch {
		return {
			hasOpenAI: true,
			hasOpencodeZen: true,
			hasZaiCodingPlan: false,
			hasKimiForCoding: false,
		};
	}
}

export function detectCurrentConfig(): DetectedConfig {
	const result: DetectedConfig = {
		isInstalled: false,
		hasClaude: true,
		isMax20: true,
		hasOpenAI: true,
		hasGemini: false,
		hasCopilot: false,
		hasOpencodeZen: true,
		hasZaiCodingPlan: false,
		hasKimiForCoding: false,
	};

	const { format, path } = detectConfigFormat();
	if (format === "none") {
		return result;
	}

	const parseResult = parseOpenCodeConfigFileWithError(path);
	if (!parseResult.config) {
		return result;
	}

	const openCodeConfig = parseResult.config;
	const plugins = openCodeConfig.plugin ?? [];
	result.isInstalled = plugins.some((plugin) => isManagedPluginEntry(plugin));

	if (!result.isInstalled) {
		return result;
	}

	const providers = openCodeConfig.provider as
		| Record<string, unknown>
		| undefined;
	result.hasGemini = providers ? "google" in providers : false;

	const { hasOpenAI, hasOpencodeZen, hasZaiCodingPlan, hasKimiForCoding } =
		detectProvidersFromOcoConfig();
	result.hasOpenAI = hasOpenAI;
	result.hasOpencodeZen = hasOpencodeZen;
	result.hasZaiCodingPlan = hasZaiCodingPlan;
	result.hasKimiForCoding = hasKimiForCoding;

	return result;
}
