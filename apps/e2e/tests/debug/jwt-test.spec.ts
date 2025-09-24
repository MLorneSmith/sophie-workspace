import { expect, test } from "@playwright/test";
import { AuthPageObject } from "../authentication/auth.po";

test.describe("JWT Debug Test", () => {
	test("test bootstrapUser JWT", async ({ page }) => {
		const auth = new AuthPageObject(page);

		console.log("Environment variables:");
		console.log("E2E_SUPABASE_URL:", process.env.E2E_SUPABASE_URL);
		console.log(
			"E2E_SUPABASE_SERVICE_ROLE_KEY:",
			`${process.env.E2E_SUPABASE_SERVICE_ROLE_KEY?.substring(0, 50)}...`,
		);

		try {
			const user = await auth.bootstrapUser({
				email: `test-jwt-${Date.now()}@test.com`,
				name: "Test User",
				password: "testpassword",
			});

			console.log("User created successfully:", user);
			expect(user).toBeDefined();
		} catch (error) {
			console.error("Error creating user:", error);
			throw error;
		}
	});
});
