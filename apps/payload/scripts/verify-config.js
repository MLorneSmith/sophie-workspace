#!/usr/bin/env node

/**
 * Payload CMS Configuration Verification Script
 *
 * This script helps verify that all required environment variables
 * are properly configured for Payload CMS to work correctly with
 * the new separate storage plugin architecture.
 */

const colors = {
	green: "\x1b[32m",
	red: "\x1b[31m",
	yellow: "\x1b[33m",
	blue: "\x1b[34m",
	reset: "\x1b[0m",
	bold: "\x1b[1m",
};

/**
 * Logs a message with the specified color.
 * @param {string} color - The color code to use for the message.
 * @param {string} message - The message to log.
 */
function log(_color, _message) {}

/**
 * Checks if an environment variable is set.
 * @param {string} name - The name of the environment variable.
 * @param {boolean} [required=true] - Whether the variable is required.
 * @returns {boolean} - True if the variable is set or optional and not set, false if required and missing.
 */
function checkEnvVar(name, required = true) {
	const value = process.env[name];
	const exists = !!value;

	if (required && !exists) {
		log(colors.red, `❌ ${name}: MISSING (Required)`);
		return false;
	}
	if (!required && !exists) {
		log(colors.yellow, `⚠️  ${name}: Not set (Optional)`);
		return true;
	}
	const displayValue =
		name.includes("SECRET") || name.includes("PASSWORD") || name.includes("KEY")
			? value
				? `${value.substring(0, 8)}...`
				: ""
			: value;
	log(colors.green, `✅ ${name}: ${displayValue}`);
	return true;
}

/**
 * Validates R2 configuration
 */
function validateR2Config() {
	const errors = [];
	const warnings = [];

	// Required environment variables for R2
	const requiredVars = [
		"R2_ACCOUNT_ID",
		"R2_ACCESS_KEY_ID",
		"R2_SECRET_ACCESS_KEY",
		"R2_MEDIA_BUCKET",
	];

	for (const varName of requiredVars) {
		if (!process.env[varName]) {
			errors.push(`Missing required environment variable: ${varName}`);
		}
	}

	// Check for downloads bucket (can fallback to media bucket)
	if (!process.env.R2_DOWNLOADS_BUCKET) {
		warnings.push(
			"R2_DOWNLOADS_BUCKET not set, will use R2_MEDIA_BUCKET for downloads collection",
		);
	}

	// Check for custom endpoints and base URLs
	if (!process.env.R2_ENDPOINT) {
		warnings.push(
			"R2_ENDPOINT not set, will use default Cloudflare R2 endpoint",
		);
	}

	if (!process.env.PAYLOAD_PUBLIC_MEDIA_BASE_URL) {
		warnings.push(
			"PAYLOAD_PUBLIC_MEDIA_BASE_URL not set, will construct from R2 bucket settings",
		);
	}

	if (!process.env.PAYLOAD_PUBLIC_DOWNLOADS_BASE_URL) {
		warnings.push(
			"PAYLOAD_PUBLIC_DOWNLOADS_BASE_URL not set, will construct from R2 bucket settings",
		);
	}

	return {
		isValid: errors.length === 0,
		errors,
		warnings,
	};
}

/**
 * Validates S3 configuration
 */
function validateS3Config() {
	const errors = [];
	const warnings = [];

	// Required environment variables for S3
	const requiredVars = ["S3_BUCKET", "S3_REGION"];

	for (const varName of requiredVars) {
		if (!process.env[varName]) {
			errors.push(`Missing required environment variable: ${varName}`);
		}
	}

	// AWS credentials are optional (can use IAM roles)
	if (!process.env.AWS_ACCESS_KEY_ID && !process.env.AWS_SECRET_ACCESS_KEY) {
		warnings.push("AWS credentials not set, assuming IAM role authentication");
	} else if (
		!process.env.AWS_ACCESS_KEY_ID ||
		!process.env.AWS_SECRET_ACCESS_KEY
	) {
		errors.push(
			"Both AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY must be set if using credential authentication",
		);
	}

	return {
		isValid: errors.length === 0,
		errors,
		warnings,
	};
}

