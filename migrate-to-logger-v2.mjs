#!/usr/bin/env node
// biome-ignore lint/suspicious/noConsole: Migration script - console output is required

import fs from "node:fs/promises";
import path from "node:path";
import { glob } from "glob";

// Configuration
const config = {
	extensions: [".ts", ".tsx", ".js", ".jsx"],
	excludePatterns: [
		"**/node_modules/**",
		"**/.next/**",
		"**/dist/**",
		"**/build/**",
		"**/*.test.*",
		"**/*.spec.*",
		"**/migrate-to-logger*.mjs",
	],
	loggerImportPath: "@/lib/logging",
};

// Detect if file is a React component
function isReactComponent(content) {
	// Check for "use client" directive
	if (content.includes('"use client"') || content.includes("'use client'")) {
		return true;
	}

	// Check for JSX syntax
	const jsxPattern = /<[A-Z][a-zA-Z0-9]*[\s>/]/;
	const fragmentPattern = /<>|<\//;
	const hookPattern = /\buse[A-Z]\w*\s*\(/;

	return (
		jsxPattern.test(content) ||
		fragmentPattern.test(content) ||
		hookPattern.test(content)
	);
}

// Detect if a function is async
function isAsyncFunction(functionStr) {
	return (
		/^async\s+/.test(functionStr.trim()) ||
		/\basync\s+function/.test(functionStr) ||
		/\basync\s*\(/.test(functionStr)
	);
}

// Extract the enclosing function context
function getEnclosingFunction(content, position) {
	// Find the function that contains this position
	const beforePosition = content.substring(0, position);

	// Look for function declarations/expressions
	const functionPatterns = [
		/(?:export\s+)?(?:async\s+)?function\s+\w+\s*\([^)]*\)\s*{$/m,
		/(?:const|let|var)\s+\w+\s*=\s*(?:async\s+)?(?:function\s*)?\([^)]*\)\s*(?:=>|{)$/m,
		/(?:const|let|var)\s+\w+\s*=\s*(?:async\s+)?function\s*\([^)]*\)\s*{$/m,
		/\w+\s*:\s*(?:async\s+)?(?:function\s*)?\([^)]*\)\s*(?:=>|{)$/m,
	];

	let lastFunctionStart = -1;
	let functionDeclaration = "";

	for (const pattern of functionPatterns) {
		const matches = [
			...beforePosition.matchAll(new RegExp(pattern.source, "gm")),
		];
		if (matches.length > 0) {
			const lastMatch = matches[matches.length - 1];
			if (lastMatch.index > lastFunctionStart) {
				lastFunctionStart = lastMatch.index;
				functionDeclaration = lastMatch[0];
			}
		}
	}

	return {
		isAsync: isAsyncFunction(functionDeclaration),
		startPosition: lastFunctionStart,
		declaration: functionDeclaration,
	};
}

// Process React component console statements
function processReactConsole(content, consoleMatch, fullMatch) {
	const method = consoleMatch[1];
	const args = consoleMatch[2];

	// Check if we're in useEffect
	const beforeMatch = content.substring(0, content.indexOf(fullMatch));
	const inUseEffect = /useEffect\s*\(\s*\(\s*\)\s*=>\s*{[^}]*$/.test(
		beforeMatch,
	);

	if (inUseEffect) {
		// Wrap in async function inside useEffect
		return `(async () => { const logger = await getLogger(); logger.${method}(${args}); })()`;
	} else {
		// For event handlers and other contexts, check if we're in an async function
		const functionContext = getEnclosingFunction(
			content,
			content.indexOf(fullMatch),
		);

		if (functionContext.isAsync) {
			// We're in an async function, can use await directly
			return `{ const logger = await getLogger(); logger.${method}(${args}); }`;
		} else {
			// Wrap in IIFE
			return `(async () => { const logger = await getLogger(); logger.${method}(${args}); })()`;
		}
	}
}

// Process server-side console statements
async function processServerConsole(content) {
	let processed = content;
	let hasLogger = false;
	const loggerDeclarations = new Map(); // Track logger declarations per function

	// Find all console statements
	const consolePattern =
		/console\.(log|error|warn|info|debug)\s*\(((?:[^)(]|\([^)]*\))*)\)/g;
	const matches = [...content.matchAll(consolePattern)];

	// Process each match
	for (const match of matches) {
		const [fullMatch, method, args] = match;
		const position = match.index;

		// Get the enclosing function context
		const functionContext = getEnclosingFunction(content, position);

		if (functionContext.isAsync && functionContext.startPosition !== -1) {
			// We're in an async function
			const functionKey = `${functionContext.startPosition}`;

			if (!loggerDeclarations.has(functionKey)) {
				// Need to add logger declaration at the start of this function
				loggerDeclarations.set(functionKey, {
					position: functionContext.startPosition,
					declaration: functionContext.declaration,
				});
			}

			// Replace console with logger
			processed = processed.replace(fullMatch, `logger.${method}(${args})`);
			hasLogger = true;
		} else {
			// Not in an async context or couldn't determine context
			// Wrap in IIFE
			const replacement = `(async () => { const logger = await getLogger(); logger.${method}(${args}); })()`;
			processed = processed.replace(fullMatch, replacement);
			hasLogger = true;
		}
	}

	// Insert logger declarations
	if (loggerDeclarations.size > 0) {
		// Sort by position (descending) to insert from bottom to top
		const sortedDeclarations = [...loggerDeclarations.entries()].sort(
			(a, b) => b[1].position - a[1].position,
		);

		for (const [_key, { position, declaration }] of sortedDeclarations) {
			// Find the opening brace of the function
			const afterDeclaration = processed.substring(
				position + declaration.length,
			);
			const braceMatch = afterDeclaration.match(/^\s*{/);

			if (braceMatch) {
				const insertPosition =
					position +
					declaration.length +
					braceMatch.index +
					braceMatch[0].length;
				processed =
					processed.slice(0, insertPosition) +
					"\n  const logger = await getLogger();" +
					processed.slice(insertPosition);
			}
		}
	}

	return { processed, hasLogger };
}

// Add import statement if needed
function addLoggerImport(content, hasLogger) {
	if (!hasLogger) return content;

	// Check if logger is already imported
	if (
		content.includes("getLogger") &&
		content.includes(config.loggerImportPath)
	) {
		return content;
	}

	// Find the right place to add import
	const importPattern = /^import\s+.*?from\s+['"].*?['"];?\s*$/gm;
	const imports = [...content.matchAll(importPattern)];

	const importStatement = `import { getLogger } from '${config.loggerImportPath}';\n`;

	if (imports.length > 0) {
		// Add after the last import
		const lastImport = imports[imports.length - 1];
		const insertPosition = lastImport.index + lastImport[0].length;
		return (
			content.slice(0, insertPosition) +
			"\n" +
			importStatement +
			content.slice(insertPosition)
		);
	} else {
		// Add at the beginning of the file (after 'use client' if present)
		const useClientMatch = content.match(/^['"]use client['"];?\s*$/m);
		if (useClientMatch) {
			const insertPosition = useClientMatch.index + useClientMatch[0].length;
			return (
				content.slice(0, insertPosition) +
				"\n\n" +
				importStatement +
				content.slice(insertPosition)
			);
		} else {
			return `${importStatement}\n${content}`;
		}
	}
}

// Process a single file
async function processFile(filePath) {
	try {
		const content = await fs.readFile(filePath, "utf-8");

		// Skip if no console statements
		if (!content.includes("console.")) {
			return { skipped: true, reason: "No console statements" };
		}

		// Skip if already using logger
		if (content.includes("getLogger") && content.includes("logger.")) {
			return { skipped: true, reason: "Already using logger" };
		}

		let processed = content;
		let hasLogger = false;

		if (isReactComponent(content)) {
			// Process as React component
			const consolePattern =
				/console\.(log|error|warn|info|debug)\s*\(((?:[^)(]|\([^)]*\))*)\)/g;

			processed = content.replace(consolePattern, (fullMatch, method, args) => {
				hasLogger = true;
				return processReactConsole(
					content,
					[fullMatch, method, args],
					fullMatch,
				);
			});
		} else {
			// Process as server-side code
			const result = await processServerConsole(content);
			processed = result.processed;
			hasLogger = result.hasLogger;
		}

		// Add import if needed
		if (hasLogger) {
			processed = addLoggerImport(processed, hasLogger);
		}

		// Only write if there were changes
		if (processed !== content) {
			await fs.writeFile(filePath, processed, "utf-8");
			return { success: true, modified: true };
		}

		return { skipped: true, reason: "No changes needed" };
	} catch (error) {
		return { error: error.message };
	}
}

// Main migration function
async function migrate() {
	// biome-ignore lint/suspicious/noConsole: Progress information
	console.log("🚀 Starting logger migration v2...\n");

	// Find all files to process
	const patterns = config.extensions.map((ext) => `**/*${ext}`);
	const files = await glob(patterns, {
		ignore: config.excludePatterns,
		absolute: true,
	});

	// biome-ignore lint/suspicious/noConsole: File count information
	console.log(`Found ${files.length} files to process\n`);

	const results = {
		processed: 0,
		modified: 0,
		skipped: 0,
		errors: 0,
	};

	// Process files
	for (const file of files) {
		const relativePath = path.relative(process.cwd(), file);
		process.stdout.write(`Processing ${relativePath}... `);

		const result = await processFile(file);

		if (result.error) {
			// biome-ignore lint/suspicious/noConsole: Error reporting
			console.log(`❌ Error: ${result.error}`);
			results.errors++;
		} else if (result.skipped) {
			// biome-ignore lint/suspicious/noConsole: Skip reporting
			console.log(`⏭️  Skipped: ${result.reason}`);
			results.skipped++;
		} else if (result.modified) {
			// biome-ignore lint/suspicious/noConsole: Success reporting
			console.log("✅ Modified");
			results.modified++;
		}

		results.processed++;
	}

	// Summary
	// biome-ignore lint/suspicious/noConsole: Summary report
	console.log("\n📊 Migration Summary:");
	// biome-ignore lint/suspicious/noConsole: Summary statistics
	console.log(`   Total files processed: ${results.processed}`);
	// biome-ignore lint/suspicious/noConsole: Summary statistics
	console.log(`   Files modified: ${results.modified}`);
	// biome-ignore lint/suspicious/noConsole: Summary statistics
	console.log(`   Files skipped: ${results.skipped}`);
	// biome-ignore lint/suspicious/noConsole: Summary statistics
	console.log(`   Errors: ${results.errors}`);

	if (results.errors > 0) {
		// biome-ignore lint/suspicious/noConsole: Error warning
		console.log("\n⚠️  Some files had errors. Please review them manually.");
	}

	// biome-ignore lint/suspicious/noConsole: Completion message
	console.log("\n✨ Migration complete!");
	// biome-ignore lint/suspicious/noConsole: Next steps header
	console.log("\n📝 Next steps:");
	// biome-ignore lint/suspicious/noConsole: Next steps instructions
	console.log("   1. Review the changes using `git diff`");
	// biome-ignore lint/suspicious/noConsole: Next steps instructions
	console.log("   2. Run your tests to ensure everything works");
	// biome-ignore lint/suspicious/noConsole: Next steps instructions
	console.log("   3. Check that async functions are properly handled");
	// biome-ignore lint/suspicious/noConsole: Next steps instructions
	console.log("   4. Commit the changes when satisfied");
}

// Run migration
migrate().catch((error) => {
	// biome-ignore lint/suspicious/noConsole: Fatal error reporting
	console.error("Fatal error:", error);
	process.exit(1);
});
