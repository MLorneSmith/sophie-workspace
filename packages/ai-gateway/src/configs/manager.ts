import { z } from 'zod';

import * as templates from './templates';
import { Config, ConfigSchema } from './types';

export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

export class ConfigManager {
  /**
   * Validate a configuration object against the schema
   */
  static validateConfig(config: unknown): Config {
    try {
      return ConfigSchema.parse(config);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ConfigurationError(
          `Invalid configuration: ${error.errors.map((e) => e.message).join(', ')}`,
        );
      }
      throw error;
    }
  }

  /**
   * Merge multiple configurations, with later configs taking precedence
   */
  static mergeConfigs(...configs: Config[]): Config {
    return configs.reduce((merged, current) => {
      return this.validateConfig({
        ...merged,
        ...current,
        // Special handling for nested objects
        cache: current.cache
          ? { ...merged.cache, ...current.cache }
          : merged.cache,
        retry: current.retry
          ? { ...merged.retry, ...current.retry }
          : merged.retry,
        strategy: current.strategy
          ? { ...merged.strategy, ...current.strategy }
          : merged.strategy,
        override_params: current.override_params
          ? { ...merged.override_params, ...current.override_params }
          : merged.override_params,
      });
    });
  }

  /**
   * Get a template configuration by name
   */
  static getTemplate(name: keyof typeof templates): Config {
    return templates[name];
  }

  /**
   * Create a configuration with the specified template as base
   */
  static createFromTemplate(
    templateName: keyof typeof templates,
    overrides: Partial<Config> = {},
  ): Config {
    const template = this.getTemplate(templateName);
    return this.mergeConfigs(template, this.validateConfig(overrides));
  }

  /**
   * Validate and normalize a configuration input that can be either a string (config ID) or object
   */
  static normalizeConfig(
    config: string | Config | undefined,
    defaultConfig?: Config,
  ): Config | undefined {
    if (!config && !defaultConfig) {
      return undefined;
    }

    if (typeof config === 'string') {
      // In a real implementation, this would fetch the config from Portkey's API
      // For now, we'll throw an error suggesting to use object configs
      throw new ConfigurationError(
        'Config IDs are not supported in this version. Please use configuration objects directly.',
      );
    }

    const configObject = config || defaultConfig;
    return this.validateConfig(configObject);
  }

  /**
   * Check if a configuration has caching enabled
   */
  static hasCaching(config: Config): boolean {
    return !!config.cache;
  }

  /**
   * Check if a configuration has retries enabled
   */
  static hasRetries(config: Config): boolean {
    return !!config.retry;
  }

  /**
   * Check if a configuration uses load balancing
   */
  static isLoadBalanced(config: Config): boolean {
    return config.strategy?.mode === 'loadbalance';
  }

  /**
   * Check if a configuration uses fallback strategy
   */
  static hasFallback(config: Config): boolean {
    return config.strategy?.mode === 'fallback';
  }

  /**
   * Get the primary provider from a configuration
   */
  static getPrimaryProvider(config: Config): string | undefined {
    if (config.provider) {
      return config.provider;
    }
    if (config.targets?.[0]) {
      return this.getPrimaryProvider(config.targets[0]);
    }
    return undefined;
  }
}
