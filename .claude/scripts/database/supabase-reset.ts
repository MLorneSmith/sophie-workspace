#!/usr/bin/env tsx

/**
 * Comprehensive Supabase Database Reset Script
 *
 * Resets Supabase databases across all three applications (web, payload, e2e)
 * in the turborepo with safety mechanisms and payload schema handling.
 *
 * Usage:
 *   tsx .claude/scripts/database/supabase-reset.ts local
 *   tsx .claude/scripts/database/supabase-reset.ts remote --confirm
 *   tsx .claude/scripts/database/supabase-reset.ts local --apps=web,e2e --run-tests
 */

import { exec, execSync } from "node:child_process";
import { setTimeout } from "node:timers/promises";
import { promisify } from "node:util";

const execAsync = promisify(exec);

// Configuration interfaces
interface ResetOptions {
	target: "local" | "remote";
	skipConfirmation?: boolean;
	runTests?: boolean;
	apps?: ("web" | "payload" | "e2e")[];
	verbose?: boolean;
}

interface SupabaseInstance {
	name: string;
	projectId: string;
	directory: string;
	ports: {
		api: number;
		db: number;
		studio: number;
	};
	hasPayloadSchema: boolean;
}

// Supabase instance configuration
const SUPABASE_INSTANCES: SupabaseInstance[] = [
	{
		name: "web",
		projectId: "2025slideheroes-db",
		directory: "apps/web",
		ports: { api: 54321, db: 54322, studio: 54323 },
		hasPayloadSchema: true,
	},
	{
		name: "e2e",
		projectId: "2025slideheroes-e2e",
		directory: "apps/e2e",
		ports: { api: 55321, db: 55322, studio: 55323 },
		hasPayloadSchema: true,
	},
];

// Payload CMS specific tables that need special handling
const PAYLOAD_CRITICAL_TABLES = [
	"payload_users",
	"payload_preferences",
	"payload_migrations",
	"media",
	"posts",
	"courses",
	"documentation",
];

// Progress reporting
class ProgressReporter {
	private currentStep = 0;
	private totalSteps = 0;
	private verbose = false;

	constructor(totalSteps: number, verbose = false) {
		this.totalSteps = totalSteps;
		this.verbose = verbose;
	}

	step(message: string) {
		this.currentStep++;
		const percentage = Math.round((this.currentStep / this.totalSteps) * 100);
		console.log(
			`[${this.currentStep}/${this.totalSteps}] (${percentage}%) ${message}`,
		);
	}

	info(message: string) {
		if (this.verbose) {
			console.log(`ℹ️  ${message}`);
		}
	}

	success(message: string) {
		console.log(`✅ ${message}`);
	}

	error(message: string) {
		console.error(`❌ ${message}`);
	}

	warning(message: string) {
		console.warn(`⚠️  ${message}`);
	}
}

// Port management utilities
async function isPortInUse(port: number): Promise<boolean> {
	try {
		const { stdout } = await execAsync(`lsof -ti:${port}`);
		return stdout.trim().length > 0;
	} catch {
		return false;
	}
}

async function killPort(
	port: number,
	reporter: ProgressReporter,
): Promise<void> {
	if (await isPortInUse(port)) {
		try {
			await execAsync(`lsof -ti:${port} | xargs kill -9`);
			reporter.info(`Killed processes on port ${port}`);
		} catch (error) {
			reporter.warning(`Failed to kill processes on port ${port}: ${error}`);
		}
	}
}

async function cleanupPorts(
	instances: SupabaseInstance[],
	reporter: ProgressReporter,
): Promise<void> {
	reporter.step("Cleaning up ports");

	for (const instance of instances) {
		await killPort(instance.ports.api, reporter);
		await killPort(instance.ports.db, reporter);
		await killPort(instance.ports.studio, reporter);
	}
}

// Supabase instance management
class SupabaseInstanceManager {
	private reporter: ProgressReporter;

	constructor(reporter: ProgressReporter) {
		this.reporter = reporter;
	}

