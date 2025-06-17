"use client";

import { isBrowser } from "@kit/shared/utils";

import { createServiceLogger } from "@kit/shared/logger";

// Initialize service logger
const { getLogger } = createServiceLogger("FEATURE-AUTH");

// Key for localStorage
const LAST_AUTH_METHOD_KEY = "auth_last_method";

// Types of authentication methods
export type AuthMethod = "password" | "otp" | "magic_link" | "oauth";

export interface LastAuthMethod {
	method: AuthMethod;
	provider?: string; // For OAuth providers (e.g., 'google', 'github')
	email?: string; // Store email for method-specific hints
	timestamp: number;
}

/**
 * Save the last used authentication method to localStorage
 */
export function saveLastAuthMethod(authMethod: LastAuthMethod): void {
	try {
		localStorage.setItem(LAST_AUTH_METHOD_KEY, JSON.stringify(authMethod));
	} catch (error) {
		// TODO: Async logger needed
		// (await getLogger()).warn("Failed to save last auth method:", { data: error });
	}
}

/**
 * Get the last used authentication method from localStorage
 */
export function getLastAuthMethod() {
	if (!isBrowser()) {
		return null;
	}

	try {
		const stored = localStorage.getItem(LAST_AUTH_METHOD_KEY);

		if (!stored) {
			return null;
		}

		const parsed = JSON.parse(stored) as LastAuthMethod;

		// Check if the stored method is older than 30 days
		const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

		if (parsed.timestamp < thirtyDaysAgo) {
			localStorage.removeItem(LAST_AUTH_METHOD_KEY);

			return null;
		}

		return parsed;
	} catch (error) {
		// TODO: Async logger needed
		// (await getLogger()).warn("Failed to get last auth method:", { data: error });
		return null;
	}
}

/**
 * Clear the last used authentication method from localStorage
 */
export function clearLastAuthMethod() {
	try {
		localStorage.removeItem(LAST_AUTH_METHOD_KEY);
	} catch (error) {
		// TODO: Async logger needed
		// (await getLogger()).warn("Failed to clear last auth method:", { data: error });
	}
}
