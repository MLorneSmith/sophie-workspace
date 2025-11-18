/**
 * Vitest setup file
 * Loads .env.test and sets up environment variables before tests run
 */

import { resolve } from "node:path";
import { config } from "dotenv";

// Load .env.test file with override to ignore shell environment variables
const envPath = resolve(__dirname, ".env.test");
config({ path: envPath, override: true });

// Force NODE_ENV to 'test' BEFORE any other setup
// This must be set unconditionally to override any system/CI defaults
// @ts-expect-error - NODE_ENV is read-only in strict mode but writable at runtime
// biome-ignore lint/suspicious/noExplicitAny: Required for test environment setup
(process.env as any).NODE_ENV = "test";

// Ensure critical variables are set (fallback if .env.test doesn't load)
// Note: sslmode=disable required for local Supabase with self-signed certificates
if (!process.env.DATABASE_URI) {
	process.env.DATABASE_URI =
		"postgresql://postgres:postgres@localhost:54322/postgres?sslmode=disable";
}
if (!process.env.PAYLOAD_SECRET) {
	process.env.PAYLOAD_SECRET = "test_payload_secret_for_e2e_testing";
}
if (!process.env.PAYLOAD_PUBLIC_SERVER_URL) {
	process.env.PAYLOAD_PUBLIC_SERVER_URL = "http://localhost:3020";
}