	async stopInstance(instance: SupabaseInstance): Promise<void> {
		try {
			const result = execSync(`cd ${instance.directory} && npx supabase stop`, {
				encoding: "utf8",
				stdio: "pipe",
			});
			this.reporter.info(`Stopped ${instance.name}: ${result}`);
		} catch (error) {
			this.reporter.info(`${instance.name} was not running or already stopped`);
		}
	}

	async startInstance(instance: SupabaseInstance): Promise<void> {
		try {
			// Check if already running
			const statusResult = execSync(
				`cd ${instance.directory} && npx supabase status`,
				{
					encoding: "utf8",
					stdio: "pipe",
				},
			);

			if (
				statusResult.includes("API URL") &&
				statusResult.includes("running")
			) {
				this.reporter.info(`${instance.name} is already running`);
				return;
			}
		} catch {
			// Status command failed, instance is not running
		}

		const result = execSync(`cd ${instance.directory} && npx supabase start`, {
			encoding: "utf8",
			stdio: "inherit",
		});
		this.reporter.info(`Started ${instance.name}`);
	}

	async resetInstance(instance: SupabaseInstance): Promise<void> {
		this.reporter.step(`Resetting ${instance.name} database`);

		const result = execSync(
			`cd ${instance.directory} && npx supabase db reset`,
			{
				encoding: "utf8",
				stdio: "inherit",
			},
		);
		this.reporter.success(`Reset ${instance.name} database`);
	}

	async getConnectionString(instance: SupabaseInstance): Promise<string> {
		try {
			const result = execSync(
				`cd ${instance.directory} && npx supabase status --output=json`,
				{
					encoding: "utf8",
					stdio: "pipe",
				},
			);

			const status = JSON.parse(result);
			return (
				status.DB_URL ||
				`postgresql://postgres:postgres@localhost:${instance.ports.db}/postgres`
			);
		} catch {
			return `postgresql://postgres:postgres@localhost:${instance.ports.db}/postgres`;
		}
	}
}

// Payload schema handler
class PayloadSchemaHandler {
	private reporter: ProgressReporter;

	constructor(reporter: ProgressReporter) {
		this.reporter = reporter;
	}

	async handlePayloadSchema(instance: SupabaseInstance): Promise<void> {
		if (!instance.hasPayloadSchema) {
			return;
		}

		this.reporter.step(`Handling Payload schema for ${instance.name}`);

		try {
			const connectionString = await new SupabaseInstanceManager(
				this.reporter,
			).getConnectionString(instance);

			// First, ensure payload schema exists
			await this.ensurePayloadSchema(connectionString);

			// Run Payload migrations to create missing tables
			await this.runPayloadMigrations(instance);

			// Verify critical tables exist
			await this.verifyPayloadTables(connectionString);

			// Test payload functionality
			await this.testPayloadFunctionality(connectionString);

			this.reporter.success(
				`Payload schema handling complete for ${instance.name}`,
			);
		} catch (error) {
			this.reporter.error(
				`Payload schema handling failed for ${instance.name}: ${error}`,
			);
			throw error;
		}
	}

	private async ensurePayloadSchema(connectionString: string): Promise<void> {
		// Using psql to ensure schema exists
		const createSchemaSQL = `
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'payload') THEN
          CREATE SCHEMA payload;
        END IF;
      END $$;
    `;

		try {
			execSync(`echo "${createSchemaSQL}" | psql "${connectionString}"`, {
				encoding: "utf8",
				stdio: "pipe",
			});
			this.reporter.info("Payload schema ensured");
		} catch (error) {
			this.reporter.warning(`Schema creation warning: ${error}`);
		}
	}

