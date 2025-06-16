#!/usr/bin/env node

const fs = require("fs").promises;
const path = require("path");
const { parse } = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const generate = require("@babel/generator").default;
const t = require("@babel/types");

/**
 * Advanced migration script using AST transformation for more accurate console to logger migration
 */

const CONFIG = {
	methodMappings: {
		log: "info",
		error: "error",
		warn: "warn",
		debug: "debug",
		info: "info",
	},

	serviceNamePatterns: [
		// App-specific patterns
		{
			pattern: /apps\/web\/app\/home\/\(user\)\/ai\/([^/]+)/,
			name: (match) => `ai-${match[1]}`,
		},
		{
			pattern: /apps\/web\/app\/home\/\(user\)\/([^/]+)/,
			name: (match) => match[1],
		},
		{
			pattern: /apps\/web\/app\/home\/\[account\]\/([^/]+)/,
			name: (match) => `team-${match[1]}`,
		},
		{
			pattern: /apps\/web\/app\/admin\/([^/]+)/,
			name: (match) => `admin-${match[1]}`,
		},
		{
			pattern: /apps\/web\/app\/api\/([^/]+)/,
			name: (match) => `api-${match[1]}`,
		},
		{ pattern: /apps\/web\/lib\/([^/]+)/, name: (match) => match[1] },
		{ pattern: /apps\/payload/, name: () => "payload" },
		{ pattern: /apps\/dev-tool/, name: () => "dev-tool" },

		// Package patterns
		{ pattern: /packages\/ai-gateway/, name: () => "ai-gateway" },
		{
			pattern: /packages\/billing\/([^/]+)/,
			name: (match) => `billing-${match[1]}`,
		},
		{
			pattern: /packages\/features\/([^/]+)/,
			name: (match) => `feature-${match[1]}`,
		},
		{
			pattern: /packages\/plugins\/([^/]+)/,
			name: (match) => `plugin-${match[1]}`,
		},
		{
			pattern: /packages\/monitoring\/([^/]+)/,
			name: (match) => `monitoring-${match[1]}`,
		},
		{ pattern: /packages\/cms\/([^/]+)/, name: (match) => `cms-${match[1]}` },
		{ pattern: /packages\/([^/]+)/, name: (match) => match[1] },

		// Default fallback
		{ pattern: /.*/, name: () => "app" },
	],
};

function getServiceName(filePath) {
	const normalizedPath = filePath.replace(/\\/g, "/");

	for (const { pattern, name } of CONFIG.serviceNamePatterns) {
		const match = normalizedPath.match(pattern);
		if (match) {
			return name(match);
		}
	}

	return "app";
}

/**
 * Transform console calls to logger calls using AST
 */
