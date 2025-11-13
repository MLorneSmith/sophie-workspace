#!/usr/bin/env node

/**
 * Claude Code hook to prevent npm usage and enforce pnpm
 * This hook runs before Bash commands are executed
 */

// Read stdin
let inputData = "";
process.stdin.setEncoding("utf8");

process.stdin.on("data", (chunk) => {
	inputData += chunk;
});

process.stdin.on("end", () => {
	try {
		const hookData = JSON.parse(inputData);

		// Check if this is a Bash tool call
		if (
			hookData.tool_input?.tool === "Bash" &&
			hookData.tool_input?.arguments?.command
		) {
			const command = hookData.tool_input.arguments.command;

			// Check if the command contains npm usage
			const npmPatterns = [
				/^npm\s/,
				/\bnpm\s+install\b/,
				/\bnpm\s+i\b/,
				/\bnpm\s+add\b/,
				/\bnpm\s+remove\b/,
				/\bnpm\s+uninstall\b/,
				/\bnpm\s+run\b/,
				/\bnpm\s+test\b/,
				/\bnpm\s+start\b/,
				/\bnpm\s+build\b/,
				/\bnpm\s+ci\b/,
				/\bnpm\s+update\b/,
				/\bnpm\s+audit\b/,
				/\bnpm\s+publish\b/,
				/\bnpm\s+link\b/,
				/\bnpm\s+exec\b/,
				/\bnpm\s+init\b/,
				/\bnpm\s+create\b/,
				/\bnpx\s/,
			];

			const containsNpm = npmPatterns.some((pattern) => pattern.test(command));

			if (containsNpm) {
				// Write error message to stderr
				process.stderr.write(
					"❌ NPM usage detected! This project uses pnpm.\n" +
						"Please use pnpm instead:\n" +
						"  • npm install → pnpm install\n" +
						"  • npm run dev → pnpm dev\n" +
						"  • npm add package → pnpm add package\n" +
						"  • npx command → pnpm dlx command\n",
				);

				// Exit with code 2 to block the command
				process.exit(2);
			}
		}

		// Allow the command to proceed by exiting with code 0
		process.exit(0);
	} catch (_error) {
		// If there's an error parsing, just allow the command to proceed
		process.exit(0);
	}
});
