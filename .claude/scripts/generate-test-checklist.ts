#!/usr/bin/env tsx
/**
 * Generates a unit test checklist by analyzing the codebase
 * Identifies testable files based on priority criteria
 */

import { promises as fs } from "node:fs";
import * as path from "node:path";
import { glob } from "glob";

interface TestTarget {
	filePath: string;
	priority: number;
	category: string;
	hasTests: boolean;
	testFilePath: string | null;
	functionCount: number;
	complexity: "low" | "medium" | "high";
	dependencies: string[];
}

// Priority paths based on the unit testing prioritization plan
const PRIORITY_PATHS = {
	1: {
		"AI Canvas/Editor System": [
			"apps/web/app/home/(user)/ai/canvas/_actions/*.ts",
			"apps/web/app/home/(user)/ai/canvas/_lib/utils/*.ts",
			"apps/web/app/home/(user)/ai/canvas/_lib/services/*.ts",
		],
		"Storyboard/Presentation System": [
			"apps/web/app/home/(user)/ai/storyboard/_lib/services/*.ts",
			"apps/web/app/home/(user)/ai/storyboard/_actions/*.ts",
		],
		"Course/Lesson System": [
			"apps/web/app/home/(user)/course/_lib/server/*.ts",
			"apps/web/app/home/(user)/course/lessons/[slug]/_lib/*.ts",
		],
	},
	2: {
		"Payload Custom Collections": ["apps/payload/src/collections/*.ts"],
		"Payload Custom Blocks": ["apps/payload/src/blocks/**/Field.tsx"],
		"Payload Enhanced Systems": ["apps/payload/src/lib/*.ts"],
	},
	3: {
		"Custom API Routes": ["apps/web/app/api/**/route.ts"],
		"Kanban System": ["apps/web/app/home/(user)/kanban/_lib/**/*.ts"],
	},
};

// Files to exclude from testing
const EXCLUDE_PATTERNS = [
	"**/node_modules/**",
	"**/*.d.ts",
	"**/*.config.ts",
	"**/*.config.js",
	"**/types.ts",
	"**/index.ts",
	"**/_components/**", // UI components are lower priority
	"**/layout.tsx",
	"**/page.tsx",
	"**/loading.tsx",
	"**/error.tsx",
];

