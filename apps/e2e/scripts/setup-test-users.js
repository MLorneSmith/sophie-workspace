#!/usr/bin/env node

/**
 * Setup test users for E2E testing
 * This script creates test users with the correct password using the Supabase Admin API
 */

const SUPABASE_URL = process.env.E2E_SUPABASE_URL || "http://127.0.0.1:54321";
const SERVICE_ROLE_KEY =
	process.env.E2E_SUPABASE_SERVICE_ROLE_KEY ||
	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

const TEST_USERS = [
	{
		email: process.env.E2E_TEST_USER_EMAIL || "test1@slideheroes.com",
		password: process.env.E2E_TEST_USER_PASSWORD || "aiesec1992",
		user_metadata: { name: "Test User One", onboarded: true },
	},
	{
		email: process.env.E2E_OWNER_EMAIL || "test2@slideheroes.com",
		password: process.env.E2E_OWNER_PASSWORD || "aiesec1992",
		user_metadata: { name: "Test User Two", onboarded: true },
	},
	{
		email: process.env.E2E_ADMIN_EMAIL || "michael@slideheroes.com",
		password: process.env.E2E_ADMIN_PASSWORD || "aiesec1992",
		user_metadata: { name: "Michael Smith", onboarded: true },
		app_metadata: { role: "super-admin" },
	},
];

async function createUser(user) {
	const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
			apikey: SERVICE_ROLE_KEY,
		},
		body: JSON.stringify({
			email: user.email,
			password: user.password,
			email_confirm: true,
			user_metadata: user.user_metadata,
			app_metadata: user.app_metadata || {},
		}),
	});

	if (!response.ok) {
		const error = await response.text();
		// Check if user already exists (409 Conflict)
		if (response.status === 409 || error.includes("already been registered")) {
			console.log(`✓ User ${user.email} already exists`);
			return;
		}
		throw new Error(`Failed to create user ${user.email}: ${error}`);
	}

	console.log(`✓ Created user: ${user.email}`);
}

async function setupTestUsers() {
	console.log("Setting up E2E test users...\n");

	for (const user of TEST_USERS) {
		try {
			await createUser(user);
		} catch (error) {
			console.error(`✗ Error creating user ${user.email}:`, error.message);
			process.exit(1);
		}
	}

	console.log("\n✓ All test users set up successfully!");
}

// Run the setup
setupTestUsers().catch((error) => {
	console.error("Setup failed:", error);
	process.exit(1);
});
