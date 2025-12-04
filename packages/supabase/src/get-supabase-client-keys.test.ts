/**
 * Unit tests for getSupabaseClientKeys
 * Tests environment variable validation and loading
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("getSupabaseClientKeys", () => {
	const originalEnv = process.env;

	beforeEach(() => {
		// Reset modules to clear cached imports
		vi.resetModules();
		// Clone the original environment
		process.env = { ...originalEnv };
	});

	afterEach(() => {
		// Restore original environment
		process.env = originalEnv;
	});

	describe("Valid Configuration", () => {
		it("should return url and publicKey from environment variables", async () => {
			process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
			process.env.NEXT_PUBLIC_SUPABASE_PUBLIC_KEY = "public-key-123";

			const { getSupabaseClientKeys } = await import(
				"./get-supabase-client-keys"
			);
			const keys = getSupabaseClientKeys();

			expect(keys.url).toBe("https://test.supabase.co");
			expect(keys.publicKey).toBe("public-key-123");
		});

		it("should use NEXT_PUBLIC_SUPABASE_ANON_KEY as fallback for publicKey", async () => {
			process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
			process.env.NEXT_PUBLIC_SUPABASE_PUBLIC_KEY = undefined;
			process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key-456";

			const { getSupabaseClientKeys } = await import(
				"./get-supabase-client-keys"
			);
			const keys = getSupabaseClientKeys();

			expect(keys.url).toBe("https://test.supabase.co");
			expect(keys.publicKey).toBe("anon-key-456");
		});

		it("should prefer NEXT_PUBLIC_SUPABASE_PUBLIC_KEY over ANON_KEY", async () => {
			process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
			process.env.NEXT_PUBLIC_SUPABASE_PUBLIC_KEY = "public-key-123";
			process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key-456";

			const { getSupabaseClientKeys } = await import(
				"./get-supabase-client-keys"
			);
			const keys = getSupabaseClientKeys();

			expect(keys.publicKey).toBe("public-key-123");
		});
	});

	describe("Invalid Configuration", () => {
		it("should throw error when NEXT_PUBLIC_SUPABASE_URL is missing", async () => {
			process.env.NEXT_PUBLIC_SUPABASE_URL = undefined;
			process.env.NEXT_PUBLIC_SUPABASE_PUBLIC_KEY = "public-key-123";

			const { getSupabaseClientKeys } = await import(
				"./get-supabase-client-keys"
			);

			expect(() => getSupabaseClientKeys()).toThrow();
		});

		it("should throw error when both publicKey and anonKey are missing", async () => {
			process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
			process.env.NEXT_PUBLIC_SUPABASE_PUBLIC_KEY = undefined;
			process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = undefined;

			const { getSupabaseClientKeys } = await import(
				"./get-supabase-client-keys"
			);

			expect(() => getSupabaseClientKeys()).toThrow();
		});

		it("should throw error when all environment variables are missing", async () => {
			process.env.NEXT_PUBLIC_SUPABASE_URL = undefined;
			process.env.NEXT_PUBLIC_SUPABASE_PUBLIC_KEY = undefined;
			process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = undefined;

			const { getSupabaseClientKeys } = await import(
				"./get-supabase-client-keys"
			);

			expect(() => getSupabaseClientKeys()).toThrow();
		});
	});
});
