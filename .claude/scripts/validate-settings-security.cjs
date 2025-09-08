#!/usr/bin/env node

/**
 * Security validation script for Claude Code settings
 * Checks for common security issues and misconfigurations
 */

const fs = require("node:fs");
const path = require("node:path");

const CLAUDE_DIR = path.join(__dirname, "..");
const SETTINGS_DIR = path.join(CLAUDE_DIR, "settings");

// Security rules to check
const SECURITY_CHECKS = {
	dangerousPermissions: [
		"Bash(rm -rf /)",
		"Bash(*eval*)",
		"Bash(*curl * | bash*)",
		"Bash(*wget * | sh*)",
		"Bash(chmod 777 *)",
		"Bash(sudo *)",
	],

	sensitivePatterns: [
		/api[_-]?key/i,
		/secret/i,
		/password/i,
		/token/i,
		/private[_-]?key/i,
		/credentials/i,
	],

	riskyCommands: [
		"Bash(*)", // Unrestricted bash access
		"Write(*)", // Unrestricted write access
		"Edit(*)", // Unrestricted edit access
	],
};

function checkFileExists(filepath) {
	return fs.existsSync(filepath);
}

function loadJsonFile(filepath) {
	try {
		const content = fs.readFileSync(filepath, "utf8");
		return JSON.parse(content);
	} catch (error) {
		return null;
	}
}

function checkPermissions(config) {
	const issues = [];
	const warnings = [];

	if (!config.permissions) {
		issues.push("❌ No permissions configuration found");
		return { issues, warnings };
	}

	const { allow = [], deny = [], ask = [] } = config.permissions;

	// Check for dangerous permissions in allow list
	for (const permission of allow) {
		// Check for overly broad permissions
		if (SECURITY_CHECKS.riskyCommands.includes(permission)) {
			issues.push(`❌ Overly broad permission: "${permission}"`);
		}

		// Check for dangerous specific permissions
		for (const dangerous of SECURITY_CHECKS.dangerousPermissions) {
			if (permission.includes(dangerous.replace("*", ""))) {
				issues.push(`❌ Dangerous permission allowed: "${permission}"`);
			}
		}
	}

	// Check if deny list is empty
	if (deny.length === 0) {
		warnings.push(
			"⚠️  Deny list is empty - consider adding dangerous operations",
		);
	}

	// Check for sensitive data in permissions
	const allPermissions = [...allow, ...deny, ...ask];
	for (const permission of allPermissions) {
		for (const pattern of SECURITY_CHECKS.sensitivePatterns) {
			if (pattern.test(permission)) {
				issues.push(
					`❌ Potential sensitive data in permission: "${permission}"`,
				);
			}
		}
	}

	return { issues, warnings };
}

function checkForSecrets(config) {
	const issues = [];
	const configStr = JSON.stringify(config);

	for (const pattern of SECURITY_CHECKS.sensitivePatterns) {
		const matches = configStr.match(pattern);
		if (matches && !matches[0].includes("example")) {
			issues.push(`❌ Potential secret detected: pattern "${pattern}" found`);
		}
	}

	return issues;
}

function checkGitIgnore() {
	const gitignorePath = path.join(CLAUDE_DIR, "..", ".gitignore");
	const issues = [];
	const warnings = [];

	if (!checkFileExists(gitignorePath)) {
		issues.push("❌ No .gitignore file found");
		return { issues, warnings };
	}

	const gitignore = fs.readFileSync(gitignorePath, "utf8");

	// Check if sensitive files are ignored
	const shouldIgnore = [
		".claude/settings/permissions.json",
		".claude/settings/environment.json",
		".claude/settings.local.json",
	];

	for (const file of shouldIgnore) {
		if (!gitignore.includes(file)) {
			issues.push(`❌ Sensitive file not in .gitignore: ${file}`);
		}
	}

	return { issues, warnings };
}

function validateSecurity() {
	console.log("🔒 Claude Code Settings Security Validation\n");

	let hasIssues = false;
	const allIssues = [];
	const allWarnings = [];

	// Check if settings directory exists
	if (!checkFileExists(SETTINGS_DIR)) {
		console.log(
			"✅ Settings directory not found - using monolithic configuration",
		);
		console.log("   Consider splitting configuration for better security\n");
		return;
	}

	// Check each configuration file
	const configFiles = ["permissions.json", "environment.json", "mcp.json"];

	for (const configFile of configFiles) {
		const filepath = path.join(SETTINGS_DIR, configFile);

		if (!checkFileExists(filepath)) {
			console.log(`⏭️  Skipping ${configFile} (not found)`);
			continue;
		}

		console.log(`\n📋 Checking ${configFile}...`);

		const config = loadJsonFile(filepath);
		if (!config) {
			allIssues.push(`❌ Failed to parse ${configFile}`);
			continue;
		}

		// Run security checks
		if (configFile === "permissions.json") {
			const { issues, warnings } = checkPermissions(config);
			allIssues.push(...issues);
			allWarnings.push(...warnings);
		}

		// Check for secrets in any config
		const secretIssues = checkForSecrets(config);
		allIssues.push(...secretIssues);
	}

	// Check .gitignore
	console.log("\n📋 Checking .gitignore...");
	const { issues: gitIssues, warnings: gitWarnings } = checkGitIgnore();
	allIssues.push(...gitIssues);
	allWarnings.push(...gitWarnings);

	// Report results
	console.log("\n" + "=".repeat(50));
	console.log("VALIDATION RESULTS");
	console.log("=".repeat(50) + "\n");

	if (allIssues.length > 0) {
		console.log("🚨 SECURITY ISSUES FOUND:\n");
		allIssues.forEach((issue) => console.log(`  ${issue}`));
		hasIssues = true;
	}

	if (allWarnings.length > 0) {
		console.log("\n⚠️  WARNINGS:\n");
		allWarnings.forEach((warning) => console.log(`  ${warning}`));
	}

	if (!hasIssues && allWarnings.length === 0) {
		console.log("✅ All security checks passed!");
	}

	console.log("\n" + "=".repeat(50));
	console.log("RECOMMENDATIONS:");
	console.log("=".repeat(50) + "\n");
	console.log("1. Never commit sensitive configuration files");
	console.log("2. Use environment variables for secrets when possible");
	console.log("3. Regularly review and audit permission patterns");
	console.log("4. Keep deny list updated with dangerous operations");
	console.log("5. Use least privilege principle for permissions\n");

	process.exit(hasIssues ? 1 : 0);
}

// Run validation
if (require.main === module) {
	validateSecurity();
}
