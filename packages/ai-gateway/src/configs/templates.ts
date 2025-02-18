import { Config } from './types';

/**
 * Basic configuration with semantic caching and retry mechanism
 */
export const basicConfig: Config = {
  provider: 'openai',
  override_params: {
    model: 'gpt-3.5-turbo',
  },
};

/**
 * Configuration for load balancing between multiple providers
 */
export const loadBalanceConfig: Config = {
  strategy: {
    mode: 'loadbalance',
  },
  targets: [
    {
      provider: 'openai',
      weight: 0.6, // 60% of traffic
      override_params: {
        model: 'gpt-3.5-turbo',
      },
    },
    {
      provider: 'openai',
      weight: 0.4, // 40% of traffic
      override_params: {
        model: 'gpt-4',
      },
    },
  ],
};

/**
 * Configuration with fallback strategy
 */
export const fallbackConfig: Config = {
  strategy: {
    mode: 'fallback',
    on_status_codes: [429, 500, 503],
  },
  targets: [
    {
      provider: 'openai',
      override_params: {
        model: 'gpt-3.5-turbo',
      },
    },
    {
      provider: 'openai',
      override_params: {
        model: 'gpt-4',
      },
    },
  ],
};

/**
 * Configuration optimized for high reliability
 */
export const reliableConfig: Config = {
  strategy: {
    mode: 'fallback',
  },
  targets: [
    {
      provider: 'openai',
      retry: {
        attempts: 3,
        on_status_codes: [429, 503],
      },
      override_params: {
        model: 'gpt-3.5-turbo',
      },
    },
    {
      provider: 'openai',
      retry: {
        attempts: 2,
        on_status_codes: [429, 503],
      },
      override_params: {
        model: 'gpt-4',
      },
    },
  ],
  cache: {
    mode: 'semantic',
    max_age: 1800, // 30 minutes
  },
};

/**
 * Configuration for cost optimization
 */
export const costOptimizedConfig: Config = {
  strategy: {
    mode: 'loadbalance',
  },
  targets: [
    {
      provider: 'openai',
      weight: 0.9,
      override_params: {
        model: 'gpt-3.5-turbo',
      },
    },
    {
      provider: 'openai',
      weight: 0.1,
      override_params: {
        model: 'gpt-4',
      },
    },
  ],
  cache: {
    mode: 'semantic',
    max_age: 7200, // 2 hours
  },
};
