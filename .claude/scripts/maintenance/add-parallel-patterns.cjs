#!/usr/bin/env node

/**
 * add-parallel-patterns.cjs
 * Adds parallel execution patterns to agents for better performance
 */

const fs = require("node:fs");
const path = require("node:path");

// Parallel execution patterns for agents
const parallelPatterns = {
	"cicd-investigator": {
		path: "./.claude/agents/cicd-investigator.md",
		pattern: `## Parallel Execution Protocol

**CRITICAL**: Execute all investigations simultaneously for 3-5x performance improvement.

When investigating CI/CD failures, launch in ONE message:
1. **Log Analysis**: Fetch build logs, error traces, and test results
2. **Context Gathering**: Read workflow files, configuration, and recent commits
3. **Dependency Check**: Analyze package files and environment variables
4. **History Analysis**: Check recent successful runs and compare differences

Example parallel execution:
\`\`\`
// Send all these in ONE message:
- Bash: gh run view [run-id] --log
- Read: .github/workflows/[workflow].yml
- Grep: Search for error patterns in logs
- Task: Launch code-search-expert for finding related code
\`\`\``,
	},

	"git-expert": {
		path: "./.claude/agents/git/git-expert.md",
		pattern: `## Parallel Execution Protocol

**CRITICAL**: Execute git operations simultaneously for optimal performance.

When analyzing repository state, execute in ONE message:
1. **Status Operations**: git status, git diff, git log
2. **Branch Analysis**: git branch -a, git remote -v
3. **History Search**: git log --grep, git blame on multiple files
4. **Conflict Resolution**: Analyze multiple conflicted files simultaneously

Example for merge conflict resolution:
\`\`\`
// Send all these in ONE message:
- Bash: git status --porcelain
- Bash: git diff --name-only --diff-filter=U
- Bash: git log --oneline -10 --graph --all
- Read: All conflicted files simultaneously
\`\`\``,
	},

	"documentation-expert": {
		path: "./.claude/agents/documentation/documentation-expert.md",
		pattern: `## Parallel Execution Protocol

**CRITICAL**: Analyze multiple documentation files simultaneously.

When reviewing documentation:
1. **Multi-file Analysis**: Read all related docs in ONE message
2. **Cross-reference Check**: Search for links and references in parallel
3. **Consistency Validation**: Check terminology and style across files
4. **Structure Analysis**: Evaluate navigation and organization simultaneously

Example documentation review:
\`\`\`
// Send all these in ONE message:
- Read: README.md, CONTRIBUTING.md, docs/index.md
- Grep: Search for broken links across all docs
- Glob: Find all markdown files in docs/
- Task: Launch code-search-expert for API documentation
\`\`\``,
	},

	"ai-sdk-expert": {
		path: "./.claude/agents/ai-sdk-expert.md",
		pattern: `## Parallel Execution Protocol

**CRITICAL**: Check multiple aspects of AI SDK implementation simultaneously.

When analyzing AI SDK setup:
1. **Provider Analysis**: Check all AI provider configurations in parallel
2. **Dependency Review**: Analyze package.json and lock files simultaneously
3. **Implementation Search**: Find all AI SDK usage patterns at once
4. **Error Diagnosis**: Check logs, traces, and error patterns in parallel

Example AI SDK investigation:
\`\`\`
// Send all these in ONE message:
- Grep: Search for "useChat", "useCompletion", "streamText"
- Read: All AI route handlers and server actions
- Bash: Check installed AI SDK versions
- Task: Launch multiple searches for provider-specific patterns
\`\`\``,
	},

	"prompt-construction-expert": {
		path: "./.claude/agents/commands/prompt-construction-expert.md",
		pattern: `## Parallel Execution Protocol

**CRITICAL**: Search for templates and examples simultaneously.

When constructing prompts:
1. **Template Discovery**: Search all prompt templates in parallel
2. **Pattern Analysis**: Find similar prompts across the codebase
3. **Context Gathering**: Read related files and configurations
4. **Example Extraction**: Collect multiple examples simultaneously

Example prompt research:
\`\`\`
// Send all these in ONE message:
- Grep: Search for "system:", "user:", "assistant:" patterns
- Glob: Find all .md files with prompts
- Read: Multiple template files simultaneously
- Task: Launch code-search-expert for prompt patterns
\`\`\``,
	},

	"frontend-css-styling-expert": {
		path: "./.claude/agents/frontend/frontend-css-styling-expert.md",
		pattern: `## Parallel Execution Protocol

**CRITICAL**: Analyze styles and components simultaneously for faster diagnosis.

When addressing CSS issues:
1. **Style Analysis**: Read all related CSS/SCSS files in ONE message
2. **Component Review**: Check all components using the styles
3. **Theme Investigation**: Analyze theme files and CSS variables
4. **Cross-browser Check**: Search for browser-specific issues in parallel

Example styling investigation:
\`\`\`
// Send all these in ONE message:
- Glob: Find all CSS/SCSS files in components/
- Read: Theme configuration and global styles
- Grep: Search for className usage
- Task: Launch accessibility-expert for a11y styling
\`\`\``,
	},

	"triage-expert": {
		path: "./.claude/agents/triage-expert.md",
		pattern: `## Parallel Execution Protocol

**CRITICAL**: Gather all diagnostic information simultaneously for rapid triage.

When diagnosing issues:
1. **Error Collection**: Gather all error messages and stack traces
2. **Context Assembly**: Read relevant files and configurations
3. **Pattern Search**: Search for similar issues in codebase
4. **Environment Check**: Analyze dependencies and settings

Example triage execution:
\`\`\`
// Send all these in ONE message:
- Bash: Check running processes and ports
- Read: Error logs and recent changes
- Grep: Search for error patterns
- Task: Launch specialized experts based on error type
\`\`\`

This parallel approach provides 3-5x faster issue diagnosis.`,
	},
};

