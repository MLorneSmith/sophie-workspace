import { Template } from "e2b";

/**
 * SlideHeroes E2B Template v2
 * Optimized for Claude Code AI agents
 *
 * Includes:
 * - Node.js 20, pnpm 10.14.0
 * - Supabase CLI, Turbo CLI
 * - Claude Code CLI
 * - Playwright dependencies
 */
export const template = Template()
	// Start from Ubuntu base image
	.fromImage("e2bdev/base")

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
		"libasound2",
	])

	// Install Node.js 20
	.runCmd("curl -fsSL https://deb.nodesource.com/setup_20.x | bash -")
	.aptInstall(["nodejs"])

	// Install pnpm 10.14.0 (needs root for symlinks in /usr/local/bin)
	.runCmd("corepack enable && corepack prepare pnpm@10.14.0 --activate", {
		user: "root",
	})

	// Install global npm packages
	.npmInstall(["supabase@latest", "turbo@2.6.1", "@anthropic-ai/claude-code"], {
		global: true,
	})

	// Set environment variables
	.setEnvs({
		PROJECT_ROOT: "/home/user/project",
		NODE_ENV: "development",
		PNPM_HOME: "/usr/local/bin",
		CI: "true",
		NEXT_TELEMETRY_DISABLED: "1",
		TURBO_TELEMETRY_DISABLED: "1",
	})

	// Create helper scripts (needs root for /usr/local/bin)
	.runCmd(
		`cat > /usr/local/bin/run-claude << 'SCRIPT'
#!/bin/bash
cd /home/user/project
if [ -z "$1" ]; then
    echo "Usage: run-claude \\"<prompt or slash command>\\""
    echo "Example: run-claude \\"/test 1\\""
    exit 1
fi
if [ -z "$CLAUDE_CODE_OAUTH_TOKEN" ] && [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "ERROR: No Claude authentication found"
    exit 1
fi
echo "Running Claude Code with prompt: $1"
echo "$1" | claude -p --dangerously-skip-permissions
SCRIPT
chmod +x /usr/local/bin/run-claude`,
		{ user: "root" },
	)

	.runCmd(
		`cat > /usr/local/bin/run-tests << 'SCRIPT'
#!/bin/bash
cd /home/user/project
pnpm test:unit
SCRIPT
chmod +x /usr/local/bin/run-tests`,
		{ user: "root" },
	)

	.runCmd(
		`cat > /usr/local/bin/build-project << 'SCRIPT'
#!/bin/bash
cd /home/user/project
pnpm build
SCRIPT
chmod +x /usr/local/bin/build-project`,
		{ user: "root" },
	)

	.runCmd(
		`cat > /usr/local/bin/typecheck << 'SCRIPT'
#!/bin/bash
cd /home/user/project
pnpm typecheck
SCRIPT
chmod +x /usr/local/bin/typecheck`,
		{ user: "root" },
	)

	.runCmd(
		`cat > /usr/local/bin/codecheck << 'SCRIPT'
#!/bin/bash
cd /home/user/project
pnpm codecheck
SCRIPT
chmod +x /usr/local/bin/codecheck`,
		{ user: "root" },
	)

	// Set working directory
	.setWorkdir("/home/user/project");
