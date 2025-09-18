"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { analytics } from "@kit/analytics";
import { createClientLogger } from "@kit/shared/logger";
import { Button } from "@kit/ui/button";
import { Checkbox } from "@kit/ui/checkbox";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@kit/ui/form";
import { Input } from "@kit/ui/input";
import {
	MultiStepForm,
	MultiStepFormContextProvider,
	MultiStepFormHeader,
	MultiStepFormStep,
	useMultiStepFormContext,
} from "@kit/ui/multi-step-form";
import { Stepper } from "@kit/ui/stepper";
import { setCookie } from "@kit/ui/utils";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Resolver } from "react-hook-form";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { FormSchemaShape } from "../_lib/onboarding-form.schema";
import { submitOnboardingFormAction } from "../_lib/server/server-actions";

// Client-side logger for this component
const { getLogger } = createClientLogger("ONBOARDING-FORM");

// Create the client-side schema using z.object directly to avoid memory issues
const FormSchema = z.object(FormSchemaShape);
type FormData = z.infer<typeof FormSchema>;

// Validation functions for each step (not used in current implementation)
// const _validation = {
// 	welcome: () => true, // Welcome step has no validation
// 	profile: (data: FormData) => {
// 		return Boolean(data.profile?.name && data.profile.name.trim().length >= 2);
// 	},
// 	goals: (data: FormData) => {
// 		return validateGoalsStep({ goals: data.goals });
// 	},
// 	theme: () => true, // Theme step has no validation (has default)
// };

// Dynamically import the Confetti component to avoid SSR issues
const Confetti = dynamic(() => import("react-confetti"), { ssr: false });

// Storage key for form data persistence
const STORAGE_KEY = "onboarding_form_data";

// Image style for profile pictures
const imageStyle = {
	borderRadius: "50%",
	border: "3px solid #27aae0",
};

