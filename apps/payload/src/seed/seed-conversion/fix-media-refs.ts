/**
 * Fix media.json _ref identifiers to match filename stems
 *
 * Problem: media.json has truncated _ref values (e.g., "brainstorming")
 * Solution: Update _ref to use full filename stem (e.g., "blog-brainstorming")
 *
 * Usage: npx tsx src/seed/seed-conversion/fix-media-refs.ts
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const MEDIA_JSON = path.join(__dirname, "../seed-data/media.json");

interface MediaRecord {
	_ref: string;
	filename: string;
	url: string;
	alt: string;
	type: string;
}

// Load current media.json
const currentMedia: MediaRecord[] = JSON.parse(
	fs.readFileSync(MEDIA_JSON, "utf-8"),
);

console.log(`Current media.json has ${currentMedia.length} records\n`);

// Update media records with correct _ref values
const updatedMedia = currentMedia.map((record) => {
	// Extract filename stem (without extension)
	const filenameStem = record.filename.replace(
		/\.(webp|jpg|png|gif|svg|ico)$/i,
		"",
	);

	// If _ref is different from filename stem, update it
	if (record._ref !== filenameStem) {
		console.log(
			`✓ Fixing: "${record._ref}" → "${filenameStem}" (${record.filename})`,
		);
		return {
			...record,
			_ref: filenameStem,
		};
	}

	// Already correct
	console.log(`  OK: "${record._ref}" (${record.filename})`);
	return record;
});

// Write updated media.json
fs.writeFileSync(MEDIA_JSON, JSON.stringify(updatedMedia, null, 2));

console.log(`\n✅ Updated ${updatedMedia.length} media records`);
console.log(`📝 Written to: ${MEDIA_JSON}`);

// Summary of changes
const changedCount = updatedMedia.filter(
	(record, index) => record._ref !== currentMedia[index]._ref,
).length;

console.log("\n📊 Summary:");
console.log(`   Total records: ${updatedMedia.length}`);
console.log(`   Changed: ${changedCount}`);
console.log(`   Unchanged: ${updatedMedia.length - changedCount}`);
