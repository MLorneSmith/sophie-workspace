/**
 * Stage-to-source configuration for context curation
 *
 * This module defines which data sources each presentation stage needs,
 * their relative priority (1-10), and character budget allocations.
 */

import type {
	ContextDataSource,
	PresentationStage,
} from "../types/context-stages";

/**
 * Configuration for a single data source within a stage
 */
export interface StageSourceConfig {
	/** The name of the data source */
	name: ContextDataSource;
	/** Priority (1-10, higher = more important) */
	priority: number;
	/** Maximum characters allocated for this source */
	maxChars: number;
}

/**
 * Configuration for a presentation stage
 */
export interface StageContextConfig {
	/** Ordered list of data sources for this stage */
	sources: StageSourceConfig[];
}

/**
 * Character budget per stage for context allocation
 * Total budget is distributed across sources based on priority
 */
const STAGE_BUDGETS: Record<PresentationStage, number> = {
	"audience-profiling": 8000,
	"outline-generation": 12000,
	"slide-generation": 15000,
	refinement: 6000,
};

/**
 * Source priorities per stage
 * Maps each stage to its relevant sources and their priorities
 */
const STAGE_SOURCE_PRIORITIES: Record<
	PresentationStage,
	Array<{ source: ContextDataSource; priority: number }>
> = {
	"audience-profiling": [
		{ source: "company-brief", priority: 10 },
		{ source: "scqa-fields", priority: 7 },
		{ source: "playbook-rag", priority: 5 },
	],
	"outline-generation": [
		{ source: "audience-brief", priority: 10 },
		{ source: "playbook-rag", priority: 8 },
		{ source: "deck-history", priority: 6 },
		{ source: "scqa-fields", priority: 5 },
	],
	"slide-generation": [
		{ source: "outline-content", priority: 10 },
		{ source: "audience-brief", priority: 7 },
		{ source: "playbook-rag", priority: 5 },
	],
	refinement: [
		{ source: "current-slide", priority: 10 },
		{ source: "user-feedback", priority: 10 },
		{ source: "audience-brief", priority: 4 },
	],
};

/**
 * Calculate maxChars for each source based on priority distribution
 */
function calculateSourceBudgets(
	sources: Array<{ source: ContextDataSource; priority: number }>,
	totalBudget: number,
): StageSourceConfig[] {
	const totalPriority = sources.reduce((sum, s) => sum + s.priority, 0);

	return sources.map(({ source, priority }) => ({
		name: source,
		priority,
		maxChars: Math.floor((priority / totalPriority) * totalBudget),
	}));
}

/**
 * Stage context configurations
 * Maps each presentation stage to its data source configuration
 */
export const STAGE_CONTEXT_CONFIGS: Record<
	PresentationStage,
	StageContextConfig
> = {
	"audience-profiling": {
		sources: calculateSourceBudgets(
			STAGE_SOURCE_PRIORITIES["audience-profiling"],
			STAGE_BUDGETS["audience-profiling"],
		),
	},
	"outline-generation": {
		sources: calculateSourceBudgets(
			STAGE_SOURCE_PRIORITIES["outline-generation"],
			STAGE_BUDGETS["outline-generation"],
		),
	},
	"slide-generation": {
		sources: calculateSourceBudgets(
			STAGE_SOURCE_PRIORITIES["slide-generation"],
			STAGE_BUDGETS["slide-generation"],
		),
	},
	refinement: {
		sources: calculateSourceBudgets(
			STAGE_SOURCE_PRIORITIES.refinement,
			STAGE_BUDGETS.refinement,
		),
	},
};

/**
 * Default configuration for backward compatibility
 * Includes all sources when no stage is specified
 */
export const DEFAULT_CONTEXT_CONFIG: StageContextConfig = {
	sources: [
		{ name: "scqa-fields", priority: 10, maxChars: 2000 },
		{ name: "audience-brief", priority: 9, maxChars: 2000 },
		{ name: "company-brief", priority: 8, maxChars: 2000 },
		{ name: "playbook-rag", priority: 7, maxChars: 3000 },
		{ name: "deck-history", priority: 6, maxChars: 2000 },
		{ name: "outline-content", priority: 5, maxChars: 3000 },
		{ name: "current-slide", priority: 4, maxChars: 2000 },
		{ name: "user-feedback", priority: 3, maxChars: 1000 },
	],
};

/**
 * Get configuration for a stage, with fallback to default
 */
export function getStageConfig(stage?: PresentationStage): StageContextConfig {
	if (!stage) {
		return DEFAULT_CONTEXT_CONFIG;
	}
	return STAGE_CONTEXT_CONFIGS[stage] ?? DEFAULT_CONTEXT_CONFIG;
}