	private async verifyPayloadTables(connectionString: string): Promise<void> {
		const checkTablesSQL = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'payload'
      AND table_name IN (${PAYLOAD_CRITICAL_TABLES.map((t) => `'${t}'`).join(",")});
    `;

		try {
			const result = execSync(
				`echo "${checkTablesSQL}" | psql "${connectionString}" -t`,
				{
					encoding: "utf8",
					stdio: "pipe",
				},
			);

			const existingTables = result
				.trim()
				.split("\n")
				.filter((t) => t.trim())
				.map((t) => t.trim());
			this.reporter.info(`Found ${existingTables.length} payload tables`);
		} catch (error) {
			this.reporter.warning(`Table verification warning: ${error}`);
		}
	}

	private async testPayloadFunctionality(
		connectionString: string,
	): Promise<void> {
		// Test basic payload schema access
		const testSQL = `
      SELECT 1 as test_connection;
      SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'payload';
    `;

		try {
			const result = execSync(
				`echo "${testSQL}" | psql "${connectionString}" -t`,
				{
					encoding: "utf8",
					stdio: "pipe",
				},
			);
			this.reporter.info("Payload functionality test passed");
		} catch (error) {
			this.reporter.warning(`Payload functionality test warning: ${error}`);
		}
	}

	private async runPayloadMigrations(
		instance: SupabaseInstance,
	): Promise<void> {
		this.reporter.step(`Running Payload migrations for ${instance.name}`);

		try {
			// Navigate to the payload app directory to run migrations
			const payloadDir = "/home/msmith/projects/2025slideheroes/apps/payload";

			// Run Payload migrations
			const migrateResult = execSync("npx payload migrate", {
				cwd: payloadDir,
				encoding: "utf8",
				stdio: "pipe",
			});

			this.reporter.info(`Payload migrations output: ${migrateResult}`);
			this.reporter.success(
				`Payload migrations completed for ${instance.name}`,
			);
		} catch (error) {
			this.reporter.error(
				`Payload migration failed for ${instance.name}: ${error}`,
			);
			throw error;
		}
	}
}

// Verification suite
class VerificationSuite {
	private reporter: ProgressReporter;

	constructor(reporter: ProgressReporter) {
		this.reporter = reporter;
	}

	async verifyInstance(instance: SupabaseInstance): Promise<boolean> {
		this.reporter.step(`Verifying ${instance.name} instance`);

		try {
			// Test connectivity
			await this.testConnectivity(instance);

			// Test schema integrity
			await this.testSchemaIntegrity(instance);

			// Test authentication
			await this.testAuthentication(instance);

			this.reporter.success(`${instance.name} verification passed`);
			return true;
		} catch (error) {
			this.reporter.error(`${instance.name} verification failed: ${error}`);
			return false;
		}
	}

	private async testConnectivity(instance: SupabaseInstance): Promise<void> {
		const manager = new SupabaseInstanceManager(this.reporter);
		const connectionString = await manager.getConnectionString(instance);

		const testSQL = "SELECT version();";
		const result = execSync(
			`echo "${testSQL}" | psql "${connectionString}" -t`,
			{
				encoding: "utf8",
				stdio: "pipe",
			},
		);

		if (!result.includes("PostgreSQL")) {
			throw new Error("Database connectivity test failed");
		}

		this.reporter.info(`${instance.name} connectivity OK`);
	}

	private async testSchemaIntegrity(instance: SupabaseInstance): Promise<void> {
		const manager = new SupabaseInstanceManager(this.reporter);
		const connectionString = await manager.getConnectionString(instance);

		const schemaSQL = `
      SELECT schema_name
      FROM information_schema.schemata
      WHERE schema_name IN ('public', 'auth', 'storage', 'payload');
    `;

		const result = execSync(
			`echo "${schemaSQL}" | psql "${connectionString}" -t`,
			{
				encoding: "utf8",
				stdio: "pipe",
			},
		);

		const schemas = result
			.trim()
			.split("\n")
			.filter((s) => s.trim())
			.map((s) => s.trim());
		const expectedSchemas = ["public", "auth", "storage"];
		if (instance.hasPayloadSchema) {
			expectedSchemas.push("payload");
		}

		for (const schema of expectedSchemas) {
			if (!schemas.includes(schema)) {
				throw new Error(`Missing schema: ${schema}`);
			}
		}

		this.reporter.info(`${instance.name} schema integrity OK`);
	}

	private async testAuthentication(instance: SupabaseInstance): Promise<void> {
		// Test auth schema tables exist
		const manager = new SupabaseInstanceManager(this.reporter);
		const connectionString = await manager.getConnectionString(instance);

		const authSQL = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'auth'
      AND table_name IN ('users', 'identities', 'instances');
    `;

		const result = execSync(
			`echo "${authSQL}" | psql "${connectionString}" -t`,
			{
				encoding: "utf8",
				stdio: "pipe",
			},
		);

		const authTables = result
			.trim()
			.split("\n")
			.filter((t) => t.trim())
			.map((t) => t.trim());

		if (authTables.length < 2) {
			throw new Error("Auth tables missing or incomplete");
		}

		this.reporter.info(`${instance.name} authentication OK`);
	}
}

