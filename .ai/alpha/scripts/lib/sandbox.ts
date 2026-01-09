/**

* Sandbox Management Module
*
* Handles E2B sandbox creation, git credentials setup, and branch management.
 */

import process from "node:process";
import { Sandbox } from "@e2b/code-interpreter";

import {
 DEV_SERVER_PORT,
 PROGRESS_FILE,
 TEMPLATE_ALIAS,
 VSCODE_PORT,
 WORKSPACE_DIR,
} from "../config/index.js";
import type { SandboxInstance, SpecManifest } from "../types/index.js";
import { E2B_API_KEY, GITHUB_TOKEN, getAllEnvVars } from "./environment.js";

// ============================================================================
// Git Credentials
// ============================================================================

/**

* Setup git credentials in the sandbox for GitHub operations.
*
* @param sandbox - The E2B sandbox instance
 */
export async function setupGitCredentials(sandbox: Sandbox): Promise<void> {
 if (!GITHUB_TOKEN) return;

 const commands = [
  'git config --global user.name "SlideHeroes Alpha"',
  'git config --global user.email "alpha@slideheroes.dev"',
  "git config --global credential.helper store",
  `echo "https://x-access-token:${GITHUB_TOKEN}@github.com" > ~/.git-credentials`,
  "chmod 600 ~/.git-credentials",
  "git config --global push.default current",
  "git config --global push.autoSetupRemote true",
 ];

 for (const cmd of commands) {
  await sandbox.commands.run(cmd, { timeoutMs: 10000 });
 }

 try {
  await sandbox.commands.run(
   `echo "${GITHUB_TOKEN}" | gh auth login --with-token`,
   { timeoutMs: 30000 },
  );
 } catch {
  // Non-fatal
 }
}

// ============================================================================
// Sandbox Creation
// ============================================================================

/**

* Create and configure an E2B sandbox for feature implementation.
*
* @param manifest - The spec manifest
* @param label - Human-readable label for the sandbox (e.g., "sbx-a")
* @param timeout - Sandbox timeout in seconds
* @returns Configured sandbox instance
 */
