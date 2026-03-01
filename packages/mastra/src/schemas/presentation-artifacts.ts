/**
 * Re-export app-level presentation artifact schemas for Mastra workflows.
 *
 * This keeps schema ownership in `apps/web` while allowing workflows in
 * `packages/mastra` to share the same runtime validators.
 */

export {
<<<<<<< HEAD
	type AudienceBrief,
	AudienceBriefSchema,
	type StoryboardContent,
	StoryboardContentSchema,
=======
	AudienceBriefSchema,
	StoryboardContentSchema,
	type AudienceBrief,
	type StoryboardContent,
>>>>>>> origin/staging
} from "../../../../apps/web/app/home/(user)/ai/_lib/schemas/presentation-artifacts";