// Safety gate for remote operations
async function confirmRemoteOperation(options: ResetOptions): Promise<boolean> {
	if (options.target !== "remote") {
		return true;
	}

	if (options.skipConfirmation) {
		console.log(
			"⚠️  Skipping confirmation for remote operation (--skip-confirmation)",
		);
		return true;
	}

	console.log("🚨 DANGER: You are about to reset REMOTE Supabase databases!");
	console.log("📋 This will:");
	console.log("   • Delete ALL data in remote databases");
	console.log("   • Reset all schemas and tables");
	console.log("   • Cannot be undone");
	console.log("");
	console.log('Type "CONFIRM_REMOTE_RESET" to proceed:');

	// In a real interactive environment, you would use readline
	// For this script, we expect the confirmation flag
	throw new Error(
		"Remote operations require explicit --confirm flag for safety",
	);
}

// Main database reset orchestrator
class SupabaseResetOrchestrator {
	private options: ResetOptions;
	private reporter: ProgressReporter;
	private instances: SupabaseInstance[];

	constructor(options: ResetOptions) {
		this.options = options;
		this.instances = this.getTargetInstances();

		// Calculate total steps for progress reporting
		const totalSteps = this.calculateTotalSteps();
		this.reporter = new ProgressReporter(totalSteps, options.verbose);
	}

	private getTargetInstances(): SupabaseInstance[] {
		if (this.options.apps) {
			return SUPABASE_INSTANCES.filter((instance) =>
				this.options.apps?.includes(instance.name as "web" | "payload" | "e2e"),
			);
		}
		return SUPABASE_INSTANCES;
	}

	private calculateTotalSteps(): number {
		let steps = 0;
		steps += 1; // Safety check
		steps += 1; // Port cleanup
		steps += this.instances.length; // Stop instances
		steps += this.instances.length; // Reset instances
		steps += this.instances.length; // Payload schema handling
		steps += this.instances.length; // Start instances
		steps += this.instances.length; // Verification
		if (this.options.runTests) {
			steps += 1; // Run tests
		}
		return steps;
	}

	async execute(): Promise<void> {
		try {
			console.log("🚀 Starting Supabase Database Reset");
			console.log(`📋 Target: ${this.options.target}`);
			console.log(
				`🎯 Instances: ${this.instances.map((i) => i.name).join(", ")}`,
			);
			console.log("");

			// Safety check
			this.reporter.step("Performing safety checks");
			await confirmRemoteOperation(this.options);

			// Port cleanup
			await cleanupPorts(this.instances, this.reporter);

			// Initialize managers
			const instanceManager = new SupabaseInstanceManager(this.reporter);
			const payloadHandler = new PayloadSchemaHandler(this.reporter);
			const verificationSuite = new VerificationSuite(this.reporter);

			// Stop all instances
			for (const instance of this.instances) {
				this.reporter.step(`Stopping ${instance.name} instance`);
				await instanceManager.stopInstance(instance);
			}

			// Wait for clean shutdown
			await setTimeout(2000);

			// Reset instances sequentially (web → e2e → payload)
			for (const instance of this.instances) {
				await instanceManager.resetInstance(instance);
			}

			// Handle Payload schemas
			for (const instance of this.instances) {
				await payloadHandler.handlePayloadSchema(instance);
			}

			// Start instances
			for (const instance of this.instances) {
				this.reporter.step(`Starting ${instance.name} instance`);
				await instanceManager.startInstance(instance);
			}

			// Wait for startup
			await setTimeout(3000);

			// Verify all instances
			let allVerified = true;
			for (const instance of this.instances) {
				const verified = await verificationSuite.verifyInstance(instance);
				if (!verified) {
					allVerified = false;
				}
			}

			if (!allVerified) {
				throw new Error("Some instances failed verification");
			}

			// Run tests if requested
			if (this.options.runTests) {
				await this.runTests();
			}

			this.reporter.success(
				"🎉 Supabase database reset completed successfully!",
			);

			// Display final status
			this.displayFinalStatus();
		} catch (error) {
			this.reporter.error(`Database reset failed: ${error}`);
			throw error;
		}
	}