export function OnboardingForm() {
	const router = useRouter();
	const [_isSubmitting, setIsSubmitting] = useState(false);
	const formRef = useRef<HTMLDivElement>(null);

	// Initialize form with React Hook Form
	const form = useForm<FormData>({
		resolver: zodResolver(FormSchema) as Resolver<FormData>,
		defaultValues: {
			welcome: {},
			profile: { name: "" },
			goals: {
				primary: "work",
				secondary: {
					learn: false,
					automate: false,
					feedback: false,
				},
				// Initialize all conditional fields with default values
				workDetails: {
					role: "",
					industry: "",
				},
				personalDetails: {
					project: "",
				},
				schoolDetails: {
					level: "undergraduate",
					major: "",
				},
			},
			theme: { style: "light" },
		},
		mode: "onChange",
	});

	// Helper function to flatten form data for analytics
	const flattenFormData = useCallback(
		(data: z.infer<typeof FormSchema>): Record<string, string> => {
			const flattenedData: Record<string, string> = {};

			for (const [key, value] of Object.entries(data)) {
				if (typeof value === "object" && value !== null) {
					for (const [subKey, subValue] of Object.entries(value)) {
						if (typeof subValue === "object" && subValue !== null) {
							for (const [nestedKey, nestedValue] of Object.entries(subValue)) {
								flattenedData[`${key}_${subKey}_${nestedKey}`] =
									String(nestedValue);
							}
						} else {
							flattenedData[`${key}_${subKey}`] = String(subValue);
						}
					}
				} else {
					flattenedData[key] = String(value);
				}
			}

			return flattenedData;
		},
		[],
	);

	// Form submission handler
	const onSubmit = useCallback(
		async (data: z.infer<typeof FormSchema>) => {
			setIsSubmitting(true);
			try {
				const result = await submitOnboardingFormAction({
					...data,
					isFinalSubmission: true,
				});

				if (result.success) {
					localStorage.removeItem(STORAGE_KEY);
					analytics.trackEvent("onboarding_completed", flattenFormData(data));

					// If server action returned a redirect URL, use it
					if (result.redirectUrl) {
						// Use window.location.href for a full page refresh to ensure session is reloaded
						window.location.href = result.redirectUrl;
					} else {
						// Fallback to router push
						router.push("/home");
					}
				} else {
					throw new Error(result.message || "Failed to submit form");
				}
			} catch (error) {
				getLogger().error("Onboarding form submission failed", { error });
				analytics.trackEvent("onboarding_error", {
					error: "Form submission failed",
				});
			} finally {
				setIsSubmitting(false);
			}
		},
		[router, flattenFormData],
	);

	// Steps for the stepper component
	const steps = ["Welcome", "Profile", "Goals", "Theme", "Complete"];

	// Focus management for accessibility
	useEffect(() => {
		if (formRef.current) {
			const focusableElements = formRef.current.querySelectorAll(
				'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
			);
			if (focusableElements.length > 0) {
				(focusableElements[0] as HTMLElement).focus();
			}
		}
	}, []);

	// Form data persistence using localStorage
	useEffect(() => {
		const savedData = localStorage.getItem(STORAGE_KEY);
		if (savedData) {
			try {
				const parsedData = JSON.parse(savedData);
				form.reset(parsedData);
			} catch (error) {
				getLogger().error("Failed to parse saved onboarding form data", {
					error,
				});
			}
		}
	}, [form.reset]);

	useEffect(() => {
		const subscription = form.watch((value) => {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
		});
		return () => subscription.unsubscribe();
	}, [form.watch]);

	// Track onboarding start
	useEffect(() => {
		analytics.trackEvent("onboarding_started");
	}, []);

	return (
		<div ref={formRef} className="px-4 sm:px-6 lg:px-8">
			<h1 className="sr-only">SlideHeroes Onboarding Process</h1>
			<MultiStepForm
				className="animate-in fade-in-90 zoom-in-95 slide-in-from-bottom-12 mx-auto w-full max-w-3xl space-y-8 rounded-lg border p-4 shadow-sm duration-500 sm:p-6 lg:p-8"
				form={form}
				schema={FormSchema}
				onSubmit={onSubmit}
			>
				<MultiStepFormHeader>
					<MultiStepFormContextProvider>
						{({ currentStepIndex }) => (
							<section
								className="text-sm sm:text-base"
								aria-label="Onboarding progress"
							>
								<Stepper
									variant="numbers"
									steps={steps}
									currentStep={currentStepIndex}
								/>
							</section>
						)}
					</MultiStepFormContextProvider>
				</MultiStepFormHeader>

				<MultiStepFormStep name="welcome">
					<WelcomeStep />
				</MultiStepFormStep>

				<MultiStepFormStep name="profile">
					<ProfileStep />
				</MultiStepFormStep>

				<MultiStepFormStep name="goals">
					<GoalsStep />
				</MultiStepFormStep>

				<MultiStepFormStep name="theme">
					<ThemeStep />
				</MultiStepFormStep>

				<MultiStepFormStep name="complete">
					<CompleteStep />
				</MultiStepFormStep>
			</MultiStepForm>
		</div>
	);
}

// Welcome step component
function WelcomeStep() {
	const { nextStep, form } = useMultiStepFormContext();

	const handleContinue = useCallback(
		(e: React.SyntheticEvent) => {
			e.preventDefault();
			analytics.trackEvent("onboarding_welcome_completed");
			nextStep(e);
		},
		[nextStep],
	);

	return (
		<Form {...form}>
			<div className="flex flex-col space-y-6 transition-all duration-300 ease-in-out">
				<div>
					<Image
						src="/images/michael_200px.webp"
						width={80}
						height={80}
						alt="Michael, the creator of SlideHeroes"
						style={imageStyle}
						loading="lazy"
						placeholder="blur"
						blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2YzZjRmNiIvPjwvc3ZnPg=="
					/>
				</div>
				<div className="flex flex-col space-y-2">
					<h2 className="text-xl font-semibold sm:text-2xl">Welcome 👋</h2>
					<h3 className="text-base font-medium sm:text-lg">
						Thank you for giving SlideHeroes a try!
					</h3>
					<p className="text-muted-foreground text-sm sm:text-base">
						I'm excited to have you here!
					</p>
					<p className="text-muted-foreground text-sm sm:text-base">
						Creating quality presentations is a challenge and we're so glad to
						be able to help!
					</p>
					<p className="text-muted-foreground text-sm sm:text-base">
						If you have ideas on how to improve SlideHeroes, please let us know.
					</p>
					<p className="text-muted-foreground pt-5 text-sm sm:text-base">
						Happy creating,
					</p>
					<p className="text-muted-foreground text-sm sm:text-base">Michael</p>
				</div>
				<div className="flex justify-center sm:justify-end">
					<Button onClick={handleContinue} className="w-full sm:w-auto">
						Continue
					</Button>
				</div>
			</div>
		</Form>
	);
}

