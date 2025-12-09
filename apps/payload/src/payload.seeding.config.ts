import path from "node:path";
import { fileURLToPath } from "node:url";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { config as loadEnv } from "dotenv";
import { buildConfig } from "payload";
import { CourseLessons } from "./collections/CourseLessons.js";
import { CourseQuizzes } from "./collections/CourseQuizzes.js";
import { Courses } from "./collections/Courses.js";
import { Documentation } from "./collections/Documentation.js";
import { Downloads } from "./collections/Downloads.js";
import { Media } from "./collections/Media.js";
import { Posts } from "./collections/Posts.js";
import { Private } from "./collections/Private.js";
import { QuizQuestions } from "./collections/QuizQuestions.js";
import { SurveyQuestions } from "./collections/SurveyQuestions.js";
import { Surveys } from "./collections/Surveys.js";
import { Users } from "./collections/Users.js";

const filename = fileURLToPath(import.meta.url);
const _dirname = path.dirname(filename);

// Parse --env flag from process.argv to determine which environment file to load
// Defaults to 'test' for backwards compatibility, supports 'production' for remote seeding
function getEnvNameFromArgs(): string {
	const envFlagIndex = process.argv.findIndex((arg) =>
		arg.startsWith("--env="),
	);
	if (envFlagIndex !== -1) {
		const envValue = process.argv[envFlagIndex].split("=")[1];
		if (envValue && ["test", "production", "development"].includes(envValue)) {
			return envValue;
		}
		// biome-ignore lint/suspicious/noConsole: Intentional log at module init time before Logger is available
		console.warn(
			`Warning: Invalid --env value "${envValue}", defaulting to "test"`,
		);
	}
	return "test"; // Default for backwards compatibility
}

// Load environment file explicitly for seeding with override to ignore shell environment variables
// This ensures environment variables are available at module evaluation time
// Using override: true to prevent shell environment pollution (fixes #966/#967)
// From src/ go up 1 level to apps/payload/
const envName = getEnvNameFromArgs();
const envPath = path.resolve(_dirname, `../.env.${envName}`);
// biome-ignore lint/suspicious/noConsole: Intentional log at module init time before Logger is available
console.log(
	`[payload.seeding.config] Loading environment from: .env.${envName}`,
);
loadEnv({ path: envPath, override: true });

// Note: Environment variables are read at config evaluation time
// Tests must ensure env vars are set before this module is imported

// Validate required environment variables
const payloadSecret = process.env.PAYLOAD_SECRET;
if (!payloadSecret) {
	throw new Error(
		"PAYLOAD_SECRET environment variable is required for seeding",
	);
}

const databaseURI = process.env.DATABASE_URI;
if (!databaseURI) {
	throw new Error("DATABASE_URI environment variable is required for seeding");
}

export default buildConfig({
	secret: payloadSecret,
	serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL || "",
	collections: [
		Users,
		Media,
		Courses,
		CourseLessons,
		CourseQuizzes,
		QuizQuestions,
		Surveys,
		SurveyQuestions,
		Documentation,
		Posts,
		Private,
		Downloads,
	],
	// Only include the database adapter, exclude other plugins/editor for seeding config
	db: (() => {
		// SSL is controlled via connection string (sslmode parameter)
		// Production: postgresql://...?sslmode=require
		// Test/Dev: postgresql://...?sslmode=disable
		// This approach avoids module caching issues and follows node-postgres best practices

		// Serverless-optimized connection pool settings
		const poolConfig = {
			connectionString: databaseURI,
			// No ssl property - let connection string sslmode parameter control SSL
			max: 2, // Reduced pool size for serverless environments like Vercel
			min: 0, // Allow pool to scale down to 0 connections
			connectionTimeoutMillis: 10000, // 10 second connection timeout
			idleTimeoutMillis: 30000, // 30 second idle timeout
			acquireTimeoutMillis: 5000, // 5 second acquire timeout
			createTimeoutMillis: 10000, // 10 second create timeout
			destroyTimeoutMillis: 5000, // 5 second destroy timeout
			reapIntervalMillis: 1000, // Check for idle connections every second
			createRetryIntervalMillis: 200, // Retry interval for failed connections
		};

		return postgresAdapter({
			pool: poolConfig,
			schemaName: "payload",
			idType: "uuid", // Explicitly set ID type to UUID
			push: false, // Disable schema push - tables already exist from migrations
		});
	})(),
	// Exclude editor, plugins, globals, bin array as they are not needed for seeding
});
