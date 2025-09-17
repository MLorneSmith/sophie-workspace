---
description: Execute comprehensive code quality validation with auto-fix and parallel analysis
category: development
allowed-tools: Bash(pnpm:*), Bash(npx:*), Bash(node:*), Read, Glob, Task
argument-hint: [--fix|--quick|--verbose]
mcp-tools: mcp__code-reasoning__code-reasoning
---

# CodeCheck Command

Execute comprehensive code quality validation across TypeScript, linting, formatting, and testing with intelligent auto-fix capabilities.

## 1. PURPOSE

Define the strategic objective and measurable success criteria.

### Primary Objective
Validate code quality across all dimensions ensuring production-ready standards with zero tolerance for critical errors.

### Success Criteria
- ✅ All TypeScript types resolve correctly (zero type errors)
- ✅ Linting rules pass or auto-fixed (100% compliance)
- ✅ Code formatting consistent (100% formatted)
- ✅ No security vulnerabilities detected
- ✅ Execution completes in <30 seconds

### Scope Boundaries
- **Included**: Type checking, linting, formatting, security scanning, auto-fixing
- **Excluded**: Test execution (use /test separately), build verification
- **Constraints**: Non-destructive fixes only, preserve functionality

## 2. ROLE

You are a **Code Quality Assurance Expert** with deep expertise in:
- TypeScript type system and compiler optimization
- ESLint/Biome configuration and rule enforcement
- Code formatting standards and consistency
- Security vulnerability detection

### Authority Level
- **Full control** over quality checks and auto-fixes
- **Decision authority** for fix strategies
- **Veto power** on risky changes
- **Enforcement role** for standards compliance

### Expertise Domains
- Static code analysis
- Type system validation
- Code style enforcement
- Performance optimization patterns
- Security best practices

## 3. INSTRUCTIONS

Execute these action-oriented steps for comprehensive code quality validation.

### Phase 1: Pre-Check Validation

1. **Verify** environment and tools availability:
   ```bash
   # Check all required tools
   which pnpm && pnpm --version
   test -f .claude/scripts/codecheck-direct.sh && echo "Script ready"
   git rev-parse --show-toplevel || exit 1
   ```

2. **Detect** project configuration:
   ```bash
   # Check for config files
   test -f tsconfig.json && echo "TypeScript: ✓"
   test -f biome.json && echo "Biome: ✓"
   ```

3. **Clear** previous check artifacts:
   ```bash
   # Clean status files for fresh run
   rm -f /tmp/.claude_codecheck_status_*
   ```

### Phase 2: Execute Quality Checks

4. **Run** the comprehensive check script:
   ```bash
   # Execute with real-time output
   bash .claude/scripts/codecheck-direct.sh
   ```

5. **Monitor** execution progress:
   - TypeScript compilation status
   - Linting rule violations
   - Formatting inconsistencies
   - Auto-fix attempts

6. **Capture** results and log paths:
   ```bash
   # Extract log directory from output
   LOG_DIR=$(grep "Logs saved to:" | cut -d: -f2 | xargs)
   ```

### Phase 3: Analysis & Remediation

7. **Analyze** failures if any:
   ```bash
   if [ -d "$LOG_DIR" ]; then
     # TypeScript errors
     [ -f "$LOG_DIR/typecheck_output.log" ] && \
       grep -E "error TS[0-9]+" "$LOG_DIR/typecheck_output.log" | head -20

     # Lint violations
     [ -f "$LOG_DIR/lint_output.log" ] && \
       grep -E "(error|warning)" "$LOG_DIR/lint_output.log" | head -20

     # Format issues
     [ -f "$LOG_DIR/format_output.log" ] && \
       head -20 "$LOG_DIR/format_output.log"
   fi
   ```

8. **Apply** targeted fixes for common issues:
   ```bash
   # Auto-fix what's safe
   pnpm lint:fix
   pnpm biome format --write .
   ```

9. **Verify** fix effectiveness:
   ```bash
   # Quick re-check after fixes
   pnpm typecheck:raw --force
   ```

10. **Report** comprehensive results with actionable next steps

## 4. MATERIALS

Context, constraints, and patterns for code quality validation.

### Dynamic Context Loading

