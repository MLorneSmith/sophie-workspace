# Initiative Workflow Improvement Recommendations

## Executive Summary

The `/initiative` workflow successfully completed **Phase 1 (Research)** and **Phase 2 (Decomposition)** but failed during **Phase 3 (Implementation)** due to E2B sandbox configuration issues. The sandbox template doesn't pre-clone the repository, and the workflow assumed incorrect paths.

---

## What Worked Well

| Component | Result |
|-----------|--------|
| Interview questions (AskUserQuestion) | Direct user interaction worked perfectly |
| `initiative-research` agent delegation | Successfully gathered tech info, patterns, existing components |
| Research manifest creation | Created comprehensive manifest with gotchas and patterns |
| `initiative-decomposition` agent | Correctly broke down into 9 features across 4 phases |
| Dependency graph generation | Proper sequencing identified |
| GitHub issue creation (DIRECT in orchestrator) | All 10 issues created correctly |
| Directory renaming with issue prefix | `1186-user-dashboard-home` naming worked |

## What Failed

| Phase | Issue | Root Cause |
|-------|-------|------------|
| Phase 3 | Wrong repo path assumed | Command assumed `/home/user/repo` but template uses `/home/user/project` |
| Phase 3 | Repository not pre-cloned | Sandbox template didn't have repo cloned during build |
| Phase 3 | GitHub auth not configured | Sandbox created without GitHub CLI auth |
| Phase 3 | No sandbox validation | Jumped to `exec` without verifying sandbox readiness |

---

## Root Cause Analysis

### 1. Template Configuration Gap

**Current State** (`packages/e2b/e2b-template/template.ts`):
```typescript
.setEnvs({
  PROJECT_ROOT: "/home/user/project",  // Directory exists but is EMPTY
  // ...
})
.setWorkdir("/home/user/project");  // Working dir set but no repo cloned
```

**Problem**: The template sets the working directory to `/home/user/project` but never clones the repository there.

### 2. Path Mismatch in initiative.md

**In initiative.md** (Line 319):
```bash
${SANDBOX_CLI} exec ${sandboxId} "git fetch origin && git checkout dev..."
```

**In sandbox-cli.ts** (Line 283):
```typescript
const WORKSPACE_DIR = "/home/user/project";
```

The initiative.md command doesn't specify the working directory, so it runs in the default location which may not be where the repo should be.

### 3. Missing Readiness Validation

The E2B best practice is to use `--ready-cmd` to validate sandbox is ready:
```bash
--ready-cmd 'test -f /home/user/project/.git/config'
```

Our current template has NO readiness check.

---

## Recommended Improvements

### Priority 1: Fix E2B Template (CRITICAL)

**Option A: Pre-clone during template build (Recommended for public repos)**

Update `packages/e2b/e2b-template/template.ts`:

```typescript
export const template = Template()
  .fromImage("e2bdev/base")
  // ... existing apt installs and setup ...

  // Clone repository during build (this bakes it into the template image)
  .runCmd(
    `git clone https://github.com/MLorneSmith/2025slideheroes.git /home/user/project`,
    { user: "user" }
  )

  // Install dependencies during build (faster sandbox startup)
  .runCmd(`cd /home/user/project && pnpm install`, { user: "user" })

  // Set workdir
  .setWorkdir("/home/user/project");
```

**Rebuild template with readiness check**:
```bash
e2b template build \
  -n slideheroes-claude-agent \
  --ready-cmd "test -f /home/user/project/.git/config && test -d /home/user/project/node_modules"
