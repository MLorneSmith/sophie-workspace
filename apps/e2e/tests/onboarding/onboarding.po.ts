import type { Page } from "@playwright/test";

export class OnboardingPageObject {
	constructor(private readonly page: Page) {}

	/**
	 * Complete the onboarding flow for a new user
	 * This handles all 5 steps of the onboarding process
	 */
	async completeOnboarding(options?: {
		name?: string;
		primaryGoal?: "work" | "personal" | "school";
		role?: string;
		industry?: string;
		project?: string;
		educationLevel?: string;
		major?: string;
		secondaryGoals?: string[];
		theme?: "dark" | "light";
	}) {
		const {
			name = "Test User",
			primaryGoal = "work",
			role = "Developer",
			industry = "Technology",
			secondaryGoals = ["learn"],
			theme = "light",
		} = options || {};

		// Wait for onboarding page to load
		await this.page.waitForURL("/onboarding");

		// Step 1: Welcome - just click continue
		await this.page.getByRole("button", { name: "Continue" }).click();

		// Step 2: Profile - enter name
		await this.page.getByLabel("Your name").fill(name);
		await this.page.getByRole("button", { name: "Continue" }).click();

		// Step 3: Goals
		// Select primary goal
		await this.page.getByLabel(this.capitalizeFirst(primaryGoal)).click();

		// Fill in goal-specific fields
		if (primaryGoal === "work") {
			await this.page.getByLabel("Your role").fill(role || "Developer");
			await this.page
				.getByLabel("Your industry")
				.fill(industry || "Technology");
		} else if (primaryGoal === "personal") {
			await this.page
				.getByLabel("Your project")
				.fill(options?.project || "Personal Website");
		} else if (primaryGoal === "school") {
			// Select education level from dropdown
			await this.page.getByRole("combobox").click();
			await this.page
				.getByRole("option", {
					name: options?.educationLevel || "Undergraduate",
				})
				.click();
			await this.page
				.getByLabel("Your major")
				.fill(options?.major || "Computer Science");
		}

		// Select secondary goals
		for (const goal of secondaryGoals) {
			await this.page.getByLabel(this.capitalizeFirst(goal)).click();
		}

		await this.page.getByRole("button", { name: "Continue" }).click();

		// Step 4: Theme - select theme preference
		await this.page.getByLabel(this.capitalizeFirst(theme)).click();
		await this.page.getByRole("button", { name: "Continue" }).click();

		// Step 5: Complete - click "Get Started"
		await this.page.getByRole("button", { name: "Get Started" }).click();

		// Wait for redirect to home page
		await this.page.waitForURL("/home");
	}

	/**
	 * Skip onboarding if on the onboarding page
	 * This is useful when you need to quickly get past onboarding in tests
	 */
	async skipOnboardingIfPresent() {
		// Check if we're on the onboarding page
		const isOnOnboardingPage = this.page.url().includes("/onboarding");

		if (isOnOnboardingPage) {
			await this.completeOnboarding();
		}
	}

	private capitalizeFirst(str: string): string {
		return str.charAt(0).toUpperCase() + str.slice(1);
	}
}