```bash
# Load project-specific quality configuration
QUALITY_CONFIG=".claude/context/code-quality-standards.md"
if [ -f "$QUALITY_CONFIG" ]; then
    source "$QUALITY_CONFIG"
fi

# Check for custom rules
CUSTOM_RULES=".claude/rules/quality-overrides.json"
if [ -f "$CUSTOM_RULES" ]; then
    export CUSTOM_QUALITY_RULES="$CUSTOM_RULES"
fi
```

### Check Categories & Severity

| Category | Tool | Auto-Fix | Severity | Action |
|----------|------|----------|----------|--------|
| **Type Safety** | TypeScript | No | Critical | Must fix manually |
| **Code Quality** | ESLint/Biome | Yes | High | Auto-fix safe issues |
| **Formatting** | Biome/Prettier | Yes | Medium | Auto-format all |
| **Security** | ESLint plugins | Partial | Critical | Review each issue |
| **Performance** | Custom rules | No | Low | Optimize if needed |

### Common Issues & Quick Fixes

```typescript
// Type errors
"TS2322": "Type mismatch - Add explicit type annotation",
"TS2339": "Property missing - Check interface definition",
"TS2345": "Argument type - Validate function signature",

// Lint issues
"no-unused-vars": "Remove or prefix with underscore",
"no-explicit-any": "Replace with specific type or unknown",
"react-hooks/exhaustive-deps": "Add to dependency array",

// Format issues
"line-length": "Break into multiple lines",
"trailing-spaces": "Auto-fixed by formatter",
"inconsistent-indentation": "Run format command"
```

### Error Recovery Patterns

1. **TypeScript build failure**:
   ```bash
   # Clear cache and rebuild
   rm -rf node_modules/.cache
   pnpm typecheck:raw --force
   ```

2. **Lint configuration conflict**:
   ```bash
   # Validate config
   npx eslint --print-config .
   ```

3. **Format tool disagreement**:
   ```bash
   # Biome takes precedence
   pnpm biome format --write .
   ```

## 5. EXPECTATIONS

Define success criteria, output format, and validation methods.

### Output Format

```text
🔍 Code Quality Check
=====================
Started: 2025-01-15 10:30:00
Project: /home/user/project

📊 Check Results:
-----------------
✅ TypeScript   : PASSED (0 errors)
⚠️  Linting      : FIXED (3 auto-fixed, 2 warnings remain)
✅ Formatting   : PASSED (5 files reformatted)
✅ Security     : PASSED (0 vulnerabilities)

📁 Logs: /tmp/codecheck_20250115_103000/

⏱️  Total Time: 12.3 seconds

💡 Next Steps:
- Review 2 remaining lint warnings
- All critical issues resolved
- Code ready for commit
```

### Validation Criteria

| Check | Success Indicator | Failure Action |
|-------|-------------------|----------------|
| Script exists | `.claude/scripts/codecheck-direct.sh` found | Create or restore script |
| TypeScript config | `tsconfig.json` exists | Use default config |
| Lint config | ESLint/Biome configured | Skip lint checks |
| All checks pass | Exit code 0 | Review specific failures |
| Logs created | Log directory exists | Check permissions |

### Performance Benchmarks

- Script startup: <1 second
- TypeScript check: <15 seconds
- Lint check: <10 seconds
- Format check: <5 seconds
- Total execution: <30 seconds

### Error Handling Matrix

```typescript
const errorHandlers = {
  "script not found": "Restore from .claude/scripts/",
  "pnpm not found": "Install pnpm: npm install -g pnpm",
  "typecheck failed": "Review type errors and fix manually",
  "lint errors": "Run pnpm lint:fix for auto-fixable issues",
  "format issues": "Run pnpm format:write to auto-format",
  "permission denied": "Check file permissions",
  "out of memory": "Increase Node heap: NODE_OPTIONS='--max-old-space-size=4096'"
}
```

### Integration Points

- **Delegate to**: `typescript-expert` for complex type issues
- **MCP Tools**: `mcp__code-reasoning__code-reasoning` for fix strategies
- **Related Commands**: `/lint`, `/typecheck`, `/format`, `/test`
- **CI/CD Integration**: Same checks run in GitHub Actions

## Usage Examples

```bash
# Standard check with auto-fix
/codecheck

# Quick check (skip slow operations)
/codecheck --quick

# Verbose output for debugging
/codecheck --verbose

# No auto-fix (check only)
/codecheck --no-fix
```

## Success Indicators

✅ All TypeScript types valid
✅ Linting rules satisfied
✅ Code properly formatted
✅ No security issues found
✅ Performance within limits
✅ Ready for commit/PR