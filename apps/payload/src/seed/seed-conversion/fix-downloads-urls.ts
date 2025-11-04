/**
 * Fix downloads.json URLs to match actual R2 filenames
 *
 * Problem: downloads.json has incorrect filenames that don't exist in R2
 * Solution: Update URLs to use actual filenames from seed-assets directory
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const DOWNLOADS_JSON = path.join(__dirname, "../seed-data/downloads.json");
const DOWNLOADS_DIR = path.join(__dirname, "../seed-assets/downloads");
const R2_BASE_URL = "https://pub-40e84da466344af19a7192a514a7400e.r2.dev";

interface DownloadRecord {
	_ref: string;
	id: string;
	slug: string;
	title: string;
	description: string;
	url: string;
	published: boolean;
	createdAt: string;
	updatedAt: string;
	filename: string;
}

// Get all actual PDF files from directory
const actualFiles = fs
	.readdirSync(DOWNLOADS_DIR)
	.filter((file) => file.endsWith(".pdf"))
	.sort();

console.log(`Found ${actualFiles.length} actual PDF files in R2`);

// Load current downloads.json
const currentDownloads: DownloadRecord[] = JSON.parse(
	fs.readFileSync(DOWNLOADS_JSON, "utf-8"),
);

console.log(`Current downloads.json has ${currentDownloads.length} records`);

// Create mapping from titles to actual filenames
const titleToFilename: Record<string, string> = {
	// Course lesson downloads (numbered)
	Welcome: "101 Welcome.pdf",
	"Course Overview": "103 Course Overview.pdf",
	"Our Process Slides": "201 Our Process.pdf",
	"The Who Slides": "202 The Who.pdf",
	"Introduction Slides": "203 The Why - Introductions.pdf",
	"Next Steps Slides": "204 The Why - Next Steps.pdf",
	"Idea Generation Slides": "301 Idea Generation.pdf",
	"What Is Structure Slides": "302 What is Structure.pdf",
	"Using Stories Slides": "401 Using Stories.pdf",
	"Storyboards Presentations Slides": "403 Storyboards in Presentations.pdf",
	"Visual Perception Slides": "501 Visual Perception.pdf",
	"Fundamental Elements Slides": "503 Detail Fundamental Elements.pdf",
	"Gestalt Principles Slides":
		"504 Gestalt Principles of Visual Perception.pdf",
	"Slide Composition Slides": "505 Slide Composition.pdf",
	"Fact Based Persuasion Slides": "601 Fact-based Persuasion Overview.pdf",
	"Tables Vs Graphs Slides": "602 Tables v Graphs.pdf",
	"Standard Graphs Slides": "604 Standard Graphs.pdf",
	"Specialist Graphs Slides": "605 Specialist Graphs.pdf",
	"Preparation Practice Slides": "701 Preparation and Practice.pdf",
	"Performance Slides": "702 Performance.pdf",

	// Special downloads
	"Audience Map": "Audience Map.pdf",
	"Marketing Template": "marketing-template.pdf",
	"SlideHeroes Golden Rules": "SlideHeroes Golden Rules.pdf",
};

// Update downloads with correct filenames and URLs
const updatedDownloads = currentDownloads.map((record) => {
	const actualFilename = titleToFilename[record.title];

	if (!actualFilename) {
		console.warn(`⚠️  No mapping found for title: "${record.title}"`);
		return record;
	}

	if (!actualFiles.includes(actualFilename)) {
		console.error(`❌ File not found in directory: "${actualFilename}"`);
		return record;
	}

	const encodedFilename = encodeURIComponent(actualFilename);
	const newUrl = `${R2_BASE_URL}/${encodedFilename}`;

	console.log(`✓ ${record.title} → ${actualFilename}`);

	return {
		...record,
		filename: actualFilename,
		url: newUrl,
	};
});

// Write updated downloads.json
fs.writeFileSync(DOWNLOADS_JSON, JSON.stringify(updatedDownloads, null, 2));

console.log(`\n✅ Updated ${updatedDownloads.length} download records`);
console.log(`📝 Written to: ${DOWNLOADS_JSON}`);

// Verify all URLs
console.log("\n🔍 Verification:");
for (const record of updatedDownloads) {
	const exists = actualFiles.includes(record.filename);
	const status = exists ? "✓" : "✗";
	console.log(`${status} ${record.filename}`);
}
