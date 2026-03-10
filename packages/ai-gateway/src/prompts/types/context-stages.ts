/**
 * Stage types and data source definitions for context curation
 *
 * This module defines the presentation workflow stages and the data sources
 * available for context assembly in the stage-aware context curation system.
 */

/**
 * Presentation workflow stages
 * Each stage represents a different phase in the presentation creation process.
 */
export type PresentationStage =
	| "audience-profiling"
	| "outline-generation"
	| "slide-generation"
	| "refinement";

/**
 * Available data sources for context assembly
 * These represent the different types of data that can be included in presentation context.
 */
export type ContextDataSource =
	| "scqa-fields"
	| "audience-brief"
	| "company-brief"
	| "playbook-rag"
	| "deck-history"
	| "outline-content"
	| "current-slide"
	| "user-feedback";
