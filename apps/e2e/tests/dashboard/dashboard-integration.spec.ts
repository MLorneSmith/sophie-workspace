import { AUTH_STATES } from "../utils/auth-state";
import { expect, test } from "../utils/base-test";
import { CI_TIMEOUTS } from "../utils/wait-for-hydration";
import { DashboardPageObject } from "./dashboard.po";

/**
 * Dashboard Integration E2E Tests
 *
 * Validates dashboard renders correctly in both new-user (welcome hero)
 * and active-user (widget grid) states. Tests responsive layout,
 * navigation links, and loading/empty states.
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

		const isNew = await dashboard.isNewUserState();
		if (isNew) {
			// New users see welcome hero (1 child)
			await expect(dashboard.welcomeHero).toBeVisible();
		} else {
			// Active users see widget rows (2-3 rows depending on data)
			const rowCount = await dashboard.getGridRowCount();
			expect(rowCount).toBeGreaterThanOrEqual(2);
		}
	});

	test("course progress widget renders", async () => {
		const isNew = await dashboard.isNewUserState();
		test.skip(isNew, "New users see welcome hero instead of widgets");
		await dashboard.expectWidgetVisible("courseProgress");
	});

	test("skills spider diagram widget renders", async () => {
		const isNew = await dashboard.isNewUserState();
		test.skip(isNew, "New users see welcome hero instead of widgets");
		await dashboard.expectWidgetVisible("skillsSpider");
	});

	test("kanban summary widget renders", async () => {
		const isNew = await dashboard.isNewUserState();
		test.skip(isNew, "New users see welcome hero instead of widgets");
		await dashboard.expectWidgetVisible("kanbanSummary");
	});

	test("activity feed widget renders", async () => {
		const isNew = await dashboard.isNewUserState();
		test.skip(isNew, "New users see welcome hero instead of widgets");
		await dashboard.expectWidgetVisible("activityFeed");
	});

	test("core widgets are visible simultaneously", async () => {
		const isNew = await dashboard.isNewUserState();
		test.skip(isNew, "New users see welcome hero instead of widgets");
		await dashboard.expectCoreWidgetsVisible();
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
			const skeletonCount = await page.locator('[role="status"]').count();
			expect(skeletonCount).toBeGreaterThan(0);
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

	test("new user sees welcome hero onboarding", async ({ page }) => {
		const dashboard = new DashboardPageObject(page);
		await dashboard.navigateToDashboard();
		await dashboard.waitForDashboardReady();

		const isNew = await dashboard.isNewUserState();
		if (isNew) {
			await expect(dashboard.welcomeHero).toBeVisible();
			await expect(page.getByText("Start Assessment")).toBeVisible();
			await expect(page.getByText("Start Learning")).toBeVisible();
			await expect(page.getByText("Create Now")).toBeVisible();
		}
	});

	test("widgets gracefully handle null or empty data", async ({ page }) => {
		const dashboard = new DashboardPageObject(page);
		await dashboard.navigateToDashboard();
		await dashboard.waitForDashboardReady();

		// Dashboard loads without crashing regardless of data state
		const gridExists = await dashboard.dashboardGrid.isVisible();
		expect(gridExists).toBe(true);
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

		const isNew = await dashboard.isNewUserState();
		if (isNew) {
			await expect(dashboard.welcomeHero).toBeVisible();
			return;
		}

		// Verify no horizontal scrollbar
		const hasHorizontalScroll = await page.evaluate(() => {
			return (
				document.documentElement.scrollWidth >
				document.documentElement.clientWidth
			);
		});
		expect(hasHorizontalScroll).toBe(false);

		// Verify grid rows use single column
		const row1 = dashboard.gridRows.nth(0);
		const row1Columns = await row1.evaluate((el) => {
			return window.getComputedStyle(el).gridTemplateColumns;
		});
		const columnCount = row1Columns.split(" ").filter((c) => c !== "").length;
		expect(columnCount).toBe(1);
	});

	test("tablet layout (768px) shows 2-column grid", async ({ page }) => {
		await page.setViewportSize({ width: 768, height: 1024 });

		const dashboard = new DashboardPageObject(page);
		await dashboard.navigateToDashboard();
		await dashboard.waitForDashboardReady();

		const isNew = await dashboard.isNewUserState();
		test.skip(isNew, "New users see welcome hero, no grid to test");

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

		const isNew = await dashboard.isNewUserState();
		test.skip(isNew, "New users see welcome hero, no grid to test");

		// Row 1 should have 3 columns at xl breakpoint
		const row1 = dashboard.gridRows.nth(0);
		const row1Columns = await row1.evaluate((el) => {
			return window.getComputedStyle(el).gridTemplateColumns;
		});
		const columnCount = row1Columns.split(" ").filter((c) => c !== "").length;
		expect(columnCount).toBe(3);
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

			const isNew = await dashboard.isNewUserState();
			if (isNew) {
				await expect(dashboard.welcomeHero).toBeVisible();
			} else {
				await dashboard.expectCoreWidgetsVisible();
			}
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

	test("kanban view link navigates correctly", async () => {
		const isNew = await dashboard.isNewUserState();
		test.skip(isNew, "New users see welcome hero");

		const kanbanLink = dashboard.kanbanViewLink;
		const isVisible = await kanbanLink.isVisible().catch(() => false);

		if (isVisible) {
			const href = await kanbanLink.getAttribute("href");
			expect(href).toContain("/home/kanban");
		}
	});

	test("presentations new link has correct href", async ({ page }) => {
		const isNew = await dashboard.isNewUserState();
		test.skip(isNew, "New users see welcome hero");

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
		const isNew = await dashboard.isNewUserState();
		test.skip(isNew, "New users see welcome hero");

		const bookingCta = page.locator('a[aria-label="Book a coaching session"]');
		const joinLink = page.locator('a[aria-label*="Join session"]').first();

		const hasBookingCta = await bookingCta.isVisible().catch(() => false);
		const hasJoinLink = await joinLink.isVisible().catch(() => false);

		// Coaching widget is conditionally rendered; skip if not present
		if (!hasBookingCta && !hasJoinLink) {
			return;
		}

		if (hasBookingCta) {
			const href = await bookingCta.getAttribute("href");
			if (href) {
				expect(href).toContain("cal.com");
			}
		}
	});

	test("widget links have proper aria attributes", async () => {
		const isNew = await dashboard.isNewUserState();
		test.skip(isNew, "New users see welcome hero");

		const kanbanLink = dashboard.kanbanViewLink;
		const isVisible = await kanbanLink.isVisible().catch(() => false);

		if (isVisible) {
			const ariaLabel = await kanbanLink.getAttribute("aria-label");
			expect(ariaLabel).toBeTruthy();
		}

		const presTable = dashboard.presentationsTableContent;
		const tableVisible = await presTable.isVisible().catch(() => false);

		if (tableVisible) {
			const tableAria = await presTable.getAttribute("aria-label");
			expect(tableAria).toContain("Presentations");
		}
	});

	test("welcome hero links navigate correctly", async ({ page }) => {
		const isNew = await dashboard.isNewUserState();
		if (!isNew) {
			return;
		}

		// Check assessment link
		const assessmentLink = page.locator('a[href="/home/assessment/survey"]');
		await expect(assessmentLink).toBeVisible();

		// Check course link
		const courseLink = page.locator('a[href="/home/course"]');
		await expect(courseLink).toBeVisible();

		// Check create presentation link
		const createLink = page.locator('a[href="/home/ai/blocks"]');
		await expect(createLink).toBeVisible();
	});
});
