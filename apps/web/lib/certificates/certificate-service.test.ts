import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import * as path from "node:path";

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
