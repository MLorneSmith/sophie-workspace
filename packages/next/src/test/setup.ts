/**
 * Test setup file for @kit/next package
 * Configures testing environment for server actions and route handlers
 */

import { vi } from "vitest";

// Mock server-only package (Next.js specific import)
vi.mock("server-only", () => ({}));

// Mock next/navigation for redirect functionality
vi.mock("next/navigation", () => ({
	redirect: vi.fn((url: string) => {
		throw new Error(`NEXT_REDIRECT:${url}`);
	}),
	useRouter: vi.fn(() => ({
		push: vi.fn(),
		replace: vi.fn(),
		prefetch: vi.fn(),
	})),
}));

// Mock @kit/supabase dependencies
vi.mock("@kit/supabase/server-client", () => ({
	getSupabaseServerClient: vi.fn(() => ({
		auth: {
			getUser: vi.fn(),
			getSession: vi.fn(),
		},
		from: vi.fn(),
	})),
}));

vi.mock("@kit/supabase/require-user", () => ({
	requireUser: vi.fn(),
}));

// Mock @kit/auth captcha
vi.mock("@kit/auth/captcha/server", () => ({
	verifyCaptchaToken: vi.fn(),
}));