function insertParallelPattern(filePath, pattern, agentName) {
	const fullPath = path.join(process.cwd(), filePath);

	if (!fs.existsSync(fullPath)) {
		console.error(`❌ File not found: ${fullPath}`);
		return false;
	}

	const content = fs.readFileSync(fullPath, "utf-8");

	// Check if parallel pattern already exists
	if (content.includes("## Parallel Execution Protocol")) {
		console.log(
			`ℹ️  ${agentName} already has parallel execution protocol, skipping`,
		);
		return false;
	}

	// Find insertion point - after Delegation Strategy if it exists, or after a suitable section
	let insertionPoint;

	if (content.includes("## Delegation Strategy")) {
		// Insert after delegation strategy
		const delegationIndex = content.indexOf("## Delegation Strategy");
		const afterDelegation = content.substring(delegationIndex);
		const nextSectionMatch = afterDelegation.match(/\n## (?!Delegation)/);

		if (nextSectionMatch) {
			insertionPoint = delegationIndex + nextSectionMatch.index;
		} else {
			// No next section, insert at end of delegation section
			const delegationEndMatch = afterDelegation.match(/\n\n/);
			insertionPoint =
				delegationIndex +
				(delegationEndMatch
					? delegationEndMatch.index + delegationEndMatch[0].length
					: afterDelegation.length);
		}
	} else {
		// Find other suitable insertion points
		const possibleMarkers = [
			"## Execution Protocol",
			"## Core Capabilities",
			"## Investigation Process",
			"## Analysis Framework",
			"## Primary Functions",
		];

		for (const marker of possibleMarkers) {
			if (content.includes(marker)) {
				const markerIndex = content.indexOf(marker);
				const afterMarker = content.substring(markerIndex);
				const nextSectionMatch = afterMarker.match(/\n## /);

				if (nextSectionMatch) {
					insertionPoint = markerIndex + nextSectionMatch.index;
				} else {
					insertionPoint = markerIndex + marker.length + 100;
				}
				break;
			}
		}
	}

	if (!insertionPoint) {
		// Fallback: insert after frontmatter
		const frontmatterEnd = content.match(/---\n([\s\S]*?)\n---\n/);
		if (frontmatterEnd) {
			insertionPoint = frontmatterEnd.index + frontmatterEnd[0].length + 200;
		} else {
			console.error(`❌ Could not find insertion point for ${agentName}`);
			return false;
		}
	}

	// Insert the parallel pattern
	const before = content.substring(0, insertionPoint);
	const after = content.substring(insertionPoint);
	const updatedContent = `${before}\n\n${pattern}\n${after}`;

	fs.writeFileSync(fullPath, updatedContent);
	console.log(`✅ Added parallel execution pattern to ${agentName}`);
	return true;
}

function main() {
	console.log("⚡ Adding Parallel Execution Patterns to Agents\n");

	let successCount = 0;
	let skipCount = 0;
	let errorCount = 0;

	for (const [agentName, config] of Object.entries(parallelPatterns)) {
		const result = insertParallelPattern(
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
	console.log(
		`⏭️  Skipped (already has parallel patterns): ${skipCount} agents`,
	);
	console.log(`❌ Errors: ${errorCount} agents`);

	if (successCount > 0) {
		console.log("\n🎉 Parallel execution patterns have been added!");
		console.log("📝 Next step: Add concrete examples to agents");
	}
}

// Run the script
main();