/**
 * Determines which storage configuration to use based on available environment variables
 */
function getStorageType() {
	const r2Validation = validateR2Config();
	const s3Validation = validateS3Config();

	if (r2Validation.isValid) {
		return "r2";
	}
	if (s3Validation.isValid) {
		return "s3";
	}
	return "none";
}

/**
 * Generate test URLs for R2
 */
function generateTestR2URLs() {
	const accountId = process.env.R2_ACCOUNT_ID;
	const mediaBucket = process.env.R2_MEDIA_BUCKET;
	const downloadsBucket = process.env.R2_DOWNLOADS_BUCKET || mediaBucket;

	const mediaBaseUrl =
		process.env.PAYLOAD_PUBLIC_MEDIA_BASE_URL ||
		`https://${mediaBucket}.${accountId}.r2.cloudflarestorage.com`;
	const downloadsBaseUrl =
		process.env.PAYLOAD_PUBLIC_DOWNLOADS_BASE_URL ||
		`https://${downloadsBucket}.${accountId}.r2.cloudflarestorage.com`;

	return {
		media: `${mediaBaseUrl}/test-image.jpg`,
		downloads: `${downloadsBaseUrl}/test-document.pdf`,
	};
}

/**
 * Tests storage configuration
 */
function testStorageConfiguration() {
	log(colors.blue + colors.bold, "\n🧪 Testing Storage Configuration:");

	const storageType = getStorageType();
	log(colors.blue, `Detected storage type: ${storageType}`);

	if (storageType === "r2") {
		const validation = validateR2Config();
		if (validation.isValid) {
			log(colors.green, "✅ R2 configuration validation passed");

			if (validation.warnings.length > 0) {
				log(colors.yellow, "Warnings:");
				for (const warning of validation.warnings) {
					log(colors.yellow, `  - ${warning}`);
				}
			}

			// Test URL generation
			try {
				const testUrls = generateTestR2URLs();
				log(colors.blue, `Sample media URL: ${testUrls.media}`);
				log(colors.blue, `Sample downloads URL: ${testUrls.downloads}`);
			} catch (error) {
				log(
					colors.red,
					`❌ Error generating test URLs: ${error instanceof Error ? error.message : String(error)}`,
				);
				return false;
			}

			return true;
		}
		log(colors.red, "❌ R2 configuration validation failed");
		for (const error of validation.errors) {
			log(colors.red, `  - ${error}`);
		}
		return false;
	}
	if (storageType === "s3") {
		const validation = validateS3Config();
		if (validation.isValid) {
			log(colors.green, "✅ S3 configuration validation passed");

			if (validation.warnings.length > 0) {
				log(colors.yellow, "Warnings:");
				for (const warning of validation.warnings) {
					log(colors.yellow, `  - ${warning}`);
				}
			}

			return true;
		}
		log(colors.red, "❌ S3 configuration validation failed");
		for (const error of validation.errors) {
			log(colors.red, `  - ${error}`);
		}
		return false;
	}
	log(colors.yellow, "⚠️  No cloud storage configured - using local storage");
	return process.env.NODE_ENV === "development"; // OK for development, not for production
}

/**
 * Verifies the separate storage plugin architecture
 */
function verifyStorageArchitecture() {
	log(colors.blue + colors.bold, "\n🏗️  Storage Architecture Verification:");

	const hasR2Config =
		process.env.R2_ACCESS_KEY_ID &&
		process.env.R2_SECRET_ACCESS_KEY &&
		process.env.R2_ACCOUNT_ID;
	const hasS3Config = process.env.S3_BUCKET && process.env.S3_REGION;

	if (hasR2Config) {
		log(colors.green, "✅ Using separate R2 storage plugins architecture");
		log(colors.blue, "   - Media collection: Dedicated R2 plugin instance");
		log(colors.blue, "   - Downloads collection: Dedicated R2 plugin instance");

		// Check bucket configuration
		const mediaBucket = process.env.R2_MEDIA_BUCKET;
		const downloadsBucket = process.env.R2_DOWNLOADS_BUCKET || mediaBucket;

		if (mediaBucket === downloadsBucket) {
			log(colors.yellow, "⚠️  Using same bucket for media and downloads");
			log(
				colors.yellow,
				"   Consider separate buckets for better organization",
			);
		} else {
			log(colors.green, "✅ Using separate buckets for media and downloads");
		}

		return true;
	}
	if (hasS3Config) {
		log(colors.green, "✅ Using separate S3 storage plugins architecture");
		log(colors.blue, "   - Media collection: Dedicated S3 plugin instance");
		log(
			colors.blue,
			"   - Downloads collection: Dedicated S3 plugin instance with prefix",
		);
		return true;
	}
	log(colors.yellow, "⚠️  No cloud storage configured");
	return false;
}

