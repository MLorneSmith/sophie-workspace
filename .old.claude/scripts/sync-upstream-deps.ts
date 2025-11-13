#!/usr/bin/env tsx

/**
 * Selective Dependency Version Sync from Upstream
 *
 * This script safely updates dependency versions from upstream while preserving
 * all SlideHeroes-specific configuration, scripts, and tooling.
 *
 * Usage:
 *   tsx .claude/scripts/sync-upstream-deps.ts [--dry-run] [--auto-approve]
 */

import { execSync } from "node:child_process";
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

interface PackageJson {
	name?: string;
	version?: string;
	dependencies?: Record<string, string>;
	devDependencies?: Record<string, string>;
	peerDependencies?: Record<string, string>;
	[key: string]: unknown;
}

interface VersionUpdate {
	package: string;
	from: string;
	to: string;
	type: "dependencies" | "devDependencies" | "peerDependencies";
}

interface PackageUpdate {
	path: string;
	relativePath: string;
	updates: VersionUpdate[];
}

const UPSTREAM_COMMIT = "c74beb27a"; // Upstream main commit (Next.js 16, React 19.2)
const PROJECT_ROOT = execSync("git rev-parse --show-toplevel", {
	encoding: "utf-8",
}).trim();

// Parse command line args
const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const AUTO_APPROVE = args.includes("--auto-approve");

/**
 * Get package.json content from upstream commit
 */
function getUpstreamPackageJson(relativePath: string): PackageJson | null {
	try {
		const content = execSync(`git show ${UPSTREAM_COMMIT}:${relativePath}`, {
			cwd: PROJECT_ROOT,
			encoding: "utf-8",
		});
		return JSON.parse(content);
	} catch (error) {
		// File doesn't exist in upstream
		return null;
	}
}

/**
 * Get current package.json content
 */
function getCurrentPackageJson(absolutePath: string): PackageJson {
	const content = readFileSync(absolutePath, "utf-8");
	return JSON.parse(content);
}

/**
 * Compare dependency versions between current and upstream
 */
function compareVersions(
	current: Record<string, string> | undefined,
	upstream: Record<string, string> | undefined,
	type: "dependencies" | "devDependencies" | "peerDependencies",
): VersionUpdate[] {
	if (!current || !upstream) return [];

	const updates: VersionUpdate[] = [];

	// Only update versions for packages that exist in BOTH current and upstream
	for (const [pkg, upstreamVersion] of Object.entries(upstream)) {
		const currentVersion = current[pkg];

		// Skip if package doesn't exist in current (it's upstream-only)
		if (!currentVersion) continue;

		// Skip if versions are already the same
		if (currentVersion === upstreamVersion) continue;

		updates.push({
			package: pkg,
			from: currentVersion,
			to: upstreamVersion,
			type,
		});
	}

	return updates;
}

/**
 * Find all package.json files recursively
 */
function findPackageJsonFiles(dir: string, files: string[] = []): string[] {
	const items = readdirSync(dir);

	for (const item of items) {
		const fullPath = join(dir, item);

		// Skip common ignore directories
		if (
			item === "node_modules" ||
			item === "dist" ||
			item === ".next" ||
			item === ".turbo"
		) {
			continue;
		}

		try {
			const stat = statSync(fullPath);

			if (stat.isDirectory()) {
				findPackageJsonFiles(fullPath, files);
			} else if (item === "package.json") {
				files.push(fullPath);
			}
		} catch (error) {}
	}

	return files;
}

/**
 * Analyze all package.json files in the workspace
 */
function analyzeWorkspace(): PackageUpdate[] {
	const packageJsonFiles = findPackageJsonFiles(PROJECT_ROOT);

	const results: PackageUpdate[] = [];

	for (const absolutePath of packageJsonFiles) {
		const relativePath = relative(PROJECT_ROOT, absolutePath);

		// Get upstream version (if exists)
		const upstream = getUpstreamPackageJson(relativePath);
		if (!upstream) {
			console.log(`ℹ️  Skipping ${relativePath} (not in upstream)`);
			continue;
		}

		// Get current version
		const current = getCurrentPackageJson(absolutePath);

		// Compare all dependency types
		const updates: VersionUpdate[] = [
			...compareVersions(
				current.dependencies,
				upstream.dependencies,
				"dependencies",
			),
			...compareVersions(
				current.devDependencies,
				upstream.devDependencies,
				"devDependencies",
			),
			...compareVersions(
				current.peerDependencies,
				upstream.peerDependencies,
				"peerDependencies",
			),
		];

		if (updates.length > 0) {
			results.push({
				path: absolutePath,
				relativePath,
				updates,
			});
		}
	}

	return results;
}

