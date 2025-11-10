#!/usr/bin/env node

/**
 * Create specifically the owner test user (test2@slideheroes.com)
 * With detailed error reporting to diagnose the issue
 */

const SUPABASE_URL = process.env.E2E_SUPABASE_URL || "http://127.0.0.1:54321";
const SERVICE_ROLE_KEY =
	process.env.E2E_SUPABASE_SERVICE_ROLE_KEY ||
	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

const OWNER_EMAIL = process.env.E2E_OWNER_EMAIL || "test2@slideheroes.com";
const OWNER_PASSWORD = process.env.E2E_OWNER_PASSWORD || "aiesec1992";

async function createOwnerUser() {
	console.log("🔧 Creating owner user with detailed error reporting...\n");
	console.log(`Supabase URL: ${SUPABASE_URL}`);
	console.log(`Email: ${OWNER_EMAIL}`);
	console.log(`Password: ${OWNER_PASSWORD.length} characters\n`);

	const user = {
		email: OWNER_EMAIL,
		password: OWNER_PASSWORD,
		email_confirm: true,
		user_metadata: {
			name: "Test User Two (Owner)",
			onboarded: true,
		},
	};

	try {
		console.log("📡 Sending request to Supabase...");

		const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
				apikey: SERVICE_ROLE_KEY,
			},
			body: JSON.stringify(user),
		});

		console.log(`Response status: ${response.status} ${response.statusText}\n`);

		const responseText = await response.text();

		if (!response.ok) {
			console.error("❌ Request failed!");
			console.error(`Status: ${response.status}`);
			console.error(`Response: ${responseText}\n`);

			// Check for specific error conditions
			if (response.status === 409) {
				console.log(
					"⚠️ This is a 409 Conflict - user might already exist with this email",
				);
				console.log(
					"But Supabase Studio shows it doesn't exist. This is suspicious.\n",
				);
			} else if (response.status === 422) {
				console.log("⚠️ This is a 422 Unprocessable Entity - validation error");
				try {
					const errorData = JSON.parse(responseText);
					console.log("Error details:", JSON.stringify(errorData, null, 2));
				} catch {
					// Response wasn't JSON
				}
			}

			throw new Error(`Failed to create user: ${responseText}`);
		}

		// Success
		const data = JSON.parse(responseText);
		console.log("✅ User created successfully!");
		console.log(`ID: ${data.id}`);
		console.log(`Email: ${data.email}`);
		console.log(`Email Confirmed: ${data.email_confirmed_at ? "Yes" : "No"}`);
		console.log(`Created At: ${data.created_at}`);
	} catch (error) {
		console.error("\n❌ Error creating user:");
		console.error(error.message);
		process.exit(1);
	}
}

createOwnerUser();
