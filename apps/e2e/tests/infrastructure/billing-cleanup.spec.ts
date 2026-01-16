import { expect, test } from "@playwright/test";

/**
 * Billing Test Data Cleanup - Regression Tests
 *
 * Verifies that the billing test data cleanup mechanism in global-setup.ts
 * is working correctly to prevent duplicate subscription records.
 *
 * @see Issue #1461 - E2E Shard 10 Duplicate Subscription Records
 */
test.describe("Billing Test Data Cleanup", () => {
	test("should prevent duplicate subscriptions for test accounts", async () => {
		// This test verifies the cleanup mechanism works
		// by checking database state after global-setup runs

		const { Client } = await import("pg");
		const client = new Client({
			host: "127.0.0.1",
			port: 54522,
			user: "postgres",
			password: "postgres",
			database: "postgres",
		});

		await client.connect();

		try {
			// Query for duplicate subscriptions in test accounts
			const result = await client.query(`
				SELECT s.account_id, COUNT(*) as count
				FROM subscriptions s
				JOIN accounts a ON s.account_id = a.id
				WHERE a.email LIKE '%@slideheroes.com' OR a.email LIKE '%@makerkit.dev'
				GROUP BY s.account_id
				HAVING COUNT(*) > 1
			`);

			// Should be zero duplicate subscriptions after cleanup
			expect(result.rowCount).toBe(0);
		} finally {
			await client.end();
		}
	});

	test("should prevent duplicate billing_customers for test accounts", async () => {
		// This test verifies no duplicate billing_customers exist

		const { Client } = await import("pg");
		const client = new Client({
			host: "127.0.0.1",
			port: 54522,
			user: "postgres",
			password: "postgres",
			database: "postgres",
		});

		await client.connect();

		try {
			// Query for duplicate billing_customers in test accounts
			const result = await client.query(`
				SELECT b.account_id, COUNT(*) as count
				FROM billing_customers b
				JOIN accounts a ON b.account_id = a.id
				WHERE a.email LIKE '%@slideheroes.com' OR a.email LIKE '%@makerkit.dev'
				GROUP BY b.account_id
				HAVING COUNT(*) > 1
			`);

			// Should be zero duplicate billing_customers after cleanup
			expect(result.rowCount).toBe(0);
		} finally {
			await client.end();
		}
	});
});
