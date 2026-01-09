/**

* Environment & Authentication Module
*
* Handles environment variable management, OAuth token retrieval,
* and environment validation for the orchestrator.
 */

import *as fs from "node:fs";
import* as path from "node:path";
import process from "node:process";

// ============================================================================
// Environment Variables
// ============================================================================

export const E2B_API_KEY = process.env.E2B_API_KEY;
export const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
export const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

// ============================================================================
// OAuth Token Management
// ============================================================================

let _cachedOAuthToken: string | undefined;

/**

* Get Claude OAuth token from environment or credentials file.
* Checks CLAUDE_CODE_OAUTH_TOKEN env var first, then falls back to
* ~/.claude/.credentials.json
 */
export function getClaudeOAuthToken(): string | undefined {
 if (process.env.CLAUDE_CODE_OAUTH_TOKEN) {
  return process.env.CLAUDE_CODE_OAUTH_TOKEN;
 }

 const homeDir = process.env.HOME || process.env.USERPROFILE;
 if (!homeDir) return undefined;

 const credentialsPath = path.join(homeDir, ".claude", ".credentials.json");

 try {
  if (fs.existsSync(credentialsPath)) {
   const content = fs.readFileSync(credentialsPath, "utf-8");
   const credentials = JSON.parse(content);
   return credentials?.claudeAiOauth?.accessToken;
  }
 } catch {
  // Silently fail
 }

 return undefined;
}

/**

* Get cached OAuth token (avoids repeated file reads).
 */
export function getCachedOAuthToken(): string | undefined {
 if (_cachedOAuthToken === undefined) {
  _cachedOAuthToken = getClaudeOAuthToken() || "";
 }
 return _cachedOAuthToken || undefined;
}

/**

* Clear the cached OAuth token (useful for testing).
 */
export function clearOAuthTokenCache(): void {
 _cachedOAuthToken = undefined;
}

// ============================================================================
// Environment Validation
// ============================================================================

/**

* Check that required environment variables are set.
* Exits process with error if not.
 */
export function checkEnvironment(): void {
 if (!E2B_API_KEY) {
  console.error("ERROR: E2B_API_KEY environment variable not set");
  process.exit(1);
 }

 const oauthToken = getCachedOAuthToken();
 if (!ANTHROPIC_API_KEY && !oauthToken) {
  console.error("ERROR: No Claude authentication found");
  process.exit(1);
 }
}

// ============================================================================
// Environment Variables for Sandbox
// ============================================================================

/**

* Get all environment variables to inject into E2B sandboxes.
* Includes Claude auth, GitHub, Supabase, Payload CMS, and R2 credentials.
 */
