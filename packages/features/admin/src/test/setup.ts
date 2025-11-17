/**
 * Test setup file for admin package
 * Configures testing environment for React components and admin functionality
 */

import { afterAll, beforeAll, vi } from "vitest";

// Use vi.hoisted to ensure mocks are hoisted before module imports
const { mocks } = vi.hoisted(() => {
	return {
		mocks: {
			redirect: vi.fn(),
			notFound: vi.fn(),
			revalidatePath: vi.fn(),
			revalidateTag: vi.fn(),
		},
	};
});

// Mock server-only package (Next.js specific import)
vi.mock("server-only", () => ({}));

// Mock Next.js router - must be hoisted
vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: vi.fn(),
		replace: vi.fn(),
		refresh: vi.fn(),
		back: vi.fn(),
		forward: vi.fn(),
		prefetch: vi.fn(),
	}),
	usePathname: () => "/admin",
	useSearchParams: () => new URLSearchParams(),
	redirect: mocks.redirect,
	notFound: mocks.notFound,
}));

// Mock Next.js cache - must be hoisted
vi.mock("next/cache", () => ({
	revalidatePath: mocks.revalidatePath,
	revalidateTag: mocks.revalidateTag,
}));

// Setup DOM environment for React Testing Library
if (typeof window !== "undefined") {
	// Add any global test utilities or polyfills here
}

// Suppress specific console errors in tests
// biome-ignore lint/suspicious/noConsole: Required for test setup
const originalError = console.error;
beforeAll(() => {
	console.error = (...args: unknown[]) => {
		if (
			typeof args[0] === "string" &&
			args[0].includes("Warning: ReactDOM.render")
		) {
			return;
		}
		originalError.call(console, ...args);
	};
});

afterAll(() => {
	console.error = originalError;
});
