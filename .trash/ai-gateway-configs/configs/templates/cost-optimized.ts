import type { Config, Provider } from "../types";

/**
 * Configuration for cost optimization
 */
const costOptimizedConfig: Config = {
	strategy: {
		mode: "loadbalance",
	},
	targets: [
		{
			provider: "openai" as Provider,
			weight: 0.9,
			override_params: {
				model: "gpt-3.5-turbo",
			},
		},
		{
			provider: "openai" as Provider,
			weight: 0.1,
			override_params: {
				model: "gpt-4",
			},
		},
	],
	cache: {
		mode: "semantic",
		max_age: 7200, // 2 hours
	},
};

export default costOptimizedConfig;
