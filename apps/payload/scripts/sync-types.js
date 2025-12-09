#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceFile = path.join(__dirname, "../payload-types.ts");
const targetFile = path.join(
	__dirname,
	"../../../packages/cms/types/src/payload-types.ts",
);

// Read the generated types
const content = fs.readFileSync(sourceFile, "utf8");

// Remove the module augmentation block (matches the full declare module block including closing brace)
const cleanedContent = content.replace(
	/declare module ['"]payload['"] \{[^}]*\}\s*$/gm,
	"// Module augmentation removed for cross-app compatibility\n",
);

// Ensure target directory exists
const targetDir = path.dirname(targetFile);
if (!fs.existsSync(targetDir)) {
	fs.mkdirSync(targetDir, { recursive: true });
}

// Write the cleaned content
fs.writeFileSync(targetFile, cleanedContent);

console.log(
	"✅ Payload types synced to @kit/cms-types (without module augmentation)",
);