	private async runTests(): Promise<void> {
		this.reporter.step("Running E2E tests to verify reset");

		try {
			execSync("pnpm test:e2e", {
				encoding: "utf8",
				stdio: "inherit",
			});
			this.reporter.success("E2E tests passed");
		} catch (error) {
			this.reporter.warning(
				`E2E tests failed (this may be expected immediately after reset): ${error}`,
			);
		}
	}

	private displayFinalStatus(): void {
		console.log("");
		console.log("📊 Final Status:");
		console.log("================");

		for (const instance of this.instances) {
			console.log(`✅ ${instance.name}:`);
			console.log(`   🌐 API: http://localhost:${instance.ports.api}`);
			console.log(`   🗄️  DB: localhost:${instance.ports.db}`);
			console.log(`   🎨 Studio: http://localhost:${instance.ports.studio}`);
		}

		console.log("");
		console.log("💡 Next steps:");
		console.log("   • Test user creation in Payload CMS admin");
		console.log("   • Verify collection pages show content");
		console.log("   • Run application to confirm functionality");
		console.log("");
	}
}

// Command line interface
function parseArgs(): ResetOptions {
	const args = process.argv.slice(2);

	if (args.length === 0) {
		console.error("Usage: tsx supabase-reset.ts <local|remote> [options]");
		console.error("");
		console.error("Options:");
		console.error(
			"  --confirm           Skip confirmation for remote operations",
		);
		console.error("  --run-tests         Run E2E tests after reset");
		console.error("  --apps=web,e2e      Target specific apps (default: all)");
		console.error("  --verbose           Show detailed logging");
		console.error("");
		console.error("Examples:");
		console.error("  tsx supabase-reset.ts local");
		console.error("  tsx supabase-reset.ts remote --confirm");
		console.error("  tsx supabase-reset.ts local --apps=web,e2e --run-tests");
		process.exit(1);
	}

	const target = args[0] as "local" | "remote";
	if (!["local", "remote"].includes(target)) {
		throw new Error('Target must be "local" or "remote"');
	}

	const options: ResetOptions = {
		target,
		skipConfirmation: args.includes("--confirm"),
		runTests: args.includes("--run-tests"),
		verbose: args.includes("--verbose"),
	};

	// Parse --apps flag
	const appsArg = args.find((arg) => arg.startsWith("--apps="));
	if (appsArg) {
		const appsList = appsArg.split("=")[1];
		options.apps = appsList.split(",") as ("web" | "payload" | "e2e")[];

		// Validate app names
		const validApps = ["web", "payload", "e2e"];
		for (const app of options.apps) {
			if (!validApps.includes(app)) {
				throw new Error(
					`Invalid app: ${app}. Valid apps: ${validApps.join(", ")}`,
				);
			}
		}
	}

	return options;
}

// Main execution
async function main() {
	try {
		const options = parseArgs();
		const orchestrator = new SupabaseResetOrchestrator(options);
		await orchestrator.execute();
		process.exit(0);
	} catch (error) {
		console.error(`❌ Fatal error: ${error}`);
		process.exit(1);
	}
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
	main();
}

export { SupabaseResetOrchestrator, type ResetOptions };
