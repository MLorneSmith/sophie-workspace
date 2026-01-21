import { createClient } from "@supabase/supabase-js";

// E2E Supabase configuration
const supabaseUrl = process.env.E2E_SUPABASE_URL || "http://localhost:54521";
const supabaseServiceKey =
	process.env.E2E_SUPABASE_SERVICE_ROLE_KEY ||
	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

// Test user configurations
export const TEST_USERS = {
	user1: {
		email: "test1@slideheroes.com",
		password: "aiesec1992",
		id: "31a03e74-1639-45b6-bfa7-77447f1a4762",
		metadata: {
			onboarded: true,
			displayName: "Test User 1",
		},
	},
	user2: {
		email: "test2@slideheroes.com",
		password: "aiesec1992",
		id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
		metadata: {
			onboarded: true,
			displayName: "Test User 2",
		},
	},
	newUser: {
		email: "newuser@slideheroes.com",
		password: "aiesec1992",
		id: "a1b2c3d4-e5f6-7890-abcd-ef0123456789",
		metadata: {
			onboarded: false,
			displayName: "New Test User",
		},
	},
	superAdmin: {
		email: "michael@slideheroes.com",
		password: "aiesec1992",
		id: "c5b930c9-0a76-412e-a836-4bc4849a3270",
		metadata: {
			onboarded: true,
			displayName: "Super Admin",
			role: "super-admin",
		},
		appMetadata: {
			role: "super-admin",
		},
	},
};

// Type for test user with optional appMetadata (used for super-admin)
type TestUser = {
	email: string;
	password: string;
	id: string;
	metadata: Record<string, unknown>;
	appMetadata?: Record<string, unknown>;
};

/**
 * Create or update a test user using the Supabase Admin API
 */
export async function ensureTestUser(user: TestUser) {
	const supabase = createClient(supabaseUrl, supabaseServiceKey, {
		auth: {
			autoRefreshToken: false,
			persistSession: false,
		},
	});

	try {
		// First, try to get the user
		const { data: existingUser } = await supabase.auth.admin.getUserById(
			user.id,
		);

		if (existingUser?.user) {
			// User exists, update only metadata (NOT password to avoid hash regeneration)
			const { error: updateError } = await supabase.auth.admin.updateUserById(
				user.id,
				{
					// DO NOT update password - it regenerates the hash!
					// password: user.password,
					email_confirm: true,
					user_metadata: user.metadata,
					...(user.appMetadata && { app_metadata: user.appMetadata }),
				},
			);

			if (updateError) {
				console.warn(`Failed to update user ${user.email}:`, updateError);
			} else {
				console.log(`✅ Updated test user metadata: ${user.email}`);
			}
		} else {
			// User doesn't exist, create it
			const { error: createError } = await supabase.auth.admin.createUser({
				email: user.email,
				password: user.password,
				email_confirm: true,
				user_metadata: user.metadata,
				...(user.appMetadata && { app_metadata: user.appMetadata }),
			});

			if (createError) {
				console.warn(`Failed to create user ${user.email}:`, createError);
			} else {
				console.log(`✅ Created test user: ${user.email}`);
			}
		}
	} catch (error) {
		console.error(`Error ensuring test user ${user.email}:`, error);
	}
}

/**
 * Setup all test users before running tests
 */
export async function setupTestUsers() {
	console.log("🔧 Setting up test users...");

	await Promise.all([
		ensureTestUser(TEST_USERS.user1),
		ensureTestUser(TEST_USERS.user2),
		ensureTestUser(TEST_USERS.newUser),
		ensureTestUser(TEST_USERS.superAdmin),
	]);

	console.log("✅ Test users ready");
}

/**
 * Clean up test users after tests (optional)
 */
export async function cleanupTestUsers() {
	const supabase = createClient(supabaseUrl, supabaseServiceKey, {
		auth: {
			autoRefreshToken: false,
			persistSession: false,
		},
	});

	console.log("🧹 Cleaning up test users...");

	for (const user of Object.values(TEST_USERS)) {
		try {
			const { error } = await supabase.auth.admin.deleteUser(user.id);
			if (error) {
				console.warn(`Failed to delete user ${user.email}:`, error);
			}
		} catch (error) {
			console.warn(`Error deleting user ${user.email}:`, error);
		}
	}

	console.log("✅ Test users cleaned up");
}