// Profile step component
function ProfileStep() {
	const { nextStep, form } = useMultiStepFormContext();
	const watchedName = useWatch({
		control: form.control,
		name: "profile.name",
		defaultValue: "",
	});

	const handleContinue = (e: React.SyntheticEvent) => {
		e.preventDefault();
		analytics.trackEvent("onboarding_profile_completed", {
			name: form.getValues().profile.name,
		});
		nextStep(e);
	};

	return (
		<Form {...form}>
			<div className="flex flex-col space-y-6 transition-all duration-300 ease-in-out">
				<div className="flex flex-col space-y-2 text-center sm:text-left">
					<h2 className="text-xl font-semibold sm:text-2xl">
						Welcome to SlideHeroes
					</h2>
					<p className="text-muted-foreground text-sm sm:text-base">
						Let's get started by adding your name to your profile.
					</p>
				</div>
				<FormField
					control={form.control}
					name="profile.name"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Your Name</FormLabel>
							<FormControl>
								<Input
									{...field}
									placeholder="Name"
									className="w-full"
									aria-required="true"
								/>
							</FormControl>
							<FormDescription>Enter your full name here</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>
				<div className="flex justify-center sm:justify-end">
					<Button
						onClick={handleContinue}
						disabled={watchedName.length < 2}
						className="w-full sm:w-auto"
					>
						Continue
					</Button>
				</div>
			</div>
		</Form>
	);
}

