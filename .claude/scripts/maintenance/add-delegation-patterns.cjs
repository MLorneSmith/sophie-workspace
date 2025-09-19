#!/usr/bin/env node

/**
 * add-delegation-patterns.cjs
 * Adds delegation patterns to complex agents to leverage specialists
 */

const fs = require("node:fs");
const path = require("node:path");

// Delegation mappings for complex agents
const delegationMappings = {
	"test-analysis-agent": {
		path: "./.claude/agents/testwriters/test-analysis-agent.md",
		delegates: ["code-search-expert", "triage-expert"],
		pattern: `## Delegation Strategy

When analyzing test coverage and quality:
- Use \`code-search-expert\` for finding test files and related code implementations
- Use \`triage-expert\` for initial error diagnosis and context gathering
- Launch multiple specialists in parallel for 3-5x performance improvement

Example parallel execution:
1. Search for test files with code-search-expert
2. Gather error context with triage-expert
3. Analyze dependencies simultaneously`,
	},

	"react-expert": {
		path: "./.claude/agents/react/react-expert.md",
		delegates: [
			"typescript-expert",
			"css-styling-expert",
			"accessibility-expert",
		],
		pattern: `## Delegation Strategy

When encountering complex React issues:
- Use \`typescript-expert\` for type-related problems and advanced TypeScript patterns
- Use \`css-styling-expert\` for styling architecture and CSS-in-JS optimization
- Use \`accessibility-expert\` for WCAG compliance and ARIA implementation
- Launch multiple specialists in parallel when issues span multiple domains

Example: For a component with TypeScript errors and styling issues, launch both typescript-expert and css-styling-expert simultaneously.`,
	},

	"database-postgres-expert": {
		path: "./.claude/agents/database/database-postgres-expert.md",
		delegates: ["code-search-expert", "triage-expert"],
		pattern: `## Delegation Strategy

For comprehensive database analysis:
- Use \`code-search-expert\` to find database schemas, migrations, and query usage
- Use \`triage-expert\` for performance issue diagnosis and error analysis
- Execute searches and diagnostics in parallel for faster resolution`,
	},

	"typescript-expert": {
		path: "./.claude/agents/typescript/typescript-expert.md",
		delegates: ["typescript-type-expert", "typescript-build-expert"],
		pattern: `## Delegation Strategy

For specialized TypeScript issues:
- Use \`typescript-type-expert\` for complex type system challenges, generics, and type-level programming
- Use \`typescript-build-expert\` for build configuration, module resolution, and compilation issues
- Launch both specialists in parallel when debugging complex type and build problems`,
	},

	"database-mongodb-expert": {
		path: "./.claude/agents/database/database-mongodb-expert.md",
		delegates: ["code-search-expert", "nodejs-expert"],
		pattern: `## Delegation Strategy

When addressing MongoDB issues:
- Use \`code-search-expert\` to locate schema definitions, aggregation pipelines, and queries
- Use \`nodejs-expert\` for Node.js driver issues, async patterns, and connection management
- Execute parallel searches for comprehensive analysis`,
	},

	"database-expert": {
		path: "./.claude/agents/database/database-expert.md",
		delegates: ["postgres-expert", "mongodb-expert"],
		pattern: `## Delegation Strategy

For database-specific issues:
- Use \`postgres-expert\` for PostgreSQL-specific optimization, JSONB operations, and advanced indexing
- Use \`mongodb-expert\` for NoSQL patterns, document modeling, and aggregation pipelines
- If the database type is unclear, launch both specialists to gather information`,
	},

	"code-review-expert": {
		path: "./.claude/agents/code-review-expert.md",
		delegates: [
			"security experts",
			"performance experts",
			"accessibility-expert",
		],
		pattern: `## Delegation Strategy

During comprehensive code reviews:
- Delegate security analysis to security-focused specialists when detecting vulnerabilities
- Use performance experts for complex optimization opportunities
- Use \`accessibility-expert\` for frontend accessibility review
- Launch multiple specialists in parallel for different aspects of the review`,
	},

	"clarification-loop-engine": {
		path: "./.claude/agents/commands/clarification-loop-engine.md",
		delegates: ["code-search-expert"],
		pattern: `## Delegation Strategy

When gathering context for clarification:
- Use \`code-search-expert\` to quickly find relevant files and patterns
- Execute multiple search strategies in parallel to build comprehensive understanding
- Combine findings from specialists to formulate targeted questions`,
	},

	"prompt-construction-expert": {
		path: "./.claude/agents/commands/prompt-construction-expert.md",
		delegates: ["code-search-expert"],
		pattern: `## Delegation Strategy

For prompt template discovery:
- Use \`code-search-expert\` to find existing prompts and patterns in the codebase
- Search for similar implementations in parallel across different directories
- Leverage specialist findings to inform prompt design decisions`,
	},

	"test-suite-architect": {
		path: "./.claude/agents/test-suite-architect.md",
		delegates: [
			"jest-testing-expert",
			"vitest-testing-expert",
			"playwright-expert",
		],
		pattern: `## Delegation Strategy

When designing comprehensive test suites:
- Use \`jest-testing-expert\` for Jest-specific patterns and configurations
- Use \`vitest-testing-expert\` for Vitest migration and browser mode testing
- Use \`playwright-expert\` for E2E test architecture
- Launch multiple testing experts in parallel based on project's testing stack`,
	},

	"frontend-accessibility-expert": {
		path: "./.claude/agents/frontend/frontend-accessibility-expert.md",
		delegates: ["css-styling-expert"],
		pattern: `## Delegation Strategy

For comprehensive accessibility improvements:
- Use \`css-styling-expert\` for implementing accessible styling patterns and focus indicators
- Coordinate styling and accessibility fixes in parallel for faster implementation
- Combine expertise for complex UI components requiring both domains`,
	},
};