```

**Pros**:
- Instant sandbox startup (no clone delay)
- Consistent repo state
- Dependencies pre-installed

**Cons**:
- Template needs rebuild when base repo changes significantly
- Uses more storage per template

---

**Option B: Clone at sandbox runtime (Recommended for private repos or frequent updates)**

Add a startup script that clones on first run:

```typescript
.runCmd(`cat > /usr/local/bin/init-project << 'SCRIPT'
#!/bin/bash
set -e

PROJECT_DIR="/home/user/project"
REPO_URL="https://github.com/MLorneSmith/2025slideheroes.git"

if [ ! -d "$PROJECT_DIR/.git" ]; then
  echo "Cloning repository..."
  if [ -n "$GITHUB_TOKEN" ]; then
    git clone "https://x-access-token:${GITHUB_TOKEN}@github.com/MLorneSmith/2025slideheroes.git" "$PROJECT_DIR"
  else
    git clone "$REPO_URL" "$PROJECT_DIR"
  fi
  cd "$PROJECT_DIR"
  git checkout dev
  pnpm install
  echo "Repository initialized"
else
  echo "Repository already exists"
  cd "$PROJECT_DIR"
  git fetch origin
fi
SCRIPT
chmod +x /usr/local/bin/init-project`, { user: "root" })
```

**Pros**:
- Always gets latest code
- Works with private repos via runtime token

**Cons**:
- 1-3 minute delay on first sandbox use
- Requires GITHUB_TOKEN for private repos

---

### Priority 2: Update Sandbox CLI

Add initialization step to `createSandbox()` in `sandbox-cli.ts`:

```typescript
async function createSandbox(
  timeout: number = 300,
  template: string = DEFAULT_TEMPLATE,
  setupGit: boolean = true,
  initializeRepo: boolean = true  // NEW PARAMETER
): Promise<Sandbox> {
  // ... existing code ...

  const sandbox = await Sandbox.create(template, opts);

  // NEW: Initialize repository if not present
  if (initializeRepo) {
    console.log("\nStep: Initializing repository...");
    const repoCheck = await sandbox.commands.run(
      `test -d ${WORKSPACE_DIR}/.git`,
      { timeoutMs: 5000 }
    );

    if (repoCheck.exitCode !== 0) {
      console.log("Repository not found, cloning...");
      await sandbox.commands.run(
        `init-project`,  // Uses the startup script
        {
          timeoutMs: 180000,  // 3 minutes for clone + install
          envs: getGitEnvVars()
        }
      );
    }
  }

  // ... rest of existing code ...
}
```

Add a dedicated `init` command:

```typescript
case "init": {
  const sandboxId = args[1];
  const branch = args[2] || "dev";

  if (!sandboxId) {
    console.error("Usage: sandbox init <sandbox-id> [branch]");
    process.exit(1);
  }

  await initializeSandbox(sandboxId, branch);
  break;
}

async function initializeSandbox(sandboxId: string, branch: string): Promise<void> {
  const sandbox = await Sandbox.connect(sandboxId, { apiKey: API_KEY });

  // Check if repo exists
  const repoCheck = await sandbox.commands.run(
    `test -d ${WORKSPACE_DIR}/.git`,
    { timeoutMs: 5000 }
  );

  if (repoCheck.exitCode !== 0) {
    console.log("Cloning repository...");
    const cloneUrl = GITHUB_TOKEN
      ? `https://x-access-token:${GITHUB_TOKEN}@github.com/MLorneSmith/2025slideheroes.git`
      : "https://github.com/MLorneSmith/2025slideheroes.git";

    await sandbox.commands.run(
      `git clone ${cloneUrl} ${WORKSPACE_DIR}`,
      { timeoutMs: 120000, envs: getGitEnvVars() }
    );
  }

  // Checkout branch and pull
  await sandbox.commands.run(
    `cd ${WORKSPACE_DIR} && git fetch origin && git checkout ${branch} && git pull origin ${branch}`,
    { timeoutMs: 60000 }
  );

  // Install dependencies
  console.log("Installing dependencies...");
  await sandbox.commands.run(
    `cd ${WORKSPACE_DIR} && pnpm install`,
    { timeoutMs: 300000 }
  );

  console.log("Sandbox initialized successfully");
}
```

---

### Priority 3: Update initiative.md

**Add sandbox validation step after creation:**

```markdown
#### Step 3.1: Create Sandbox

\`\`\`bash
${SANDBOX_CLI} create --template slideheroes-claude-agent --timeout 3600
\`\`\`

Capture `sandboxId` from output.

#### Step 3.1.1: Validate Sandbox (NEW)

**CRITICAL**: Validate sandbox is ready before proceeding.

\`\`\`bash
# Check if repository exists
${SANDBOX_CLI} exec ${sandboxId} "test -d /home/user/project/.git" --timeout 10000

# If repo doesn't exist, initialize it
${SANDBOX_CLI} exec ${sandboxId} "init-project" --timeout 180000

# Verify repo is ready
${SANDBOX_CLI} exec ${sandboxId} "cd /home/user/project && git status" --timeout 30000
\`\`\`

**If validation fails**: Fall back to local mode.
```