// Goals step component
function GoalsStep() {
	const { nextStep, prevStep, form } = useMultiStepFormContext();
	const primaryGoal = form.watch("goals.primary");

	// No need to initialize fields when primary goal changes
	// since we've already initialized all fields in the form's default values
	// and made them required in the schema

	// Validate form based on primary goal
	const isFormValid = () => {
		const values = form.getValues();
		// Check if at least one secondary goal is selected
		const hasSecondaryGoal = Object.values(values.goals.secondary).some(
			Boolean,
		);

		// Check primary goal specific fields
		if (primaryGoal === "work") {
			return (
				hasSecondaryGoal &&
				values.goals.workDetails &&
				values.goals.workDetails.role &&
				values.goals.workDetails.role.length > 0 &&
				values.goals.workDetails.industry &&
				values.goals.workDetails.industry.length > 0
			);
		}
		if (primaryGoal === "personal") {
			return (
				hasSecondaryGoal &&
				values.goals.personalDetails &&
				values.goals.personalDetails.project &&
				values.goals.personalDetails.project.length > 0
			);
		}
		if (primaryGoal === "school") {
			return (
				hasSecondaryGoal &&
				values.goals.schoolDetails &&
				values.goals.schoolDetails.level &&
				values.goals.schoolDetails.major &&
				values.goals.schoolDetails.major.length > 0
			);
		}

		return false;
	};

	// Handle continue button click
	const handleContinue = (e: React.SyntheticEvent) => {
		e.preventDefault();

		// Validate form fields
		if (!isFormValid()) {
			// Set validation errors
			if (primaryGoal === "work") {
				form.trigger("goals.workDetails.role");
				form.trigger("goals.workDetails.industry");
			} else if (primaryGoal === "personal") {
				form.trigger("goals.personalDetails.project");
			} else if (primaryGoal === "school") {
				form.trigger("goals.schoolDetails.level");
				form.trigger("goals.schoolDetails.major");
			}

			// Check if at least one secondary goal is selected
			const hasSecondaryGoal = Object.values(
				form.getValues().goals.secondary,
			).some(Boolean);
			if (!hasSecondaryGoal) {
				// Set at least one secondary goal to true to pass validation
				form.setValue("goals.secondary.learn", true);
			}
		}

		// Track event
		analytics.trackEvent("onboarding_goals_completed", form.getValues().goals);

		// Use the built-in nextStep function
		nextStep(e);
	};

	return (
		<Form {...form}>
			<div className="flex flex-col space-y-6 transition-all duration-300 ease-in-out">
				<div className="flex flex-col space-y-2 text-center sm:text-left">
					<h2 className="text-xl font-semibold sm:text-2xl">
						What would you like to use SlideHeroes for?
					</h2>
					<p className="text-muted-foreground text-sm sm:text-base">
						We'll use this to help us recommend the right training.
					</p>
				</div>
				<FormField
					control={form.control}
					name="goals.primary"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Primary Goal</FormLabel>
							<FormControl>
								<select
									{...field}
									className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none sm:text-base"
									aria-required="true"
								>
									<option value="work">Work</option>
									<option value="personal">Personal</option>
									<option value="school">School</option>
								</select>
							</FormControl>
						</FormItem>
					)}
				/>

				{primaryGoal === "work" && (
					<>
						<FormField
							control={form.control}
							name="goals.workDetails.role"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Your Role</FormLabel>
									<FormControl>
										<Input {...field} placeholder="" className="w-full" />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="goals.workDetails.industry"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Your Industry</FormLabel>
									<FormControl>
										<Input {...field} placeholder="" className="w-full" />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</>
				)}

				{primaryGoal === "personal" && (
					<FormField
						control={form.control}
						name="goals.personalDetails.project"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Personal Project</FormLabel>
								<FormControl>
									<Input {...field} placeholder="" className="w-full" />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				)}

				{primaryGoal === "school" && (
					<>
						<FormField
							control={form.control}
							name="goals.schoolDetails.level"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Education Level</FormLabel>
									<FormControl>
										<select
											{...field}
											className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none sm:text-base"
										>
											<option value="highschool">High School</option>
											<option value="undergraduate">Undergraduate</option>
											<option value="graduate">Graduate</option>
										</select>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="goals.schoolDetails.major"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Major/Subject</FormLabel>
									<FormControl>
										<Input {...field} placeholder="" className="w-full" />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</>
				)}

				<div className="flex flex-col space-y-2 text-center sm:text-left">
					<h2 className="text-xl font-semibold sm:text-2xl">
						What are you looking to do?
					</h2>
					<p className="text-muted-foreground text-sm sm:text-base">
						We'll use this to help improve our product.
					</p>
				</div>
				{["learn", "automate", "feedback"].map((goal) => (
					<FormField
						key={goal}
						control={form.control}
						name={`goals.secondary.${goal}`}
						render={({ field }) => (
							<FormItem className="flex flex-row items-start space-y-0 space-x-3">
								<FormControl>
									<Checkbox
										checked={field.value}
										onCheckedChange={field.onChange}
										aria-label={`${goal.charAt(0).toUpperCase() + goal.slice(1)} goal`}
									/>
								</FormControl>
								<div className="space-y-1 leading-none">
									<FormLabel>
										{goal.charAt(0).toUpperCase() + goal.slice(1)}
									</FormLabel>
								</div>
							</FormItem>
						)}
					/>
				))}
				<FormMessage />
				<div className="flex flex-col justify-between space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
					<Button
						variant="outline"
						onClick={(e) => {
							e.preventDefault();
							prevStep(e);
						}}
						className="w-full sm:w-auto"
					>
						Go Back
					</Button>
					<Button onClick={handleContinue} className="w-full sm:w-auto">
						Continue
					</Button>
				</div>
			</div>
		</Form>
	);
}

