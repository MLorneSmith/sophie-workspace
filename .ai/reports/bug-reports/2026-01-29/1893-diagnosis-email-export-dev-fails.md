# Bug Diagnosis: email-export dev script fails causing pnpm dev to abort

**ID**: ISSUE-1893
**Created**: 2026-01-29T14:45:00Z
**Reporter**: user
**Severity**: medium
**Status**: new
**Type**: bug

## Summary

Running `pnpm dev` fails because the `email-export` package has a `dev` script that runs the CLI tool without arguments. Since `email-export` is a CLI tool (not a server), it prints help and exits with code 1, causing Turborepo to abort all dev tasks.

## Environment

- **Application Version**: 2.13.1
- **Environment**: development
- **Node Version**: v22.16.0
- **Turborepo Version**: 2.6.3
- **Last Working**: Unknown (may have never worked with email-export included)

## Reproduction Steps

1. Run `pnpm dev` from the project root
2. Observe Turborepo starts all packages' dev scripts
3. `email-export:dev` executes `tsx src/index.ts` (the CLI entry point)
4. CLI prints help and exits with code 1 (no command provided)
5. Turborepo detects failure and aborts all other dev tasks

## Expected Behavior

`pnpm dev` should start all development servers (web, payload, dev-tool) without failure.

## Actual Behavior

`pnpm dev` fails with exit code 1 after `email-export#dev` fails. The error message shows:

```
email-export:dev: Usage: email-export [options] [command]
...
email-export:dev:  ELIFECYCLE  Command failed with exit code 1.
email-export:dev: ERROR: command finished with error: command (/home/msmith/projects/2025slideheroes/.ai/tools/email-export) /home/msmith/.nvm/versions/node/v22.16.0/bin/pnpm run dev exited (1)
```

## Diagnostic Data

### Console Output

```
email-export:dev: Usage: email-export [options] [command]
email-export:dev:
email-export:dev: Export emails from Gmail to YAML format for style analysis
email-export:dev:
email-export:dev: Options:
email-export:dev:   -V, --version     output the version number
email-export:dev:   -h, --help        display help for command
email-export:dev:
email-export:dev: Commands:
email-export:dev:   export [options]  Export emails matching the given criteria
email-export:dev:   auth [options]    Authenticate with Gmail (run this first)
email-export:dev:   labels [options]  List available Gmail labels
email-export:dev:   help [command]    display help for command
email-export:dev:  ELIFECYCLE  Command failed with exit code 1.
```

### Build vs Dev Comparison

- `pnpm build` **works** - only compiles TypeScript, doesn't execute CLI
- `pnpm dev` **fails** - executes CLI which exits with code 1

## Error Stack Traces

No stack trace - this is an expected exit from Commander.js when no command is provided.

## Related Code

- **Affected Files**:
  - `.ai/tools/email-export/package.json` - Contains problematic `dev` script
  - `turbo.json` - Defines `dev` task that runs on all packages

- **Problematic Code**:

`.ai/tools/email-export/package.json:15`:
```json
"dev": "tsx src/index.ts"
```

This runs the CLI entry point without arguments, which causes Commander.js to print help and exit.

`.ai/tools/email-export/src/index.ts`:
```typescript
#!/usr/bin/env node
import { createCli } from "./cli.js";
const program = createCli();
program.parse(process.argv);
```

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `email-export` package is a CLI tool with a `dev` script that executes the CLI without arguments, causing it to exit with code 1.

**Detailed Explanation**:
CLI tools using Commander.js behave differently from web servers:
1. Web servers (web, payload, dev-tool) start and run persistently when their `dev` script executes
2. CLI tools execute a command and exit immediately
3. When `email-export`'s `dev` script runs `tsx src/index.ts` without arguments, Commander.js:
   - Detects no valid command was provided
   - Prints the help message
   - Exits with code 1 (indicating improper usage)

Turborepo's `dev` task is configured with `"persistent": true` expecting long-running processes. When `email-export` exits immediately with a non-zero code, Turborepo treats this as a critical failure and aborts all tasks.

**Supporting Evidence**:
- `package.json:15` shows `"dev": "tsx src/index.ts"` - runs CLI without arguments
- `src/index.ts` shows Commander.js CLI setup that requires a command
- Error output shows help text followed by exit code 1
- `turbo.json:148-150` shows dev task expects persistent processes

### How This Causes the Observed Behavior

1. User runs `pnpm dev`
2. Turborepo executes `dev` script in all packages with a `dev` script
3. `email-export`'s `dev` script runs: `tsx src/index.ts`
4. Commander.js parses empty arguments, finds no command
5. CLI prints help and exits with code 1
6. Turborepo detects non-zero exit, reports failure, aborts remaining tasks
7. All other dev servers (web, payload, dev-tool) are killed

### Confidence Level

**Confidence**: High

**Reasoning**: The evidence is conclusive:
- Error output explicitly shows the CLI help being printed
- Exit code 1 is shown in the error
- The `dev` script clearly runs the CLI without arguments
- `pnpm build` works because it only compiles TypeScript

## Fix Approach (High-Level)

Three possible solutions (choose one):

1. **Remove the `dev` script** from `email-export/package.json` - CLI tools don't need dev servers
2. **Change `dev` to a no-op** like `"dev": "echo 'CLI tool - no dev server'"` with exit code 0
3. **Exclude email-export from dev** in turbo.json using task filtering

Recommendation: Option 1 (remove the dev script) is cleanest since CLI tools have no need for a dev server.

## Diagnosis Determination

This is a straightforward configuration issue. The `email-export` package is a CLI tool that was incorrectly given a `dev` script that executes the CLI without arguments. CLI tools should not have dev scripts since they are not servers. The fix is to remove the dev script or make it a no-op.

## Additional Context

- The `email-export` tool is located in `.ai/tools/` suggesting it's a development utility, not a core application
- This may have been an oversight when the package was created
- The `build` script works correctly because it compiles TypeScript without executing the CLI

---
*Generated by Claude Debug Assistant*
*Tools Used: Read (package.json, turbo.json, index.ts), Glob (turbo.json)*
