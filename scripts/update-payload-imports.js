#!/usr/bin/env node

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.join(__dirname, "..");

// Find all files that import from payload-types
const grepResult = execSync(
	'grep -r "payload/payload-types" apps/web/ --include="*.ts" --include="*.tsx" -l || true',
	{ cwd: rootDir, encoding: "utf8" },
).trim();

if (!grepResult) {
	console.log("No files found to update");
	process.exit(0);
}

const files = grepResult.split("\n").filter(Boolean);
let updatedCount = 0;

files.forEach((file) => {
	const filePath = path.join(rootDir, file);
	const content = fs.readFileSync(filePath, "utf8");

	// Replace relative imports from payload with @kit/cms-types
	const importRegex = /from\s+["']\.\.\/.*?payload\/payload-types["']/g;
	const newContent = content.replace(importRegex, 'from "@kit/cms-types"');

	if (content !== newContent) {
		fs.writeFileSync(filePath, newContent);
		console.log(`✅ Updated: ${file}`);
		updatedCount++;
	}
});

console.log(`\n🎉 Updated ${updatedCount} files to use @kit/cms-types`);
