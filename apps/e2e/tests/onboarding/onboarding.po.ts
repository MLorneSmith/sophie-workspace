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
		await this.page.waitForURL("**/onboarding");

		// Step 1: Welcome - just click continue
		await this.page.getByRole("button", { name: "Continue" }).click();

		// Step 2: Profile - enter name
		await this.page.getByLabel("Your Name").fill(name);
		await this.page.getByRole("button", { name: "Continue" }).click();

		// Step 3: Goals
		// Select primary goal from dropdown
		await this.page.getByLabel("Primary Goal").selectOption(primaryGoal);

		// Fill in goal-specific fields
		if (primaryGoal === "work") {
			await this.page.getByLabel("Your Role").fill(role || "Developer");
			await this.page
				.getByLabel("Your Industry")
				.fill(industry || "Technology");
		} else if (primaryGoal === "personal") {
			await this.page
				.getByLabel("Personal Project")
				.fill(options?.project || "Personal Website");
		} else if (primaryGoal === "school") {
			// Select education level from dropdown
			await this.page
				.getByLabel("Education Level")
				.selectOption(
					options?.educationLevel?.toLowerCase() || "undergraduate",
				);
			await this.page
				.getByLabel("Major/Subject")
				.fill(options?.major || "Computer Science");
		}

		// Select secondary goals (checkboxes)
		for (const goal of secondaryGoals) {
			await this.page
				.getByRole("checkbox", {
					name: `${this.capitalizeFirst(goal)} goal`,
				})
				.check();
		}

		await this.page.getByRole("button", { name: "Continue" }).click();

		// Step 4: Theme - select theme preference
		// Click on the theme container using data attribute
		await this.page.locator(`[data-theme-option="${theme}"]`).click();
		await this.page.getByRole("button", { name: "Continue" }).click();

		// Step 5: Complete - click "Get Started"
		const getStartedButton = this.page.getByRole("button", {
			name: "Get Started",
		});

		// Set up dialog handler in case there's an alert
		this.page.on("dialog", async (dialog) => {
			console.error(`Alert dialog detected: ${dialog.message()}`);
			await dialog.accept();
		});

		await getStartedButton.click();

		// Wait a bit for the form submission to process
		await this.page.waitForTimeout(2000);

		// Check for any visible alerts on the page
		const alertElement = await this.page.getByRole("alert").first();
		if (await alertElement.isVisible({ timeout: 1000 })) {
			const alertText = await alertElement.textContent();
			console.error(`Alert found on page: ${alertText}`);
		}

		// Wait for redirect to home page with better error handling
		try {
			await this.page.waitForURL("**/home", { timeout: 15000 });
		} catch (error) {
			// If we're not redirected to /home, check if we're on an error page or still on onboarding
			const currentUrl = this.page.url();
			console.error(`Failed to redirect to /home. Current URL: ${currentUrl}`);

			// Check for any error messages on the page
			const errorMessage = await this.page
				.locator("text=/error|failed/i")
				.first()
				.textContent()
				.catch(() => null);
			if (errorMessage) {
				console.error(`Error message found: ${errorMessage}`);
			}

			throw error;
		}
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
