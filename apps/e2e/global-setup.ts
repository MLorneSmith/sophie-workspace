import { chromium, type FullConfig } from "@playwright/test";
import { execSync } from "node:child_process";
import path from "node:path";
import { cleanupTestData } from "./tests/helpers/cleanup";

async function globalSetup(config: FullConfig) {
	await cleanupTestData();
	try {
		const _seedUsersPath = path.join(__dirname, "scripts/seed-test-users.sql");
		execSync(
			"cd apps/e2e && npx supabase db reset --db-url postgresql://postgres:postgres@localhost:55322/postgres",
			{
				stdio: "ignore",
			},
		);
	} catch (_error) {}

	// Warm up the application by visiting the home page
	if (!process.env.SKIP_WARMUP) {
		const browser = await chromium.launch();
		const page = await browser.newPage();

		try {
			// Visit the home page to ensure the server is ready
			const baseURL =
				config.projects[0]?.use?.baseURL || "http://localhost:3000";
			await page.goto(baseURL, {
				waitUntil: "networkidle",
				timeout: 30000,
			});
		} catch (_error) {
		} finally {
			await browser.close();
		}
	}
}

export default globalSetup;
