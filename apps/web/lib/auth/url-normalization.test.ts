import { describe, expect, it } from "vitest";
import {
	getCookieNameFromUrl,
	getProjectRefFromUrl,
	normalizeUrl,
	urlsMatch,
	validateSupabaseUrls,
} from "./url-normalization";

describe("url-normalization", () => {
	describe("normalizeUrl", () => {
		it("removes trailing slashes", () => {
			expect(normalizeUrl("https://example.supabase.co/")).toBe(
				"https://example.supabase.co",
			);
			expect(normalizeUrl("https://example.supabase.co")).toBe(
				"https://example.supabase.co",
			);
		});

		it("handles localhost URLs", () => {
			expect(normalizeUrl("http://127.0.0.1:54521/")).toBe(
				"http://127.0.0.1:54521",
			);
			expect(normalizeUrl("http://127.0.0.1:54521")).toBe(
				"http://127.0.0.1:54521",
			);
			expect(normalizeUrl("http://localhost:54521/")).toBe(
				"http://localhost:54521",
			);
		});

		it("handles Docker internal URLs", () => {
			expect(normalizeUrl("http://host.docker.internal:54521/")).toBe(
				"http://host.docker.internal:54521",
			);
			expect(normalizeUrl("http://host.docker.internal:54521")).toBe(
				"http://host.docker.internal:54521",
			);
		});

		it("handles production Supabase URLs", () => {
			expect(normalizeUrl("https://abc123xyz.supabase.co/")).toBe(
				"https://abc123xyz.supabase.co",
			);
			expect(normalizeUrl("https://abc123xyz.supabase.co")).toBe(
				"https://abc123xyz.supabase.co",
			);
		});

		it("preserves protocol", () => {
			expect(normalizeUrl("http://example.com")).toBe("http://example.com");
			expect(normalizeUrl("https://example.com")).toBe("https://example.com");
		});

		it("returns empty string for empty or null inputs", () => {
			expect(normalizeUrl("")).toBe("");
			expect(normalizeUrl(null)).toBe("");
			expect(normalizeUrl(undefined)).toBe("");
		});

		it("handles multiple trailing slashes", () => {
			expect(normalizeUrl("https://example.com///")).toBe(
				"https://example.com",
			);
		});
	});

	describe("urlsMatch", () => {
		it("returns true for identical URLs", () => {
			expect(
				urlsMatch("https://example.supabase.co", "https://example.supabase.co"),
			).toBe(true);
		});

		it("returns true when only trailing slash differs", () => {
			expect(
				urlsMatch(
					"https://example.supabase.co/",
					"https://example.supabase.co",
				),
			).toBe(true);
			expect(
				urlsMatch("http://127.0.0.1:54521", "http://127.0.0.1:54521/"),
			).toBe(true);
		});

		it("returns false for different hosts", () => {
			expect(
				urlsMatch("http://127.0.0.1:54521", "http://localhost:54521"),
			).toBe(false);
			expect(
				urlsMatch(
					"http://host.docker.internal:54521",
					"http://127.0.0.1:54521",
				),
			).toBe(false);
		});

		it("returns false for different ports", () => {
			expect(
				urlsMatch("http://127.0.0.1:54521", "http://127.0.0.1:54522"),
			).toBe(false);
		});

		it("returns false for different protocols", () => {
			expect(urlsMatch("http://example.com", "https://example.com")).toBe(
				false,
			);
		});

		it("returns true for empty/null comparisons", () => {
			expect(urlsMatch("", "")).toBe(true);
			expect(urlsMatch(null, null)).toBe(true);
			expect(urlsMatch(undefined, undefined)).toBe(true);
		});

		it("returns false when one is empty", () => {
			expect(urlsMatch("https://example.com", "")).toBe(false);
			expect(urlsMatch("", "https://example.com")).toBe(false);
		});
	});

	describe("getProjectRefFromUrl", () => {
		it("extracts project ref from localhost URL", () => {
			expect(getProjectRefFromUrl("http://127.0.0.1:54521")).toBe("127");
			expect(getProjectRefFromUrl("http://localhost:54521")).toBe("localhost");
		});

		it("extracts project ref from Docker internal URL", () => {
			expect(getProjectRefFromUrl("http://host.docker.internal:54521")).toBe(
				"host",
			);
		});

		it("extracts project ref from Supabase production URL", () => {
			expect(getProjectRefFromUrl("https://abc123xyz.supabase.co")).toBe(
				"abc123xyz",
			);
			expect(getProjectRefFromUrl("https://myproject.supabase.co")).toBe(
				"myproject",
			);
		});

		it("returns null for invalid inputs", () => {
			expect(getProjectRefFromUrl("")).toBe(null);
			expect(getProjectRefFromUrl(null)).toBe(null);
			expect(getProjectRefFromUrl(undefined)).toBe(null);
			expect(getProjectRefFromUrl("not-a-url")).toBe(null);
		});
	});

	describe("getCookieNameFromUrl", () => {
		it("generates correct cookie name for localhost", () => {
			expect(getCookieNameFromUrl("http://127.0.0.1:54521")).toBe(
				"sb-127-auth-token",
			);
			expect(getCookieNameFromUrl("http://localhost:54521")).toBe(
				"sb-localhost-auth-token",
			);
		});

		it("generates correct cookie name for Docker internal URL", () => {
			expect(getCookieNameFromUrl("http://host.docker.internal:54521")).toBe(
				"sb-host-auth-token",
			);
		});

		it("generates correct cookie name for Supabase production URL", () => {
			expect(getCookieNameFromUrl("https://abc123xyz.supabase.co")).toBe(
				"sb-abc123xyz-auth-token",
			);
		});

		it("returns unknown cookie name for invalid input", () => {
			expect(getCookieNameFromUrl("")).toBe("sb-unknown-auth-token");
			expect(getCookieNameFromUrl(null)).toBe("sb-unknown-auth-token");
		});
	});

	describe("validateSupabaseUrls", () => {
		it("returns valid when URLs match exactly", () => {
			const result = validateSupabaseUrls(
				"http://127.0.0.1:54521",
				"http://127.0.0.1:54521",
			);
			expect(result.isValid).toBe(true);
			expect(result.mismatchReason).toBeNull();
		});

		it("returns valid when URLs differ only by trailing slash", () => {
			const result = validateSupabaseUrls(
				"http://127.0.0.1:54521/",
				"http://127.0.0.1:54521",
			);
			expect(result.isValid).toBe(true);
			expect(result.mismatchReason).toBeNull();
		});

		it("returns invalid when project refs differ", () => {
			const result = validateSupabaseUrls(
				"http://host.docker.internal:54521",
				"http://127.0.0.1:54521",
			);
			expect(result.isValid).toBe(false);
			expect(result.mismatchReason).toContain("Project ref mismatch");
			expect(result.e2eProjectRef).toBe("host");
			expect(result.appProjectRef).toBe("127");
		});

		it("returns invalid when E2E URL is missing", () => {
			const result = validateSupabaseUrls(null, "http://127.0.0.1:54521");
			expect(result.isValid).toBe(false);
			expect(result.mismatchReason).toContain(
				"E2E Supabase URL is not configured",
			);
		});

		it("returns invalid when app URL is missing", () => {
			const result = validateSupabaseUrls("http://127.0.0.1:54521", null);
			expect(result.isValid).toBe(false);
			expect(result.mismatchReason).toContain(
				"App Supabase URL (NEXT_PUBLIC_SUPABASE_URL) is not configured",
			);
		});

		it("includes all validation details in result", () => {
			const result = validateSupabaseUrls(
				"http://127.0.0.1:54521/",
				"http://127.0.0.1:54521",
			);

			expect(result.e2eNormalized).toBe("http://127.0.0.1:54521");
			expect(result.appNormalized).toBe("http://127.0.0.1:54521");
			expect(result.e2eProjectRef).toBe("127");
			expect(result.appProjectRef).toBe("127");
			expect(result.e2eCookieName).toBe("sb-127-auth-token");
			expect(result.appCookieName).toBe("sb-127-auth-token");
		});

		it("detects cookie name mismatch even when URLs look similar", () => {
			// This scenario should be caught by project ref validation
			const result = validateSupabaseUrls(
				"http://host.docker.internal:54521",
				"http://127.0.0.1:54521",
			);

			expect(result.isValid).toBe(false);
			expect(result.e2eCookieName).toBe("sb-host-auth-token");
			expect(result.appCookieName).toBe("sb-127-auth-token");
		});
	});
});
