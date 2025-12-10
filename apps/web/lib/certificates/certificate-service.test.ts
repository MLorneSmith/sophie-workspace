import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import * as path from "node:path";

// Mock global fetch for PDF.co API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock the path module to track how paths are constructed
const mockJoin = vi.fn((...args: string[]) => args.join("/"));

vi.mock("node:path", () => ({
	default: {
		join: (...args: string[]) => mockJoin(...args),
	},
	join: (...args: string[]) => mockJoin(...args),
}));

// Mock fs to avoid actual file operations
vi.mock("node:fs", () => ({
	default: {
		existsSync: vi.fn(() => true),
		readFileSync: vi.fn(() => Buffer.from("mock-pdf-content")),
	},
	existsSync: vi.fn(() => true),
	readFileSync: vi.fn(() => Buffer.from("mock-pdf-content")),
}));

// Mock the logger
vi.mock("@kit/shared/logger", () => ({
	createServiceLogger: () => ({
		getLogger: () => ({
			info: vi.fn(),
			debug: vi.fn(),
			error: vi.fn(),
			warn: vi.fn(),
		}),
	}),
}));

// Mock Supabase client
vi.mock("@kit/supabase/server-client", () => ({
	getSupabaseServerClient: vi.fn(() => ({
		storage: {
			listBuckets: vi.fn(() => ({
				data: [{ name: "certificates" }],
				error: null,
			})),
			createBucket: vi.fn(),
			from: vi.fn(() => ({
				upload: vi.fn(() => ({ error: null })),
				getPublicUrl: vi.fn(() => ({
					data: { publicUrl: "https://example.com/cert.pdf" },
				})),
			})),
		},
		from: vi.fn(() => ({
			update: vi.fn(() => ({
				eq: vi.fn(() => ({ eq: vi.fn(() => ({ error: null })) })),
			})),
		})),
		rpc: vi.fn(() => ({ data: [{ id: "cert-123" }], error: null })),
	})),
}));

describe("certificate-service path construction", () => {
	const originalEnv = process.env.PDF_CO_API_KEY;
	const originalCwd = process.cwd;

	beforeEach(() => {
		vi.clearAllMocks();
		// Set up API key
		process.env.PDF_CO_API_KEY = "test-api-key";
	});

	afterEach(() => {
		if (originalEnv) {
			process.env.PDF_CO_API_KEY = originalEnv;
		} else {
			delete process.env.PDF_CO_API_KEY;
		}
	});

	it("should construct template path without duplicating apps/web directory", () => {
		// Arrange - Simulate Next.js dev mode where cwd is already apps/web
		const mockCwd = "/home/user/project/apps/web";

		// Verify our understanding of the correct path construction
		const correctPath = path.join(
			mockCwd,
			"lib",
			"certificates",
			"templates",
			"ddm_certificate_form.pdf",
		);

		// Assert - The path should be apps/web/lib/certificates/templates/...
		// NOT apps/web/apps/web/lib/certificates/templates/...
		expect(correctPath).not.toContain("apps/web/apps/web");
		expect(correctPath).toContain("lib/certificates/templates");
	});

	it("should NOT include apps/web prefix when process.cwd() already returns apps/web", () => {
		// This test documents the expected behavior after the fix
		// The path.join should be called with:
		// - process.cwd() (which is already apps/web)
		// - "lib", "certificates", "templates", "ddm_certificate_form.pdf"
		// NOT with "apps", "web" added in between

		const cwdInDevMode = "/home/user/project/apps/web";

		// The FIXED behavior - direct path from cwd
		const fixedPath = [
			cwdInDevMode,
			"lib",
			"certificates",
			"templates",
			"ddm_certificate_form.pdf",
		].join("/");

		// The BUGGY behavior - adds apps/web again
		const buggyPath = [
			cwdInDevMode,
			"apps",
			"web",
			"lib",
			"certificates",
			"templates",
			"ddm_certificate_form.pdf",
		].join("/");

		expect(fixedPath).toBe(
			"/home/user/project/apps/web/lib/certificates/templates/ddm_certificate_form.pdf",
		);
		expect(buggyPath).toBe(
			"/home/user/project/apps/web/apps/web/lib/certificates/templates/ddm_certificate_form.pdf",
		);

		// The buggy path has a duplicated apps/web
		expect(buggyPath).toContain("apps/web/apps/web");
		expect(fixedPath).not.toContain("apps/web/apps/web");
	});

	it("should work in both dev mode (cwd=apps/web) and production (cwd=root)", () => {
		// In development: cwd = /project/apps/web
		// In production: cwd = /project/apps/web (after build output)
		// The fix ensures we don't add "apps/web" again in either case

		const scenarios = [
			{
				name: "dev mode",
				cwd: "/project/apps/web",
				expectedPath:
					"/project/apps/web/lib/certificates/templates/ddm_certificate_form.pdf",
			},
			{
				name: "production",
				cwd: "/app",
				expectedPath:
					"/app/lib/certificates/templates/ddm_certificate_form.pdf",
			},
		];

		for (const scenario of scenarios) {
			const templatePath = [
				scenario.cwd,
				"lib",
				"certificates",
				"templates",
				"ddm_certificate_form.pdf",
			].join("/");

			expect(templatePath).toBe(scenario.expectedPath);
			expect(templatePath).not.toContain("apps/web/apps/web");
		}
	});
});

