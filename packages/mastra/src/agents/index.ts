/**
 * Agent definitions for SlideHeroes.
 *
 * Includes research foundation agent and launch agents
 * (Partner, Validator, Whisperer, Editor).
 */

export { researchAgent } from "./research-agent";

export {
	partnerAgent,
	PartnerSlideScoresSchema,
	PartnerSlideReviewSchema,
	PartnerTopIssueSchema,
	PartnerReviewSchema,
	type PartnerSlideReview,
	type PartnerReview,
} from "./partner-agent";

export {
	validatorAgent,
	ValidatorClaimSchema,
	ValidatorSlideReviewSchema,
	ValidatorCriticalFlagSchema,
	ValidatorReviewSchema,
	type ValidatorClaim,
	type ValidatorSlideReview,
	type ValidatorReview,
} from "./validator-agent";

export {
	whispererAgent,
	WhispererSlideNotesSchema,
	WhispererReviewSchema,
	type WhispererSlideNotes,
	type WhispererReview,
} from "./whisperer-agent";

export {
	editorAgent,
	EditorSlideActionSchema,
	EditorRedundancyPairSchema,
	EditorReviewSchema,
	type EditorSlideAction,
	type EditorReview,
} from "./editor-agent";

export {
	AGENT_CATALOG,
	LAUNCH_AGENTS,
	getAgent,
	type LaunchAgentId,
	type AgentCatalogEntry,
} from "./registry";