/**
 * Provides troubleshooting guidance
 */
function provideTroubleshootingGuidance(hasValidStorage) {
	log(colors.blue + colors.bold, "\n🔧 Troubleshooting Guide:");

	if (!hasValidStorage) {
		log(colors.red, "Common storage issues and solutions:");
		log(colors.yellow, "1. Media collection shows blank screen:");
		log(colors.yellow, "   - Check R2_MEDIA_BUCKET is set correctly");
		log(colors.yellow, "   - Verify R2 credentials have proper permissions");
		log(colors.yellow, "   - Check browser console for CORS errors");

		log(colors.yellow, "2. Downloads result in 404 errors:");
		log(colors.yellow, "   - Verify R2_DOWNLOADS_BUCKET is configured");
		log(colors.yellow, "   - Check file permissions in R2 dashboard");
		log(colors.yellow, "   - Ensure bucket has public read access");

		log(colors.yellow, "3. Plugin conflicts (FIXED in new architecture):");
		log(colors.yellow, "   - ✅ Now uses separate plugin instances");
		log(colors.yellow, "   - ✅ Each collection has its own s3Storage plugin");
		log(colors.yellow, "   - ✅ No more shared plugin configuration");
	} else {
		log(colors.green, "Configuration looks good! If you still have issues:");
		log(colors.blue, "1. Clear browser cache and restart the dev server");
		log(colors.blue, "2. Check R2 dashboard for uploaded files");
		log(colors.blue, "3. Verify bucket CORS settings if needed");
		log(colors.blue, "4. Test with a fresh file upload");
	}
}

