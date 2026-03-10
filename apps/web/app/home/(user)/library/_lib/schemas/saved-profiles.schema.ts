import { z } from "zod";

/**
 * Schema for creating a new saved profile from an audience profile.
 */
export const CreateSavedProfileSchema = z.object({
	accountId: z.string().uuid(),
	// Optional name, defaults to "company + date" if not provided
	name: z.string().min(1).optional(),
	// The audience_profile to copy from
	sourceProfileId: z.string().uuid(),
});

export type CreateSavedProfileInput = z.infer<typeof CreateSavedProfileSchema>;

/**
 * Schema for updating a saved profile's name.
 */
export const UpdateSavedProfileSchema = z.object({
	profileId: z.string().uuid(),
	name: z.string().min(1).optional(),
	// Optional: new enrichment data from a refresh
	audienceData: z.record(z.string(), z.unknown()).optional(),
	companyBrief: z.record(z.string(), z.unknown()).optional(),
	enrichmentInputs: z.record(z.string(), z.unknown()).optional(),
});

export type UpdateSavedProfileInput = z.infer<typeof UpdateSavedProfileSchema>;

/**
 * Schema for deleting a saved profile.
 */
export const DeleteSavedProfileSchema = z.object({
	profileId: z.string().uuid(),
});

export type DeleteSavedProfileInput = z.infer<typeof DeleteSavedProfileSchema>;

/**
 * Schema for refreshing a saved profile with new enrichment data.
 * Used when creating a new presentation from a saved profile.
 */
export const RefreshSavedProfileSchema = z.object({
	profileId: z.string().uuid(),
	// The new presentation to run enrichment for
	presentationId: z.string().uuid(),
});

export type RefreshSavedProfileInput = z.infer<
	typeof RefreshSavedProfileSchema
>;
