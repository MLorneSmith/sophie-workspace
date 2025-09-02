import type {
	Reporter,
	TestCase,
	TestResult,
	FullResult,
} from "@playwright/test/reporter";

interface TestStats {
	total: number;
	passed: number;
	failed: number;
	skipped: number;
	flaky: number;
	duration: number;
}

class FailureReporter implements Reporter {
	private stats: TestStats = {
		total: 0,
		passed: 0,
		failed: 0,
		skipped: 0,
		flaky: 0,
		duration: 0,
	};

	private failures: Array<{
		title: string;
		file: string;
		line: number;
		error: string;
		duration: number;
	}> = [];

	private startTime: number = 0;

	onBegin() {
		this.startTime = Date.now();
	}

	onTestBegin(_test: TestCase) {
		// Track test start for debugging
		if (process.env.DEBUG_TEST === "true") {
		}
	}

	onTestEnd(test: TestCase, result: TestResult) {
		this.stats.total++;

		switch (result.status) {
			case "passed":
				this.stats.passed++;
				if (process.env.DEBUG_TEST === "true") {
				}
				break;

			case "failed": {
				this.stats.failed++;
				const error = result.error?.message || "Unknown error";
				const location = test.location;

				this.failures.push({
					title: test.title,
					file: location.file,
					line: location.line,
					error: error,
					duration: result.duration,
				});
				break;
			}

			case "skipped":
				this.stats.skipped++;
				if (process.env.DEBUG_TEST === "true") {
				}
				break;

			case "flaky":
				this.stats.flaky++;
				break;
		}
	}

	onEnd(_result: FullResult) {
		const duration = Date.now() - this.startTime;
		this.stats.duration = duration;

		// Failure summary if any
		if (this.failures.length > 0) {
			// Group failures by file for better organization
			const failuresByFile = new Map<string, typeof this.failures>();
			this.failures.forEach((failure) => {
				if (!failuresByFile.has(failure.file)) {
					failuresByFile.set(failure.file, []);
				}
				failuresByFile.get(failure.file)?.push(failure);
			});

			// Display failures grouped by file
			failuresByFile.forEach((failures, _file) => {
				failures.forEach((_failure, _index) => {});
			});

			// Pattern detection for common issues
			this.detectFailurePatterns();
		}

		// Success message if all passed
		if (this.stats.failed === 0 && this.stats.total > 0) {
		}
	}

	private getPercentage(value: number): string {
		if (this.stats.total === 0) return "0";
		return ((value / this.stats.total) * 100).toFixed(1);
	}

	private detectFailurePatterns() {
		const patterns = new Map<string, number>();

		// Analyze error messages for patterns
		this.failures.forEach((failure) => {
			if (failure.error.includes("timeout")) {
				patterns.set(
					"Timeout Issues",
					(patterns.get("Timeout Issues") || 0) + 1,
				);
			}
			if (failure.error.includes("locator")) {
				patterns.set(
					"Element Not Found",
					(patterns.get("Element Not Found") || 0) + 1,
				);
			}
			if (failure.error.includes("navigation")) {
				patterns.set(
					"Navigation Problems",
					(patterns.get("Navigation Problems") || 0) + 1,
				);
			}
			if (failure.error.includes("expect")) {
				patterns.set(
					"Assertion Failures",
					(patterns.get("Assertion Failures") || 0) + 1,
				);
			}
		});

		if (patterns.size > 0) {
			patterns.forEach((_count, _pattern) => {});
		}
	}
}

export default FailureReporter;
