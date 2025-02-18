import { type Config, type Provider } from '../../types';

/**
 * Configuration specific to presentation outline generation
 * Optimized for high-quality, consistent responses with semantic caching
 */
const outlineGenerationConfig: Config = {
  strategy: {
    mode: 'single',
  },
  provider: 'anthropic' as Provider,
  cache: {
    mode: 'semantic',
    max_age: 7200, // 2 hours, longer cache for outlines as they change less frequently
  },
  retry: {
    attempts: 3,
    on_status_codes: [429, 500, 502, 503, 504],
  },
  override_params: {
    model: 'claude-3-opus-20240229', // Using Opus for higher quality
    temperature: 0.3, // Lower temperature for more consistent outputs
    max_tokens: 4000, // Higher token limit for complex outlines
  },
  request_timeout: 30000, // 30 seconds timeout for longer generations
};

export default outlineGenerationConfig;
