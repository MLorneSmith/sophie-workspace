import { chromium, type FullConfig } from "@playwright/test";
import { TEST_USERS } from "./helpers/test-data";

async function globalSetup(config: FullConfig) {
	console.log("🚀 Starting Payload CMS E2E Test Setup...");

	const { baseURL } = config.projects[0].use;
	const browser = await chromium.launch();
	const page = await browser.newPage();

	try {
		// Check if Payload is running
		console.log(`📡 Checking Payload at ${baseURL}...`);

		const healthResponse = await page.request
			.get(`${baseURL}/api/health`, {
				timeout: 10000,
			})
			.catch(() => null);

		if (!healthResponse || !healthResponse.ok()) {
			console.error("❌ Payload CMS is not running or not healthy!");
			console.error(
				"Please start Payload with: cd apps/payload && npm run dev",
			);
			throw new Error("Payload CMS is not accessible");
		}

		console.log("✅ Payload CMS is running and healthy");

		// Check database connection
		const apiResponse = await page.request.get(`${baseURL}/api/users`, {
			failOnStatusCode: false,
		});

		if (apiResponse.status() === 500) {
			const errorText = await apiResponse.text();
			if (
				errorText.includes("does not exist") ||
				errorText.includes("relation")
			) {
				console.error("❌ Database tables not found!");
				console.error(
					"Run migrations: cd apps/payload && npm run payload migrate",
				);
				throw new Error("Database not properly initialized");
			}
		}

		// Try to create first user if needed
		await page.goto(`${baseURL}/admin/login`);

		const needsFirstUser = await page
			.locator('button:has-text("Create First User")')
			.isVisible({ timeout: 5000 })
			.catch(() => false);

		if (needsFirstUser) {
			console.log("📝 Creating first admin user...");

			await page.locator('button:has-text("Create First User")').click();
			await page.locator('input[name="name"]').fill(TEST_USERS.admin.name);
			await page.locator('input[name="email"]').fill(TEST_USERS.admin.email);
			await page
				.locator('input[name="password"]')
				.fill(TEST_USERS.admin.password);
			await page
				.locator('input[name="confirm-password"]')
				.fill(TEST_USERS.admin.password);

			await page.locator('button[type="submit"]').click();

			// Wait for redirect or error
			await Promise.race([
				page.waitForURL("**/admin", { timeout: 15000 }),
				page.locator(".error").waitFor({ state: "visible", timeout: 15000 }),
			]).catch(() => {});

			const isSuccess = !page.url().includes("/login");

			if (isSuccess) {
				console.log("✅ First admin user created successfully");
			} else {
				console.log("⚠️ Could not create first user, it may already exist");
			}
		} else {
			console.log("✅ Admin user already exists");
		}

		// Store auth state for reuse
		const storageState = await page.context().storageState();
		await page.context().close();

		console.log("✅ Payload CMS E2E Test Setup Complete!");

		return storageState;
	} catch (error) {
		console.error("❌ Setup failed:", error);
		throw error;
	} finally {
		await browser.close();
	}
}

export default globalSetup;
