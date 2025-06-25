# Code Check

Check and fix TypeScript, linting, and formatting errors across the project.

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

3. Run linting:
   ```bash
   pnpm lint
   ```

4. Run formatting check:
   ```bash
   pnpm format
   ```

5. If any errors are found:
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
   - Re-run all checks to ensure fixes are complete

6. Report summary of:
   - Number and types of errors found
   - Files modified
   - Any remaining issues that need manual attention

7. Update GitHub issue #101 with the results:
   ```bash
   # Post a comment to the tracking issue with the fix summary
   gh issue comment 101 --repo MLorneSmith/2025slideheroes --body "### Code Check Run - $(date +%Y-%m-%d)

**Errors Found:**
- TypeScript: [count]
- Linting: [count]
- Formatting: [count]

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
- Always verify fixes don't introduce new issues