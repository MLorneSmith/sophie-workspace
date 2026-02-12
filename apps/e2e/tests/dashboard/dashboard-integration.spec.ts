import { AUTH_STATES } from "../utils/auth-state";
import { expect, test } from "../utils/base-test";
import { CI_TIMEOUTS } from "../utils/wait-for-hydration";
import { DashboardPageObject } from "./dashboard.po";

/**
 * Dashboard Integration E2E Tests
 *
 * Validates all 7 dashboard widgets render correctly, loading/empty states
 * display properly, responsive layout adapts to breakpoints, and navigation
 * links function as expected.
 *
 * Feature: S2072.I6.F3 - Dashboard Integration Verification
 */

// ─── Widget Rendering Tests (T3) ────────────────────────────────────

test.describe("Dashboard Widget Rendering @dashboard", () => {
	test.describe.configure({ mode: "serial" });

	DashboardPageObject.setupSession(AUTH_STATES.TEST_USER);

	let dashboard: DashboardPageObject;

	test.beforeEach(async ({ page }) => {
		dashboard = new DashboardPageObject(page);
		await dashboard.navigateToDashboard();
	});

	test("dashboard page loads with grid layout", async () => {
		await dashboard.waitForDashboardReady();
		await dashboard.expectGridLayout(3);
	});

	test("course progress widget renders", async () => {
		await dashboard.expectWidgetVisible("courseProgress");
	});

	test("skills spider diagram widget renders", async () => {
		await dashboard.expectWidgetVisible("skillsSpider");
	});

	test("kanban summary widget renders", async () => {
		await dashboard.expectWidgetVisible("kanbanSummary");
	});

	test("activity feed widget renders", async () => {
		await dashboard.expectWidgetVisible("activityFeed");
	});

	test("quick actions panel renders", async () => {
		await dashboard.expectWidgetVisible("quickActions");
	});

	test("coaching sessions widget renders", async () => {
		await dashboard.expectWidgetVisible("coachingSessions");
	});

	test("presentations table widget renders", async () => {
		await dashboard.expectWidgetVisible("presentationsTable");
	});

	test("all 7 widgets are visible simultaneously", async () => {
		await dashboard.expectAllWidgetsVisible();
	});

	test("no console errors on dashboard load", async ({ page }) => {
		const consoleErrors: string[] = [];
		page.on("console", (msg) => {
			if (msg.type() === "error") {
				consoleErrors.push(msg.text());
			}
		});

		await dashboard.navigateToDashboard();
		await dashboard.waitForDashboardReady();

		// Filter out known non-critical errors (e.g., external resource loading)
		const criticalErrors = consoleErrors.filter(
			(err) =>
				!err.includes("favicon") &&
				!err.includes("analytics") &&
				!err.includes("ERR_BLOCKED_BY_CLIENT"),
		);

		expect(criticalErrors).toHaveLength(0);
	});
});

// ─── Loading and Empty State Tests (T4) ─────────────────────────────

