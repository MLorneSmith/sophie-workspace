import { test, expect } from "@playwright/test";

/**
 * Test file to verify that Playwright continues running all tests despite failures.
 * This file contains intentional failures to test the configuration from Issue #275.
 *
 * Expected behavior: ALL 11 tests should run, regardless of failures.
 * - 8 tests should PASS
 * - 3 tests should FAIL (intentionally - Tests 2, 4, and 7)
 */

test.describe("Configuration Verification - Continue on Failure", () => {
	test("Test 1: Should PASS", async () => {
		expect(true).toBe(true);
	});

	test("Test 2: Intentional FAILURE", async () => {
		expect(true).toBe(false); // This will fail
	});

	test("Test 3: Should still run after failure", async () => {
		expect(2 + 2).toBe(4);
	});

	test("Test 4: Another intentional FAILURE", async () => {
		throw new Error("This test throws an error intentionally");
	});

	test("Test 5: Should continue after thrown error", async () => {
		expect("hello").toContain("hello");
	});

	test.describe("Nested suite with failures", () => {
		test("Test 6: Nested test should run", async () => {
			expect([1, 2, 3]).toHaveLength(3);
		});

		test("Test 7: Nested intentional FAILURE", async () => {
			expect("fail").toBe("pass"); // This will fail
		});

		test("Test 8: Should run after nested failure", async () => {
			expect(Math.PI).toBeCloseTo(3.14, 1);
		});
	});

	test("Test 9: Final test should run", async () => {
		expect({ a: 1 }).toHaveProperty("a");
	});

	test("Test 10: Last test to verify all tests executed", async () => {
		console.log("✅ Test 10 executed - ALL TESTS RAN!");
		expect(true).toBe(true);
	});
});

test.describe("Summary Verification", () => {
	test.afterAll(async () => {
		console.log(`
    =====================================================
    CONFIGURATION VERIFICATION COMPLETE
    =====================================================
    If you see this message and all 10 tests from the
    previous suite were executed (including Test 10),
    then the configuration is working correctly!
    
    Expected: 11 tests total (10 in main suite + 1 verification)
    - 8 passing tests
    - 3 failing tests (intentional)
    
    All tests should have run despite the failures.
    =====================================================
    `);
	});

	test("Verification marker test", async () => {
		// This test just marks that we reached the end
		expect("configuration").toBe("configuration");
	});
});
