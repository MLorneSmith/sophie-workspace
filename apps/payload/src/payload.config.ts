import path from "node:path";
/**
 * Sharp import removed.
 * Sharp is now initialized via platform-specific adapter in ./lib/serverless-sharp-adapter.
 * This ensures compatibility with serverless environments (Vercel, Cloudflare, etc).
 */
import { fileURLToPath } from "node:url";
import { nestedDocsPlugin } from "@payloadcms/plugin-nested-docs";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { s3Storage } from "@payloadcms/storage-s3";
import { en } from "@payloadcms/translations/languages/en";
import type { Plugin } from "payload";
import { buildConfig } from "payload";

// Type for Payload plugins
type PayloadPlugin =
	| Plugin
	| ReturnType<typeof s3Storage>
	| ReturnType<typeof nestedDocsPlugin>;

import { createServiceLogger } from "@kit/shared/logger";
import { CourseLessons } from "./collections/CourseLessons";
import { CourseQuizzes } from "./collections/CourseQuizzes";
import { Courses } from "./collections/Courses";
import { Documentation } from "./collections/Documentation";
import { Downloads } from "./collections/Downloads";
import { Media } from "./collections/Media";
import { Posts } from "./collections/Posts";
import { Private } from "./collections/Private";
import { QuizQuestions } from "./collections/QuizQuestions";
import { SurveyQuestions } from "./collections/SurveyQuestions";
import { Surveys } from "./collections/Surveys";
import { Users } from "./collections/Users";
import { getDatabaseAdapter } from "./lib/database-adapter-singleton";
import {
	getR2Config,
	getS3Config,
	getStorageType,
	logStorageConfig,
	validateR2Config,
	validateS3Config,
} from "./lib/storage-config";
import { createURLGenerator } from "./lib/storage-url-generators";

// Initialize service logger
const { getLogger } = createServiceLogger("PAYLOAD_CONFIG");

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const serverURL = process.env.PAYLOAD_PUBLIC_SERVER_URL || "";
const payloadSecret = process.env.PAYLOAD_SECRET || "";

// Validate required environment variables
if (!payloadSecret) {
	throw new Error("PAYLOAD_SECRET environment variable is required");
}

if (!process.env.DATABASE_URI) {
	throw new Error("DATABASE_URI environment variable is required");
}

// Log configuration info (development only)
if (process.env.NODE_ENV === "development") {
	// TODO: Async logger needed
	// (await getLogger()).info("[PAYLOAD-CONFIG] Initializing Payload CMS with enhanced database connection management", { data:  });
	// TODO: Async logger needed
	// (await getLogger()).info("[PAYLOAD-CONFIG] Environment:", { data: process.env.NODE_ENV });
	// TODO: Async logger needed
	// (await getLogger()).info("[PAYLOAD-CONFIG] Server URL:", { data: serverURL || "Not set" });
	// TODO: Async logger needed
	// (await getLogger()).info("[PAYLOAD-CONFIG] Database adapter: Enhanced PostgreSQL with singleton pattern", { data:  });

	// Log storage configuration
	logStorageConfig();
}

/**
 * Creates media storage plugin for Cloudflare R2
 */
const createR2MediaStorage = () => {
	const config = getR2Config();
	const urlGenerator = createURLGenerator("r2", "media");

	return s3Storage({
		collections: {
			media: {
				disableLocalStorage: true,
				generateFileURL: urlGenerator,
			},
		},
		bucket: config.mediaBucket,
		config: {
			endpoint:
				config.endpoint ||
				`https://${config.accountId}.r2.cloudflarestorage.com`,
			region: config.region,
			credentials: {
				accessKeyId: config.accessKeyId,
				secretAccessKey: config.secretAccessKey,
			},
			forcePathStyle: true,
		},
	});
};

/**
 * Creates downloads storage plugin for Cloudflare R2
 */
const createR2DownloadsStorage = () => {
	const config = getR2Config();
	const urlGenerator = createURLGenerator("r2", "downloads");

	return s3Storage({
		collections: {
			downloads: {
				disableLocalStorage: true,
				generateFileURL: urlGenerator,
			},
		},
		bucket: config.downloadsBucket,
		config: {
			endpoint:
				config.endpoint ||
				`https://${config.accountId}.r2.cloudflarestorage.com`,
			region: config.region,
			credentials: {
				accessKeyId: config.accessKeyId,
				secretAccessKey: config.secretAccessKey,
			},
			forcePathStyle: true,
		},
	});
};

/**
 * Creates media storage plugin for AWS S3
 */
const createS3MediaStorage = () => {
	const config = getS3Config();
	const urlGenerator = createURLGenerator("s3", "media");

	return s3Storage({
		collections: {
			media: {
				disableLocalStorage: true,
				generateFileURL: urlGenerator,
			},
		},
		bucket: config.bucket,
		config: {
			region: config.region,
			credentials:
				config.accessKeyId && config.secretAccessKey
					? {
							accessKeyId: config.accessKeyId,
							secretAccessKey: config.secretAccessKey,
						}
					: undefined,
		},
	});
};

/**
 * Creates downloads storage plugin for AWS S3
 */
