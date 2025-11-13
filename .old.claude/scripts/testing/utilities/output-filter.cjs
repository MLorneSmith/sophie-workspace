/**
 * Output Filter Utility
 * Manages test output streaming with buffer overflow prevention
 *
 * Features:
 * - Configurable output modes (full, summary, quiet, file)
 * - Smart buffering with size limits
 * - File output with rotation
 * - Memory tracking and warnings
 * - Line-based filtering
 */

const fs = require("node:fs");
const path = require("node:path");
const { PassThrough } = require("node:stream");

/**
 * Output Filter Class
 * Prevents buffer overflow by intelligently filtering and limiting output
 */
class OutputFilter {
	constructor(config = {}) {
		this.config = config;
		this.mode = config.mode || "summary";
		this.streaming = config.streaming || {};
		this.filter = config.filter || {};
		this.fileConfig = config.file || {};
		this.console = config.console || {};
		this.metrics = config.metrics || {};

		// Buffer management
		this.lineBuffer = [];
		this.maxLineBuffer = this.streaming.lineBufferSize || 1000;
		this.currentBufferSize = 0;
		this.maxBufferSize = this.streaming.maxBufferSize || 50 * 1024;

		// Line counting
		this.totalLines = 0;
		this.suppressedLines = 0;
		this.limitWarningShown = false; // Track if we've shown the limit warning

		// File output
		this.fileStream = null;
		this.fileSize = 0;

		// Timing
		this.startTime = Date.now();
		this.lastFlush = Date.now();

		// Memory tracking
		if (this.metrics.trackMemory) {
			this.memoryCheckInterval = setInterval(() => {
				this.checkMemoryUsage();
			}, 5000); // Check every 5 seconds
		}
	}

	/**
	 * Initialize file output if enabled
	 */
	async initFileOutput() {
		if (!this.fileConfig.enabled) {
			return;
		}

		try {
			const filePath = this.fileConfig.path;
			const dir = path.dirname(filePath);

			// Ensure directory exists
			if (!fs.existsSync(dir)) {
				fs.mkdirSync(dir, { recursive: true });
			}

			// Rotate if file exists and is too large
			if (fs.existsSync(filePath)) {
				const stats = fs.statSync(filePath);
				if (this.fileConfig.rotation && stats.size > this.fileConfig.maxSize) {
					this.rotateFile(filePath);
				}
			}

			// Create write stream
			this.fileStream = fs.createWriteStream(filePath, { flags: "a" });

			// Write header
			const header = `\n${"=".repeat(80)}\nTest Run: ${new Date().toISOString()}\nMode: ${this.mode}\n${"=".repeat(80)}\n`;
			this.fileStream.write(header);
		} catch (error) {
			console.error(`Failed to initialize file output: ${error.message}`);
		}
	}

	/**
	 * Rotate log file
	 */
	rotateFile(filePath) {
		const backups = this.fileConfig.keepBackups || 3;

		// Shift existing backups
		for (let i = backups - 1; i >= 1; i--) {
			const oldPath = `${filePath}.${i}`;
			const newPath = `${filePath}.${i + 1}`;
			if (fs.existsSync(oldPath)) {
				fs.renameSync(oldPath, newPath);
			}
		}

		// Move current file to .1
		fs.renameSync(filePath, `${filePath}.1`);
	}

	/**
	 * Process a line of output
	 * @param {string} line - Line to process
	 * @param {string} _stream - 'stdout' or 'stderr'
	 * @returns {boolean} - Whether to output this line
	 */
	processLine(line, _stream = "stdout") {
		this.totalLines++;

		// Always write to file if enabled
		if (this.fileStream) {
			this.fileStream.write(`${line}\n`);
			this.fileSize += line.length + 1;
		}

		// CRITICAL: Enforce HARD maximum total lines to prevent Claude Code crash
		// This is a hard limit - NO output (not even errors) after this point
		const shownLines = this.totalLines - this.suppressedLines;
		if (
			this.console.maxTotalLines &&
			shownLines >= this.console.maxTotalLines
		) {
			// Show warning once when limit is reached
			if (!this.limitWarningShown) {
				this.limitWarningShown = true;
				process.stdout.write(
					`\n⚠️  HARD OUTPUT LIMIT REACHED (${this.console.maxTotalLines} lines)\n` +
						"   All further output suppressed to prevent crash.\n" +
						`   Full output available at: ${this.fileConfig.path || "/tmp/test-output.log"}\n\n`,
				);
			}

			// Hard limit: suppress ALL lines after limit (including errors)
			this.suppressedLines++;
			return false;
		}

		// Mode-specific filtering
		switch (this.mode) {
			case "quiet":
				// Only errors and critical messages
				return this.isErrorLine(line) || this.isCriticalLine(line);

			case "summary":
				// Intelligent filtering based on content
				return this.shouldShowInSummary(line);

			case "file":
				// Only write to file, no console output
				this.suppressedLines++;
				return false;

			default:
				// Show everything (full mode)
				return true;
		}
	}

