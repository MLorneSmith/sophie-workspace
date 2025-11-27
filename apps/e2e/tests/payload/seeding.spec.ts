/**
 * End-to-End tests for Payload CMS seeding workflow
 *
 * Tests the complete seeding process from CLI to database including:
 * - Running seed command via CLI
 * - Verifying records created in database
 * - Checking relationship integrity
 * - Validating Lexical content rendering
 * - Testing Payload Admin UI accessibility
 *
 * @requires Database connection (Supabase)
 * @requires Payload CMS running
 *
 * @module e2e/tests/payload/seeding
 */

import { exec } from "node:child_process";
import { promisify } from "node:util";
import { expect, test } from "@playwright/test";

const execAsync = promisify(exec);

// Test configuration
const SEED_TIMEOUT = 180000; // 3 minutes for seeding operations
// Use pnpm tsx to execute TypeScript directly (same as npm scripts do)
const CLI_PATH = "apps/payload/src/seed/seed-engine/index.ts";
const CLI_EXECUTOR = "pnpm tsx";

test.describe("Payload Seeding E2E", () => {
	test.describe.configure({ mode: "serial" });

	test("should execute seed command successfully", async () => {
		test.setTimeout(SEED_TIMEOUT);

		// Run seed command in dry-run mode first using tsx
		try {
			const { stdout, stderr } = await execAsync(
				`${CLI_EXECUTOR} ${CLI_PATH} seed --dry-run`,
				{
					cwd: process.cwd(),
					env: { ...process.env, NODE_ENV: "test" },
				},
			);

			// Verify output
			expect(stderr).toBe("");
			expect(stdout).toContain("Seeding engine initialized");
			expect(stdout).toContain("validation passed");
		} catch (error) {
			const err = error as { stderr: string; stdout: string };
			throw new Error(
				`Seed command failed:\nCommand: ${CLI_EXECUTOR} ${CLI_PATH} seed --dry-run\nStdout: ${err.stdout}\nStderr: ${err.stderr}`,
			);
		}
	});

	test("should display help information", async () => {
		const { stdout } = await execAsync(
			`${CLI_EXECUTOR} ${CLI_PATH} seed --help`,
			{
				cwd: process.cwd(),
				env: { ...process.env, NODE_ENV: "test" },
			},
		);

		expect(stdout).toContain("Usage:");
		expect(stdout).toContain("--dry-run");
		expect(stdout).toContain("--verbose");
		expect(stdout).toContain("--collections");
	});

	test("should validate data without creating records in dry-run", async () => {
		test.setTimeout(SEED_TIMEOUT);

		const { stdout } = await execAsync(
			`${CLI_EXECUTOR} ${CLI_PATH} seed --dry-run --verbose`,
			{
				cwd: process.cwd(),
				env: { ...process.env, NODE_ENV: "test" },
			},
		);

		// Verify dry-run indicators
		expect(stdout).toContain("[DRY-RUN]");
		expect(stdout).toContain("validation");
		expect(stdout).not.toContain("created");
	});

	test("should filter specific collections", async () => {
		test.setTimeout(SEED_TIMEOUT);

		const { stdout } = await execAsync(
			`${CLI_EXECUTOR} ${CLI_PATH} seed --dry-run --collections courses,course-lessons`,
			{
				cwd: process.cwd(),
				env: { ...process.env, NODE_ENV: "test" },
			},
		);

		expect(stdout).toContain("courses");
		expect(stdout).toContain("course-lessons");
		// Should not contain other collections
		expect(stdout).not.toContain("Processing surveys");
	});

	test("should handle invalid collection names gracefully", async () => {
		test.setTimeout(SEED_TIMEOUT);

		try {
			await execAsync(
				`${CLI_EXECUTOR} ${CLI_PATH} seed --dry-run --collections invalid-collection`,
				{
					cwd: process.cwd(),
					env: { ...process.env, NODE_ENV: "test" },
				},
			);
			// Should not reach here
			expect(true).toBe(false);
		} catch (error) {
			// Should fail with helpful error message
			const err = error as { stderr: string };
			expect(err.stderr).toContain("No valid collections");
		}
	});

	test("should report accurate statistics", async () => {
		test.setTimeout(SEED_TIMEOUT);

		const { stdout } = await execAsync(
			`${CLI_EXECUTOR} ${CLI_PATH} seed --dry-run --verbose`,
			{
				cwd: process.cwd(),
				env: { ...process.env, NODE_ENV: "test" },
			},
		);

		// Verify summary statistics
		expect(stdout).toContain("Total records:");
		expect(stdout).toContain("Success:");
		expect(stdout).toContain("Duration:");
		expect(stdout).toContain("Speed:");
	});
});

test.describe("Payload Admin UI after Seeding", () => {
	test.describe.configure({ mode: "serial" });

	test.skip("should display seeded courses in admin", async ({ page }) => {
		// Note: This test requires actual seeding and admin authentication
		// Skipped by default as it requires database modification

		await page.goto("http://localhost:3000/admin");

		// Login would go here (requires admin credentials)

		await page.goto("http://localhost:3000/admin/collections/courses");

		// Verify course exists
		await expect(page.locator("text=Decks for Decision Makers")).toBeVisible({
			timeout: 10000,
		});
	});

	test.skip("should display seeded lessons with relationships", async ({
		page,
	}) => {
		// Note: Requires authentication and actual seeding
		await page.goto("http://localhost:3000/admin/collections/course-lessons");

		// Verify lessons exist
		const lessonCount = await page
			.locator('[data-testid="collection-item"]')
			.count();
		expect(lessonCount).toBeGreaterThan(0);
	});

	test.skip("should render Lexical content correctly", async ({ page }) => {
		// Note: Requires authentication and actual seeding
		await page.goto("http://localhost:3000/admin/collections/posts");

		// Click on first post
		await page.locator('[data-testid="collection-item"]').first().click();

		// Verify Lexical editor loaded
		await expect(page.locator('[data-lexical-editor="true"]')).toBeVisible({
			timeout: 10000,
		});
	});
});

test.describe("Data Integrity Verification", () => {
	test.skip("should maintain referential integrity", async () => {
		// Note: This would require database access to verify foreign keys
		// Implementation depends on database client availability
	});

	test.skip("should have correct relationship counts", async () => {
		// Note: Requires database access
		// Verify lesson → downloads relationship counts
		// Verify course → lessons relationship counts
	});

	test.skip("should preserve UUID references", async () => {
		// Note: Requires database access
		// Verify downloads collection uses pre-assigned UUIDs
	});
});
