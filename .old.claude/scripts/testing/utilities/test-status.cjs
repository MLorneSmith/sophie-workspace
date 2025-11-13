/**
 * Test Status Module
 * Tracks and reports test execution status across all phases
 */

const fs = require("node:fs").promises;

/**
 * Stringify JSON with tab indentation for Biome compatibility
 * @param {*} data - Data to stringify
 * @returns {string} JSON string with tab indentation
 */
function stringifyWithTabs(data) {
	return JSON.stringify(data, null, "\t");
}

class TestStatus {
	constructor(config) {
		this.config = config;
		this.reset();
	}

	reset() {
		this.status = {
			phase: "initializing",
			status: "running",
			startTime: new Date().toISOString(),
			unit: { total: 0, passed: 0, failed: 0, skipped: 0 },
			e2e: {
				total: 0,
				passed: 0,
				failed: 0,
				skipped: 0,
				intentionalFailures: 0,
				shards: {},
			},
			infrastructure: {
				supabase: "unknown",
				ports: "unknown",
				environment: "unknown",
			},
			errors: [],
		};
	}

	async save() {
		await fs.writeFile(this.config.resultFile, stringifyWithTabs(this.status));
	}

	async updateStatusLine(status, passed = 0, failed = 0, total = 0) {
		const timestamp = Math.floor(Date.now() / 1000);
		const line = `${status}|${timestamp}|${passed}|${failed}|${total}`;
		await fs.writeFile(this.config.statusFile, line);
	}

	// Additional helper methods for status updates
	setPhase(phase) {
		this.status.phase = phase;
		return this.save();
	}

	addError(error) {
		this.status.errors.push({
			timestamp: new Date().toISOString(),
			phase: this.status.phase,
			message: error.message || error,
			stack: error.stack,
		});
		return this.save();
	}

	updateInfrastructure(key, value) {
		if (Object.hasOwn(this.status.infrastructure, key)) {
			this.status.infrastructure[key] = value;
			return this.save();
		}
		throw new Error(`Unknown infrastructure key: ${key}`);
	}

	updateUnitTests(updates) {
		Object.assign(this.status.unit, updates);
		return this.save();
	}

	updateE2ETests(updates) {
		Object.assign(this.status.e2e, updates);
		return this.save();
	}

	updateShard(shardId, updates) {
		if (!this.status.e2e.shards[shardId]) {
			this.status.e2e.shards[shardId] = {
				status: "pending",
				passed: 0,
				failed: 0,
				total: 0,
				startTime: null,
				endTime: null,
			};
		}
		Object.assign(this.status.e2e.shards[shardId], updates);
		return this.save();
	}

	getStatus() {
		return { ...this.status };
	}

	getSummary() {
		const { unit, e2e } = this.status;
		const totalPassed = unit.passed + e2e.passed;
		const totalFailed = unit.failed + e2e.failed;
		const totalSkipped = unit.skipped + e2e.skipped;
		const total = unit.total + e2e.total;

		// Calculate actual failures (excluding intentional failures)
		const intentionalFailures = e2e.intentionalFailures || 0;
		const actualFailures = totalFailed - intentionalFailures;

		return {
			total,
			passed: totalPassed,
			failed: totalFailed,
			skipped: totalSkipped,
			intentionalFailures,
			actualFailures,
			success: actualFailures === 0,
			duration: this.calculateDuration(),
		};
	}

	calculateDuration() {
		const start = new Date(this.status.startTime);
		const end = new Date();
		return Math.round((end - start) / 1000); // Duration in seconds
	}
}

module.exports = { TestStatus };
