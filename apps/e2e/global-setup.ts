import { chromium, type FullConfig } from "@playwright/test";
import { execSync } from "child_process";
import path from "path";
import { cleanupTestData } from "./tests/helpers/cleanup";

async function globalSetup(config: FullConfig) {
	console.log("🎭 Starting Playwright global setup...");

	// Clean up test data before running tests
	console.log("🧹 Cleaning up test data...");
	await cleanupTestData();
	
	// Setup test users for authentication tests
	console.log("🔧 Setting up test users...");
	try {
		const seedUsersPath = path.join(__dirname, "scripts/seed-test-users.sql");
		execSync(`cd apps/e2e && npx supabase db reset --db-url postgresql://postgres:postgres@localhost:55322/postgres`, { 
			stdio: "ignore" 
		});
		console.log("✅ Database reset and test users seeded");
	} catch (error) {
		console.warn("⚠️ Could not seed test users, they may already exist:", error);
	}

	// Warm up the application by visiting the home page
	if (!process.env.SKIP_WARMUP) {
		console.log("🔥 Warming up application...");
		const browser = await chromium.launch();
		const page = await browser.newPage();
		
		try {
			// Visit the home page to ensure the server is ready
			const baseURL = config.projects[0]?.use?.baseURL || "http://localhost:3000";
			await page.goto(baseURL, { 
				waitUntil: "networkidle",
				timeout: 30000 
			});
			console.log("✅ Application warmed up successfully");
		} catch (error) {
			console.warn("⚠️ Application warmup failed:", error);
		} finally {
			await browser.close();
		}
	}

	console.log("✅ Global setup complete");
}

export default globalSetup;