function transformConsoleToLogger(ast, serviceName) {
	let hasConsoleUsage = false;
	let hasLoggerImport = false;
	let needsLoggerDeclaration = false;
	let replacementCount = 0;

	// First pass: check what we have
	traverse(ast, {
		ImportDeclaration(path) {
			if (path.node.source.value === "@kit/shared/logger") {
				hasLoggerImport = true;
			}
		},

		VariableDeclarator(path) {
			if (t.isIdentifier(path.node.id, { name: "logger" })) {
				needsLoggerDeclaration = false;
			}
		},

		MemberExpression(path) {
			if (
				t.isIdentifier(path.node.object, { name: "console" }) &&
				CONFIG.methodMappings[path.node.property.name]
			) {
				hasConsoleUsage = true;
			}
		},
	});

	if (!hasConsoleUsage) {
		return { ast, modified: false, replacementCount: 0 };
	}

	needsLoggerDeclaration = !needsLoggerDeclaration;

	// Second pass: transform
	traverse(ast, {
		Program(path) {
			const body = path.node.body;

			// Add import if needed
			if (!hasLoggerImport) {
				const importDeclaration = t.importDeclaration(
					[
						t.importSpecifier(
							t.identifier("createServiceLogger"),
							t.identifier("createServiceLogger"),
						),
					],
					t.stringLiteral("@kit/shared/logger"),
				);

				// Find where to insert (after other imports or at top)
				let insertIndex = 0;
				for (let i = 0; i < body.length; i++) {
					if (t.isImportDeclaration(body[i])) {
						insertIndex = i + 1;
					} else if (!t.isDirective(body[i])) {
						break;
					}
				}

				body.splice(insertIndex, 0, importDeclaration);

				// Add logger declaration
				if (needsLoggerDeclaration) {
					const loggerDeclaration = t.variableDeclaration("const", [
						t.variableDeclarator(
							t.identifier("logger"),
							t.callExpression(
								t.memberExpression(
									t.callExpression(t.identifier("createServiceLogger"), [
										t.stringLiteral(serviceName),
									]),
									t.identifier("getLogger"),
								),
								[],
							),
						),
					]);

					body.splice(insertIndex + 1, 0, loggerDeclaration);
				}
			}
		},

		CallExpression(path) {
			if (
				t.isMemberExpression(path.node.callee) &&
				t.isIdentifier(path.node.callee.object, { name: "console" })
			) {
				const method = path.node.callee.property.name;
				const loggerMethod = CONFIG.methodMappings[method];

				if (loggerMethod) {
					replacementCount++;

					// Transform arguments
					const args = path.node.arguments;
					let newArgs = [];

					if (args.length === 0) {
						// Empty console call
						newArgs = [t.stringLiteral("Log output")];
					} else if (args.length === 1) {
						const firstArg = args[0];

						if (t.isStringLiteral(firstArg) || t.isTemplateLiteral(firstArg)) {
							// String message
							newArgs = [firstArg];
						} else {
							// Non-string argument - wrap it
							if (
								method === "error" &&
								firstArg.name &&
								firstArg.name.includes("error")
							) {
								newArgs = [
									t.stringLiteral("Error occurred"),
									t.objectExpression([
										t.objectProperty(t.identifier("error"), firstArg),
									]),
								];
							} else {
								newArgs = [
									t.stringLiteral("Log output"),
									t.objectExpression([
										t.objectProperty(t.identifier("data"), firstArg),
									]),
								];
							}
						}
					} else {
						// Multiple arguments
						const firstArg = args[0];

						if (t.isStringLiteral(firstArg) || t.isTemplateLiteral(firstArg)) {
							// First arg is message, rest is data
							if (args.length === 2 && t.isObjectExpression(args[1])) {
								// Already in correct format
								newArgs = args;
							} else {
								// Wrap additional args in object
								const dataProps = args.slice(1).map((arg, index) => {
									const key = t.isIdentifier(arg) ? arg.name : `arg${index}`;
									return t.objectProperty(t.identifier(key), arg);
								});

								newArgs = [firstArg, t.objectExpression(dataProps)];
							}
						} else {
							// No string message, wrap everything
							const dataProps = args.map((arg, index) => {
								const key = t.isIdentifier(arg) ? arg.name : `arg${index}`;
								return t.objectProperty(t.identifier(key), arg);
							});

							newArgs = [
								t.stringLiteral("Log output"),
								t.objectExpression(dataProps),
							];
						}
					}

					// Replace the call
					path.replaceWith(
						t.callExpression(
							t.memberExpression(
								t.identifier("logger"),
								t.identifier(loggerMethod),
							),
							newArgs,
						),
					);
				}
			}
		},
	});

	return { ast, modified: true, replacementCount };
}

/**
 * Process a single file using AST transformation
 */
async function processFileWithAST(filePath) {
	try {
		const content = await fs.readFile(filePath, "utf8");
		const serviceName = getServiceName(filePath);

		// Determine parser plugins based on file extension
		const plugins = ["typescript", "jsx", "decorators-legacy"];
		if (filePath.endsWith(".tsx")) {
			plugins.push("jsx");
		}

		// Parse the file
		const ast = parse(content, {
			sourceType: "module",
			plugins,
		});

		// Transform the AST
		const {
			ast: transformedAst,
			modified,
			replacementCount,
		} = transformConsoleToLogger(ast, serviceName);

		if (!modified) {
			return {
				filePath,
				status: "skipped",
				reason: "No console statements found",
			};
		}

		// Generate the new code
		const { code } = generate(transformedAst, {
			retainLines: true,
			retainFunctionParens: true,
		});

		// Write back
		await fs.writeFile(filePath, code, "utf8");

		return {
			filePath,
			status: "success",
			serviceName,
			replacementCount,
		};
	} catch (error) {
		// If AST parsing fails, fall back to regex approach
		if (error.code === "BABEL_PARSER_SYNTAX_ERROR") {
			return {
				filePath,
				status: "error",
				error: "AST parsing failed - file may need manual migration",
				suggestion: "Try the basic migration script instead",
			};
		}

		return {
			filePath,
			status: "error",
			error: error.message,
		};
	}
}

