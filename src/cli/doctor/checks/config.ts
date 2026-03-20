import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { getCacheDir } from "../../../shared/data-path";
import { CHECK_IDS, CHECK_NAMES } from "../constants";
import type { CheckResult, DoctorIssue } from "../types";
import { validateConfig } from "./config-validation";
import { getModelResolutionInfoWithOverrides } from "./model-resolution";
import { loadAvailableModelsFromCache } from "./model-resolution-cache";
import type { OcoConfig } from "./model-resolution-types";

interface ConnectedProvidersCache {
	connected?: string[];
}

interface ProviderModelsCache {
	models?: Record<string, unknown>;
}

function loadKnownProviderIds(): Set<string> {
	const availableModels = loadAvailableModelsFromCache();
	const providers = new Set(availableModels.providers);
	const cacheDirs = [join(getCacheDir(), "opencode-codex-orch")];

	for (const cacheDir of cacheDirs) {
		const providerModelsPath = join(cacheDir, "provider-models.json");
		if (existsSync(providerModelsPath)) {
			try {
				const content = readFileSync(providerModelsPath, "utf-8");
				const data = JSON.parse(content) as ProviderModelsCache;
				for (const providerId of Object.keys(data.models ?? {})) {
					providers.add(providerId);
				}
			} catch {
				// Ignore unreadable cache files and keep checking other sources.
			}
		}

		const connectedProvidersPath = join(cacheDir, "connected-providers.json");
		if (existsSync(connectedProvidersPath)) {
			try {
				const content = readFileSync(connectedProvidersPath, "utf-8");
				const data = JSON.parse(content) as ConnectedProvidersCache;
				for (const providerId of data.connected ?? []) {
					providers.add(providerId);
				}
			} catch {
				// Ignore unreadable cache files and keep checking other sources.
			}
		}
	}

	return providers;
}

function collectModelResolutionIssues(config: OcoConfig): DoctorIssue[] {
	const issues: DoctorIssue[] = [];
	const resolution = getModelResolutionInfoWithOverrides(config);

	const invalidAgentOverrides = resolution.agents.filter(
		(agent) => agent.userOverride && !agent.userOverride.includes("/"),
	);
	const invalidCategoryOverrides = resolution.categories.filter(
		(category) => category.userOverride && !category.userOverride.includes("/"),
	);

	for (const invalidAgent of invalidAgentOverrides) {
		issues.push({
			title: `Invalid agent override: ${invalidAgent.name}`,
			description: `Override '${invalidAgent.userOverride}' must be in provider/model format.`,
			severity: "warning",
			affects: [invalidAgent.name],
		});
	}

	for (const invalidCategory of invalidCategoryOverrides) {
		issues.push({
			title: `Invalid category override: ${invalidCategory.name}`,
			description: `Override '${invalidCategory.userOverride}' must be in provider/model format.`,
			severity: "warning",
			affects: [invalidCategory.name],
		});
	}

	const providerSet = loadKnownProviderIds();
	if (providerSet.size > 0) {
		const unknownProviders = [
			...resolution.agents.map((agent) => agent.userOverride),
			...resolution.categories.map((category) => category.userOverride),
		]
			.filter((value): value is string => Boolean(value))
			.map((value) => value.split("/")[0])
			.filter((provider) => provider.length > 0 && !providerSet.has(provider));

		if (unknownProviders.length > 0) {
			const uniqueProviders = [...new Set(unknownProviders)];
			issues.push({
				title: "Model override uses unavailable provider",
				description: `Provider(s) not found in available model caches: ${uniqueProviders.join(", ")}`,
				severity: "warning",
				affects: ["model resolution"],
			});
		}
	}

	return issues;
}

export async function checkConfig(): Promise<CheckResult> {
	const validation = validateConfig();
	const issues: DoctorIssue[] = [];

	if (!validation.exists) {
		return {
			name: CHECK_NAMES[CHECK_IDS.CONFIG],
			status: "pass",
			message: "No custom config found; defaults are used",
			details: undefined,
			issues,
		};
	}

	if (!validation.valid) {
		issues.push(
			...validation.errors.map((error) => ({
				title: "Invalid configuration",
				description: error,
				severity: "error" as const,
				affects: ["plugin startup"],
			})),
		);

		return {
			name: CHECK_NAMES[CHECK_IDS.CONFIG],
			status: "fail",
			message: `Configuration invalid (${issues.length} issue${issues.length > 1 ? "s" : ""})`,
			details: validation.path ? [`Path: ${validation.path}`] : undefined,
			issues,
		};
	}

	if (validation.config) {
		issues.push(...collectModelResolutionIssues(validation.config));
	}

	return {
		name: CHECK_NAMES[CHECK_IDS.CONFIG],
		status: issues.length > 0 ? "warn" : "pass",
		message:
			issues.length > 0
				? `${issues.length} configuration warning(s)`
				: "Configuration is valid",
		details: validation.path ? [`Path: ${validation.path}`] : undefined,
		issues,
	};
}
