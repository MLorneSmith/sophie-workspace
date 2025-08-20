# Code Check

Check and fix TypeScript, linting, formatting, YAML, and Markdown errors across the project.

## Steps

1. Check previous fix history to understand recurring issues:
   ```bash
   # Read GitHub issue #101 to see patterns of recurring fixes
   gh issue view 101 --repo MLorneSmith/2025slideheroes
   
   # Get all comments to see history of fixes
   gh issue view 101 --comments --repo MLorneSmith/2025slideheroes
   ```

2. Run TypeScript type checking:
   ```bash
   pnpm typecheck
   ```

3. Check Payload app build (catches build-time TypeScript errors):
   ```bash
   echo "Checking Payload app build for TypeScript errors..."
   cd apps/payload && pnpm build --dry-run 2>&1 | grep -E "error|Error|Type error" || echo "✓ Payload build check passed"
   cd ../..
   ```
   Note: This performs a dry-run build to catch TypeScript errors that only appear during Next.js compilation

4. Run linting:
   ```bash
   pnpm lint
   ```

4. Run formatting check:
   ```bash
   pnpm format
   ```

5. Run YAML lint check:
   ```bash
   pnpm lint:yaml
   ```
   Note: Focus on project YAML files, ignore node_modules errors

6. Run Markdown lint check:
   ```bash
   pnpm lint:md
   ```
   Note: Check all Markdown files for formatting and style issues

7. If any errors are found:
   - Read the code standards from `.claude/context/standards/code-standards.md`
   - Fix TypeScript errors by updating type definitions and imports
   - Fix linting errors using:
     ```bash
     pnpm lint:fix
     ```
   - Fix formatting errors using:
     ```bash
     pnpm format:fix
     ```
   - Fix YAML errors by:
     - Removing duplicate keys
     - Fixing indentation issues
     - Ensuring proper YAML syntax
   - Fix Markdown errors using:
     ```bash
     pnpm lint:md:fix
     ```
     Or manually fix:
     - Line length issues (keep under 120 characters)
     - Missing language specifiers in code blocks
     - Heading levels and formatting
   - Re-run all checks to ensure fixes are complete

8. Report summary of:
   - Number and types of errors found
   - Files modified
   - Any remaining issues that need manual attention

9. Update GitHub issue #101 with the results:
   ```bash
   # Post a comment to the tracking issue with the fix summary
   gh issue comment 101 --repo MLorneSmith/2025slideheroes --body "### Code Check Run - $(date +%Y-%m-%d)

**Errors Found:**
- TypeScript: [count]
- Linting: [count]
- Formatting: [count]
- YAML: [count]
- Markdown: [count]

**Files Modified:**
[List files and fixes]

**Common Patterns:**
[List any patterns noticed]

**Command Output Summary:**
[Relevant output]"
   ```

## Notes

- The project uses Biome for linting and formatting
- TypeScript strict mode is enabled
- Code standards are defined in `.claude/context/standards/code-standards.md`
- YAML files are validated using yaml-lint
- Focus on project YAML files (e.g., .semgrep.yml, GitHub Actions workflows)
- Ignore YAML errors in node_modules as they are third-party files
- Markdown files are validated using markdownlint-cli2
- Common Markdown issues include line length (120 char limit) and missing code block languages
- Always verify fixes don't introduce new issues