async function analyzeFile(filePath: string): Promise<Partial<TestTarget>> {
	const content = await fs.readFile(filePath, "utf-8");

	// Count exported functions (rough complexity metric)
	const exportedFunctions = (
		content.match(/export\s+(async\s+)?function/g) || []
	).length;
	const exportedArrowFunctions = (
		content.match(/export\s+const\s+\w+\s+=\s+(async\s+)?\(/g) || []
	).length;
	const functionCount = exportedFunctions + exportedArrowFunctions;

	// Detect dependencies
	const dependencies: string[] = [];
	if (content.includes("createAIGatewayClient"))
		dependencies.push("AI Gateway");
	if (content.includes("supabase")) dependencies.push("Database");
	if (content.includes("fetch(")) dependencies.push("External API");
	if (content.includes("fs.") || content.includes("readFile"))
		dependencies.push("File System");

	// Determine complexity
	let complexity: "low" | "medium" | "high" = "low";
	if (functionCount > 5 || dependencies.length > 2) complexity = "high";
	else if (functionCount > 2 || dependencies.length > 0) complexity = "medium";

	return {
		functionCount,
		complexity,
		dependencies,
	};
}

async function findTestFile(filePath: string): Promise<string | null> {
	const dir = path.dirname(filePath);
	const basename = path.basename(filePath, path.extname(filePath));

	// Common test file patterns
	const testPatterns = [
		path.join(dir, `${basename}.test.ts`),
		path.join(dir, `${basename}.spec.ts`),
		path.join(dir, "__tests__", `${basename}.test.ts`),
		path.join(dir, "__tests__", `${basename}.spec.ts`),
	];

	for (const pattern of testPatterns) {
		try {
			await fs.access(pattern);
			return pattern;
		} catch {
			// File doesn't exist
		}
	}

	return null;
}

async function generateChecklist() {
	const testTargets: TestTarget[] = [];

	// Process each priority level
	for (const [priorityLevel, categories] of Object.entries(PRIORITY_PATHS)) {
		const priority = Number.parseInt(priorityLevel);

		for (const [category, patterns] of Object.entries(categories)) {
			for (const pattern of patterns) {
				const files = await glob(pattern, { ignore: EXCLUDE_PATTERNS });

				for (const filePath of files) {
					const analysis = await analyzeFile(filePath);
					const testFilePath = await findTestFile(filePath);

					testTargets.push({
						filePath,
						priority,
						category,
						hasTests: !!testFilePath,
						testFilePath,
						functionCount: analysis.functionCount ?? 0,
						complexity: analysis.complexity ?? "low",
						dependencies: analysis.dependencies ?? [],
					});
				}
			}
		}
	}

	// Sort by priority and complexity
	testTargets.sort((a, b) => {
		if (a.priority !== b.priority) return a.priority - b.priority;
		const complexityOrder = { high: 0, medium: 1, low: 2 };
		return complexityOrder[a.complexity] - complexityOrder[b.complexity];
	});

	return testTargets;
}

async function generateMarkdownChecklist(targets: TestTarget[]) {
	const totalFiles = targets.length;
	const filesWithTests = targets.filter((t) => t.hasTests).length;
	const coverage =
		totalFiles > 0 ? ((filesWithTests / totalFiles) * 100).toFixed(1) : "0";

	let markdown = `# Unit Test Checklist Tracker

## Progress Overview
- Total Files: ${totalFiles}
- Files with Tests: ${filesWithTests}
- Coverage: ${coverage}%
- Last Updated: ${new Date().toISOString().split("T")[0]}

## Test Targets by Priority
`;

	// Group by priority and category
	const grouped = targets.reduce(
		(acc, target) => {
			const key = `Priority ${target.priority}: ${target.category}`;
			if (!acc[key]) acc[key] = [];
			acc[key].push(target);
			return acc;
		},
		{} as Record<string, TestTarget[]>,
	);

	for (const [group, groupTargets] of Object.entries(grouped)) {
		markdown += `\n### ${group}\n\n`;

		for (const target of groupTargets) {
			const checkbox = target.hasTests ? "[x]" : "[ ]";
			const relativePath = target.filePath.replace(`${process.cwd()}/`, "");

			markdown += `- ${checkbox} \`${relativePath}\`\n`;
			markdown += `  - **Complexity**: ${target.complexity}\n`;
			markdown += `  - **Functions**: ${target.functionCount}\n`;
			if (target.dependencies.length > 0) {
				markdown += `  - **Dependencies**: ${target.dependencies.join(", ")}\n`;
			}
			if (target.hasTests && target.testFilePath) {
				const relativeTestPath = target.testFilePath.replace(
					`${process.cwd()}/`,
					"",
				);
				markdown += `  - **Test File**: \`${relativeTestPath}\`\n`;
			}
			markdown += "\n";
		}
	}

	return markdown;
}

// Main execution
async function main() {
	// Analyzing codebase for test targets
	process.stdout.write("Analyzing codebase for test targets...\n");
	const targets = await generateChecklist();

	process.stdout.write(`Found ${targets.length} files to test\n`);

	// Generate markdown checklist
	const markdown = await generateMarkdownChecklist(targets);
	const outputPath = ".claude/docs/testing/unit-test-checklist.md";

	await fs.mkdir(path.dirname(outputPath), { recursive: true });
	await fs.writeFile(outputPath, markdown);

	process.stdout.write(`Checklist generated at: ${outputPath}\n`);

	// Also generate JSON for programmatic use
	const jsonPath = ".claude/docs/testing/unit-test-checklist.json";
	await fs.writeFile(jsonPath, JSON.stringify(targets, null, 2));

	process.stdout.write(`JSON data generated at: ${jsonPath}\n`);
}

main().catch((error) => {
	process.stderr.write(`Error: ${error.message}\n`);
	process.exit(1);
});
