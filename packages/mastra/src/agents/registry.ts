import {
	editorAgent,
	EditorRedundancyPairSchema,
	EditorReviewSchema,
	EditorSlideActionSchema,
} from "./editor-agent";
import {
	partnerAgent,
	PartnerReviewSchema,
	PartnerSlideReviewSchema,
	PartnerSlideScoresSchema,
	PartnerTopIssueSchema,
} from "./partner-agent";
import {
	validatorAgent,
	ValidatorClaimSchema,
	ValidatorCriticalFlagSchema,
	ValidatorReviewSchema,
	ValidatorSlideReviewSchema,
} from "./validator-agent";
import {
	whispererAgent,
	WhispererReviewSchema,
	WhispererSlideNotesSchema,
} from "./whisperer-agent";

export const AGENT_CATALOG = [
	{
		id: "partner",
		name: "The Partner",
		description: "Senior consulting partner review",
		icon: "target",
		category: "review",
	},
	{
		id: "validator",
		name: "The Validator",
		description: "Fact & claims checker",
		icon: "shield-check",
		category: "review",
	},
	{
		id: "whisperer",
		name: "The Whisperer",
		description: "Speaker notes generator",
		icon: "mic",
		category: "enhance",
	},
	{
		id: "editor",
		name: "The Editor",
		description: "Deck shrinker",
		icon: "scissors",
		category: "optimize",
	},
] as const;

export const LAUNCH_AGENTS = {
	partner: partnerAgent,
	validator: validatorAgent,
	whisperer: whispererAgent,
	editor: editorAgent,
} as const;

export type LaunchAgentId = keyof typeof LAUNCH_AGENTS;
export type AgentCatalogEntry = (typeof AGENT_CATALOG)[number];

export function getAgent(id: string) {
	if (!(id in LAUNCH_AGENTS)) {
		return undefined;
	}

	return LAUNCH_AGENTS[id as LaunchAgentId];
}

export {
	partnerAgent,
	validatorAgent,
	whispererAgent,
	editorAgent,
	PartnerSlideScoresSchema,
	PartnerSlideReviewSchema,
	PartnerTopIssueSchema,
	PartnerReviewSchema,
	ValidatorClaimSchema,
	ValidatorSlideReviewSchema,
	ValidatorCriticalFlagSchema,
	ValidatorReviewSchema,
	WhispererSlideNotesSchema,
	WhispererReviewSchema,
	EditorSlideActionSchema,
	EditorRedundancyPairSchema,
	EditorReviewSchema,
};
