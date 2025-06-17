import { createServiceLogger } from "@kit/shared/logger";

// Initialize service logger
const { getLogger } = createServiceLogger("STORAGE_CONFIG");

/**
 * Storage Configuration Utilities for Cloudflare R2 and AWS S3
 *
 * This module provides validation and configuration functions for setting up
 * separate storage instances for different collections.
 */

export interface StorageValidationResult {
	isValid: boolean;
	errors: string[];
	warnings: string[];
}

export interface R2Config {
	accountId: string;
	accessKeyId: string;
	secretAccessKey: string;
	mediaBucket: string;
	downloadsBucket: string;
	endpoint?: string;
	region?: string;
	mediaBaseUrl?: string;
	downloadsBaseUrl?: string;
}

export interface S3Config {
	bucket: string;
	region: string;
	accessKeyId?: string;
	secretAccessKey?: string;
}

/**
 * Validates Cloudflare R2 configuration
 */
export function validateR2Config(): StorageValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];

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
 * Validates AWS S3 configuration
 */
export function validateS3Config(): StorageValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];

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
 * Gets R2 configuration from environment variables
 */
export function getR2Config(): R2Config {
	return {
		accountId: process.env.R2_ACCOUNT_ID || "",
		accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
		secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
		mediaBucket: process.env.R2_MEDIA_BUCKET || "",
		downloadsBucket:
			process.env.R2_DOWNLOADS_BUCKET || process.env.R2_MEDIA_BUCKET || "",
		endpoint: process.env.R2_ENDPOINT,
		region: process.env.R2_REGION || "auto",
		mediaBaseUrl: process.env.PAYLOAD_PUBLIC_MEDIA_BASE_URL,
		downloadsBaseUrl: process.env.PAYLOAD_PUBLIC_DOWNLOADS_BASE_URL,
	};
}

/**
 * Gets S3 configuration from environment variables
 */
export function getS3Config(): S3Config {
	return {
		bucket: process.env.S3_BUCKET || "",
		region: process.env.S3_REGION || "",
		accessKeyId: process.env.AWS_ACCESS_KEY_ID,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
	};
}

/**
 * Determines which storage configuration to use based on available environment variables
 */
export function getStorageType(): "r2" | "s3" | "none" {
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
 * Logs storage configuration status
 */
export function logStorageConfig(): void {
	if (process.env.NODE_ENV !== "development") {
		return;
	}

	const storageType = getStorageType();
	// TODO: Async logger needed
		// (await getLogger()).info(`[STORAGE-CONFIG] Storage type: ${storageType}`);

	if (storageType === "r2") {
		const _r2Config = getR2Config();
		const validation = validateR2Config();

		// TODO: Async logger needed
		// (await getLogger()).info("[STORAGE-CONFIG] Cloudflare R2 Configuration:");
		// TODO: Async logger needed
		// (await getLogger()).info(`[STORAGE-CONFIG] - Account ID: ${r2Config.accountId}`);
		// TODO: Async logger needed
		// (await getLogger()).info(`[STORAGE-CONFIG] - Media Bucket: ${r2Config.mediaBucket}`);
		// TODO: Async logger needed
		// (await getLogger()).info(`[STORAGE-CONFIG] - Downloads Bucket: ${r2Config.downloadsBucket}`, { data:  });
		// TODO: Async logger needed
		// (await getLogger()).info(`[STORAGE-CONFIG] - Endpoint: ${r2Config.endpoint || "default"}`, { data:  });
		// TODO: Async logger needed
		// (await getLogger()).info(`[STORAGE-CONFIG] - Region: ${r2Config.region}`);

		if (validation.warnings.length > 0) {
			// TODO: Async logger needed
		// (await getLogger()).info("[STORAGE-CONFIG] Warnings:");
			for (const _warning of validation.warnings) {
				// TODO: Async logger needed
		// (await getLogger()).info(`[STORAGE-CONFIG] - ${warning}`);
			}
		}
	} else if (storageType === "s3") {
		const s3Config = getS3Config();
		const validation = validateS3Config();

		// TODO: Async logger needed
		// (await getLogger()).info("[STORAGE-CONFIG] AWS S3 Configuration:");
		// TODO: Async logger needed
		// (await getLogger()).info(`[STORAGE-CONFIG] - Bucket: ${s3Config.bucket}`);
		// TODO: Async logger needed
		// (await getLogger()).info(`[STORAGE-CONFIG] - Region: ${s3Config.region}`);
		// TODO: Async logger needed
		// (await getLogger()).info(
		//	`[STORAGE-CONFIG] - Using credentials: ${s3Config.accessKeyId ? "Yes" : "No (IAM role)"}`,
		// );

		if (validation.warnings.length > 0) {
			// TODO: Async logger needed
		// (await getLogger()).info("[STORAGE-CONFIG] Warnings:");
			for (const _warning of validation.warnings) {
				// TODO: Async logger needed
		// (await getLogger()).info(`[STORAGE-CONFIG] - ${warning}`);
			}
		}
	} else {
		// TODO: Async logger needed
		// (await getLogger()).info("[STORAGE-CONFIG] No valid storage configuration found");

		const r2Validation = validateR2Config();
		const s3Validation = validateS3Config();

		if (r2Validation.errors.length > 0) {
			// TODO: Async logger needed
		// (await getLogger()).info("[STORAGE-CONFIG] R2 configuration errors:");
			for (const _error of r2Validation.errors) {
				// TODO: Async logger needed
		// (await getLogger()).info(`[STORAGE-CONFIG] - ${error}`);
			}
		}

		if (s3Validation.errors.length > 0) {
			// TODO: Async logger needed
		// (await getLogger()).info("[STORAGE-CONFIG] S3 configuration errors:");
			for (const _error of s3Validation.errors) {
				// TODO: Async logger needed
		// (await getLogger()).info(`[STORAGE-CONFIG] - ${error}`);
			}
		}
	}
}
