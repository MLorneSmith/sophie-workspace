/**
 * Re-export app-level presentation artifact schemas for Mastra workflows.
 *
 * This keeps schema ownership in `apps/web` while allowing workflows in
 * `packages/mastra` to share the same runtime validators.
 */

export {
	type AudienceBrief,
	AudienceBriefSchema,
	type StoryboardContent,
	StoryboardContentSchema,
} from "../../../../apps/web/app/home/(user)/ai/_lib/schemas/presentation-artifacts";
