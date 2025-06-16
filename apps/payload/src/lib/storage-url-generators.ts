/**
 * Storage URL Generators for Different Collections
 *
 * This module provides collection-specific URL generation functions
 * for proper file access across different storage backends.
 */

import { getR2Config } from "./storage-config";

import { createServiceLogger } from "@kit/shared/logger";

// Initialize service logger
const { getLogger } = createServiceLogger("STORAGE_URL_GENERATORS");

export interface GenerateFileURLArgs {
	filename: string;
	prefix?: string;
}

/**
 * Generates URL for media collection files stored in R2
 */
export function generateMediaURL({ filename }: GenerateFileURLArgs): string {
	const config = getR2Config();

	// Use custom base URL if provided
	if (config.mediaBaseUrl) {
		return `${config.mediaBaseUrl}/${filename}`;
	}

	// Construct URL from R2 bucket settings
	const baseUrl = `https://${config.mediaBucket}.${config.accountId}.r2.cloudflarestorage.com`;
	return `${baseUrl}/${filename}`;
}

/**
 * Generates URL for downloads collection files stored in R2
 */
export function generateDownloadsURL({
	filename,
}: GenerateFileURLArgs): string {
	const config = getR2Config();

	// Use custom base URL if provided
	if (config.downloadsBaseUrl) {
		return `${config.downloadsBaseUrl}/${filename}`;
	}

	// Construct URL from R2 bucket settings
	const baseUrl = `https://${config.downloadsBucket}.${config.accountId}.r2.cloudflarestorage.com`;
	return `${baseUrl}/${filename}`;
}

/**
 * Generates URL for media collection files stored in S3
 */
export function generateS3MediaURL({ filename }: GenerateFileURLArgs): string {
	const bucket = process.env.S3_BUCKET || "";
	const region = process.env.S3_REGION || "";

	// Use custom base URL if provided
	if (process.env.PAYLOAD_PUBLIC_MEDIA_BASE_URL) {
		return `${process.env.PAYLOAD_PUBLIC_MEDIA_BASE_URL}/${filename}`;
	}

	// Construct standard S3 URL
	return `https://${bucket}.s3.${region}.amazonaws.com/${filename}`;
}

/**
 * Generates URL for downloads collection files stored in S3
 */
export function generateS3DownloadsURL({
	filename,
}: GenerateFileURLArgs): string {
	const bucket = process.env.S3_BUCKET || "";
	const region = process.env.S3_REGION || "";

	// Use custom base URL if provided
	if (process.env.PAYLOAD_PUBLIC_DOWNLOADS_BASE_URL) {
		return `${process.env.PAYLOAD_PUBLIC_DOWNLOADS_BASE_URL}/${filename}`;
	}

	// Construct standard S3 URL with downloads prefix
	return `https://${bucket}.s3.${region}.amazonaws.com/downloads/${filename}`;
}

/**
 * Factory function to get the appropriate URL generator based on storage type and collection
 */
export function getURLGenerator(
	storageType: "r2" | "s3",
	collection: "media" | "downloads",
) {
	if (storageType === "r2") {
		return collection === "media" ? generateMediaURL : generateDownloadsURL;
	}
	if (storageType === "s3") {
		return collection === "media" ? generateS3MediaURL : generateS3DownloadsURL;
	}

	// Fallback for local storage or unknown types
	return ({ filename }: GenerateFileURLArgs) => `/${filename}`;
}

/**
 * Enhanced URL generator with error handling and logging
 */
export function createURLGenerator(
	storageType: "r2" | "s3",
	collection: "media" | "downloads",
) {
	const generator = getURLGenerator(storageType, collection);

	return ({ filename }: GenerateFileURLArgs): string => {
		try {
			if (!filename) {
				// Instead of throwing, log warning and return fallback URL
				/* TODO: Async logger needed */ logger.warn(`[URL-GENERATOR] Warning: Filename is missing for ${collection} URL generation. Returning fallback URL.`, { data:  });
				return `/uploads/placeholder-${collection}.png`;
			}

			const url = generator({ filename });

			if (process.env.NODE_ENV === "development") {
				/* TODO: Async logger needed */ logger.info(`[URL-GENERATOR] Generated ${collection} URL: ${url}`);
			}

			return url;
		} catch (error) {
			/* TODO: Async logger needed */ logger.error(`[URL-GENERATOR] Error generating URL for ${collection}/${filename}:`, { arg1: error, arg2:  });

			// Return a fallback URL
			return `/uploads/${filename || "unknown"}`;
		}
	};
}
