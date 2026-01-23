/**
 * Test setup for Ink component tests
 *
 * This file runs before each test file and sets up the testing environment.
 */

import { afterAll, beforeAll } from "vitest";

// Suppress console output during tests unless explicitly enabled
// This keeps test output clean while allowing debugging when needed
if (!process.env.DEBUG_TESTS) {
	// Store original console methods
	const originalConsole = { ...console };

	// Suppress console methods during tests
	beforeAll(() => {
		console.log = () => {};
		console.info = () => {};
		console.debug = () => {};
		// Keep console.error and console.warn for test failures
	});

	// Restore console methods after tests
	afterAll(() => {
		console.log = originalConsole.log;
		console.info = originalConsole.info;
		console.debug = originalConsole.debug;
	});
}