/**
 * Apply updates to a package.json file
 */
function applyUpdates(packageUpdate: PackageUpdate): void {
	const current = getCurrentPackageJson(packageUpdate.path);

	for (const update of packageUpdate.updates) {
		const depSection = current[update.type];
		if (!depSection) continue;

		depSection[update.package] = update.to;
	}

	// Write back with pretty formatting (preserve existing style)
	const content = JSON.stringify(current, null, 2) + "\n";
	writeFileSync(packageUpdate.path, content, "utf-8");
}

/**
 * Display updates in a nice format
 */
function displayUpdates(packageUpdates: PackageUpdate[]): void {
	console.log("\n📦 Dependency Version Updates Available:\n");

	let totalUpdates = 0;

	for (const pkg of packageUpdates) {
		console.log(`\n${pkg.relativePath}:`);

		// Group by type
		const byType = {
			dependencies: pkg.updates.filter((u) => u.type === "dependencies"),
			devDependencies: pkg.updates.filter((u) => u.type === "devDependencies"),
			peerDependencies: pkg.updates.filter(
				(u) => u.type === "peerDependencies",
			),
		};

		for (const [type, updates] of Object.entries(byType)) {
			if (updates.length === 0) continue;

			console.log(`  ${type}:`);
			for (const update of updates) {
				console.log(`    ${update.package}: ${update.from} → ${update.to}`);
				totalUpdates++;
			}
		}
	}

	console.log(
		`\n📊 Total: ${totalUpdates} version updates across ${packageUpdates.length} files\n`,
	);
}

/**
 * Prompt user for confirmation
 */
function promptConfirmation(): boolean {
	if (AUTO_APPROVE) {
		console.log("✅ Auto-approve enabled, proceeding with updates...\n");
		return true;
	}

	console.log("❓ Apply these updates? [y/N]: ");

	// Simple synchronous stdin read
	const response = execSync("read -n 1 response && echo $response", {
		shell: "/bin/bash",
		encoding: "utf-8",
		stdio: ["inherit", "pipe", "inherit"],
	})
		.trim()
		.toLowerCase();

	return response === "y";
}

/**
 * Main execution
 */
async function main() {
	console.log("🔍 Analyzing workspace package.json files...\n");

	// Analyze all packages
	const packageUpdates = analyzeWorkspace();

	if (packageUpdates.length === 0) {
		console.log(
			"✅ All dependency versions are already up to date with upstream!\n",
		);
		process.exit(0);
	}

	// Display what would change
	displayUpdates(packageUpdates);

	if (DRY_RUN) {
		console.log("🔍 Dry run mode - no changes applied\n");
		process.exit(0);
	}

	// Get confirmation
	const confirmed = promptConfirmation();
	if (!confirmed) {
		console.log("❌ Update cancelled by user\n");
		process.exit(0);
	}

	// Apply updates
	console.log("📝 Applying updates...\n");
	for (const pkg of packageUpdates) {
		console.log(`  ✓ ${pkg.relativePath}`);
		applyUpdates(pkg);
	}

	console.log("\n✅ All updates applied successfully!\n");

	// Regenerate lockfile
	console.log("🔄 Regenerating pnpm-lock.yaml...\n");
	try {
		execSync("pnpm install", {
			cwd: PROJECT_ROOT,
			stdio: "inherit",
		});
		console.log("\n✅ Lockfile updated successfully!\n");
	} catch (error) {
		console.error(
			"\n⚠️  Warning: Failed to regenerate lockfile. Run `pnpm install` manually.\n",
		);
	}

	console.log("🎉 Dependency sync complete!\n");
	console.log("💡 Next steps:");
	console.log("   1. Review changes: git diff");
	console.log("   2. Run tests: pnpm test");
	console.log(
		'   3. Commit: git commit -am "chore: sync dependency versions from upstream"\n',
	);
}

main().catch((error) => {
	console.error("❌ Error:", error.message);
	process.exit(1);
});
