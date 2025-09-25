#!/usr/bin/env node

/**
 * Token Counter Script
 * Estimates token count for documents using a simple approximation
 *
 * Usage:
 *   node .claude/scripts/token-counter.cjs <file-path>
 *   node .claude/scripts/token-counter.cjs --text "some text to count"
 *   cat file.md | node .claude/scripts/token-counter.cjs --stdin
 *
 * Output:
 *   Returns JSON with token count estimate
 */

const fs = require("node:fs");
const path = require("node:path");

/**
 * Estimate token count using common approximations
 * - Average: ~4 characters per token (GPT-3/4 approximation)
 * - Words: ~0.75 tokens per word
 * - We'll use a balanced approach
 */
function estimateTokens(text) {
	if (!text) return 0;

	// Remove excessive whitespace
	const cleanedText = text.replace(/\s+/g, " ").trim();

	// Method 1: Character-based estimation (4 chars ≈ 1 token)
	const charCount = cleanedText.length;
	const charBasedTokens = Math.ceil(charCount / 4);

	// Method 2: Word-based estimation (1 word ≈ 1.3 tokens for technical docs)
	const words = cleanedText.split(/\s+/).filter((w) => w.length > 0);
	const wordCount = words.length;
	const wordBasedTokens = Math.ceil(wordCount * 1.3);

	// Method 3: Line and special character adjustment
	// Code blocks, special characters, and formatting tend to use more tokens
	const codeBlockCount = (text.match(/```[\s\S]*?```/g) || []).length;
	const specialChars = (text.match(/[{}[\]()<>|\\`~!@#$%^&*+=]/g) || []).length;
	const adjustment = codeBlockCount * 10 + Math.ceil(specialChars / 10);

	// Use the average of both methods with adjustment
	const estimatedTokens =
		Math.ceil((charBasedTokens + wordBasedTokens) / 2) + adjustment;

	return {
		tokens: estimatedTokens,
		characters: charCount,
		words: wordCount,
		method: "balanced",
		details: {
			charBased: charBasedTokens,
			wordBased: wordBasedTokens,
			adjustment: adjustment,
		},
	};
}

/**
 * Read file and estimate tokens
 */
function estimateFileTokens(filePath) {
	try {
		const absolutePath = path.resolve(filePath);

		if (!fs.existsSync(absolutePath)) {
			return {
				error: `File not found: ${filePath}`,
				tokens: 0,
			};
		}

		const content = fs.readFileSync(absolutePath, "utf-8");
		const result = estimateTokens(content);

		return {
			file: filePath,
			...result,
		};
	} catch (error) {
		return {
			error: `Error reading file: ${error.message}`,
			tokens: 0,
		};
	}
}

/**
 * Read from stdin
 */
async function readStdin() {
	return new Promise((resolve) => {
		let data = "";
		process.stdin.setEncoding("utf8");

		process.stdin.on("data", (chunk) => {
			data += chunk;
		});

		process.stdin.on("end", () => {
			resolve(data);
		});

		// Handle no stdin data
		setTimeout(() => {
			if (data === "") {
				resolve("");
			}
		}, 100);
	});
}

/**
 * Main execution
 */
async function main() {
	const args = process.argv.slice(2);

	if (args.length === 0 || args[0] === "--help") {
		console.log(
			JSON.stringify(
				{
					usage: [
						"node token-counter.cjs <file-path>",
						'node token-counter.cjs --text "text to count"',
						"cat file | node token-counter.cjs --stdin",
					],
					description: "Estimates token count for text or files",
				},
				null,
				2,
			),
		);
		return;
	}

	let result;

	if (args[0] === "--text" && args[1]) {
		// Direct text input
		result = estimateTokens(args.slice(1).join(" "));
	} else if (args[0] === "--stdin") {
		// Read from stdin
		const stdinContent = await readStdin();
		result = estimateTokens(stdinContent);
	} else {
		// File path
		result = estimateFileTokens(args[0]);
	}

	// Output as JSON for easy parsing
	console.log(JSON.stringify(result, null, 2));
}

// Execute if run directly
if (require.main === module) {
	main().catch((error) => {
		console.error(
			JSON.stringify(
				{
					error: error.message,
					tokens: 0,
				},
				null,
				2,
			),
		);
		process.exit(1);
	});
}

// Export for use as module
module.exports = {
	estimateTokens,
	estimateFileTokens,
};