	/**
	 * Determine if line should be shown in summary mode
	 */
	shouldShowInSummary(line) {
		// Always show errors
		if (this.isErrorLine(line)) return true;

		// Always show critical info
		if (this.isCriticalLine(line)) return true;

		// Show progress indicators
		if (this.filter.showProgress && this.isProgressLine(line)) return true;

		// Show failures
		if (this.filter.showFailed && this.isFailureLine(line)) return true;

		// Show warnings
		if (this.filter.showWarnings && this.isWarningLine(line)) return true;

		// Show timing information
		if (this.filter.showTimings && this.isTimingLine(line)) return true;

		// Show coverage summaries
		if (this.filter.showCoverage && this.isCoverageLine(line)) return true;

		// Hide passed tests in summary mode
		if (!this.filter.showPassed && this.isPassedLine(line)) {
			this.suppressedLines++;
			return false;
		}

		// Hide skipped tests unless explicitly enabled
		if (!this.filter.showSkipped && this.isSkippedLine(line)) {
			this.suppressedLines++;
			return false;
		}

		// Hide verbose test runner output
		if (this.isVerboseLine(line)) {
			this.suppressedLines++;
			return false;
		}

		// Show by default in summary mode
		return true;
	}

	/**
	 * Check if line contains an error
	 */
	isErrorLine(line) {
		return (
			/error|failed|failure|exception|fatal/i.test(line) ||
			line.includes("✗") ||
			line.includes("❌") ||
			line.includes("FAIL") ||
			line.includes("stderr")
		);
	}

	/**
	 * Check if line is critical information
	 */
	isCriticalLine(line) {
		return (
			line.includes("Test Files") ||
			line.includes("Tests") ||
			line.includes("Duration") ||
			line.includes("Summary") ||
			line.includes("🚀") ||
			line.includes("✨") ||
			line.includes("📊") ||
			/INFO|ERROR|WARN/i.test(line)
		);
	}

	/**
	 * Check if line is progress indicator
	 */
	isProgressLine(line) {
		return (
			line.includes("RUN") ||
			line.includes("Running") ||
			line.includes("Executing") ||
			line.includes("Starting") ||
			line.match(/\d+\/\d+/) || // Progress like "5/10"
			line.includes("%")
		); // Percentage
	}

	/**
	 * Check if line indicates test failure
	 */
	isFailureLine(line) {
		return (
			line.includes("FAIL") ||
			line.includes("✗") ||
			line.includes("❌") ||
			line.includes("expected") ||
			line.includes("received")
		);
	}

	/**
	 * Check if line is a warning
	 */
	isWarningLine(line) {
		return (
			line.includes("WARNING") || line.includes("⚠") || line.includes("WARN")
		);
	}

	/**
	 * Check if line contains timing information
	 */
	isTimingLine(line) {
		return (
			line.includes("Duration") ||
			line.includes("ms") ||
			line.includes("Start at") ||
			line.match(/\d+s/) || // Seconds like "5s"
			line.match(/\d+m/) // Minutes like "2m"
		);
	}

	/**
	 * Check if line contains coverage information
	 */
	isCoverageLine(line) {
		return (
			line.includes("coverage") ||
			line.includes("Coverage") ||
			line.includes("branches") ||
			line.includes("functions") ||
			line.includes("lines") ||
			line.includes("statements")
		);
	}

	/**
	 * Check if line indicates passed test
	 */
	isPassedLine(line) {
		return (
			(line.includes("✓") || line.includes("PASS")) &&
			!line.includes("Test Files") &&
			!line.includes("passed")
		); // Exclude summary lines
	}

	/**
	 * Check if line indicates skipped test
	 */
	isSkippedLine(line) {
		return (
			line.includes("skipped") || line.includes("SKIP") || line.includes("todo")
		);
	}

