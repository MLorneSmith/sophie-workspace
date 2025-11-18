import { z } from "zod";

// Strategy object schema
export const StrategySchema = z.object({
	mode: z.enum(["single", "loadbalance", "fallback"]),
	on_status_codes: z.array(z.number()).optional(),
});

// Cache object schema
export const CacheSchema = z.object({
	mode: z.enum(["simple", "semantic"]),
	max_age: z.number().optional(),
});

// Retry object schema
export const RetrySchema = z.object({
	attempts: z.number(),
	on_status_codes: z.array(z.number()).optional(),
});

// Provider enum
export const ProviderEnum = z.enum([
	"openai",
	"anthropic",
	"azure-openai",
	"anyscale",
	"cohere",
	"palm",
	"groq",
]);

// Base config properties
const BaseConfigProperties = {
	provider: ProviderEnum.optional(),
	api_key: z.string().optional(),
	virtual_key: z.string().optional(),
	cache: CacheSchema.optional(),
	retry: RetrySchema.optional(),
	weight: z.number().optional(),
	on_status_codes: z.array(z.number()).optional(),
	request_timeout: z.number().optional(),
	custom_host: z.string().optional(),
	forward_headers: z.array(z.string()).optional(),
	override_params: z.record(z.string(), z.any()).optional(),
};

// Define Config type first
export type Config = {
	provider?: z.infer<typeof ProviderEnum>;
	api_key?: string;
	virtual_key?: string;
	cache?: z.infer<typeof CacheSchema>;
	retry?: z.infer<typeof RetrySchema>;
	weight?: number;
	on_status_codes?: number[];
	request_timeout?: number;
	custom_host?: string;
	forward_headers?: string[];
	override_params?: Record<string, unknown>;
	strategy?: z.infer<typeof StrategySchema>;
	targets?: Config[];
};

// Config object schema
export const ConfigSchema: z.ZodType<Config> = z.lazy(() =>
	z.object({
		...BaseConfigProperties,
		strategy: StrategySchema.optional(),
		targets: z.array(ConfigSchema).optional(),
	}),
);

// Export types
export type Strategy = z.infer<typeof StrategySchema>;
export type Cache = z.infer<typeof CacheSchema>;
export type Retry = z.infer<typeof RetrySchema>;
export type Provider = z.infer<typeof ProviderEnum>;

// Config options for chat completion
export interface ChatCompletionConfigOptions {
	config?: string | Config;
}
