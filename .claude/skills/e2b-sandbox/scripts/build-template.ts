#!/usr/bin/env tsx
/**
 * E2B v2 Template Builder for SlideHeroes
 *
 * This script builds a custom E2B sandbox template optimized for Claude Code agents.
 * Uses E2B Build System 2.0 (SDK-based, no Docker required).
 *
 * Usage:
 *   tsx build-template.ts [--dev]
 *
 * Environment:
 *   E2B_API_KEY - Required for building templates
 */

import { Template, defaultBuildLogger } from "e2b";

const TEMPLATE_ALIAS = "slideheroes-claude-agent";
const DEV_TEMPLATE_ALIAS = "slideheroes-claude-agent-dev";
const REPO_BRANCH = "dev";

// GitHub token for private repo access (from environment)
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_URL = GITHUB_TOKEN
	? `https://${GITHUB_TOKEN}@github.com/MLorneSmith/2025slideheroes.git`
	: "https://github.com/MLorneSmith/2025slideheroes.git";

// Helper script contents
// Note: Use single $ for bash variables - printf '%s' preserves them literally
const RUN_CLAUDE_SCRIPT = `#!/bin/bash
cd /home/user/project 2>/dev/null || cd /home/user

if [ -z "$1" ]; then
    echo "Usage: run-claude \\"<prompt or slash command>\\""
    echo "Example: run-claude \\"/test 1\\""
    echo "Example: run-claude \\"Fix the type errors in src/auth.ts\\""
    exit 1
fi

# Check authentication
if [ -z "$CLAUDE_CODE_OAUTH_TOKEN" ] && [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "ERROR: No Claude authentication found"
    echo "Set CLAUDE_CODE_OAUTH_TOKEN (for Max plan) or ANTHROPIC_API_KEY"
    exit 1
fi

if [ -n "$CLAUDE_CODE_OAUTH_TOKEN" ]; then
    echo "Using OAuth authentication (Max plan)"
else
    echo "Using API key authentication"
fi

echo "Running Claude Code with prompt: $1"
echo "$1" | claude -p --dangerously-skip-permissions
`;

const RUN_TESTS_SCRIPT = `#!/bin/bash
set -e
cd /home/user/project
echo "Running unit tests..."
pnpm test:unit
echo "Tests completed!"
`;

const BUILD_PROJECT_SCRIPT = `#!/bin/bash
set -e
cd /home/user/project
echo "Building project..."
pnpm build
echo "Build completed!"
`;

const TYPECHECK_SCRIPT = `#!/bin/bash
set -e
cd /home/user/project
echo "Running type check..."
pnpm typecheck
echo "Type check completed!"
`;

const LINT_FIX_SCRIPT = `#!/bin/bash
set -e
cd /home/user/project
echo "Running linter and formatter..."
pnpm lint:fix
pnpm format:fix
echo "Lint and format completed!"
`;

const CODECHECK_SCRIPT = `#!/bin/bash
set -e
cd /home/user/project
echo "Running full code quality check..."
pnpm codecheck
echo "Code quality check completed!"
`;

const GIT_INFO_SCRIPT = `#!/bin/bash
cd /home/user/project
echo "=== Git Status ==="
git status
echo ""
echo "=== Recent Commits ==="
git log --oneline -10
echo ""
echo "=== Current Branch ==="
git branch --show-current
`;

// VS Code Web (code-server) start script
const START_VSCODE_SCRIPT = `#!/bin/bash
cd /home/user/project 2>/dev/null || cd /home/user
echo "Starting VS Code Web (code-server) on port 8080..."
code-server --bind-addr 0.0.0.0:8080 --auth none --disable-telemetry /home/user/project &
sleep 2
echo "VS Code Web started on port 8080"
`;

// Dev server (pnpm dev) start script
const START_DEV_SCRIPT = `#!/bin/bash
cd /home/user/project
echo "Starting dev server on port 3000..."
pnpm dev &
echo "Dev server starting on port 3000 (may take 10-30 seconds to compile)"
`;