export async function createSandbox(
 manifest: SpecManifest,
 label: string,
 timeout: number,
): Promise<SandboxInstance> {
 console.log(`\n📦 Creating sandbox ${label}...`);

 const sandbox = await Sandbox.create(TEMPLATE_ALIAS, {
  timeoutMs: timeout * 1000,
  apiKey: E2B_API_KEY,
  envs: getAllEnvVars(),
 });

 console.log(`ID: ${sandbox.sandboxId}`);

 // Setup git
 if (GITHUB_TOKEN) {
  await setupGitCredentials(sandbox);
 }

 // Fetch and setup branch
 const branchName = `alpha/spec-${manifest.metadata.spec_id}`;

 await sandbox.commands.run(`cd ${WORKSPACE_DIR} && git fetch origin`, {
  timeoutMs: 120000,
 });

 // Check if spec branch exists
 const branchExistsResult = await sandbox.commands.run(
  `cd ${WORKSPACE_DIR} && git ls-remote --heads origin "${branchName}" | wc -l`,
  { timeoutMs: 30000 },
 );
 const branchExists = branchExistsResult.stdout.trim() === "1";

 if (branchExists) {
  console.log(`Checking out existing branch: ${branchName}`);
  await sandbox.commands.run(
   `cd ${WORKSPACE_DIR} && git fetch origin "${branchName}" && git checkout -B "${branchName}" FETCH_HEAD`,
   { timeoutMs: 60000 },
  );
 } else {
  console.log(`Creating new branch from dev: ${branchName}`);
  await sandbox.commands.run(
   `cd ${WORKSPACE_DIR} && git checkout dev && git pull origin dev && git checkout -b "${branchName}"`,
   { timeoutMs: 60000 },
  );
  // Push new branch to remote so other sandboxes can pull from it
  if (GITHUB_TOKEN) {
   console.log("   Pushing new branch to remote...");
   try {
    await sandbox.commands.run(
     `cd ${WORKSPACE_DIR} && git push -u origin "${branchName}"`,
     { timeoutMs: 60000 },
    );
   } catch {
    console.log(
     "   ⚠ Initial push failed (will retry after first feature)",
    );
   }
  }
 }

 // Clear any stale progress file from template or previous runs
 await sandbox.commands.run(`cd ${WORKSPACE_DIR} && rm -f ${PROGRESS_FILE}`, {
  timeoutMs: 5000,
 });

 // Verify dependencies
 const checkResult = await sandbox.commands.run(
  `cd ${WORKSPACE_DIR} && test -d node_modules && echo "exists" || echo "missing"`,
  { timeoutMs: 10000 },
 );

 if (checkResult.stdout.trim() === "missing") {
  console.log("   Installing dependencies...");
  await sandbox.commands.run(
   `cd ${WORKSPACE_DIR} && pnpm install --frozen-lockfile`,
   { timeoutMs: 600000 },
  );
 }

 // Setup Supabase CLI if sandbox project is configured
 const sandboxProjectRef = process.env.SUPABASE_SANDBOX_PROJECT_REF;
 const supabaseAccessToken = process.env.SUPABASE_ACCESS_TOKEN;

 if (sandboxProjectRef && supabaseAccessToken) {
  console.log("   Setting up Supabase CLI...");

  // Verify supabase CLI is available via pnpm
  const cliCheck = await sandbox.commands.run(
   `cd ${WORKSPACE_DIR} && pnpm exec supabase --version 2>/dev/null || echo 'not found'`,
   { timeoutMs: 30000 },
  );

  if (cliCheck.stdout.includes("not found") || cliCheck.exitCode !== 0) {
   console.log(
    "   ⚠️ Supabase CLI not found in project dependencies, DB features may fail",
   );
  } else {
   console.log(`   Found Supabase CLI: ${cliCheck.stdout.trim()}`);

   // Link to sandbox project (from apps/web which has supabase config)
   console.log(`   Linking to sandbox project: ${sandboxProjectRef}`);
   try {
    const linkResult = await sandbox.commands.run(
     `cd ${WORKSPACE_DIR}/apps/web && pnpm exec supabase link --project-ref ${sandboxProjectRef}`,
     {
      timeoutMs: 60000,
      envs: { SUPABASE_ACCESS_TOKEN: supabaseAccessToken },
     },
    );

    if (linkResult.exitCode === 0) {
     console.log("   ✅ Supabase CLI linked to sandbox project");
    } else {
     console.log(
      `   ⚠️ Supabase link failed (code ${linkResult.exitCode}): ${linkResult.stderr}`,
     );
    }
   } catch (linkError) {
    console.log(`   ⚠️ Supabase link failed (non-fatal): ${linkError}`);
   }
  }
 } else if (sandboxProjectRef && !supabaseAccessToken) {
  console.log(
   "   ⚠️ SUPABASE_ACCESS_TOKEN not set, skipping Supabase CLI setup",
  );
 }

 // Update manifest
 if (!manifest.sandbox.sandbox_ids.includes(sandbox.sandboxId)) {
  manifest.sandbox.sandbox_ids.push(sandbox.sandboxId);
 }
 manifest.sandbox.branch_name = branchName;
 manifest.sandbox.created_at =
  manifest.sandbox.created_at || new Date().toISOString();

 return {
  sandbox,
  id: sandbox.sandboxId,
  label,
  status: "ready",
  currentFeature: null,
  retryCount: 0,
 };
}

// ============================================================================
// Dev Server & URLs
// ============================================================================

/**

* Start the dev server in the sandbox.
*
* @param sandbox - The E2B sandbox instance
* @returns The dev server URL
 */
export async function startDevServer(sandbox: Sandbox): Promise<string> {
 // Start the dev server
 sandbox.commands
  .run("nohup start-dev > /tmp/devserver.log 2>&1 &", { timeoutMs: 5000 })
  .catch(() => {
   /* fire and forget */
  });

 const devServerHost = sandbox.getHost(DEV_SERVER_PORT);
 return `https://${devServerHost}`;
}

/**

* Get the VS Code URL for a sandbox.
*
* @param sandbox - The E2B sandbox instance
* @returns The VS Code URL
 */
export function getVSCodeUrl(sandbox: Sandbox): string {
 const vscodeHost = sandbox.getHost(VSCODE_PORT);
 return `https://${vscodeHost}`;
}