/**
 * Main function
 */
async function main() {
	const args = process.argv.slice(2);

	if (args.length === 0) {
		console.error("Advanced Logger Migration Tool");
		console.error("==============================");
		console.error("");
		console.error("Usage:");
		console.error(
			"  node migrate-to-logger-advanced.js <file1> [file2] [...fileN]",
		);
		console.error(
			"  node migrate-to-logger-advanced.js --from-file <file-list.txt>",
		);
		console.error("");
		console.error(
			"Note: This script requires @babel/parser, @babel/traverse, @babel/generator, and @babel/types",
		);
		console.error(
			"Install with: npm install --save-dev @babel/parser @babel/traverse @babel/generator @babel/types",
		);
		process.exit(1);
	}

	// Check if babel packages are installed
	try {
		require("@babel/parser");
		require("@babel/traverse");
		require("@babel/generator");
		require("@babel/types");
	} catch (error) {
		console.error("Error: Required Babel packages not found!");
		console.error("Please install them with:");
		console.error(
			"  npm install --save-dev @babel/parser @babel/traverse @babel/generator @babel/types",
		);
		process.exit(1);
	}

	let files = [];

	// Handle file list from text file
	if (args[0] === "--from-file" && args[1]) {
		const fileListPath = args[1];
		try {
			const fileListContent = await fs.readFile(fileListPath, "utf8");
			files = fileListContent.split("\n").filter((line) => line.trim());
		} catch (error) {
			console.error(`Error reading file list: ${error.message}`);
			process.exit(1);
		}
	} else {
		files = args;
	}

	// Validate files exist
	const validFiles = [];
	for (const file of files) {
		try {
			await fs.access(file);
			validFiles.push(file);
		} catch {
			console.warn(`Warning: File not found: ${file}`);
		}
	}

	if (validFiles.length === 0) {
		console.error("No valid files to process");
		process.exit(1);
	}

	console.log(
		`Processing ${validFiles.length} files with AST transformation...\n`,
	);

	// Process files
	const results = await Promise.all(validFiles.map(processFileWithAST));

	// Display results
	const successful = results.filter((r) => r.status === "success");
	const skipped = results.filter((r) => r.status === "skipped");
	const errors = results.filter((r) => r.status === "error");

	if (successful.length > 0) {
		console.log("✅ Successfully migrated:");
		successful.forEach((result) => {
			console.log(
				`   ${result.filePath} (${result.replacementCount} replacements, service: ${result.serviceName})`,
			);
		});
		console.log("");
	}

	if (skipped.length > 0) {
		console.log("⏩ Skipped:");
		skipped.forEach((result) => {
			console.log(`   ${result.filePath} - ${result.reason}`);
		});
		console.log("");
	}

	if (errors.length > 0) {
		console.log("❌ Errors:");
		errors.forEach((result) => {
			console.log(`   ${result.filePath} - ${result.error}`);
			if (result.suggestion) {
				console.log(`      Suggestion: ${result.suggestion}`);
			}
		});
		console.log("");
	}

	console.log(
		`Summary: ${successful.length} migrated, ${skipped.length} skipped, ${errors.length} errors`,
	);

	if (errors.length > 0) {
		console.log(
			"\nFor files that failed AST parsing, try the basic migration script:",
		);
		console.log("  node scripts/migrate-to-logger.js <failed-files>");
	}
}

// Run the script
main().catch((error) => {
	console.error("Fatal error:", error);
	process.exit(1);
});
