export const TEST_USERS = {
	admin: {
		email: process.env.PAYLOAD_TEST_ADMIN_EMAIL || "admin@test.payload.com",
		password: process.env.PAYLOAD_TEST_ADMIN_PASSWORD || "Admin123!@#",
		name: "Test Admin",
	},
	editor: {
		email: "editor@test.payload.com",
		password: "Editor123!@#",
		name: "Test Editor",
	},
	viewer: {
		email: "viewer@test.payload.com",
		password: "Viewer123!@#",
		name: "Test Viewer",
	},
};

export const TEST_COLLECTIONS = {
	posts: {
		title: "E2E Test Post",
		slug: "e2e-test-post",
		content: "This is a test post created by E2E tests",
		status: "published",
	},
	courses: {
		title: "E2E Test Course",
		description: "Test course for E2E testing",
		slug: "e2e-test-course",
	},
	documentation: {
		title: "E2E Test Documentation",
		content: "Test documentation content",
		category: "testing",
	},
};

export function generateUniqueId(): string {
	return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function generateTestEmail(): string {
	return `test-${generateUniqueId()}@payload.test`;
}

export function generateTestData(
	collection: string,
	override: Record<string, any> = {},
) {
	const baseData =
		TEST_COLLECTIONS[collection as keyof typeof TEST_COLLECTIONS] || {};
	const uniqueId = generateUniqueId();

	return {
		...baseData,
		...override,
		title: override.title || `${baseData.title} ${uniqueId}`,
		slug:
			override.slug || `${(baseData as any).slug || collection}-${uniqueId}`,
	};
}
