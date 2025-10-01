/**
 * Vitest setup file
 * Loads .env.test and sets up environment variables before tests run
 */

import { resolve } from "node:path";
import { config } from "dotenv";

// Load .env.test file
const envPath = resolve(__dirname, ".env.test");
config({ path: envPath });

// Ensure critical variables are set (fallback if .env.test doesn't load)
if (!process.env.DATABASE_URI) {
	process.env.DATABASE_URI =
		"postgresql://postgres:postgres@localhost:55322/postgres";
}
if (!process.env.PAYLOAD_SECRET) {
	process.env.PAYLOAD_SECRET = "test_payload_secret_for_e2e_testing";
}
if (!process.env.PAYLOAD_PUBLIC_SERVER_URL) {
	process.env.PAYLOAD_PUBLIC_SERVER_URL = "http://localhost:3020";
}
if (!process.env.NODE_ENV) {
	process.env.NODE_ENV = "test";
}
