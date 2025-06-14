import type { Config } from "./types";

/**
 * Loads a base configuration template
 * @param name Template name to load
 * @returns Base configuration
 */
export function loadTemplate(name: string): Config {
	const template = require(`./templates/${name}`).default;
	return normalizeConfig(template);
}

/**
 * Merges a base configuration with use-case specific configuration
 * @param base Base configuration template
 * @param useCase Name of the use case configuration to merge
 * @returns Merged configuration
 */
export function mergeWithUseCase(base: Config, useCase: string): Config {
	const useCaseConfig = require(`./use-cases/${useCase}/config`).default;
	return {
		...base,
		...useCaseConfig,
		// Deep merge specific objects if needed
		strategy: {
			...base.strategy,
			...useCaseConfig.strategy,
		},
		cache: {
			...base.cache,
			...useCaseConfig.cache,
		},
		retry: {
			...base.retry,
			...useCaseConfig.retry,
		},
	};
}

/**
 * Overrides local configuration with Portkey configuration if specified
 * @param config Local configuration
 * @param portkeyConfigId Optional Portkey config ID to use
 * @returns Final configuration
 */
export async function overrideWithPortkey(
	config: Config,
	portkeyConfigId?: string,
): Promise<Config> {
	if (!portkeyConfigId) {
		return config;
	}

	// Here we would fetch the Portkey config and merge it
	// This is a placeholder for the actual implementation
	return config;
}

/**
 * Normalizes a configuration object by setting default values
 * @param config Configuration to normalize
 * @returns Normalized configuration
 */
export function normalizeConfig(config: Config): Config {
	return {
		strategy: {
			mode: "single",
			...config.strategy,
		},
		cache: {
			mode: "simple",
			max_age: 3600,
			...config.cache,
		},
		retry: {
			attempts: 3,
			on_status_codes: [429, 500, 502, 503, 504],
			...config.retry,
		},
		...config,
	};
}
