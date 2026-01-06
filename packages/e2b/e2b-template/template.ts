/**
 * SlideHeroes E2B Template - Single Source of Truth
 *
 * This is the canonical template definition for E2B sandboxes.
 * Used by both pnpm scripts and the sandbox skill.
 *
 * Features:
 * - Node.js 20, pnpm 10.14.0
 * - Claude Code CLI
 * - VS Code Web (code-server) for code review
 * - GitHub CLI (gh) for PR automation
 * - Turbo CLI (Supabase CLI available via pnpm exec in project)
 * - Playwright with Chromium for E2E testing
 * - Pre-cloned repository with dependencies installed
 *
 * Build scripts:
 * - pnpm e2b:build:dev  → slideheroes-claude-agent-dev
 * - pnpm e2b:build:prod → slideheroes-claude-agent
 */

import { Template } from "e2b";

// ============================================================================
// Configuration
// ============================================================================

export const TEMPLATE_ALIAS = "slideheroes-claude-agent";
export const DEV_TEMPLATE_ALIAS = "slideheroes-claude-agent-dev";
export const REPO_BRANCH = "dev";
export const WORKSPACE_DIR = "/home/user/project";

// Repository URL - uses GITHUB_TOKEN if available for private repo access
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_URL = GITHUB_TOKEN
	? `https://${GITHUB_TOKEN}@github.com/MLorneSmith/2025slideheroes.git`
	: "https://github.com/MLorneSmith/2025slideheroes.git";

// ============================================================================
// Helper Scripts
// ============================================================================

const RUN_CLAUDE_SCRIPT = `#!/bin/bash
cd ${WORKSPACE_DIR} 2>/dev/null || cd /home/user

# Ensure npm global binaries are in PATH (claude CLI location)
export PATH="/usr/local/lib/node_modules/.bin:/usr/lib/node_modules/.bin:$PATH"

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

# Verify claude is available
if ! command -v claude &> /dev/null; then
    echo "ERROR: claude command not found in PATH"
    echo "PATH: $PATH"
    echo "Checking common locations..."
    ls -la /usr/local/lib/node_modules/.bin/ 2>/dev/null || echo "  /usr/local/lib/node_modules/.bin/ not found"
    ls -la /usr/lib/node_modules/.bin/ 2>/dev/null || echo "  /usr/lib/node_modules/.bin/ not found"
    which claude 2>/dev/null || echo "  claude not in PATH"
    exit 1
fi

if [ -n "$CLAUDE_CODE_OAUTH_TOKEN" ]; then
    echo "Using OAuth authentication (Max plan)"
else
    echo "Using API key authentication"
fi

echo "Running Claude Code with prompt: $1"
# --setting-sources user,project enables custom slash commands from .claude/commands/
echo "$1" | claude -p --setting-sources user,project --dangerously-skip-permissions
`;

const RUN_TESTS_SCRIPT = `#!/bin/bash
set -e
cd ${WORKSPACE_DIR}
echo "Running unit tests..."
pnpm test:unit
echo "Tests completed!"
`;

const BUILD_PROJECT_SCRIPT = `#!/bin/bash
set -e
cd ${WORKSPACE_DIR}
echo "Building project..."
pnpm build
echo "Build completed!"
`;

const TYPECHECK_SCRIPT = `#!/bin/bash
set -e
cd ${WORKSPACE_DIR}
echo "Running type check..."
pnpm typecheck
echo "Type check completed!"
`;

const LINT_FIX_SCRIPT = `#!/bin/bash
set -e
cd ${WORKSPACE_DIR}
echo "Running linter and formatter..."
pnpm lint:fix
pnpm format:fix
echo "Lint and format completed!"
`;

const CODECHECK_SCRIPT = `#!/bin/bash
set -e
cd ${WORKSPACE_DIR}
echo "Running full code quality check..."
pnpm codecheck
echo "Code quality check completed!"
`;

const GIT_INFO_SCRIPT = `#!/bin/bash
cd ${WORKSPACE_DIR}
echo "=== Git Status ==="
git status
echo ""
echo "=== Recent Commits ==="
git log --oneline -10
echo ""
echo "=== Current Branch ==="
git branch --show-current
`;

const START_VSCODE_SCRIPT = `#!/bin/bash
cd ${WORKSPACE_DIR} 2>/dev/null || cd /home/user
echo "Starting VS Code Web (code-server) on port 8080..."
code-server --bind-addr 0.0.0.0:8080 --auth none --disable-telemetry ${WORKSPACE_DIR} &
sleep 2
echo "VS Code Web started on port 8080"
`;

const START_DEV_SCRIPT = `#!/bin/bash
cd ${WORKSPACE_DIR}
echo "Starting dev server on port 3000..."
pnpm dev &
echo "Dev server starting on port 3000 (may take 10-30 seconds to compile)"
`;

// ============================================================================
// Template Definition
// ============================================================================

/**
 * Creates the E2B template with all necessary tools and the pre-cloned repository.
 *
 * @param cloneRepo - Whether to clone the repository during build (default: true)
 *                    Set to false for faster iteration during template development
 */
