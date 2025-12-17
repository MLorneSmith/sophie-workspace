#!/usr/bin/env tsx
/**
 * E2B Template Builder CLI
 *
 * This is a thin wrapper around the canonical template definition.
 * The actual template is defined in: packages/e2b/e2b-template/template.ts
 *
 * Usage:
 *   tsx build-template.ts [--dev]
 *
 * Equivalent pnpm scripts (from monorepo root):
 *   pnpm e2b:build:dev   → slideheroes-claude-agent-dev
 *   pnpm e2b:build:prod  → slideheroes-claude-agent
 *
 * Environment:
 *   E2B_API_KEY    - Required for building templates
 *   GITHUB_TOKEN   - Required for cloning private repository
 */

import { defaultBuildLogger, Template } from "e2b";

// Import the canonical template definition
// Note: This import path assumes the script is run from the project root
// or that the module resolution can find the package
import {
	template,
	TEMPLATE_ALIAS,
	DEV_TEMPLATE_ALIAS,
	WORKSPACE_DIR,
	REPO_BRANCH,
} from "../../../../packages/e2b/e2b-template/template";

async function buildTemplate(isDev: boolean = false): Promise<void> {
	const alias = isDev ? DEV_TEMPLATE_ALIAS : TEMPLATE_ALIAS;

	// Check for required environment variables
	if (!process.env.E2B_API_KEY) {
		console.error("ERROR: E2B_API_KEY environment variable not set");
		console.error("Get your API key from: https://e2b.dev/dashboard");
		process.exit(1);
	}

	if (!process.env.GITHUB_TOKEN) {
		console.error("ERROR: GITHUB_TOKEN environment variable not set");
		console.error("Required to clone the private SlideHeroes repository");
		console.error(
			"Create a token at: https://github.com/settings/tokens (needs 'repo' scope)",
		);
		process.exit(1);
	}

	console.log(`Building E2B template: ${alias}`);
	console.log(`Repository branch: ${REPO_BRANCH}`);
	console.log(`Workspace directory: ${WORKSPACE_DIR}`);
	console.log("This may take several minutes...\n");

	try {
		// Build the template
		// Note: 4GB RAM needed for code-server + dev server + Claude Code concurrently
		const result = await Template.build(template, {
			alias,
			cpuCount: 4,
			memoryMB: 4096,
			onBuildLogs: defaultBuildLogger(),
		});

		console.log("\n=== Template Built Successfully ===");
		console.log(`Alias: ${alias}`);
		console.log(`Template ID: ${result.templateId}`);
		console.log("\nTo use this template:");
		console.log(`  /sandbox create --template ${alias}`);
		console.log(`  /sandbox run-claude "/test 1"`);
	} catch (error) {
		console.error("\nFailed to build template:", error);
		process.exit(1);
	}
}

// Parse arguments
const args = process.argv.slice(2);
const isDev = args.includes("--dev");

if (args.includes("--help") || args.includes("-h")) {
	console.log(`
E2B Template Builder CLI

Usage:
  tsx build-template.ts [options]

Options:
  --dev     Build development template (slideheroes-claude-agent-dev)
  --help    Show this help message

Environment Variables:
  E2B_API_KEY     Required - Your E2B API key
  GITHUB_TOKEN    Required - GitHub token for private repo access

Examples:
  # Build production template
  tsx build-template.ts

  # Build development template
  tsx build-template.ts --dev

Equivalent pnpm commands:
  pnpm e2b:build:prod   # Production template
  pnpm e2b:build:dev    # Development template
`);
	process.exit(0);
}

buildTemplate(isDev);
