import { z } from "zod";

// Helper function to check if at least one secondary goal is selected
const hasAtLeastOneSecondaryGoal = (data: {
	learn: boolean;
	automate: boolean;
	feedback: boolean;
}) => {
	return data.learn || data.automate || data.feedback;
};

// Define the schema directly without using createStepSchema
// This allows it to be used in both client and server contexts
export const FormSchemaShape = {
	welcome: z.object({}),
	profile: z.object({
		name: z
			.string()
			.min(2, { message: "Name must be at least 2 characters" })
			.max(255, { message: "Name must be 255 characters or less" }),
	}),
	goals: z
		.object({
			primary: z.enum(["work", "personal", "school"]),
			secondary: z
				.object({
					learn: z.boolean(),
					automate: z.boolean(),
					feedback: z.boolean(),
				})
				.refine(hasAtLeastOneSecondaryGoal, {
					message: "Please select at least one goal",
					path: ["learn"], // This will show the error on the first checkbox
				}),
			// Define these fields as required since they'll be conditionally validated
			workDetails: z.object({
				role: z.string().min(1, "Role is required"),
				industry: z.string().min(1, "Industry is required"),
			}),
			personalDetails: z.object({
				project: z.string().min(1, "Project is required"),
			}),
			schoolDetails: z.object({
				level: z.enum(["highschool", "undergraduate", "graduate"]),
				major: z.string().min(1, "Major is required"),
			}),
		})
		.refine(
			(data) => {
				// Validate work details if primary goal is work
				if (data.primary === "work") {
					return (
						data.workDetails &&
						typeof data.workDetails.role === "string" &&
						data.workDetails.role.length > 0 &&
						typeof data.workDetails.industry === "string" &&
						data.workDetails.industry.length > 0
					);
				}
				// Validate personal details if primary goal is personal
				if (data.primary === "personal") {
					return (
						data.personalDetails &&
						typeof data.personalDetails.project === "string" &&
						data.personalDetails.project.length > 0
					);
				}
				// Validate school details if primary goal is school
				if (data.primary === "school") {
					return (
						data.schoolDetails?.level &&
						typeof data.schoolDetails.major === "string" &&
						data.schoolDetails.major.length > 0
					);
				}
				return false;
			},
			{
				message: "Please complete all required fields for your primary goal",
				path: ["primary"], // This will show the error on the primary goal field
			},
		),
	theme: z.object({
		style: z.enum(["dark", "light"]),
	}),
};

// Server-side schema for validation in server actions
export const ServerFormSchema = z.object({
	...FormSchemaShape,
	isFinalSubmission: z.boolean().optional(),
});

// Client-side schema will be created in the component using createStepSchema

// Helper function to validate the goals step
export const validateGoalsStep = (formData: any): boolean => {
	// Check if at least one secondary goal is selected
	const hasSecondaryGoal = hasAtLeastOneSecondaryGoal(formData.goals.secondary);

	// Check primary goal specific fields
	if (formData.goals.primary === "work") {
		return (
			hasSecondaryGoal &&
			formData.goals.workDetails &&
			typeof formData.goals.workDetails.role === "string" &&
			formData.goals.workDetails.role.length > 0 &&
			typeof formData.goals.workDetails.industry === "string" &&
			formData.goals.workDetails.industry.length > 0
		);
	}
	if (formData.goals.primary === "personal") {
		return (
			hasSecondaryGoal &&
			formData.goals.personalDetails &&
			typeof formData.goals.personalDetails.project === "string" &&
			formData.goals.personalDetails.project.length > 0
		);
	}
	if (formData.goals.primary === "school") {
		return (
			hasSecondaryGoal &&
			formData.goals.schoolDetails &&
			formData.goals.schoolDetails.level &&
			typeof formData.goals.schoolDetails.major === "string" &&
			formData.goals.schoolDetails.major.length > 0
		);
	}

	return false;
};