async function buildTemplate(isDev: boolean = false): Promise<void> {
	const alias = isDev ? DEV_TEMPLATE_ALIAS : TEMPLATE_ALIAS;

	// Check for required environment variables
	if (!process.env.E2B_API_KEY) {
		console.error("ERROR: E2B_API_KEY environment variable not set");
		console.error("Get your API key from: https://e2b.dev/dashboard");
		process.exit(1);
	}

	if (!GITHUB_TOKEN) {
		console.error("ERROR: GITHUB_TOKEN environment variable not set");
		console.error("Required to clone the private SlideHeroes repository");
		console.error(
			"Create a token at: https://github.com/settings/tokens (needs 'repo' scope)",
		);
		process.exit(1);
	}

	console.log(`Building E2B v2 template: ${alias}`);
	console.log(
		"Repository: MLorneSmith/2025slideheroes (branch: " + REPO_BRANCH + ")",
	);
	console.log("This may take several minutes...\n");

	// Define the template using E2B v2 SDK
	const template = Template()
		// Start from Ubuntu base image
		.fromUbuntuImage("24.04")
		// Install system dependencies
		.aptInstall([
			"git",
			"curl",
			"wget",
			"vim",
			"jq",
			"htop",
			"build-essential",
			"python3",
			// Playwright dependencies
			"libnss3",
			"libnspr4",
			"libatk1.0-0",
			"libatk-bridge2.0-0",
			"libcups2",
			"libdrm2",
			"libdbus-1-3",
			"libxkbcommon0",
			"libatspi2.0-0",
			"libxcomposite1",
			"libxdamage1",
			"libxfixes3",
			"libxrandr2",
			"libgbm1",
			"libasound2t64",
			// Additional Playwright deps (from validation warning)
			"libcairo2",
			"libpango-1.0-0",
		])
		// Install code-server (VS Code Web) for code review
		.runCmd(["curl -fsSL https://code-server.dev/install.sh | sh"], {
			user: "root",
		})
		// Install GitHub CLI (gh) for GitHub automation
		.runCmd(
			[
				"curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg",
				"chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg",
				'echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | tee /etc/apt/sources.list.d/github-cli.list > /dev/null',
				"apt-get update && apt-get install -y gh",
				"gh --version",
			],
			{ user: "root" },
		)
		// Install Node.js 20 (must run as root)
		.runCmd(
			[
				"curl -fsSL https://deb.nodesource.com/setup_20.x | bash -",
				"apt-get install -y nodejs",
			],
			{ user: "root" },
		)
		// Install pnpm (must run as root for corepack)
		.runCmd(["corepack enable", "corepack prepare pnpm@10.14.0 --activate"], {
			user: "root",
		})
		// Install global npm tools (must use runCmd, npmInstall doesn't exist in E2B v2 SDK)
		.runCmd(["npm install -g turbo@2.6.1 @anthropic-ai/claude-code"], {
			user: "root",
		})
		// Set environment variables
		.setEnvs({
			NODE_ENV: "development",
			CI: "true",
			NEXT_TELEMETRY_DISABLED: "1",
			TURBO_TELEMETRY_DISABLED: "1",
		})
		// Create run-claude script
		.runCmd(
			[
				`printf '%s' '${RUN_CLAUDE_SCRIPT.replace(/'/g, "'\\''")}' > /usr/local/bin/run-claude`,
				"chmod +x /usr/local/bin/run-claude",
			],
			{ user: "root" },
		)
		// Create run-tests script
		.runCmd(
			[
				`printf '%s' '${RUN_TESTS_SCRIPT.replace(/'/g, "'\\''")}' > /usr/local/bin/run-tests`,
				"chmod +x /usr/local/bin/run-tests",
			],
			{ user: "root" },
		)
		// Create build-project script
		.runCmd(
			[
				`printf '%s' '${BUILD_PROJECT_SCRIPT.replace(/'/g, "'\\''")}' > /usr/local/bin/build-project`,
				"chmod +x /usr/local/bin/build-project",
			],
			{ user: "root" },
		)
		// Create typecheck script
		.runCmd(
			[
				`printf '%s' '${TYPECHECK_SCRIPT.replace(/'/g, "'\\''")}' > /usr/local/bin/typecheck`,
				"chmod +x /usr/local/bin/typecheck",
			],
			{ user: "root" },
		)
		// Create lint-fix script
		.runCmd(
			[
				`printf '%s' '${LINT_FIX_SCRIPT.replace(/'/g, "'\\''")}' > /usr/local/bin/lint-fix`,
				"chmod +x /usr/local/bin/lint-fix",
			],
			{ user: "root" },
		)
		// Create codecheck script
		.runCmd(
			[
				`printf '%s' '${CODECHECK_SCRIPT.replace(/'/g, "'\\''")}' > /usr/local/bin/codecheck`,
				"chmod +x /usr/local/bin/codecheck",
			],
			{ user: "root" },
		)
		// Create git-info script
		.runCmd(
			[
				`printf '%s' '${GIT_INFO_SCRIPT.replace(/'/g, "'\\''")}' > /usr/local/bin/git-info`,
				"chmod +x /usr/local/bin/git-info",
			],
			{ user: "root" },
		)
		// Create start-vscode script (VS Code Web)
		.runCmd(
			[
				`printf '%s' '${START_VSCODE_SCRIPT.replace(/'/g, "'\\''")}' > /usr/local/bin/start-vscode`,
				"chmod +x /usr/local/bin/start-vscode",
			],
			{ user: "root" },
		)
		// Create start-dev script (pnpm dev)
		.runCmd(
			[
				`printf '%s' '${START_DEV_SCRIPT.replace(/'/g, "'\\''")}' > /usr/local/bin/start-dev`,
				"chmod +x /usr/local/bin/start-dev",
			],
			{ user: "root" },
		)
		// Clone the SlideHeroes repository
		.runCmd([
			`git clone --depth 1 --branch ${REPO_BRANCH} ${REPO_URL} /home/user/project`,
		])
		// Set working directory
		.setWorkdir("/home/user/project")
		// Install project dependencies
		.runCmd(["pnpm install --frozen-lockfile"])
		// Install Playwright browsers for E2E testing
		.runCmd(["pnpm exec playwright install chromium"]);

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

buildTemplate(isDev);
