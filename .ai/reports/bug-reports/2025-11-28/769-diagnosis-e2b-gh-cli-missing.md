# Bug Diagnosis: E2B Sandbox Template Missing GitHub CLI (gh)

**ID**: ISSUE-pending
**Created**: 2025-11-28T12:00:00Z
**Reporter**: User (during feature workflow testing)
**Severity**: medium
**Status**: new
**Type**: bug

## Summary

The E2B sandbox template `slideheroes-claude-agent` does not include the GitHub CLI (`gh`), preventing the sandbox from creating GitHub issues or PRs directly. This breaks the automated feature workflow where Claude Code needs to create GitHub issues as part of the `/feature` command.

## Environment

- **Application Version**: Current dev branch
- **Environment**: development (E2B cloud sandbox)
- **Node Version**: 20.x (in sandbox)
- **E2B Template**: slideheroes-claude-agent
- **Last Working**: Never (gh CLI was never installed in template)

## Reproduction Steps

1. Run `/sandbox feature "#123 Add dark mode"`
2. Claude Code runs `/feature` in the sandbox
3. Claude Code attempts to create a GitHub issue using `gh issue create`
4. Command fails with "gh: command not found" or similar

## Expected Behavior

The `gh` CLI should be available in the E2B sandbox, allowing Claude Code to:
- Create GitHub issues with `gh issue create`
- Create pull requests with `gh pr create`
- Interact with the GitHub API for workflow automation

## Actual Behavior

The `gh` CLI is not installed in the sandbox template. When Claude Code attempts to use `gh` commands, they fail. The sandbox-cli.ts code at lines 837-858 shows it attempts to use `gh pr create` and has a fallback message noting "gh CLI not available".

## Diagnostic Data

### Template Build Configuration
```typescript
// From .claude/skills/e2b-sandbox/scripts/build-template.ts lines 156-204
.aptInstall([
    "git",
    "curl",
    "wget",
    "vim",
    "jq",
    "htop",
    "build-essential",
    "python3",
    // Playwright dependencies...
])
// NOTE: 'gh' is NOT in this list
```

### Sandbox CLI Code Expecting gh
```typescript
// From sandbox-cli.ts lines 837-858
const prResult = await sandbox.commands.run(
    `cd ${WORKSPACE_DIR} && gh pr create --title "${commitMessage}" --body "${prBody}" --base dev`,
    {
        timeoutMs: 60000,
        envs: { ...getGitEnvVars(), GH_TOKEN: GITHUB_TOKEN },
    },
);

if (prResult.exitCode === 0 && prResult.stdout) {
    console.log("\n=== Pull Request Created ===");
    console.log(prResult.stdout);
} else {
    // Fallback: just show the branch URL
    console.log("\n=== Branch Pushed ===");
    console.log(`Branch: ${branch}`);
    console.log(`Create PR at: https://github.com/${REPO_OWNER}/${REPO_NAME}/compare/dev...${branch}`);
    if (prResult.stderr) {
        console.log("\nNote: gh CLI not available, manual PR creation needed");
    }
}
```

### Console Output
```
Running Claude Code with prompt: "Please create the GitHub issue now using the gh CLI..."
...
I see that the `gh` CLI is not installed on this system.
```

## Error Stack Traces

No stack trace - the `gh` command simply doesn't exist in the sandbox.

## Related Code

- **Affected Files**:
  - `.claude/skills/e2b-sandbox/scripts/build-template.ts` - Template build configuration
  - `.claude/skills/e2b-sandbox/scripts/sandbox-cli.ts` - Sandbox CLI that expects gh
- **Recent Changes**: Template was recently created but gh CLI was never included
- **Suspected Functions**: `buildTemplate()` in build-template.ts

## Related Issues & Context

### Direct Predecessors
None found - this is a new feature/template.

### Historical Context
The E2B sandbox template was designed to run Claude Code for feature development but the GitHub CLI was overlooked during initial template setup.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The GitHub CLI (`gh`) is not installed in the E2B sandbox template build configuration.

**Detailed Explanation**:
The template builder script (`.claude/skills/e2b-sandbox/scripts/build-template.ts`) uses E2B's SDK to define a custom sandbox template. The template installs various packages via `aptInstall()` (git, curl, jq, etc.) and `npm install -g` (turbo, @anthropic-ai/claude-code), but the GitHub CLI (`gh`) was never added to either installation step.

The GitHub CLI requires a specific installation process:
1. Add the GitHub CLI apt repository
2. Install the `gh` package

This was not included in the template build script.

**Supporting Evidence**:
- Lines 156-184 of `build-template.ts` show the `aptInstall()` call with packages - `gh` is not listed
- Lines 201-204 show global npm packages - `gh` is not listed there either
- The sandbox-cli.ts has fallback handling at lines 849-858 specifically for when `gh` is unavailable
- User reported "gh CLI is not installed on this system" from sandbox Claude output

### How This Causes the Observed Behavior

1. Template is built without `gh` CLI
2. Sandbox is created from template
3. Claude Code runs `/feature` command
4. `/feature` tries to create GitHub issue via `gh issue create`
5. Command fails because `gh` binary doesn't exist
6. Feature workflow cannot complete automated GitHub integration

### Confidence Level

**Confidence**: High

**Reasoning**: The code is explicit - `gh` is simply not in the list of installed packages in the template build script. The error message confirms the binary doesn't exist. This is a straightforward omission, not a complex interaction bug.

## Fix Approach (High-Level)

Add GitHub CLI installation to the E2B template build script. This requires:
1. Add apt repository for GitHub CLI: `curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg`
2. Add the repository to sources: `echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | tee /etc/apt/sources.list.d/github-cli.list`
3. Install gh: `apt update && apt install gh`
4. Rebuild the template: `tsx .claude/skills/e2b-sandbox/scripts/build-template.ts`

## Diagnosis Determination

Root cause confirmed: The GitHub CLI was never included in the E2B sandbox template build configuration. This is a simple omission that can be fixed by adding the `gh` CLI installation commands to the template builder script.

## Additional Context

- The sandbox already has `GITHUB_TOKEN` environment variable support configured
- The sandbox-cli.ts code is already written to use `gh` CLI with `GH_TOKEN` environment variable
- Once `gh` is installed, the existing code should work without modification
- Template rebuild is required after making the fix

---
*Generated by Claude Debug Assistant*
*Tools Used: Glob, Read, Grep*