export function createTemplate(
	cloneRepo: boolean = true,
): ReturnType<typeof Template> {
	let tmpl = Template()
		// Start from Ubuntu 24.04 base image
		.fromUbuntuImage("24.04")

		// ========================================
		// System Dependencies
		// ========================================
		.aptInstall([
			"git",
			"curl",
			"wget",
			"vim",
			"jq",
			"htop",
			"build-essential",
			"python3",
			"postgresql-client",
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
			// Additional Playwright deps
			"libcairo2",
			"libpango-1.0-0",
		])

		// ========================================
		// VS Code Web (code-server)
		// ========================================
		.runCmd(["curl -fsSL https://code-server.dev/install.sh | sh"], {
			user: "root",
		})

		// ========================================
		// GitHub CLI (gh)
		// ========================================
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

		// ========================================
		// Node.js 20
		// ========================================
		.runCmd(
			[
				"curl -fsSL https://deb.nodesource.com/setup_20.x | bash -",
				"apt-get install -y nodejs",
			],
			{ user: "root" },
		)

		// ========================================
		// pnpm 10.14.0
		// ========================================
		.runCmd(["corepack enable", "corepack prepare pnpm@10.14.0 --activate"], {
			user: "root",
		})

		// ========================================
		// Global npm tools
		// Note: Supabase CLI doesn't support global npm install anymore
		// It's available via pnpm in the project (pnpm exec supabase)
		// ========================================
		.runCmd(["npm install -g turbo@2.6.1 @anthropic-ai/claude-code"], {
			user: "root",
		})

		// ========================================
		// Environment Variables
		// ========================================
		.setEnvs({
			PROJECT_ROOT: WORKSPACE_DIR,
			NODE_ENV: "development",
			PNPM_HOME: "/usr/local/bin",
			CI: "true",
			NEXT_TELEMETRY_DISABLED: "1",
			TURBO_TELEMETRY_DISABLED: "1",
		})

		// ========================================
		// Helper Scripts
		// ========================================
		.runCmd(
			[
				`printf '%s' '${RUN_CLAUDE_SCRIPT.replace(/'/g, "'\\''")}' > /usr/local/bin/run-claude`,
				"chmod +x /usr/local/bin/run-claude",
			],
			{ user: "root" },
		)
		.runCmd(
			[
				`printf '%s' '${RUN_TESTS_SCRIPT.replace(/'/g, "'\\''")}' > /usr/local/bin/run-tests`,
				"chmod +x /usr/local/bin/run-tests",
			],
			{ user: "root" },
		)
		.runCmd(
			[
				`printf '%s' '${BUILD_PROJECT_SCRIPT.replace(/'/g, "'\\''")}' > /usr/local/bin/build-project`,
				"chmod +x /usr/local/bin/build-project",
			],
			{ user: "root" },
		)
		.runCmd(
			[
				`printf '%s' '${TYPECHECK_SCRIPT.replace(/'/g, "'\\''")}' > /usr/local/bin/typecheck`,
				"chmod +x /usr/local/bin/typecheck",
			],
			{ user: "root" },
		)
		.runCmd(
			[
				`printf '%s' '${LINT_FIX_SCRIPT.replace(/'/g, "'\\''")}' > /usr/local/bin/lint-fix`,
				"chmod +x /usr/local/bin/lint-fix",
			],
			{ user: "root" },
		)
		.runCmd(
			[
				`printf '%s' '${CODECHECK_SCRIPT.replace(/'/g, "'\\''")}' > /usr/local/bin/codecheck`,
				"chmod +x /usr/local/bin/codecheck",
			],
			{ user: "root" },
		)
		.runCmd(
			[
				`printf '%s' '${GIT_INFO_SCRIPT.replace(/'/g, "'\\''")}' > /usr/local/bin/git-info`,
				"chmod +x /usr/local/bin/git-info",
			],
			{ user: "root" },
		)
		.runCmd(
			[
				`printf '%s' '${START_VSCODE_SCRIPT.replace(/'/g, "'\\''")}' > /usr/local/bin/start-vscode`,
				"chmod +x /usr/local/bin/start-vscode",
			],
			{ user: "root" },
		)
		.runCmd(
			[
				`printf '%s' '${START_DEV_SCRIPT.replace(/'/g, "'\\''")}' > /usr/local/bin/start-dev`,
				"chmod +x /usr/local/bin/start-dev",
			],
			{ user: "root" },
		);

	// ========================================
	// Repository Setup (optional)
	// ========================================
	if (cloneRepo) {
		tmpl = tmpl
			// Clone the SlideHeroes repository
			.runCmd([
				`git clone --depth 1 --branch ${REPO_BRANCH} ${REPO_URL} ${WORKSPACE_DIR}`,
			])
			// Set working directory
			.setWorkdir(WORKSPACE_DIR)
			// Install project dependencies (no frozen-lockfile to handle patched deps)
			.runCmd(["pnpm install"])
			// Install Playwright browsers for E2E testing
			.runCmd(["pnpm exec playwright install chromium"]);
	} else {
		// Just set the working directory without cloning
		tmpl = tmpl.runCmd([`mkdir -p ${WORKSPACE_DIR}`]).setWorkdir(WORKSPACE_DIR);
	}

	return tmpl;
}

/**
 * Default template export with repository cloning enabled.
 * Used by build.dev.ts and build.prod.ts
 */
export const template = createTemplate(true);