const createS3DownloadsStorage = () => {
	const config = getS3Config();
	const urlGenerator = createURLGenerator("s3", "downloads");

	return s3Storage({
		collections: {
			downloads: {
				disableLocalStorage: true,
				generateFileURL: urlGenerator,
				prefix: "downloads/", // Use prefix for S3 organization
			},
		},
		bucket: config.bucket,
		config: {
			region: config.region,
			credentials:
				config.accessKeyId && config.secretAccessKey
					? {
							accessKeyId: config.accessKeyId,
							secretAccessKey: config.secretAccessKey,
						}
					: undefined,
		},
	});
};

/**
 * Gets storage plugins based on configuration
 */
const getStoragePlugins = () => {
	const storageType = getStorageType();
	const plugins: PayloadPlugin[] = [];

	if (storageType === "r2") {
		const r2Validation = validateR2Config();
		if (!r2Validation.isValid) {
			// TODO: Async logger needed
			// (await getLogger()).error("[PAYLOAD-CONFIG] R2 validation failed:");
			for (const error of r2Validation.errors) {
				// TODO: Async logger needed
				// (await getLogger()).error(`[PAYLOAD-CONFIG] - ${error}`);
			}
			throw new Error(
				"Invalid R2 configuration. Please check your environment variables.",
			);
		}

		if (process.env.NODE_ENV === "development") {
			// TODO: Async logger needed
			// (await getLogger()).info("[PAYLOAD-CONFIG] Creating separate R2 storage plugins for media and downloads", { data:  });
		}

		plugins.push(createR2MediaStorage());
		plugins.push(createR2DownloadsStorage());
	} else if (storageType === "s3") {
		const s3Validation = validateS3Config();
		if (!s3Validation.isValid) {
			// TODO: Async logger needed
			// (await getLogger()).error("[PAYLOAD-CONFIG] S3 validation failed:");
			for (const error of s3Validation.errors) {
				// TODO: Async logger needed
				// (await getLogger()).error(`[PAYLOAD-CONFIG] - ${error}`);
			}
			throw new Error(
				"Invalid S3 configuration. Please check your environment variables.",
			);
		}

		if (process.env.NODE_ENV === "development") {
			// TODO: Async logger needed
			// (await getLogger()).info("[PAYLOAD-CONFIG] Creating separate S3 storage plugins for media and downloads", { data:  });
		}

		plugins.push(createS3MediaStorage());
		plugins.push(createS3DownloadsStorage());
	} else {
		// Log warning if no cloud storage is configured in production
		if (process.env.NODE_ENV === "production") {
			// TODO: Async logger needed
			// (await getLogger()).warn("[PAYLOAD-CONFIG] WARNING: No cloud storage configured for production. This will cause errors in serverless environments.", { data:  });
			// TODO: Async logger needed
			// (await getLogger()).warn("[PAYLOAD-CONFIG] Please configure either Cloudflare R2 or AWS S3 environment variables.", { data:  });
		} else {
			// TODO: Async logger needed
			// (await getLogger()).info("[PAYLOAD-CONFIG] No cloud storage configured, { arg1: using local storage for development", arg2:  });
		}
	}

	return plugins;
};

// Plugin configuration
const getPlugins = () => {
	const plugins: PayloadPlugin[] = [];

	// Add storage plugins (separate instances for media and downloads)
	const storagePlugins = getStoragePlugins();
	plugins.push(...storagePlugins);

	// Add nested docs plugin for hierarchical content
	plugins.push(
		nestedDocsPlugin({
			collections: ["documentation"],
			generateLabel: (_, doc) => doc.title as string,
			generateURL: (docs) =>
				docs.reduce((url, doc) => `${url}/${doc.slug}`, ""),
		}),
	);

	return plugins;
};

export default buildConfig({
	secret: payloadSecret,
	serverURL: serverURL,
	collections: [
		Users,
		Media,
		Downloads,
		Posts,
		Documentation,
		Private,
		Courses,
		CourseLessons,
		CourseQuizzes,
		QuizQuestions,
		SurveyQuestions,
		Surveys,
	],
	globals: [
		// Add globals here as needed
	],
	typescript: {
		outputFile: path.resolve(dirname, "../payload-types.ts"),
	},
	editor: lexicalEditor({}),
	// Use the enhanced database adapter with singleton pattern
	db: getDatabaseAdapter(),
	plugins: getPlugins(),
	admin: {
		user: Users.slug,
		meta: {
			titleSuffix: "- SlideHeroes CMS",
		},
	},
	i18n: {
		supportedLanguages: { en },
		fallbackLanguage: "en",
	},
	// CORS configuration
	cors: process.env.ALLOWED_ORIGINS
		? process.env.ALLOWED_ORIGINS.split(",")
		: "*",
	// Enhanced logging configuration
	debug:
		process.env.NODE_ENV === "development" ||
		process.env.PAYLOAD_DEBUG === "true",
	// Custom scripts for seeding and maintenance
	bin: [
		{
			scriptPath: path.resolve(dirname, "./seed-static-collections.mjs"),
			key: "seed-static-collections",
		},
		{
			scriptPath: path.resolve(
				dirname,
				"../../packages/payload-local-init/stage-2-seed-core/seed-media-downloads.mjs",
			),
			key: "seed-media-downloads",
		},
		{
			scriptPath: path.resolve(
				dirname,
				"../../packages/payload-local-init/stage-2-seed-core/seed-main-content-collections.mjs",
			),
			key: "seed-main-content-collections",
		},
		{
			scriptPath: path.resolve(
				dirname,
				"../../packages/payload-local-init/stage-2-seed-core/seed-course-structure.mjs",
			),
			key: "seed-course-structure",
		},
	],
});
