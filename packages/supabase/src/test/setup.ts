/**
 * Test setup file for @kit/supabase package
 * Configures testing environment for Supabase client utilities
 */

import { vi } from "vitest";

// Mock server-only package (Next.js specific import)
vi.mock("server-only", () => ({}));

// Mock next/headers for cookie handling
vi.mock("next/headers", () => ({
	cookies: vi.fn(() => ({
		getAll: vi.fn(() => []),
		get: vi.fn(),
		set: vi.fn(),
	})),
}));

// Set up default environment variables for tests
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test-project.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_PUBLIC_KEY = "test-public-key-123";
process.env.SUPABASE_SECRET_KEY = "test-secret-key-456";
