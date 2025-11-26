#!/usr/bin/env node

/**
 * Verify test users exist in remote Supabase
 * This diagnostic script checks if E2E test users are properly provisioned
 */

const SUPABASE_URL = process.env.E2E_SUPABASE_URL || "http://127.0.0.1:54521";
const SERVICE_ROLE_KEY =
	process.env.E2E_SUPABASE_SERVICE_ROLE_KEY ||
	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

const TEST_USER_EMAIL =
	process.env.E2E_TEST_USER_EMAIL || "test1@slideheroes.com";
const OWNER_EMAIL = process.env.E2E_OWNER_EMAIL || "test2@slideheroes.com";
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || "michael@slideheroes.com";

async function getUserByEmail(email) {
	try {
		const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
			method: "GET",
			headers: {
				Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
				apikey: SERVICE_ROLE_KEY,
			},
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${await response.text()}`);
		}

		const data = await response.json();
		return data.users?.find((user) => user.email === email) || null;
	} catch (error) {
		throw new Error(`Failed to fetch users: ${error.message}`);
	}
}

function formatUserStatus(user, email) {
	if (!user) {
		return {
			exists: false,
			email,
			status: "❌ USER NOT FOUND",
			details: "User does not exist in this Supabase instance",
		};
	}

	const issues = [];

	if (!user.email_confirmed_at) {
		issues.push("Email not confirmed");
	}

	if (user.banned_until) {
		issues.push(`Banned until ${user.banned_until}`);
	}

	if (user.deleted_at) {
		issues.push("User is deleted");
	}

	return {
		exists: true,
		email: user.email,
		id: user.id,
		status: issues.length === 0 ? "✅ OK" : "⚠️ ISSUES FOUND",
		details:
			issues.length === 0 ? "User is active and ready" : issues.join(", "),
		emailConfirmed: !!user.email_confirmed_at,
		createdAt: user.created_at,
		lastSignIn: user.last_sign_in_at || "Never",
	};
}

async function verifyTestUsers() {
	console.log("🔍 Verifying E2E Test Users in Remote Supabase\n");
	console.log(`Supabase URL: ${SUPABASE_URL}\n`);

	const testUsers = [
		{ role: "Test User", email: TEST_USER_EMAIL },
		{ role: "Owner User", email: OWNER_EMAIL },
		{ role: "Admin User", email: ADMIN_EMAIL },
	];

	const results = [];
	let allUsersExist = true;
	let hasIssues = false;

	for (const { role, email } of testUsers) {
		console.log(`Checking ${role} (${email})...`);

		try {
			const user = await getUserByEmail(email);
			const status = formatUserStatus(user, email);
			results.push({ role, ...status });

			console.log(`  ${status.status}`);
			if (status.exists) {
				console.log(`  ID: ${status.id}`);
				console.log(
					`  Email Confirmed: ${status.emailConfirmed ? "Yes" : "No"}`,
				);
				console.log(`  Created: ${status.createdAt}`);
				console.log(`  Last Sign-In: ${status.lastSignIn}`);
				if (status.details !== "User is active and ready") {
					console.log(`  Issues: ${status.details}`);
					hasIssues = true;
				}
			} else {
				allUsersExist = false;
				console.log(`  Details: ${status.details}`);
			}
		} catch (error) {
			console.error(`  ❌ ERROR: ${error.message}`);
			results.push({
				role,
				exists: false,
				email,
				status: "❌ ERROR",
				details: error.message,
			});
			allUsersExist = false;
		}

		console.log("");
	}

	// Summary
	console.log("─".repeat(60));
	console.log("\n📊 SUMMARY\n");

	if (allUsersExist && !hasIssues) {
		console.log("✅ All test users exist and are ready for testing");
		console.log("\n🔍 DIAGNOSIS:");
		console.log(
			"   Users exist in Supabase, so the CI failure is likely due to:",
		);
		console.log("   1. Password mismatch between GitHub Secrets and Supabase");
		console.log("   2. Wrong Supabase instance (E2E_SUPABASE_URL mismatch)");
		console.log("\n💡 NEXT STEPS:");
		console.log(
			"   1. Verify E2E_SUPABASE_URL in GitHub Secrets matches this instance",
		);
		console.log(
			"   2. Check that E2E_*_PASSWORD secrets match the actual passwords",
		);
		console.log("   3. Consider resetting passwords to match GitHub Secrets");
	} else if (!allUsersExist) {
		console.log("❌ Some test users are missing from Supabase");

		const missingUsers = results.filter((r) => !r.exists);
		console.log("\n🔍 MISSING USERS:");
		for (const user of missingUsers) {
			console.log(`   - ${user.role}: ${user.email}`);
		}

		console.log("\n💡 NEXT STEPS:");
		console.log("   1. Run setup-test-users.js to provision missing users:");
		console.log("      node apps/e2e/scripts/setup-test-users.js");
		console.log("   2. Ensure GitHub Secrets match the passwords used");
		console.log("   3. Re-run this verification script to confirm");
	} else if (hasIssues) {
		console.log("⚠️ All users exist but some have issues");

		const problematicUsers = results.filter(
			(r) => r.exists && r.status !== "✅ OK",
		);
		console.log("\n🔍 ISSUES FOUND:");
		for (const user of problematicUsers) {
			console.log(`   - ${user.role}: ${user.details}`);
		}

		console.log("\n💡 NEXT STEPS:");
		console.log("   1. Fix user states in Supabase dashboard:");
		console.log("      - Confirm unconfirmed emails");
		console.log("      - Enable disabled/banned users");
		console.log("      - Restore deleted users if needed");
		console.log("   2. Re-run this verification script to confirm");
	}

	console.log("\n─".repeat(60));

	// Exit code based on results
	process.exit(allUsersExist && !hasIssues ? 0 : 1);
}

// Run verification
verifyTestUsers().catch((error) => {
	console.error("\n❌ Verification failed:", error.message);
	process.exit(1);
});