**Add error handling for sandbox failures:**

```markdown
#### Step 3.2: Create Feature Branch

\`\`\`bash
# Use full path and include error handling
RESULT=$(${SANDBOX_CLI} exec ${sandboxId} "cd /home/user/project && git fetch origin && git checkout dev && git pull origin dev && git checkout -b feature/${masterIssueNumber}-${slug}" 2>&1)

if [[ $? -ne 0 ]]; then
  echo "Sandbox git setup failed. Falling back to local mode."
  # Cleanup sandbox
  ${SANDBOX_CLI} kill ${sandboxId}
  # Switch to Path B (Local Mode)
  goto_local_mode
fi
\`\`\`
```

---

### Priority 4: Add Sandbox Health Check Command

Add to sandbox-cli.ts:

```typescript
case "health": {
  const sandboxId = args[1];
  if (!sandboxId) {
    console.error("Usage: sandbox health <sandbox-id>");
    process.exit(1);
  }
  await healthCheck(sandboxId);
  break;
}

async function healthCheck(sandboxId: string): Promise<void> {
  const sandbox = await Sandbox.connect(sandboxId, { apiKey: API_KEY });

  const checks = [
    { name: "Repository exists", cmd: "test -d /home/user/project/.git" },
    { name: "Git configured", cmd: "git config user.name" },
    { name: "Node available", cmd: "node --version" },
    { name: "pnpm available", cmd: "pnpm --version" },
    { name: "Claude CLI available", cmd: "which claude" },
    { name: "Dependencies installed", cmd: "test -d /home/user/project/node_modules" },
  ];

  console.log(`Health check for sandbox ${sandboxId}:\n`);

  let allPassed = true;
  for (const check of checks) {
    const result = await sandbox.commands.run(
      `cd /home/user/project && ${check.cmd}`,
      { timeoutMs: 10000 }
    );
    const status = result.exitCode === 0 ? "✓" : "✗";
    console.log(`  ${status} ${check.name}`);
    if (result.exitCode !== 0) allPassed = false;
  }

  console.log("");
  if (allPassed) {
    console.log("All checks passed - sandbox is ready");
  } else {
    console.log("Some checks failed - run: /sandbox init " + sandboxId);
    process.exit(1);
  }
}
```

---

## Implementation Plan

### Phase 1: Quick Fix (Immediate)
1. Update `initiative.md` to include sandbox validation step
2. Add fallback to local mode when sandbox fails
3. Update path references to use correct `/home/user/project`

### Phase 2: Template Update (Next Session)
1. Update `template.ts` to pre-clone repository
2. Rebuild template with `--ready-cmd`
3. Test new template with `/initiative` workflow

### Phase 3: CLI Enhancements (Future)
1. Add `init` command to sandbox CLI
2. Add `health` command for diagnostics
3. Add `--clone-repo` flag to `create` command
4. Update `/sandbox` slash command documentation

---

## Testing Strategy

After implementing changes:

1. **Template Test**:
   ```bash
   # Build updated template
   cd packages/e2b && pnpm build-template

   # Create sandbox and verify repo exists
   /sandbox create
   /sandbox health <id>
   ```

2. **Initiative Test**:
   ```bash
   # Run full initiative with E2B
   /initiative Add a simple test feature --quick
   # Select E2B Sandbox mode
   # Verify sandbox creates, clones, and implements
   ```

3. **Local Fallback Test**:
   ```bash
   # Simulate sandbox failure by using wrong template
   /initiative Test feature
   # Verify graceful fallback to local mode
   ```

---

## Related Files to Update

| File | Changes |
|------|---------|
| `packages/e2b/e2b-template/template.ts` | Add repo cloning, ready-cmd |
| `.claude/skills/e2b-sandbox/scripts/sandbox-cli.ts` | Add init, health commands |
| `.claude/commands/initiative.md` | Add validation step, fix paths |
| `.claude/commands/sandbox/initiative-feature.md` | Add validation, error handling |
| `.claude/commands/sandbox/initiative-implement.md` | Add validation, error handling |