	/**
	 * Check if line is verbose output that can be suppressed
	 */
	isVerboseLine(line) {
		return (
			line.includes("transform") ||
			line.includes("collect") ||
			line.includes("prepare") ||
			line.includes("environment") ||
			(line.includes("setup") && !this.isCriticalLine(line))
		);
	}

	/**
	 * Truncate long lines if needed
	 */
	truncateLine(line) {
		if (!this.console.truncateAt) return line;

		if (line.length > this.console.truncateAt) {
			const truncated = line.substring(0, this.console.truncateAt);
			return this.console.showEllipsis ? `${truncated}...` : truncated;
		}

		return line;
	}

	/**
	 * Check memory usage and warn if needed
	 */
	checkMemoryUsage() {
		if (!this.metrics.trackMemory) return;

		const used = process.memoryUsage();
		const heapUsed = used.heapUsed;

		if (this.metrics.errorThreshold && heapUsed > this.metrics.errorThreshold) {
			console.error(
				`\n⚠️  CRITICAL: Memory usage (${Math.round(heapUsed / 1024 / 1024)}MB) exceeds error threshold!`,
			);
			console.error(
				`   Suppressed ${this.suppressedLines} lines to prevent crash`,
			);
		} else if (
			this.metrics.warnThreshold &&
			heapUsed > this.metrics.warnThreshold
		) {
			console.warn(
				`\n⚠️  Memory usage high: ${Math.round(heapUsed / 1024 / 1024)}MB`,
			);
		}
	}

	/**
	 * Get statistics about filtered output
	 */
	getStats() {
		return {
			totalLines: this.totalLines,
			suppressedLines: this.suppressedLines,
			shownLines: this.totalLines - this.suppressedLines,
			suppressionRate: this.totalLines
				? Math.round((this.suppressedLines / this.totalLines) * 100)
				: 0,
			bufferSize: this.currentBufferSize,
			fileSize: this.fileSize,
			duration: Date.now() - this.startTime,
			memory: this.metrics.trackMemory
				? Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
				: null,
		};
	}

	/**
	 * Print summary of output filtering
	 */
	printSummary() {
		const stats = this.getStats();

		if (stats.suppressedLines > 0 || this.mode !== "full") {
			console.log("\n" + "─".repeat(80));
			console.log("📊 Output Filtering Summary");
			console.log("─".repeat(80));
			console.log(`Mode: ${this.mode}`);
			console.log(`Total Lines: ${stats.totalLines}`);
			console.log(`Shown: ${stats.shownLines}`);
			console.log(
				`Suppressed: ${stats.suppressedLines} (${stats.suppressionRate}%)`,
			);

			if (stats.memory) {
				console.log(`Memory Used: ${stats.memory}MB`);
			}

			if (this.fileStream) {
				console.log(
					`Full Output: ${this.fileConfig.path} (${Math.round(stats.fileSize / 1024)}KB)`,
				);
			}

			console.log("─".repeat(80) + "\n");
		}
	}

	/**
	 * Cleanup resources
	 */
	cleanup() {
		// Clear memory check interval
		if (this.memoryCheckInterval) {
			clearInterval(this.memoryCheckInterval);
		}

		// Close file stream
		if (this.fileStream) {
			this.fileStream.end();
			this.fileStream = null;
		}

		// Clear buffers
		this.lineBuffer = [];
		this.currentBufferSize = 0;
	}
}

/**
 * Create a filtered stream wrapper
 * @param {OutputFilter} filter - Output filter instance
 * @param {string} streamType - 'stdout' or 'stderr'
 * @returns {PassThrough} - Wrapped stream
 */
function createFilteredStream(filter, streamType = "stdout") {
	const passThrough = new PassThrough();
	let lineBuffer = "";

	passThrough.on("data", (data) => {
		lineBuffer += data.toString();
		const lines = lineBuffer.split("\n");
		lineBuffer = lines.pop() || ""; // Keep incomplete line

		for (const line of lines) {
			if (filter.processLine(line, streamType)) {
				const truncated = filter.truncateLine(line);
				const target =
					streamType === "stderr" ? process.stderr : process.stdout;
				target.write(truncated + "\n");
			}
		}
	});

	// Flush remaining buffer on end
	passThrough.on("end", () => {
		if (lineBuffer && filter.processLine(lineBuffer, streamType)) {
			const truncated = filter.truncateLine(lineBuffer);
			const target = streamType === "stderr" ? process.stderr : process.stdout;
			target.write(truncated + "\n");
		}
	});

	return passThrough;
}

module.exports = {
	OutputFilter,
	createFilteredStream,
};
