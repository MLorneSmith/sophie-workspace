#!/usr/bin/env node

import { promises as fs } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function fileExists(filePath) {
	try {
		const stat = await fs.stat(filePath);
		return stat.isFile();
	} catch {
		return false;
	}
}

async function directoryExists(dirPath) {
	try {
		const stat = await fs.stat(dirPath);
		return stat.isDirectory();
	} catch {
		return false;
	}
}

async function resolveImportPath(importPath, fromFile) {
	const fromDir = dirname(fromFile);
	const absolutePath = resolve(fromDir, importPath);

	// Check if it's already a file with extension
	if (await fileExists(absolutePath)) {
		return importPath;
	}

	// Check if adding .js makes it a valid file
	if (await fileExists(`${absolutePath}.js`)) {
		return `${importPath}.js`;
	}

	// Check if adding .jsx makes it a valid file
	if (await fileExists(`${absolutePath}.jsx`)) {
		return `${importPath}.jsx`;
	}

	// Check if it's a directory with index.js
	if (await directoryExists(absolutePath)) {
		if (await fileExists(join(absolutePath, "index.js"))) {
			return `${importPath}/index.js`;
		}
		// Also check for index.jsx
		if (await fileExists(join(absolutePath, "index.jsx"))) {
			return `${importPath}/index.jsx`;
		}
	}

	// Default: assume it's a file and add .js
	return `${importPath}.js`;
}

async function fixEsmImports(dir) {
	const entries = await fs.readdir(dir, { withFileTypes: true });

	for (const entry of entries) {
		const fullPath = join(dir, entry.name);

		if (entry.isDirectory()) {
			await fixEsmImports(fullPath);
		} else if (entry.name.endsWith(".js") || entry.name.endsWith(".jsx")) {
			let content = await fs.readFile(fullPath, "utf-8");
			let modified = false;

			// Fix relative imports to add proper extension
			const importRegex = /from\s+["'](\.[^"']+)["']/g;
			const matches = [...content.matchAll(importRegex)];

			for (const match of matches) {
				const originalImport = match[1];
				// Skip if already has an extension
				if (originalImport.match(/\.\w+$/)) {
					continue;
				}

				const resolvedPath = await resolveImportPath(originalImport, fullPath);
				if (resolvedPath !== originalImport) {
					content = content.replace(
						`from "${originalImport}"`,
						`from "${resolvedPath}"`,
					);
					content = content.replace(
						`from '${originalImport}'`,
						`from '${resolvedPath}'`,
					);
					modified = true;
				}
			}

			// Fix dynamic imports
			const dynamicImportRegex = /import\(["'](\.[^"']+)["']\)/g;
			const dynamicMatches = [...content.matchAll(dynamicImportRegex)];

			for (const match of dynamicMatches) {
				const originalImport = match[1];
				// Skip if already has an extension
				if (originalImport.match(/\.\w+$/)) {
					continue;
				}

				const resolvedPath = await resolveImportPath(originalImport, fullPath);
				if (resolvedPath !== originalImport) {
					content = content.replace(
						`import("${originalImport}")`,
						`import("${resolvedPath}")`,
					);
					content = content.replace(
						`import('${originalImport}')`,
						`import('${resolvedPath}')`,
					);
					modified = true;
				}
			}

			if (modified) {
				await fs.writeFile(fullPath, content);
			}
		}
	}
}

const distDir = join(__dirname, "..", "dist");
fixEsmImports(distDir)
	.then(() => {})
	.catch((error) => {
		// biome-ignore lint/suspicious/noConsole: Script error logging
		console.error("Error fixing ESM imports:", error);
		process.exit(1);
	});