export function getAllEnvVars(): Record<string, string> {
 const envs: Record<string, string> = {};

 // Claude authentication
 const oauthToken = getCachedOAuthToken();
 if (oauthToken) {
  envs.CLAUDE_CODE_OAUTH_TOKEN = oauthToken;
 } else if (ANTHROPIC_API_KEY) {
  envs.ANTHROPIC_API_KEY = ANTHROPIC_API_KEY;
 }

 // GitHub
 if (GITHUB_TOKEN) {
  envs.GITHUB_TOKEN = GITHUB_TOKEN;
 }

 // Supabase credentials for dev server and runtime operations
 const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
 const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
 const databaseUrl = process.env.DATABASE_URL;

 if (supabaseUrl) {
  envs.NEXT_PUBLIC_SUPABASE_URL = supabaseUrl;
  envs.SUPABASE_URL = supabaseUrl;
 }
 if (supabaseAnonKey) {
  envs.NEXT_PUBLIC_SUPABASE_ANON_KEY = supabaseAnonKey;
  envs.SUPABASE_ANON_KEY = supabaseAnonKey;
 }
 if (supabaseServiceKey) {
  envs.SUPABASE_SERVICE_ROLE_KEY = supabaseServiceKey;
 }
 if (databaseUrl) {
  envs.DATABASE_URL = databaseUrl;
 }

 // Sandbox Supabase credentials (for DB operations in E2B)
 const sandboxProjectRef = process.env.SUPABASE_SANDBOX_PROJECT_REF;
 const sandboxUrl = process.env.SUPABASE_SANDBOX_URL;
 const sandboxAnonKey = process.env.SUPABASE_SANDBOX_ANON_KEY;
 const sandboxServiceKey = process.env.SUPABASE_SANDBOX_SERVICE_ROLE_KEY;
 const sandboxDbUrl = process.env.SUPABASE_SANDBOX_DB_URL;
 const supabaseAccessToken = process.env.SUPABASE_ACCESS_TOKEN;

 if (sandboxProjectRef) {
  envs.SUPABASE_SANDBOX_PROJECT_REF = sandboxProjectRef;
 }
 if (sandboxUrl) {
  envs.NEXT_PUBLIC_SUPABASE_URL = sandboxUrl;
  envs.SUPABASE_URL = sandboxUrl;
 }
 if (sandboxAnonKey) {
  envs.NEXT_PUBLIC_SUPABASE_ANON_KEY = sandboxAnonKey;
  envs.SUPABASE_ANON_KEY = sandboxAnonKey;
 }
 if (sandboxServiceKey) {
  envs.SUPABASE_SERVICE_ROLE_KEY = sandboxServiceKey;
 }
 if (sandboxDbUrl) {
  envs.DATABASE_URL = sandboxDbUrl;
  envs.SUPABASE_SANDBOX_DB_URL = sandboxDbUrl;
  // Payload uses DATABASE_URI with sslmode=require for remote connections
  const dbUriWithSsl = sandboxDbUrl.includes("?")
   ? `${sandboxDbUrl}&sslmode=require`
   : `${sandboxDbUrl}?sslmode=require`;
  envs.DATABASE_URI = dbUriWithSsl;
 }
 if (supabaseAccessToken) {
  envs.SUPABASE_ACCESS_TOKEN = supabaseAccessToken;
 }

 // Payload CMS credentials for seeding
 const payloadSecret = process.env.PAYLOAD_SECRET;
 const seedUserPassword = process.env.SEED_USER_PASSWORD;

 if (payloadSecret) {
  envs.PAYLOAD_SECRET = payloadSecret;
 }
 if (seedUserPassword) {
  envs.SEED_USER_PASSWORD = seedUserPassword;
 }

 // R2 Storage credentials for seeding media files
 const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID;
 const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
 const r2AccountId = process.env.R2_ACCOUNT_ID;
 const r2MediaBucket = process.env.R2_MEDIA_BUCKET;
 const r2DownloadsBucket = process.env.R2_DOWNLOADS_BUCKET;
 const r2Region = process.env.R2_REGION;
 const mediaBaseUrl = process.env.PAYLOAD_PUBLIC_MEDIA_BASE_URL;
 const downloadsBaseUrl = process.env.PAYLOAD_PUBLIC_DOWNLOADS_BASE_URL;

 if (r2AccessKeyId) envs.R2_ACCESS_KEY_ID = r2AccessKeyId;
 if (r2SecretAccessKey) envs.R2_SECRET_ACCESS_KEY = r2SecretAccessKey;
 if (r2AccountId) envs.R2_ACCOUNT_ID = r2AccountId;
 if (r2MediaBucket) envs.R2_MEDIA_BUCKET = r2MediaBucket;
 if (r2DownloadsBucket) envs.R2_DOWNLOADS_BUCKET = r2DownloadsBucket;
 if (r2Region) envs.R2_REGION = r2Region;
 if (mediaBaseUrl) envs.PAYLOAD_PUBLIC_MEDIA_BASE_URL = mediaBaseUrl;
 if (downloadsBaseUrl)
  envs.PAYLOAD_PUBLIC_DOWNLOADS_BASE_URL = downloadsBaseUrl;

 return envs;
}
