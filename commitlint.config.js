/**
 * Commitlint configuration for SlideHeroes monorepo
 * Enforces conventional commit format with project-specific scopes
 */
module.exports = {
	extends: ["@commitlint/config-conventional"],
	rules: {
		"type-enum": [
			2,
			"always",
			[
				"feat", // New features
				"fix", // Bug fixes
				"docs", // Documentation changes
				"style", // Code style changes (formatting, etc.)
				"refactor", // Code refactoring
				"perf", // Performance improvements
				"test", // Adding or updating tests
				"build", // Build system changes
				"ci", // CI configuration changes
				"chore", // Maintenance tasks
				"revert", // Revert previous commits
			],
		],
		"scope-enum": [
			2,
			"always",
			[
				// Apps
				"web", // Web application
				"payload", // Payload CMS
				"e2e", // End-to-end tests
				"dev-tool", // Development tool app

				// Features
				"auth", // Authentication
				"billing", // Billing and payments
				"canvas", // AI canvas/presentation builder
				"course", // Learning platform
				"quiz", // Quiz system
				"admin", // Admin panel
				"api", // API routes and server actions

				// Technical
				"cms", // Content management
				"ui", // UI components
				"migration", // Database migrations
				"config", // Configuration changes
				"deps", // Dependency updates
				"tooling", // Build tools, linting, etc.

				// Infrastructure
				"ci", // Continuous integration
				"deploy", // Deployment related
				"docker", // Docker configuration
				"security", // Security improvements
			],
		],
		"scope-case": [2, "always", "lower-case"],
		"subject-case": [
			2,
			"never",
			["sentence-case", "start-case", "pascal-case", "upper-case"],
		],
		"subject-empty": [2, "never"],
		"subject-full-stop": [2, "never", "."],
		"type-case": [2, "always", "lower-case"],
		"type-empty": [2, "never"],
	},
};
