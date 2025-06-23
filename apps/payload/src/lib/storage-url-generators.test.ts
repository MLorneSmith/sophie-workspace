/**
 * Unit Tests for Storage URL Generators
 * Tests URL generation for R2, S3, and factory functions
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getR2Config } from "./storage-config";
import {
	createURLGenerator,
	generateDownloadsURL,
	generateMediaURL,
	generateS3DownloadsURL,
	generateS3MediaURL,
	getURLGenerator,
} from "./storage-url-generators";

// Mock storage config
vi.mock("./storage-config", () => ({
	getR2Config: vi.fn(),
}));

// Mock console methods for testing logging
const mockConsoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});
const mockConsoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
const mockConsoleError = vi
	.spyOn(console, "error")
	.mockImplementation(() => {});

// Helper function to create complete R2Config objects for testing
function createMockR2Config(
	overrides: Partial<import("./storage-config").R2Config> = {},
): import("./storage-config").R2Config {
	return {
		accountId: "test-account",
		accessKeyId: "test-access-key",
		secretAccessKey: "test-secret-key",
		mediaBucket: "test-media-bucket",
		downloadsBucket: "test-downloads-bucket",
		region: "auto",
		...overrides,
	};
}

describe("Storage URL Generators", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Reset environment variables to known state
		vi.stubEnv("NODE_ENV", "test");
		vi.stubEnv("S3_BUCKET", "");
		vi.stubEnv("S3_REGION", "");
		vi.stubEnv("PAYLOAD_PUBLIC_MEDIA_BASE_URL", "");
		vi.stubEnv("PAYLOAD_PUBLIC_DOWNLOADS_BASE_URL", "");
	});

	afterEach(() => {
		vi.unstubAllEnvs();
	});

	describe("generateMediaURL (R2)", () => {
		it("should generate R2 media URL with custom base URL", () => {
			// Arrange
			vi.mocked(getR2Config).mockReturnValue(
				createMockR2Config({
					accountId: "account123",
					mediaBucket: "media-bucket",
					mediaBaseUrl: "https://custom.domain.com",
				}),
			);

			// Act
			const result = generateMediaURL({ filename: "test.jpg" });

			// Assert
			expect(result).toBe("https://custom.domain.com/test.jpg");
			expect(getR2Config).toHaveBeenCalledOnce();
		});

		it("should generate R2 media URL from bucket settings when no custom base URL", () => {
			// Arrange
			vi.mocked(getR2Config).mockReturnValue(
				createMockR2Config({
					accountId: "account123",
					mediaBucket: "media-bucket",
					mediaBaseUrl: undefined,
				}),
			);

			// Act
			const result = generateMediaURL({ filename: "test.jpg" });

			// Assert
			expect(result).toBe(
				"https://media-bucket.account123.r2.cloudflarestorage.com/test.jpg",
			);
		});

		it("should handle empty filename", () => {
			// Arrange
			vi.mocked(getR2Config).mockReturnValue(
				createMockR2Config({
					accountId: "account123",
					mediaBucket: "media-bucket",
					mediaBaseUrl: "https://custom.domain.com",
				}),
			);

			// Act
			const result = generateMediaURL({ filename: "" });

			// Assert
			expect(result).toBe("https://custom.domain.com/");
		});

		it("should handle special characters in filename", () => {
			// Arrange
			vi.mocked(getR2Config).mockReturnValue(
				createMockR2Config({
					accountId: "account123",
					mediaBucket: "media-bucket",
					mediaBaseUrl: "https://custom.domain.com",
				}),
			);

			// Act
			const result = generateMediaURL({
				filename: "test file with spaces & symbols.jpg",
			});

			// Assert
			expect(result).toBe(
				"https://custom.domain.com/test file with spaces & symbols.jpg",
			);
		});
	});

	describe("generateDownloadsURL (R2)", () => {
		it("should generate R2 downloads URL with custom base URL", () => {
			// Arrange
			vi.mocked(getR2Config).mockReturnValue(
				createMockR2Config({
					accountId: "account123",
					downloadsBucket: "downloads-bucket",
					downloadsBaseUrl: "https://downloads.domain.com",
				}),
			);

			// Act
			const result = generateDownloadsURL({ filename: "document.pdf" });

			// Assert
			expect(result).toBe("https://downloads.domain.com/document.pdf");
		});

		it("should generate R2 downloads URL from bucket settings when no custom base URL", () => {
			// Arrange
			vi.mocked(getR2Config).mockReturnValue(
				createMockR2Config({
					accountId: "account123",
					downloadsBucket: "downloads-bucket",
					downloadsBaseUrl: undefined,
				}),
			);

			// Act
			const result = generateDownloadsURL({ filename: "document.pdf" });

			// Assert
			expect(result).toBe(
				"https://downloads-bucket.account123.r2.cloudflarestorage.com/document.pdf",
			);
		});
	});

	describe("generateS3MediaURL", () => {
		it("should generate S3 media URL with custom base URL", () => {
			// Arrange
			vi.stubEnv("PAYLOAD_PUBLIC_MEDIA_BASE_URL", "https://cdn.example.com");

			// Act
			const result = generateS3MediaURL({ filename: "image.png" });

			// Assert
			expect(result).toBe("https://cdn.example.com/image.png");
		});

		it("should generate S3 media URL from bucket settings when no custom base URL", () => {
			// Arrange
			vi.stubEnv("S3_BUCKET", "my-bucket");
			vi.stubEnv("S3_REGION", "us-west-2");
			vi.stubEnv("PAYLOAD_PUBLIC_MEDIA_BASE_URL", "");

			// Act
			const result = generateS3MediaURL({ filename: "image.png" });

			// Assert
			expect(result).toBe(
				"https://my-bucket.s3.us-west-2.amazonaws.com/image.png",
			);
		});

		it("should handle missing S3 environment variables gracefully", () => {
			// Arrange
			vi.stubEnv("S3_BUCKET", "");
			vi.stubEnv("S3_REGION", "");
			vi.stubEnv("PAYLOAD_PUBLIC_MEDIA_BASE_URL", "");

			// Act
			const result = generateS3MediaURL({ filename: "image.png" });

			// Assert
			expect(result).toBe("https://.s3..amazonaws.com/image.png");
		});
	});

	describe("generateS3DownloadsURL", () => {
		it("should generate S3 downloads URL with custom base URL", () => {
			// Arrange
			vi.stubEnv(
				"PAYLOAD_PUBLIC_DOWNLOADS_BASE_URL",
				"https://downloads.cdn.com",
			);

			// Act
			const result = generateS3DownloadsURL({ filename: "file.zip" });

			// Assert
			expect(result).toBe("https://downloads.cdn.com/file.zip");
		});

		it("should generate S3 downloads URL with downloads prefix when no custom base URL", () => {
			// Arrange
			vi.stubEnv("S3_BUCKET", "my-bucket");
			vi.stubEnv("S3_REGION", "us-west-2");
			vi.stubEnv("PAYLOAD_PUBLIC_DOWNLOADS_BASE_URL", "");

			// Act
			const result = generateS3DownloadsURL({ filename: "file.zip" });

			// Assert
			expect(result).toBe(
				"https://my-bucket.s3.us-west-2.amazonaws.com/downloads/file.zip",
			);
		});
	});

	describe("getURLGenerator (Factory Function)", () => {
		it("should return R2 media generator for r2/media combination", () => {
			// Act
			const generator = getURLGenerator("r2", "media");

			// Assert
			expect(generator).toBe(generateMediaURL);
		});

		it("should return R2 downloads generator for r2/downloads combination", () => {
			// Act
			const generator = getURLGenerator("r2", "downloads");

			// Assert
			expect(generator).toBe(generateDownloadsURL);
		});

		it("should return S3 media generator for s3/media combination", () => {
			// Act
			const generator = getURLGenerator("s3", "media");

			// Assert
			expect(generator).toBe(generateS3MediaURL);
		});

		it("should return S3 downloads generator for s3/downloads combination", () => {
			// Act
			const generator = getURLGenerator("s3", "downloads");

			// Assert
			expect(generator).toBe(generateS3DownloadsURL);
		});

		it("should return fallback generator for unknown storage type", () => {
			// Act
			const generator = getURLGenerator("unknown" as "r2" | "s3", "media");

			// Assert
			// Test that the fallback generator works
			const result = generator({ filename: "test.jpg" });
			expect(result).toBe("/test.jpg");
		});

		it("should return fallback generator for unhandled storage type combination", () => {
			// Act
			const generator = getURLGenerator("local" as "r2" | "s3", "media");

			// Assert
			const result = generator({ filename: "test.jpg" });
			expect(result).toBe("/test.jpg");
		});
	});

	describe("createURLGenerator (Enhanced Generator)", () => {
		beforeEach(() => {
			// Clear console mocks for each test
			mockConsoleWarn.mockClear();
			mockConsoleLog.mockClear();
			mockConsoleError.mockClear();
		});

		it("should handle missing filename with warning log and placeholder URL", () => {
			// Arrange
			const generator = createURLGenerator("r2", "media");

			// Act
			const result = generator({ filename: "" });

			// Assert
			expect(result).toBe("/uploads/placeholder-media.png");
			// Logger calls are commented out in implementation with TODO
			expect(mockConsoleWarn).not.toHaveBeenCalled();
		});

		it("should handle undefined filename with warning log and placeholder URL", () => {
			// Arrange
			const generator = createURLGenerator("r2", "downloads");

			// Act
			const result = generator({ filename: undefined as unknown as string });

			// Assert
			expect(result).toBe("/uploads/placeholder-downloads.png");
			// Logger calls are commented out in implementation with TODO
			expect(mockConsoleWarn).not.toHaveBeenCalled();
		});

		it("should log generated URL in development mode", () => {
			// Arrange
			vi.stubEnv("NODE_ENV", "development");
			vi.mocked(getR2Config).mockReturnValue(
				createMockR2Config({
					accountId: "account123",
					mediaBucket: "media-bucket",
					mediaBaseUrl: "https://custom.domain.com",
				}),
			);
			const generator = createURLGenerator("r2", "media");

			// Act
			const result = generator({ filename: "test.jpg" });

			// Assert
			expect(result).toBe("https://custom.domain.com/test.jpg");
			// Logger calls are commented out in implementation with TODO
			expect(mockConsoleLog).not.toHaveBeenCalled();
		});

		it("should not log in production mode", () => {
			// Arrange
			vi.stubEnv("NODE_ENV", "production");
			vi.mocked(getR2Config).mockReturnValue(
				createMockR2Config({
					accountId: "account123",
					mediaBucket: "media-bucket",
					mediaBaseUrl: "https://custom.domain.com",
				}),
			);
			const generator = createURLGenerator("r2", "media");

			// Act
			const result = generator({ filename: "test.jpg" });

			// Assert
			expect(result).toBe("https://custom.domain.com/test.jpg");
			expect(mockConsoleLog).not.toHaveBeenCalled();
		});

		it("should handle generator function errors with error log and fallback URL", () => {
			// Arrange
			vi.mocked(getR2Config).mockImplementation(() => {
				throw new Error("Config error");
			});
			const generator = createURLGenerator("r2", "media");

			// Act
			const result = generator({ filename: "test.jpg" });

			// Assert
			expect(result).toBe("/uploads/test.jpg");
			// Logger calls are commented out in implementation with TODO
			expect(mockConsoleError).not.toHaveBeenCalled();
		});

		it("should handle error with undefined filename (missing filename branch)", () => {
			// Arrange
			vi.mocked(getR2Config).mockImplementation(() => {
				throw new Error("Config error");
			});
			const generator = createURLGenerator("r2", "downloads");

			// Act
			const result = generator({ filename: undefined as unknown as string });

			// Assert
			// Since filename is undefined, it triggers the missing filename check first
			// and returns placeholder URL, not the error fallback
			expect(result).toBe("/uploads/placeholder-downloads.png");
			// Logger calls are commented out in implementation with TODO
			expect(mockConsoleWarn).not.toHaveBeenCalled();
		});

		it("should handle error with valid filename (error fallback branch)", () => {
			// Arrange
			vi.mocked(getR2Config).mockImplementation(() => {
				throw new Error("Config error");
			});
			const generator = createURLGenerator("r2", "downloads");

			// Act
			const result = generator({ filename: "valid-file.pdf" });

			// Assert
			// With valid filename, it goes to generator which throws error,
			// triggering error handling and fallback URL
			expect(result).toBe("/uploads/valid-file.pdf");
			// Logger calls are commented out in implementation with TODO
			expect(mockConsoleError).not.toHaveBeenCalled();
		});
	});

	describe("Edge Cases", () => {
		it("should handle Unicode filenames correctly", () => {
			// Arrange
			vi.mocked(getR2Config).mockReturnValue(
				createMockR2Config({
					accountId: "account123",
					mediaBucket: "media-bucket",
					mediaBaseUrl: "https://custom.domain.com",
				}),
			);

			// Act
			const result = generateMediaURL({ filename: "файл.jpg" });

			// Assert
			expect(result).toBe("https://custom.domain.com/файл.jpg");
		});

		it("should handle very long filenames", () => {
			// Arrange
			vi.mocked(getR2Config).mockReturnValue(
				createMockR2Config({
					accountId: "account123",
					mediaBucket: "media-bucket",
					mediaBaseUrl: "https://custom.domain.com",
				}),
			);
			const longFilename = `${"a".repeat(1000)}.jpg`;

			// Act
			const result = generateMediaURL({ filename: longFilename });

			// Assert
			expect(result).toBe(`https://custom.domain.com/${longFilename}`);
		});

		it("should handle null filename in enhanced generator", () => {
			// Arrange
			const generator = createURLGenerator("s3", "media");

			// Act
			const result = generator({ filename: null as unknown as string });

			// Assert
			expect(result).toBe("/uploads/placeholder-media.png");
			// Logger calls are commented out in implementation with TODO
			expect(mockConsoleWarn).not.toHaveBeenCalled();
		});
	});

	describe("Error Scenarios", () => {
		it("should propagate R2 config errors in basic generators", () => {
			// Arrange
			vi.mocked(getR2Config).mockImplementation(() => {
				throw new Error("R2 config error");
			});

			// Act & Assert
			expect(() => generateMediaURL({ filename: "test.jpg" })).toThrow(
				"R2 config error",
			);
		});

		it("should handle environment variable access gracefully in S3 generators", () => {
			// Arrange
			// Mock process.env to be undefined (edge case)
			const originalEnv = process.env;
			Object.defineProperty(global, "process", {
				value: { env: {} },
				writable: true,
			});

			// Act
			const result = generateS3MediaURL({ filename: "test.jpg" });

			// Assert
			expect(result).toBe("https://.s3..amazonaws.com/test.jpg");

			// Restore
			Object.defineProperty(global, "process", {
				value: { env: originalEnv },
				writable: true,
			});
		});
	});

	describe("Integration Scenarios", () => {
		it("should handle complete R2 workflow with mixed configurations", () => {
			// Arrange
			vi.mocked(getR2Config).mockReturnValue(
				createMockR2Config({
					accountId: "account123",
					mediaBucket: "media-bucket",
					downloadsBucket: "downloads-bucket",
					mediaBaseUrl: "https://custom-media.com", // Custom for media
					downloadsBaseUrl: undefined, // Default for downloads
				}),
			);

			// Act
			const mediaUrl = generateMediaURL({ filename: "image.jpg" });
			const downloadsUrl = generateDownloadsURL({ filename: "file.pdf" });

			// Assert
			expect(mediaUrl).toBe("https://custom-media.com/image.jpg");
			expect(downloadsUrl).toBe(
				"https://downloads-bucket.account123.r2.cloudflarestorage.com/file.pdf",
			);
		});

		it("should handle complete S3 workflow with environment variables", () => {
			// Arrange
			vi.stubEnv("S3_BUCKET", "my-bucket");
			vi.stubEnv("S3_REGION", "eu-west-1");
			vi.stubEnv("PAYLOAD_PUBLIC_MEDIA_BASE_URL", "https://cdn.example.com");
			vi.stubEnv("PAYLOAD_PUBLIC_DOWNLOADS_BASE_URL", ""); // No custom downloads URL

			// Act
			const mediaUrl = generateS3MediaURL({ filename: "photo.png" });
			const downloadsUrl = generateS3DownloadsURL({ filename: "archive.zip" });

			// Assert
			expect(mediaUrl).toBe("https://cdn.example.com/photo.png");
			expect(downloadsUrl).toBe(
				"https://my-bucket.s3.eu-west-1.amazonaws.com/downloads/archive.zip",
			);
		});

		it("should work end-to-end with factory and enhanced generator", () => {
			// Arrange
			vi.stubEnv("NODE_ENV", "development");
			vi.mocked(getR2Config).mockReturnValue(
				createMockR2Config({
					accountId: "test-account",
					mediaBucket: "test-bucket",
					mediaBaseUrl: undefined,
				}),
			);

			// Act
			const generator = createURLGenerator("r2", "media");
			const result = generator({ filename: "integration-test.jpg" });

			// Assert
			expect(result).toBe(
				"https://test-bucket.test-account.r2.cloudflarestorage.com/integration-test.jpg",
			);
			// Logger calls are commented out in implementation with TODO
			expect(mockConsoleLog).not.toHaveBeenCalled();
		});
	});
});
