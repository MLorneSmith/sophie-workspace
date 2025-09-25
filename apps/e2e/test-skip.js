// Quick test to verify skip condition works
const { test } = require("@playwright/test");

test("test skip verification", async (_, testInfo) => {
	if (process.env.PLAYWRIGHT_PARALLEL === "true") {
		testInfo.skip(true, "Test skipped in parallel mode");
		return;
	}
	// Test runs when PLAYWRIGHT_PARALLEL is not true
});