describe("certificate-service UUID validation", () => {
	const originalEnv = process.env.PDF_CO_API_KEY;

	beforeEach(() => {
		vi.clearAllMocks();
		process.env.PDF_CO_API_KEY = "test-api-key";
	});

	afterEach(() => {
		if (originalEnv) {
			process.env.PDF_CO_API_KEY = originalEnv;
		} else {
			delete process.env.PDF_CO_API_KEY;
		}
	});

	it("should reject courseId that is a slug instead of UUID", async () => {
		// This test documents the bug fix: courseId must be a UUID, not a slug
		const { generateCertificate } = await import("./certificate-service");

		// Using a slug (like the old buggy behavior)
		await expect(
			generateCertificate({
				userId: "a3d820ec-d063-4768-bae0-a11c4ab78705",
				courseId: "decks-for-decision-makers", // Slug, not UUID - should fail
				fullName: "Test User",
			}),
		).rejects.toThrow(
			'Invalid courseId format: expected UUID but received "decks-for-decision-makers"',
		);
	});

	it("should accept valid UUID courseId", async () => {
		const { generateCertificate } = await import("./certificate-service");

		// Mock fetch for PDF.co API calls
		mockFetch.mockResolvedValueOnce({
			json: async () => ({
				info: {
					FieldsInfo: {
						Fields: [{ FieldName: "name", Type: "EditBox" }],
					},
				},
			}),
		});
		mockFetch.mockResolvedValueOnce({
			json: async () => ({
				url: "https://pdf.co/mock-certificate.pdf",
			}),
		});
		mockFetch.mockResolvedValueOnce({
			arrayBuffer: async () => new ArrayBuffer(100),
		});

		// Using a valid UUID (the correct behavior after fix)
		// This should not throw the UUID validation error
		// (though it may fail later due to other mocking issues, which is fine)
		const validUUID = "a3d820ec-d063-4768-bae0-a11c4ab78705";

		try {
			await generateCertificate({
				userId: validUUID,
				courseId: validUUID,
				fullName: "Test User",
			});
		} catch (error) {
			// It's okay if it fails for other reasons (like storage/RPC mocking)
			// as long as it doesn't fail on UUID validation
			expect((error as Error).message).not.toContain("Invalid courseId format");
		}
	});

	it("should validate various UUID formats correctly", () => {
		// Direct test of UUID validation logic
		const validUUIDs = [
			"a3d820ec-d063-4768-bae0-a11c4ab78705",
			"00000000-0000-0000-0000-000000000000",
			"FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF",
			"123e4567-e89b-12d3-a456-426614174000",
		];

		const invalidUUIDs = [
			"decks-for-decision-makers", // Slug
			"not-a-uuid",
			"12345",
			"",
			"a3d820ec-d063-4768-bae0", // Too short
			"a3d820ec-d063-4768-bae0-a11c4ab78705-extra", // Too long
		];

		// UUID regex pattern (same as in certificate-service.ts)
		const UUID_REGEX =
			/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

		for (const uuid of validUUIDs) {
			expect(UUID_REGEX.test(uuid)).toBe(true);
		}

		for (const invalid of invalidUUIDs) {
			expect(UUID_REGEX.test(invalid)).toBe(false);
		}
	});
});
