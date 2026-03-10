/**
 * Context curation function for stage-aware presentation context assembly
 *
 * This module provides a function that assembles context based on the current
 * presentation workflow stage, applying budget-aware truncation to optimize token usage.
 */

import type {
	ContextDataSource,
	PresentationStage,
} from "../types/context-stages";
import { getStageConfig } from "../config/stage-context-config";

/**
 * Input interface for context curation
 * Accepts all possible context fields plus optional stage parameter
 */
export interface CurationInput {
	/** Optional stage for stage-aware curation */
	stage?: PresentationStage;

	/** SCQA fields */
	title?: string;
	audience?: string;
	questionType?: string;
	situation?: string;
	complication?: string;
	answer?: string;
	sectionType?: string;

	/** Additional context sources */
	audienceBrief?: string;
	companyBrief?: string;
	playbookRag?: string;
	deckHistory?: string;
	outlineContent?: string;
	currentSlide?: string;
	userFeedback?: string;
}

/**
 * Safe truncate function for budget-aware context assembly
 * Uses character-based estimation (~4 chars per token heuristic)
 *
 * @param value - The text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text
 */
function safeTruncate(value: string | undefined, maxLength: number): string {
	if (!value) {
		return "";
	}
	if (value.length <= maxLength) {
		return value;
	}
	return `${value.substring(0, maxLength - 3)}...`;
}

/**
 * Source name to input field mapping
 */
const SOURCE_TO_FIELD: Record<ContextDataSource, keyof CurationInput> = {
	"scqa-fields": "title",
	"audience-brief": "audienceBrief",
	"company-brief": "companyBrief",
	"playbook-rag": "playbookRag",
	"deck-history": "deckHistory",
	"outline-content": "outlineContent",
	"current-slide": "currentSlide",
	"user-feedback": "userFeedback",
};

/**
 * Build SCQA section from individual fields
 */
function buildScqaSection(input: CurationInput): string {
	const parts: string[] = [];

	if (input.title) {
		parts.push(`- Title: ${input.title}`);
	}
	if (input.audience) {
		parts.push(`- Target Audience: ${input.audience}`);
	}
	if (input.questionType) {
		parts.push(`- Question Type: ${input.questionType}`);
	}

	if (input.situation) {
		parts.push(`\n- Situation (Current State): ${input.situation}`);
		parts.push("  This sets the context and background for the presentation.");
	}

	if (input.complication) {
		parts.push(`\n- Complication (Problem/Challenge): ${input.complication}`);
		parts.push(
			"  This explains why the current situation is problematic or needs change.",
		);
	}

	if (input.questionType) {
		parts.push(`\n- Question: How can we ${input.questionType}?`);
		parts.push("  This is the core question the presentation aims to answer.");
	}

	if (input.answer) {
		parts.push(`\n- Answer (Solution): ${input.answer}`);
		parts.push(
			"  This provides the solution or approach to address the complication.",
		);
	}

	return parts.join("\n");
}

/**
 * Get available sources from input based on config
 */
function getSourceContent(
	input: CurationInput,
	sourceName: ContextDataSource,
	maxChars: number,
): string {
	const fieldName = SOURCE_TO_FIELD[sourceName];
	const content = input[fieldName];

	if (!content) {
		return "";
	}

	const truncated = safeTruncate(content, maxChars);
	return truncated;
}

/**
 * Stage label for context output
 */
function getStageLabel(stage?: PresentationStage): string {
	if (!stage) {
		return "All Stages (Default)";
	}

	const labels: Record<PresentationStage, string> = {
		"audience-profiling": "Audience Profiling",
		"outline-generation": "Outline Generation",
		"slide-generation": "Slide Generation",
		refinement: "Refinement",
	};

	return labels[stage];
}

/**
 * Curate presentation context based on stage
 *
 * This function assembles context by:
 * 1. Looking up stage config (falls back to "all sources" if no stage)
 * 2. Filtering and ordering data sources by priority
 * 3. Applying character budgets using safeTruncate
 * 4. Assembling the final context string
 *
 * @param input - Context input including stage and all possible fields
 * @returns Curated context string optimized for the current stage
 */
export function curatePresentationContext(input: CurationInput): string {
	const config = getStageConfig(input.stage);
	const stageLabel = getStageLabel(input.stage);

	const sections: string[] = [
		`# Presentation Context${input.stage ? ` (${stageLabel})` : ""}`,
		"",
		"The following context is provided for this operation:",
		"",
	];

	// Add SCQA section if any SCQA fields are present
	const scqaSection = buildScqaSection(input);
	if (scqaSection) {
		sections.push("## SCQA Framework:");
		sections.push(scqaSection);
		sections.push("");
	}

	// Process each source in priority order
	// Note: scqa-fields is handled separately via buildScqaSection, so we exclude it here
	// to avoid duplicate output in "Additional Context"
	const sourceConfigs = config.sources.filter((source) => {
		// scqa-fields is handled separately via buildScqaSection
		if (source.name === "scqa-fields") return false;
		const fieldName = SOURCE_TO_FIELD[source.name];
		return !!input[fieldName];
	});

	if (sourceConfigs.length > 0) {
		sections.push("## Additional Context:");

		for (const sourceConfig of sourceConfigs) {
			const content = getSourceContent(
				input,
				sourceConfig.name,
				sourceConfig.maxChars,
			);

			if (content) {
				const sourceLabel = sourceConfig.name
					.replace(/-/g, " ")
					.replace(/\b\w/g, (c) => c.toUpperCase());

				sections.push(`### ${sourceLabel}:`);
				sections.push(content);
				sections.push("");
			}
		}
	}

	// Add section focus if provided
	if (input.sectionType) {
		sections.push("## Current Focus:");
		sections.push(
			`We are now working on improving the ${input.sectionType} section of this presentation.`,
		);
		sections.push(
			"This section must work effectively with the other components to create a compelling narrative.",
		);
		sections.push("");
		sections.push("Consider how this section:");
		sections.push("- Supports the overall presentation goal");
		sections.push("- Connects with the other SCQA components");
		if (input.audience) {
			sections.push(`- Addresses the needs of the ${input.audience} audience`);
		}
		sections.push("- Contributes to answering the core question");
	}

	return sections.join("\n");
}

/**
 * Re-export presentationContext for backward compatibility
 * The original template export - preserved for existing consumers
 */
export { presentationContext } from "../partials/presentation-context";