// Theme step component
function ThemeStep() {
	const { nextStep, prevStep, form } = useMultiStepFormContext();

	const handleContinue = (e: React.SyntheticEvent) => {
		e.preventDefault();
		analytics.trackEvent("onboarding_theme_completed", {
			theme: form.getValues().theme.style,
		});
		nextStep(e);
	};

	return (
		<Form {...form}>
			<div className="flex flex-col space-y-6 transition-all duration-300 ease-in-out">
				<div className="flex flex-col space-y-2 text-center sm:text-left">
					<h2 className="text-xl font-semibold sm:text-2xl">
						How do you want to work?
					</h2>
					<p className="text-muted-foreground text-sm sm:text-base">
						Don't worry, you can change these settings later.
					</p>
				</div>
				<div className="flex flex-col space-y-4 pb-10 sm:flex-row sm:space-y-0 sm:space-x-8">
					{["dark", "light"].map((style) => (
						<FormField
							key={style}
							control={form.control}
							name="theme.style"
							render={({ field }) => (
								<FormItem className="flex-1">
									<FormLabel className="[&:has([data-state=checked])>div]:border-primary">
										<FormControl>
											<input
												type="radio"
												className="sr-only"
												{...field}
												id={`theme-${style}`}
												checked={field.value === style}
												onChange={() => field.onChange(style)}
												aria-label={`${style.charAt(0).toUpperCase() + style.slice(1)} mode`}
											/>
										</FormControl>
										<div
											className={`items-center rounded-md border-2 p-1 transition-colors duration-200 cursor-pointer ${
												field.value === style
													? "border-primary hover:border-primary"
													: "border-muted hover:border-accent"
											}`}
											data-theme-option={style}
										>
											<Image
												src={`/images/${style}.webp`}
												width={300}
												height={300}
												alt={`SlideHeroes ${style} mode preview`}
												className="h-auto w-full"
												loading="lazy"
												placeholder="blur"
												blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PC9zdmc+"
											/>
										</div>
										<div className="mt-2 text-center font-normal">
											{style.charAt(0).toUpperCase() + style.slice(1)} mode
										</div>
									</FormLabel>
								</FormItem>
							)}
						/>
					))}
				</div>
				<FormMessage />
				<div className="flex flex-col justify-between space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
					<Button
						variant="outline"
						onClick={(e) => {
							e.preventDefault();
							prevStep(e);
						}}
						className="w-full sm:w-auto"
					>
						Go Back
					</Button>
					<Button onClick={handleContinue} className="w-full sm:w-auto">
						Continue
					</Button>
				</div>
			</div>
		</Form>
	);
}

// Complete step component
function CompleteStep() {
	const _router = useRouter();
	const { form } = useMultiStepFormContext();
	const { setTheme } = useTheme();
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		analytics.trackEvent("onboarding_completed");
	}, []);

	const handleGetStarted = async () => {
		if (isSubmitting) return;
		setIsSubmitting(true);

		try {
			const formData = form.getValues();
			const finalFormData = {
				...formData,
				isFinalSubmission: true,
			};

			// Apply the selected theme
			const selectedTheme = formData.theme.style;
			setTheme(selectedTheme);

			// Set the theme cookie for SSR hydration
			setCookie("theme", selectedTheme, { path: "/", maxAge: 31536000 });

			const isValid = await form.trigger();
			if (!isValid) {
				const errors = form.formState.errors;
				getLogger().error("Form validation failed on final submission", {
					formData: finalFormData,
					errors: errors,
					formState: form.formState,
				});
				// Try to submit anyway since this is the final step
				// The server will validate the data
			}

			const result = await submitOnboardingFormAction(finalFormData);
			getLogger().info("Onboarding submission result", { result });

			if (result.success && result.isComplete === true) {
				getLogger().info("Onboarding successful, redirecting to home");

				// Clear local storage to ensure clean state
				localStorage.removeItem(STORAGE_KEY);

				// Use the redirect URL from the server action
				if (result.redirectUrl) {
					window.location.href = result.redirectUrl;
				} else {
					// Fallback to hardcoded URL
					const timestamp = Date.now();
					window.location.href = `/home?onboarded=${timestamp}`;
				}
			} else {
				getLogger().error("Onboarding completion failed", {
					result,
					formData: finalFormData,
				});
				alert(`Failed to complete onboarding: ${result.message}`);
			}
		} catch (error) {
			getLogger().error("Error during onboarding completion", { error });
			alert("An error occurred while submitting the form. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="flex flex-col space-y-6 transition-all duration-300 ease-in-out">
			{createPortal(
				<Confetti numberOfPieces={500} recycle={false} />,
				document.body,
			)}
			<div className="flex flex-col space-y-2 text-center sm:text-left">
				<h2 className="text-xl font-semibold sm:text-2xl">
					Hello, {form.getValues("profile").name}!
				</h2>
				<p className="text-muted-foreground text-sm sm:text-base">
					You're all set! Click the button below to start using SlideHeroes.
				</p>
			</div>
			<Button
				onClick={handleGetStarted}
				className="w-full sm:w-auto"
				disabled={isSubmitting}
			>
				{isSubmitting ? "Submitting..." : "Get Started"}
			</Button>
		</div>
	);
}
