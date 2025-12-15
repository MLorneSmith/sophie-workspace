import { expect, test } from "./utils/base-test";

/**
 * Test file to verify that Playwright continues running all tests despite failures.
 * This file contains intentional failures to test the configuration from Issue #275.
 *
 * Uses Playwright's test.fail() annotation to mark tests as "expected to fail".
 * These tests will be reported as "expected failures" rather than actual test failures.
 *
 * Expected behavior: ALL 11 tests should run, regardless of failures.
 * - 8 tests should PASS
 * - 3 tests are EXPECTED TO FAIL (Tests 2, 4, and 7) using test.fail() annotation
 */

test.describe("@skip-in-ci Configuration Verification - Continue on Failure", () => {
	test("Test 1: Should PASS", async () => {
		expect(true).toBe(true);
	});

	test("Test 2: Expected failure - demonstrates test.fail() annotation", async () => {
		// This test is marked as expected to fail
		// Playwright treats this as "expected failure" not an actual test failure
		test.fail();
		expect(true).toBe(false); // This fails, matching what test.fail() expects
	});

	test("Test 3: Should still run after expected failure", async () => {
		expect(2 + 2).toBe(4);
	});

	test("Test 4: Expected failure - demonstrates error handling", async () => {
		// This test is marked as expected to fail
		test.fail();
		expect(true).toBe(false); // This fails, matching what test.fail() expects
	});

	test("Test 5: Should continue after expected failure", async () => {
		expect("hello").toContain("hello");
	});

	test.describe("Nested suite with failures", () => {
		test("Test 6: Nested test should run", async () => {
			expect([1, 2, 3]).toHaveLength(3);
		});

		test("Test 7: Nested expected failure", async () => {
			// This test is marked as expected to fail
			test.fail();
			expect(true).toBe(false); // This fails, matching what test.fail() expects
		});

		test("Test 8: Should run after nested expected failure", async () => {
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

test.describe("@skip-in-ci Summary Verification", () => {
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
    - 3 expected-to-fail tests (using test.fail() annotation)

    All tests should have run despite expected failures.
    Expected failures are not counted as test failures by Playwright.
    =====================================================
    `);
	});

	test("Verification marker test", async () => {
		// This test just marks that we reached the end
		expect("configuration").toBe("configuration");
	});
});
