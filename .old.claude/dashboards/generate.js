#!/usr/bin/env node

/**
 * GitHub Pages compatible generator script
 * This file is required for the GitHub Pages workflow to detect and run the generator
 */

import { execSync } from "node:child_process";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

try {
	// Run the main generator
	execSync("node generator/index.js", {
		cwd: __dirname,
		stdio: "inherit",
	});
} catch (_error) {
	process.exit(1);
}