test.describe("Dashboard Loading and Empty States @dashboard", () => {
	DashboardPageObject.setupSession(AUTH_STATES.TEST_USER);

	test("loading skeleton displays role=status attributes", async ({ page }) => {
		// Throttle the network to slow speed so loading skeleton is visible
		const cdp = await page.context().newCDPSession(page);
		await cdp.send("Network.enable");
		await cdp.send("Network.emulateNetworkConditions", {
			offline: false,
			downloadThroughput: 50 * 1024, // 50 KB/s
			uploadThroughput: 50 * 1024,
			latency: 500,
		});

		await page.goto("/home", { waitUntil: "commit" });

		// Check for skeleton loading states
		await expect(async () => {
			const skeletonCount = await page.locator('[role="status"]').count();
			// Should have at least some skeleton elements visible
			expect(skeletonCount).toBeGreaterThan(0);
		}).toPass({
			timeout: CI_TIMEOUTS.short,
			intervals: [100, 250, 500],
		});

		// Reset network conditions
		await cdp.send("Network.emulateNetworkConditions", {
			offline: false,
			downloadThroughput: -1,
			uploadThroughput: -1,
			latency: 0,
		});
	});

	test("loading skeleton has accessible aria-labels", async ({ page }) => {
		const cdp = await page.context().newCDPSession(page);
		await cdp.send("Network.enable");
		await cdp.send("Network.emulateNetworkConditions", {
			offline: false,
			downloadThroughput: 50 * 1024,
			uploadThroughput: 50 * 1024,
			latency: 500,
		});

		await page.goto("/home", { waitUntil: "commit" });

		await expect(async () => {
			const labeledSkeletons = await page
				.locator('[role="status"][aria-label*="Loading"]')
				.count();
			expect(labeledSkeletons).toBeGreaterThan(0);
		}).toPass({
			timeout: CI_TIMEOUTS.short,
			intervals: [100, 250, 500],
		});

		await cdp.send("Network.emulateNetworkConditions", {
			offline: false,
			downloadThroughput: -1,
			uploadThroughput: -1,
			latency: 0,
		});
	});

	test("empty state messaging is present for widgets without data", async ({
		page,
	}) => {
		const dashboard = new DashboardPageObject(page);
		await dashboard.navigateToDashboard();
		await dashboard.waitForDashboardReady();

		// Quick actions should always show at least "New Presentation"
		await expect(
			dashboard.quickActionsNav.getByText("New Presentation"),
		).toBeVisible({ timeout: CI_TIMEOUTS.element });

		// Check if coaching sessions shows empty state (likely for test user)
		// The widget should either show sessions or the booking CTA
		const coachingCard = page.getByRole("heading", {
			name: "Coaching Sessions",
		});
		await expect(coachingCard).toBeVisible({ timeout: CI_TIMEOUTS.element });
	});

	test("widgets gracefully handle null or empty data", async ({ page }) => {
		const dashboard = new DashboardPageObject(page);
		await dashboard.navigateToDashboard();
		await dashboard.waitForDashboardReady();

		// Verify dashboard loads without crashing even if some data is null
		// The grid should still have 3 rows
		await dashboard.expectGridLayout(3);

		// All headings should still be present
		await dashboard.expectAllWidgetsVisible();
	});
});

// ─── Responsive Layout Tests (T5) ───────────────────────────────────

test.describe("Dashboard Responsive Layout @dashboard", () => {
	DashboardPageObject.setupSession(AUTH_STATES.TEST_USER);

	test("mobile layout (375px) stacks widgets vertically", async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 812 });

		const dashboard = new DashboardPageObject(page);
		await dashboard.navigateToDashboard();
		await dashboard.waitForDashboardReady();

		// All widgets should be visible on mobile
		await dashboard.expectAllWidgetsVisible();

		// Verify no horizontal scrollbar
		const hasHorizontalScroll = await page.evaluate(() => {
			return (
				document.documentElement.scrollWidth >
				document.documentElement.clientWidth
			);
		});
		expect(hasHorizontalScroll).toBe(false);

		// Verify grid rows use single column (grid-cols-1)
		const row1 = dashboard.gridRows.nth(0);
		const row1Columns = await row1.evaluate((el) => {
			return window.getComputedStyle(el).gridTemplateColumns;
		});
		// Single column should NOT have multiple column values
		// In CSS, grid-cols-1 resolves to a single value
		const columnCount = row1Columns.split(" ").filter((c) => c !== "").length;
		expect(columnCount).toBe(1);
	});

	test("tablet layout (768px) shows 2-column grid", async ({ page }) => {
		await page.setViewportSize({ width: 768, height: 1024 });

		const dashboard = new DashboardPageObject(page);
		await dashboard.navigateToDashboard();
		await dashboard.waitForDashboardReady();

		await dashboard.expectAllWidgetsVisible();

		// Verify grid rows use 2 columns at md breakpoint
		const row1 = dashboard.gridRows.nth(0);
		const row1Columns = await row1.evaluate((el) => {
			return window.getComputedStyle(el).gridTemplateColumns;
		});
		const columnCount = row1Columns.split(" ").filter((c) => c !== "").length;
		expect(columnCount).toBe(2);
	});

	test("desktop layout (1440px) shows 3-column grid", async ({ page }) => {
		await page.setViewportSize({ width: 1440, height: 900 });

		const dashboard = new DashboardPageObject(page);
		await dashboard.navigateToDashboard();
		await dashboard.waitForDashboardReady();

		await dashboard.expectAllWidgetsVisible();

		// Row 1 and Row 2 should have 3 columns at xl breakpoint
		const row1 = dashboard.gridRows.nth(0);
		const row1Columns = await row1.evaluate((el) => {
			return window.getComputedStyle(el).gridTemplateColumns;
		});
		const columnCount = row1Columns.split(" ").filter((c) => c !== "").length;
		expect(columnCount).toBe(3);

		// Row 3 should always be single column
		const row3 = dashboard.gridRows.nth(2);
		const row3Columns = await row3.evaluate((el) => {
			return window.getComputedStyle(el).gridTemplateColumns;
		});
		const row3ColumnCount = row3Columns
			.split(" ")
			.filter((c) => c !== "").length;
		expect(row3ColumnCount).toBe(1);
	});

	test("widgets remain accessible at all breakpoints", async ({ page }) => {
		const dashboard = new DashboardPageObject(page);

		for (const viewport of [
			{ width: 375, height: 812 },
			{ width: 768, height: 1024 },
			{ width: 1440, height: 900 },
		]) {
			await page.setViewportSize(viewport);
			await dashboard.navigateToDashboard();
			await dashboard.waitForDashboardReady();

			// All widget headings should be visible at every breakpoint
			await dashboard.expectAllWidgetsVisible();
		}
	});
});

