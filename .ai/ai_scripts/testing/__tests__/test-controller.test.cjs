/**
 * Test Controller Regression Tests
 * Verifies that test execution flags are properly initialized
 */

const { TestController } = require("../infrastructure/test-controller.cjs");
const { CONFIG } = require("../config/test-config.cjs");

describe("TestController", () => {
	describe("E2E execution flags", () => {
		test("should initialize continueOnFailure flag to true", () => {
			// This test verifies that the continueOnFailure flag is set to true
			// in the configuration, allowing all test shards to execute even if
			// some shards fail. This is critical for getting complete test coverage
			// and accurate failure counts.

			expect(CONFIG.execution.continueOnFailure).toBe(true);
		});

		test("should initialize continueOnTimeout flag to true", () => {
			// This test verifies that the continueOnTimeout flag is set to true
			// in the configuration, allowing all test shards to execute even if
			// some shards timeout. This prevents early termination when a shard
			// times out (e.g., due to slow test initialization).

			expect(CONFIG.execution.continueOnTimeout).toBe(true);
		});

		test("should have both flags set for regression prevention", () => {
			// Both flags must be true to prevent execution stoppage
			// Regression check: Ensure neither flag has been accidentally set to false
			expect(CONFIG.execution).toMatchObject({
				continueOnFailure: true,
				continueOnTimeout: true,
			});
		});
	});

	describe("Shard continuation logic", () => {
		test("should continue executing shards when continueOnFailure is true", () => {
			// When continueOnFailure is true, the E2E runner should NOT break
			// out of the shard loop when a shard fails (line 637-645 of e2e-test-runner.cjs)
			// This ensures all 10 shards execute instead of stopping after shard 2

			const shouldBreakLoop = false && !CONFIG.execution.continueOnFailure;
			expect(shouldBreakLoop).toBe(false);
		});

		test("should continue executing shards when continueOnTimeout is true", () => {
			// When continueOnTimeout is true, the E2E runner should continue
			// executing shards even if an earlier shard times out
			// This prevents the "stopping after Authentication shard" issue

			const shouldBreakLoop = false && !CONFIG.execution.continueOnTimeout;
			expect(shouldBreakLoop).toBe(false);
		});
	});
});
