/**
 * Vitest setup file for web application
 * Configures testing environment, mocks, and global test utilities
 */

import { beforeEach, vi } from "vitest";
import "@testing-library/jest-dom";

// Mock Next.js router
vi.mock("next/router", () => ({
	useRouter: () => ({
		push: vi.fn(),
		replace: vi.fn(),
		prefetch: vi.fn(),
		back: vi.fn(),
		beforePopState: vi.fn(),
		asPath: "/",
		pathname: "/",
		query: {},
		route: "/",
		events: {
			on: vi.fn(),
			off: vi.fn(),
			emit: vi.fn(),
		},
	}),
}));

// Mock Next.js navigation (app directory)
vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: vi.fn(),
		replace: vi.fn(),
		refresh: vi.fn(),
		back: vi.fn(),
		forward: vi.fn(),
		prefetch: vi.fn(),
	}),
	usePathname: () => "/",
	useSearchParams: () => new URLSearchParams(),
	useParams: () => ({}),
}));

// Mock Next.js Image component
vi.mock("next/image", () => ({
	default: vi.fn().mockImplementation(({ src, alt, ...props }) => {
		return {
			type: "img",
			props: { src, alt, ...props },
		};
	}),
}));

// Mock Supabase client
vi.mock("@/lib/supabase/client", () => ({
	createClient: vi.fn(() => ({
		auth: {
			getUser: vi.fn(),
			signInWithPassword: vi.fn(),
			signOut: vi.fn(),
			onAuthStateChange: vi.fn(),
		},
		from: vi.fn(() => ({
			select: vi.fn().mockReturnThis(),
			insert: vi.fn().mockReturnThis(),
			update: vi.fn().mockReturnThis(),
			delete: vi.fn().mockReturnThis(),
			eq: vi.fn().mockReturnThis(),
			throwOnError: vi.fn().mockResolvedValue({ data: null, error: null }),
		})),
	})),
}));

// Mock server-only package to allow importing server components in tests
vi.mock("server-only", () => ({}));

// Mock Next.js server-side functions
vi.mock("next/cache", () => ({
	revalidatePath: vi.fn(),
	revalidateTag: vi.fn(),
	unstable_cache: vi.fn(),
}));

vi.mock("next/headers", () => ({
	cookies: vi.fn(() => ({
		get: vi.fn(),
		set: vi.fn(),
		delete: vi.fn(),
		getAll: vi.fn(() => []),
		setAll: vi.fn(),
	})),
	headers: vi.fn(() => ({
		get: vi.fn(),
		set: vi.fn(),
		delete: vi.fn(),
		has: vi.fn(),
		entries: vi.fn(() => []),
	})),
}));

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54521";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
// NODE_ENV is set in vitest.config.ts via define option

// Mock fetch for API testing
global.fetch = vi.fn();

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
	writable: true,
	value: vi.fn().mockImplementation((query) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: vi.fn(), // deprecated
		removeListener: vi.fn(), // deprecated
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn(),
	})),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
	observe: vi.fn(),
	unobserve: vi.fn(),
	disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
	observe: vi.fn(),
	unobserve: vi.fn(),
	disconnect: vi.fn(),
}));

// Setup cleanup between tests
beforeEach(() => {
	vi.clearAllMocks();
});
