"use server";

import { enhanceAction } from "@kit/next/actions";
import { getLogger } from "@kit/shared/logger";
import { getSupabaseServerClient } from "@kit/supabase/server-client";

import { ServerFormSchema } from "../onboarding-form.schema";

// Define the onboarding data type
type OnboardingData = {
	user_id: string;
	full_name: string;
	first_name: string;
	last_name: string;
	primary_goal: "work" | "personal" | "school";
	secondary_goals: {
		learn: boolean;
		automate: boolean;
		feedback: boolean;
	};
	theme_preference: "dark" | "light";
	updated_at: string;
	work_role?: string;
	work_industry?: string;
	personal_project?: string;
	school_level?: string;
	school_major?: string;
	completed?: boolean;
	completed_at?: string;
};

export const submitOnboardingFormAction = enhanceAction(
	async (data, user) => {
		const logger = await getLogger();
		const supabase = getSupabaseServerClient();
		const isFinalSubmission = data.isFinalSubmission || false;

		logger.info({ userId: user.id }, "Submitting onboarding form...");

		try {
			// Parse full name into first and last name
			const nameParts = data.profile.name.trim().split(/\s+/);
			const firstName = nameParts[0] || "";
			const lastName = nameParts.slice(1).join(" ") || "";

			// Prepare onboarding data
			const onboardingData: OnboardingData = {
				user_id: user.id,
				full_name: data.profile.name,
				first_name: firstName,
				last_name: lastName,
				primary_goal: data.goals.primary,
				secondary_goals: data.goals.secondary,
				theme_preference: data.theme.style,
				updated_at: new Date().toISOString(),
			};

			// Add fields based on primary goal
			// Since we've made these fields required in the schema, we can safely access them
			if (data.goals.primary === "work") {
				onboardingData.work_role = data.goals.workDetails.role;
				onboardingData.work_industry = data.goals.workDetails.industry;
			} else if (data.goals.primary === "personal") {
				onboardingData.personal_project = data.goals.personalDetails.project;
			} else if (data.goals.primary === "school") {
				onboardingData.school_level = data.goals.schoolDetails.level;
				onboardingData.school_major = data.goals.schoolDetails.major;
			}

			// If this is the final submission, mark as completed
			if (isFinalSubmission) {
				onboardingData.completed = true;
				onboardingData.completed_at = new Date().toISOString();
			}

			// Upsert to onboarding table
			const { error } = await supabase
				.from("onboarding")
				.upsert(onboardingData, { onConflict: "user_id" });

			if (error) {
				logger.error(
					{ userId: user.id, error },
					"Failed to save onboarding data",
				);
				throw error;
			}

			logger.info({ userId: user.id }, "Onboarding data saved successfully");

			// If final submission, also update user metadata
			if (isFinalSubmission) {
				const { error: userUpdateError } = await supabase.auth.updateUser({
					data: {
						onboarded: true,
						onboardedAt: new Date().toISOString(),
					},
				});

				if (userUpdateError) {
					logger.error(
						{ userId: user.id, error: userUpdateError },
						"Failed to mark user as onboarded",
					);
					throw userUpdateError;
				}

				logger.info(
					{ userId: user.id },
					"User marked as onboarded successfully",
				);

				// Refresh the session to ensure the middleware sees the updated metadata
				const { error: refreshError } = await supabase.auth.refreshSession();
				if (refreshError) {
					logger.warn(
						{ userId: user.id, error: refreshError },
						"Failed to refresh session after onboarding",
					);
				}
				
				// Force a new session fetch to ensure metadata is up to date
				const { data: sessionData } = await supabase.auth.getSession();
				if (sessionData?.session) {
					// Re-fetch user to confirm metadata update
					const { data: updatedUser } = await supabase.auth.getUser();
					logger.info(
						{ 
							userId: user.id, 
							onboarded: updatedUser?.user?.user_metadata?.onboarded 
						},
						"Session refreshed with updated metadata",
					);
				}
			}

			return {
				success: true,
				isComplete: isFinalSubmission,
				redirectUrl: isFinalSubmission ? `/home?onboarded=${Date.now()}` : undefined,
			};
		} catch (error) {
			logger.error(
				{ userId: user.id, error },
				"Error in submitOnboardingFormAction",
			);

			return {
				success: false,
				message:
					error instanceof Error
						? error.message
						: "An unexpected error occurred",
				isComplete: false,
			};
		}
	},
	{
		auth: true,
		schema: ServerFormSchema,
	},
);
