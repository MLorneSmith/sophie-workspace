---
description: Create git commits with security checks, multi-commit detection, and project-aware conventions
category: workflow
allowed-tools: Bash(git:*), Bash(echo:*), Bash(head:*), Bash(wc:*), Bash(test:*), Bash([:[*), Bash(grep:*), Read, Edit, Task
---

Create git commits with intelligent change grouping and security validation

## Key Features
- **Security validation** - Checks for passwords, API keys, debug code
- **Multi-commit detection** - Suggests splitting unrelated changes
- **Convention-aware** - Adapts to project's commit style
- **Documentation reminders** - Suggests README/CHANGELOG updates
- **Efficiency optimized** - Reuses recent git status when available

## Steps:
1. Check if the previous message contains git:status results:
   - Look for patterns like "Git Status Analysis", "Modified Files:", "Uncommitted Changes:"
   - If found and recent (within last 2-3 messages): Reuse those results
   - If not found or stale: Run a single combined git command:
   !git --no-pager status --porcelain=v1 && echo "---STAT---" && git --no-pager diff --stat 2>/dev/null && echo "---DIFF---" && git --no-pager diff 2>/dev/null | head -2000 && echo "---LOG---" && git --no-pager log --oneline -5
   - Note: Only skip git status if you're confident the working directory hasn't changed
   - Note: Full diff is capped at 2000 lines to prevent context flooding. The stat summary above shows all changed files
2. Review the diff output to verify:
   - No sensitive information (passwords, API keys, tokens) in the changes
   - No debugging code or console.log statements left in production code
   - No temporary debugging scripts (test-*.js, debug-*.py, etc.) created by Claude Code
   - No temporary files or outputs in inappropriate locations (move to project's temp directory or delete)
   - All TODO/FIXME comments are addressed or intentionally left
3. Detect if multiple distinct logical changes are present:
   - Different feature areas or modules being modified
   - Unrelated bug fixes mixed with features
   - Documentation changes mixed with code changes
   - Test additions mixed with implementation changes
   - Dependency updates mixed with application code
   If multiple logical changes detected:
   - List each distinct logical change clearly
   - Suggest breaking into smaller, focused commits
   - Ask user preference: "Multiple logical changes detected. Create separate commits? (recommended)"
   - If confirmed, create separate commits for each logical change
   - If declined, proceed with single commit
4. Use documented git commit conventions from CLAUDE.md/AGENTS.md
   - If conventions are not documented, analyze recent commits and document them
5. If the project uses ticket/task codes, ask the user for the relevant code if not clear from context
6. Check if README.md or other documentation needs updating to reflect the changes (see "Documentation Updates" section below)
7. Run tests and lint commands to ensure code quality (unless just ran before this command)
8. Stage all relevant files (including any updated documentation)
9. Create commit(s) with appropriate message(s) matching the project's conventions
   - For single commit: proceed as normal
   - For multiple commits: stage and commit each logical change separately
10. Verify commit(s) succeeded - Report with ✅ success indicator
11. Check if any post-commit hooks need to be considered (e.g., pushing to remote, creating PR)

## Documentation Updates:
Consider updating relevant documentation when committing changes:
- README.md: New features, API changes, installation steps, usage examples
- CHANGELOG.md: Notable changes, bug fixes, new features
- API documentation: New endpoints, changed parameters, deprecated features
- User guides: New workflows, updated procedures
- Configuration docs: New settings, changed defaults

## Commit Convention Documentation:
Only when conventions are NOT already documented: Analyze the commit history and document the observed conventions in CLAUDE.md under a "Git Commit Conventions" section. Once documented, use them without verbose explanation.

The documentation should capture whatever style the project uses, for example:
- Simple descriptive messages: "Fix navigation bug"
- Conventional commits: "feat(auth): add OAuth support"
- Prefixed style: "[BUGFIX] Resolve memory leak in parser"
- Task/ticket codes: "PROJ-123: Add user authentication"
- JIRA integration: "ABC-456 Fix memory leak in parser"
- GitHub issues: "#42 Update documentation"
- Imperative mood: "Add user authentication"
- Past tense: "Added user authentication"
- Or any other project-specific convention

Example CLAUDE.md section:
```markdown
## Git Commit Conventions
Based on analysis of this project's git history:
- Format: [observed format pattern]
- Tense: [imperative/past/present]
- Length: [typical subject line length]
- Ticket codes: [if used, note the pattern like "PROJ-123:" or "ABC-456 "]
- Other patterns: [any other observed conventions]

Note: If ticket/task codes are used, always ask the user for the specific code rather than inventing one.
```

## Multi-Commit Examples

Example of detecting multiple logical changes:

**Scenario**: Git diff shows:
- Modified authentication logic in `src/auth/login.ts`
- Fixed typo in `README.md`
- Added unit tests for user service in `tests/user.test.ts`
- Updated dependencies in `package.json`

**Detection**: These are 4 distinct logical changes:
1. Feature: Authentication logic update
2. Docs: README typo fix  
3. Test: User service tests
4. Chore: Dependency updates

**Suggested commits**:
```
feat(auth): update login validation logic
docs: fix typo in README installation section
test: add unit tests for user service
chore(deps): update package dependencies
```

The tool will present these as separate commits and ask for user confirmation.