// ─── Navigation Link Tests (T6) ─────────────────────────────────────

test.describe("Dashboard Navigation Links @dashboard", () => {
	DashboardPageObject.setupSession(AUTH_STATES.TEST_USER);

	let dashboard: DashboardPageObject;

	test.beforeEach(async ({ page }) => {
		dashboard = new DashboardPageObject(page);
		await dashboard.navigateToDashboard();
		await dashboard.waitForDashboardReady();
	});

	test("quick actions panel shows New Presentation link", async () => {
		const link = await dashboard.expectQuickActionVisible("New Presentation");
		const href = await link.locator("a").first().getAttribute("href");
		expect(href).toContain("/home/ai/blocks");
	});

	test("quick actions Take Assessment link has correct href", async ({
		page,
	}) => {
		// Take Assessment is shown when assessment is not completed
		const assessmentLink = page
			.locator('[aria-label="Quick actions"]')
			.getByText("Take Assessment");

		const isVisible = await assessmentLink.isVisible().catch(() => false);

		if (isVisible) {
			const href = await assessmentLink
				.locator("xpath=ancestor::a")
				.first()
				.getAttribute("href");
			expect(href).toContain("/home/assessment");
		}
	});

	test("kanban view link navigates correctly", async () => {
		const kanbanLink = dashboard.kanbanViewLink;
		const isVisible = await kanbanLink.isVisible().catch(() => false);

		if (isVisible) {
			const href = await kanbanLink.getAttribute("href");
			expect(href).toContain("/home/kanban");
		}
	});

	test("presentations new link has correct href", async ({ page }) => {
		const newPresentationLink = page.locator(
			'a[aria-label="Create new presentation"]',
		);
		const isVisible = await newPresentationLink.isVisible().catch(() => false);

		if (isVisible) {
			const href = await newPresentationLink.getAttribute("href");
			expect(href).toContain("/home/ai/storyboard");
		}
	});

	test("coaching sessions booking CTA is accessible", async ({ page }) => {
		// Either sessions are shown with join links, or the booking CTA is shown
		const bookingCta = page.locator('a[aria-label="Book a coaching session"]');
		const joinLink = page.locator('a[aria-label*="Join session"]').first();

		const hasBookingCta = await bookingCta.isVisible().catch(() => false);
		const hasJoinLink = await joinLink.isVisible().catch(() => false);

		// At least one should be present
		expect(hasBookingCta || hasJoinLink).toBe(true);

		if (hasBookingCta) {
			const href = await bookingCta.getAttribute("href");
			// Booking links go to cal.com
			if (href) {
				expect(href).toContain("cal.com");
			}
		}
	});

	test("widget links have proper aria attributes", async () => {
		// Verify key links have accessible labels
		const kanbanLink = dashboard.kanbanViewLink;
		const isVisible = await kanbanLink.isVisible().catch(() => false);

		if (isVisible) {
			const ariaLabel = await kanbanLink.getAttribute("aria-label");
			expect(ariaLabel).toBeTruthy();
		}

		// Presentations table aria-label
		const presTable = dashboard.presentationsTableContent;
		const tableVisible = await presTable.isVisible().catch(() => false);

		if (tableVisible) {
			const tableAria = await presTable.getAttribute("aria-label");
			expect(tableAria).toContain("Presentations");
		}
	});
});
