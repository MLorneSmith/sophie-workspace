import type { AUTH_STATES } from "../utils/auth-state";
import { expect, type Page, test } from "../utils/base-test";
import {
	CI_TIMEOUTS,
	navigateAndWaitForHydration,
	RETRY_INTERVALS,
	waitForContentReady,
} from "../utils/wait-for-hydration";

/**
 * Page Object for the user dashboard.
 * Provides methods for navigating to the dashboard and verifying
 * all 7 widgets across their various states (loaded, empty, loading).
 */
export class DashboardPageObject {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	static setupSession(user: (typeof AUTH_STATES)[keyof typeof AUTH_STATES]) {
		test.use({ storageState: user });
	}

	// ─── Navigation ─────────────────────────────────────────────

	async navigateToDashboard() {
		await navigateAndWaitForHydration(this.page, "/home", {
			waitForSelector: ".dashboard-grid",
		});
	}

	async waitForDashboardReady() {
		await waitForContentReady(this.page, ".dashboard-grid", {
			timeout: CI_TIMEOUTS.element,
			intervals: RETRY_INTERVALS,
		});
	}

	// ─── Widget Locators ────────────────────────────────────────

	get courseProgressCard() {
		return this.page.locator('[aria-label*="Course progress"]').first();
	}

	get courseProgressTitle() {
		return this.page.getByRole("heading", { name: "Course Progress" });
	}

	get skillsSpiderCard() {
		return this.page
			.locator('[aria-label*="Skills assessment"]')
			.or(this.page.getByRole("heading", { name: "Skills Assessment" }))
			.first();
	}

	get skillsSpiderTitle() {
		return this.page.getByRole("heading", { name: "Skills Assessment" });
	}

	get kanbanSummaryCard() {
		return this.page.getByRole("heading", { name: "Current Tasks" }).first();
	}

	get kanbanDoingBadge() {
		return this.page.locator('[data-testid="doing-count-badge"]');
	}

	get kanbanViewLink() {
		return this.page.locator('[data-testid="view-kanban-link"]');
	}

	get activityFeedCard() {
		return this.page
			.locator('[aria-label*="Recent activity"]')
			.or(this.page.getByRole("heading", { name: "Recent Activity" }))
			.first();
	}

	get activityFeedTitle() {
		return this.page.getByRole("heading", { name: "Recent Activity" });
	}

	get quickActionsCard() {
		return this.page.getByRole("heading", { name: "Quick Actions" }).first();
	}

	get quickActionsNav() {
		return this.page.locator('[aria-label="Quick actions"]');
	}

	get coachingSessionsCard() {
		return this.page
			.getByRole("heading", { name: "Coaching Sessions" })
			.first();
	}

	get presentationsTable() {
		return this.page
			.getByRole("heading", { name: "Your Presentations" })
			.first();
	}

	get presentationsTableContent() {
		return this.page.locator('[aria-label*="Presentations list"]');
	}

	// ─── Loading Skeleton Locators ──────────────────────────────

	get loadingSkeleton() {
		return this.page.locator('[role="status"]');
	}

	get skeletonCards() {
		return this.page.locator('[role="status"][aria-label*="Loading"]');
	}

	// ─── Grid Layout Locators ───────────────────────────────────

	get dashboardGrid() {
		return this.page.locator(".dashboard-grid");
	}

	get gridRows() {
		return this.dashboardGrid.locator("> div");
	}

	// ─── Widget Visibility Assertions ───────────────────────────

	async expectAllWidgetsVisible() {
		await expect(async () => {
			await expect(this.courseProgressTitle).toBeVisible({
				timeout: CI_TIMEOUTS.short,
			});
			await expect(this.skillsSpiderTitle).toBeVisible({
				timeout: CI_TIMEOUTS.short,
			});
			await expect(this.kanbanSummaryCard).toBeVisible({
				timeout: CI_TIMEOUTS.short,
			});
			await expect(this.activityFeedTitle).toBeVisible({
				timeout: CI_TIMEOUTS.short,
			});
			await expect(this.quickActionsCard).toBeVisible({
				timeout: CI_TIMEOUTS.short,
			});
			await expect(this.coachingSessionsCard).toBeVisible({
				timeout: CI_TIMEOUTS.short,
			});
			await expect(this.presentationsTable).toBeVisible({
				timeout: CI_TIMEOUTS.short,
			});
		}).toPass({
			timeout: CI_TIMEOUTS.element,
			intervals: RETRY_INTERVALS as unknown as number[],
		});
	}

	async expectWidgetVisible(
		widgetName:
			| "courseProgress"
			| "skillsSpider"
			| "kanbanSummary"
			| "activityFeed"
			| "quickActions"
			| "coachingSessions"
			| "presentationsTable",
	) {
		const widgetMap = {
			courseProgress: this.courseProgressTitle,
			skillsSpider: this.skillsSpiderTitle,
			kanbanSummary: this.kanbanSummaryCard,
			activityFeed: this.activityFeedTitle,
			quickActions: this.quickActionsCard,
			coachingSessions: this.coachingSessionsCard,
			presentationsTable: this.presentationsTable,
		};

		await expect(async () => {
			await expect(widgetMap[widgetName]).toBeVisible({
				timeout: CI_TIMEOUTS.short,
			});
		}).toPass({
			timeout: CI_TIMEOUTS.element,
			intervals: RETRY_INTERVALS as unknown as number[],
		});
	}

	// ─── Empty State Checks ─────────────────────────────────────

	async expectEmptyState(
		widgetName:
			| "skillsSpider"
			| "kanbanSummary"
			| "activityFeed"
			| "coachingSessions",
	) {
		const emptyStateMap = {
			skillsSpider: this.page.getByText("No Assessment Yet"),
			kanbanSummary: this.page.getByText("No tasks in progress"),
			activityFeed: this.page.getByText("No activity yet"),
			coachingSessions: this.page.getByText("No upcoming sessions"),
		};

		await expect(emptyStateMap[widgetName]).toBeVisible({
			timeout: CI_TIMEOUTS.element,
		});
	}

	// ─── Quick Action Checks ────────────────────────────────────

	async getQuickActionLinks() {
		return this.quickActionsNav.locator("a");
	}

	async expectQuickActionVisible(name: string) {
		const link = this.quickActionsNav.getByText(name);
		await expect(link).toBeVisible({ timeout: CI_TIMEOUTS.short });
		return link;
	}

	// ─── Navigation Checks ──────────────────────────────────────

	async clickAndVerifyNavigation(
		locator: ReturnType<Page["locator"]>,
		expectedUrlPart: string,
	) {
		await locator.click();
		await expect(async () => {
			const url = this.page.url();
			expect(url).toContain(expectedUrlPart);
		}).toPass({
			timeout: CI_TIMEOUTS.navigation,
			intervals: RETRY_INTERVALS as unknown as number[],
		});
	}

	// ─── Layout Checks ─────────────────────────────────────────

	async getGridRowCount() {
		return this.gridRows.count();
	}

	async expectGridLayout(expectedRows: number) {
		const count = await this.getGridRowCount();
		expect(count).toBe(expectedRows);
	}
}