function insertDelegationPattern(filePath, pattern, agentName) {
	const fullPath = path.join(process.cwd(), filePath);

	if (!fs.existsSync(fullPath)) {
		console.error(`❌ File not found: ${fullPath}`);
		return false;
	}

	const content = fs.readFileSync(fullPath, "utf-8");

	// Check if delegation pattern already exists
	if (content.includes("## Delegation Strategy")) {
		console.log(`ℹ️  ${agentName} already has delegation strategy, skipping`);
		return false;
	}

	// Find a good insertion point - after Core Capabilities or after the main description
	let insertionPoint;
	let insertionMarker;

	// Try different section headers as insertion points
	const possibleMarkers = [
		"## Core Capabilities",
		"## Execution Protocol",
		"## Primary Functions",
		"## Key Responsibilities",
		"## Analysis Framework",
		"## Query Classification",
		"## Proactive Analysis",
	];

	for (const marker of possibleMarkers) {
		if (content.includes(marker)) {
			insertionMarker = marker;
			break;
		}
	}

	if (insertionMarker) {
		// Find the next section after the marker
		const markerIndex = content.indexOf(insertionMarker);
		const afterMarker = content.substring(markerIndex);
		const nextSectionMatch = afterMarker.match(/\n## /);

		if (nextSectionMatch) {
			// Insert before the next section
			const insertIndex = markerIndex + nextSectionMatch.index;
			insertionPoint = insertIndex;
		} else {
			// No next section, insert at a reasonable point after the marker
			const markerEndIndex = content.indexOf("\n\n", markerIndex);
			insertionPoint =
				markerEndIndex !== -1
					? markerEndIndex
					: markerIndex + insertionMarker.length;
		}
	} else {
		// Fallback: insert after frontmatter
		const frontmatterEnd = content.match(/---\n([\s\S]*?)\n---\n/);
		if (frontmatterEnd) {
			insertionPoint = frontmatterEnd.index + frontmatterEnd[0].length;
			// Find first empty line after frontmatter
			const afterFrontmatter = content.substring(insertionPoint);
			const firstSection = afterFrontmatter.match(/\n## /);
			if (firstSection) {
				insertionPoint += firstSection.index;
			} else {
				insertionPoint += 100; // Skip initial description
			}
		} else {
			console.error(`❌ Could not find insertion point for ${agentName}`);
			return false;
		}
	}

	// Insert the delegation pattern
	const before = content.substring(0, insertionPoint);
	const after = content.substring(insertionPoint);
	const updatedContent = `${before}\n\n${pattern}\n${after}`;

	fs.writeFileSync(fullPath, updatedContent);
	console.log(`✅ Added delegation pattern to ${agentName}`);
	return true;
}

function main() {
	console.log("🔄 Adding Delegation Patterns to Complex Agents\n");

	let successCount = 0;
	let skipCount = 0;
	let errorCount = 0;

	for (const [agentName, config] of Object.entries(delegationMappings)) {
		const result = insertDelegationPattern(
			config.path,
			config.pattern,
			agentName,
		);

		if (result === true) {
			successCount++;
		} else if (result === false) {
			skipCount++;
		} else {
			errorCount++;
		}
	}

	console.log("\n📊 Summary:");
	console.log(`✅ Successfully updated: ${successCount} agents`);
	console.log(`⏭️  Skipped (already has delegation): ${skipCount} agents`);
	console.log(`❌ Errors: ${errorCount} agents`);

	if (successCount > 0) {
		console.log("\n🎉 Delegation patterns have been added!");
		console.log("📝 Next step: Add parallel execution patterns to agents");
	}
}

// Run the script
main();