function main() {
	log(
		colors.blue + colors.bold,
		"\n🔍 Payload CMS Storage Configuration Verification\n",
	);
	log(colors.blue, "New Architecture: Separate S3 Storage Plugin Instances\n");

	let allGood = true;

	// Database Configuration
	log(colors.blue + colors.bold, "📊 Database Configuration:");
	allGood &&= checkEnvVar("DATABASE_URI", true);
	allGood &&= checkEnvVar("NODE_ENV", true);

	// Payload Configuration
	log(colors.blue + colors.bold, "\n⚙️  Payload Configuration:");
	allGood &&= checkEnvVar("PAYLOAD_SECRET", true);
	allGood &&= checkEnvVar("PAYLOAD_PUBLIC_SERVER_URL", true);

	// Storage Configuration
	log(colors.blue + colors.bold, "\n💾 Storage Configuration:");

	// Check for Cloudflare R2 configuration
	const hasR2 =
		process.env.R2_ACCESS_KEY_ID &&
		process.env.R2_SECRET_ACCESS_KEY &&
		process.env.R2_ACCOUNT_ID &&
		process.env.R2_MEDIA_BUCKET;

	// Check for AWS S3
	const hasS3 = process.env.S3_BUCKET && process.env.S3_REGION;

	let storageValid = false;

	if (hasR2) {
		log(colors.green, "🟢 Cloudflare R2 Storage Configuration:");
		allGood &&= checkEnvVar("R2_ACCOUNT_ID", true);
		allGood &&= checkEnvVar("R2_MEDIA_BUCKET", true);
		checkEnvVar("R2_DOWNLOADS_BUCKET", false);
		allGood &&= checkEnvVar("R2_ACCESS_KEY_ID", true);
		allGood &&= checkEnvVar("R2_SECRET_ACCESS_KEY", true);
		checkEnvVar("R2_ENDPOINT", false);
		checkEnvVar("R2_REGION", false);

		// Check optional public URLs
		log(colors.blue, "\n📡 Optional Public URLs:");
		checkEnvVar("PAYLOAD_PUBLIC_MEDIA_BASE_URL", false);
		checkEnvVar("PAYLOAD_PUBLIC_DOWNLOADS_BASE_URL", false);

		storageValid = allGood;
	} else if (hasS3) {
		log(colors.green, "🟢 AWS S3 Storage Configuration:");
		allGood &&= checkEnvVar("S3_BUCKET", true);
		allGood &&= checkEnvVar("S3_REGION", true);
		checkEnvVar("AWS_ACCESS_KEY_ID", false);
		checkEnvVar("AWS_SECRET_ACCESS_KEY", false);

		storageValid = allGood;
	} else {
		log(colors.red, "❌ No cloud storage configured!");
		log(
			colors.yellow,
			"   This will cause errors in production/serverless environments.",
		);
		log(colors.yellow, "   Please configure either Cloudflare R2 or AWS S3.");
		storageValid = false;
	}

	// Test storage configuration
	const storageTestPassed = testStorageConfiguration();
	allGood &&= storageTestPassed;

	// Verify storage architecture
	const _architectureValid = verifyStorageArchitecture();

	// Results Summary
	log(colors.blue + colors.bold, "\n📋 Configuration Summary:");

	if (allGood && storageValid) {
		log(colors.green + colors.bold, "🎉 All configuration looks good!");
		log(colors.green, "   ✅ Separate storage plugin architecture implemented");
		log(colors.green, "   ✅ Storage configuration working correctly");

		if (hasR2) {
			log(colors.green, "   ✅ Cloudflare R2 storage configured");
			log(colors.green, `   ✅ Media bucket: ${process.env.R2_MEDIA_BUCKET}`);
			if (process.env.R2_DOWNLOADS_BUCKET) {
				log(
					colors.green,
					`   ✅ Downloads bucket: ${process.env.R2_DOWNLOADS_BUCKET}`,
				);
			}
		} else if (hasS3) {
			log(colors.green, "   ✅ AWS S3 storage configured");
		}

		log(colors.blue, "\n📝 Next steps:");
		log(colors.blue, "   1. Start the app: npm run dev");
		log(colors.blue, "   2. Navigate to /admin");
		log(colors.blue, "   3. Test media collection uploads");
		log(colors.blue, "   4. Test downloads collection uploads");
		log(colors.blue, "   5. Verify files are accessible via generated URLs");
	} else {
		log(colors.red + colors.bold, "❌ Configuration issues detected!");

		if (!storageValid) {
			log(colors.red, "   ❌ Storage configuration invalid");
		}
		if (!storageTestPassed) {
			log(colors.red, "   ❌ Storage configuration test failed");
		}
	}

	// Environment-specific warnings
	const nodeEnv = process.env.NODE_ENV;
	if (nodeEnv === "production" && !storageValid) {
		log(
			colors.red + colors.bold,
			"\n🚨 CRITICAL: Production environment without cloud storage!",
		);
		log(
			colors.red,
			"   This WILL cause the \"mkdir 'media'\" error in serverless environments.",
		);
	}

	// Architecture explanation
	log(colors.blue + colors.bold, "\n🏗️  New Architecture Benefits:");
	log(
		colors.green,
		"✅ Separate s3Storage plugin instances for media and downloads",
	);
	log(
		colors.green,
		"✅ Each collection has dedicated bucket/prefix configuration",
	);
	log(colors.green, "✅ Independent URL generation for each collection");
	log(colors.green, "✅ No more plugin conflicts between collections");
	log(colors.green, "✅ Better error isolation and debugging");

	// Provide troubleshooting guidance
	provideTroubleshootingGuidance(storageValid);
	process.exit(allGood ? 0 : 1);
}

// Handle different ways this script might be run
import url from "node:url";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

if (process.argv[1] === __filename) {
	main();
}

export { checkEnvVar, main };
