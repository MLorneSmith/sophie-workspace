/**
 * Test setup file for admin package
 * Configures testing environment for React components and admin functionality
 */

import { afterAll, beforeAll, vi } from "vitest";

// Mock Next.js router
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
	redirect: vi.fn(),
	notFound: vi.fn(),
}));

// Mock Next.js cache
vi.mock("next/cache", () => ({
	revalidatePath: vi.fn(),
	revalidateTag: vi.fn(),
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
