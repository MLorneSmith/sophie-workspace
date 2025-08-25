---
name: codecheck
description: Comprehensive code quality check using specialized agents
usage: /codecheck [options]
options:
  - fix: Apply automatic fixes (default true)
  - quick: Skip time-consuming checks
  - verbose: Show detailed output
---

# Code Check Command

Performs comprehensive code quality checks using specialized agents for TypeScript, linting, and formatting.

## Command Structure

```yaml
command: /codecheck
options:
  fix: true      # Apply automatic fixes
  quick: false   # Skip comprehensive checks
  verbose: false # Show detailed output
```

## Execution Flow

### 1. Initialize Check
```yaml
initialization:
  task: "Setup code check environment"
  actions:
    - "Verify working directory"
    - "Check for uncommitted changes"
    - "Initialize status tracking"
  status_file: "/tmp/.claude_codecheck_status_${GIT_ROOT//\//_}"
```

### 2. Launch Orchestrator Agent
```yaml
orchestrator:
  agent: "codecheck-orchestrator"
  role: "Coordinate all code quality checks"
  phases:
    - name: "TypeScript Check"
      agent: "typecheck-agent"
      blocking: true
    - name: "Parallel Checks"
      agents:
        - "lint-agent"
        - "format-agent"
      parallel: true
```

### 3. TypeScript Phase
```yaml
typecheck_phase:
  agent: "typecheck-agent"
  commands:
    - "pnpm typecheck:raw --force"
  fixes:
    - "Add missing type imports"
    - "Fix nullable property access"
    - "Add return type annotations"
  status_update: true
  cache_bypass: true
```

### 4. Linting Phase
```yaml
lint_phase:
  agent: "lint-agent"
  commands:
    - "pnpm lint"
    - "pnpm lint:yaml"
    - "pnpm lint:md"
  fixes:
    - "Remove unused imports"
    - "Fix accessibility issues"
    - "Correct YAML indentation"
    - "Fix Markdown formatting"
  auto_fix_command: "pnpm lint:fix"
  cache_bypass: true
```

### 5. Formatting Phase
```yaml
format_phase:
  agent: "format-agent"
  commands:
    - "pnpm format"
  auto_fix_command: "pnpm format:fix"
  validates:
    - "Indentation consistency"
    - "Line length compliance"
    - "Quote style uniformity"
  cache_bypass: true
```

### 6. Status Reporting
```yaml
status_reporting:
  update_file: "/tmp/.claude_codecheck_status_"
  format: "status|timestamp|errors|warnings|type_errors"
  statusline_integration: true
  display_format:
    success: "🟢 codecheck"
    running: "⟳ codecheck"
    failed: "🔴 codecheck:errors"
```

## Agent Task Definitions

### TypeCheck Agent Task
```yaml
task:
  subagent_type: "typecheck-agent"
  description: "TypeScript type checking and fixes"
  prompt: |
    Perform comprehensive TypeScript type checking with cache bypass:
    1. Run pnpm typecheck:raw --force to bypass Turbo cache
    2. Analyze and categorize type errors
    3. Apply automatic fixes where safe
    4. Update codecheck status file with results
    5. Return structured results in YAML format
    Note: Use typecheck:raw --force to bypass Turbo cache for accurate results
```

### Lint Agent Task
```yaml
task:
  subagent_type: "lint-agent"
  description: "Comprehensive linting with Biome"
  prompt: |
    Perform comprehensive linting with cache bypass:
    1. Run pnpm lint for JavaScript/TypeScript
    2. Run pnpm lint:yaml for YAML files
    3. Run pnpm lint:md for Markdown files
    4. Apply automatic fixes with pnpm lint:fix
    5. Update codecheck status file
    6. Return structured results
    Note: Use typecheck:raw --force to bypass Turbo cache for accurate results
```

### Format Agent Task
```yaml
task:
  subagent_type: "format-agent"
  description: "Code formatting with Biome"
  prompt: |
    Check and fix code formatting with cache bypass:
    1. Run pnpm format to check current state
    2. Apply pnpm format:fix if needed
    3. Verify all files are properly formatted
    4. Update codecheck status file
    5. Return structured results
    Note: Use typecheck:raw --force to bypass Turbo cache for accurate results
```

## Output Format

### Success Output
```yaml
codecheck_results:
  status: "success"
  timestamp: "2024-01-15T10:30:00Z"
  duration: "45s"
  
  summary:
    total_files_checked: 150
    total_issues_found: 25
    total_issues_fixed: 24
    remaining_issues: 1
  
  details:
    typecheck:
      status: "success"
      errors_found: 5
      errors_fixed: 5
      execution_time: "12s"
    
    lint:
      status: "success"
      errors_found: 12
      errors_fixed: 11
      warnings_found: 8
      warnings_fixed: 7
      execution_time: "18s"
    
    format:
      status: "success"
      files_formatted: 8
      execution_time: "8s"
  
  files_modified:
    - path: "/home/msmith/projects/2025slideheroes/src/components/Button.tsx"
      changes: ["Added type imports", "Fixed formatting"]
    - path: "/home/msmith/projects/2025slideheroes/src/utils/helpers.ts"
      changes: ["Removed unused imports"]
  
  next_steps:
    - "All checks passed - ready to commit"
    - "Run tests to verify functionality"
```

### Failure Output
```yaml
codecheck_results:
  status: "failed"
  timestamp: "2024-01-15T10:30:00Z"
  
  summary:
    total_issues_found: 25
    total_issues_fixed: 20
    remaining_issues: 5
    blocking_errors: 2
  
  remaining_errors:
    - type: "typecheck"
      file: "/home/msmith/projects/2025slideheroes/src/api/client.ts"
      line: 45
      error: "Type 'undefined' is not assignable to type 'string'"
      severity: "error"
    
    - type: "lint"
      file: "/home/msmith/projects/2025slideheroes/src/utils/complex.ts"
      error: "Complexity too high - requires refactoring"
      severity: "warning"
  
  commands_to_run:
    - "Review and fix remaining TypeScript errors"
    - "Run 'pnpm typecheck' to verify fixes"
    - "Run '/codecheck' again after fixes"
```

## Error Handling

### Status File Updates
```bash
# Ensure status file is always updated
trap 'echo "failed|$(date +%s)|1|0|0" > "$CODECHECK_STATUS_FILE"' ERR

# Update on each phase
echo "running|$(date +%s)|0|0|0" > "$CODECHECK_STATUS_FILE"
```

### Recovery from Failures
```yaml
error_recovery:
  on_typecheck_failure:
    action: "Stop and report"
    reason: "TypeScript errors block compilation"
  
  on_lint_failure:
    action: "Continue with warnings"
    reason: "Lint issues don't block functionality"
  
  on_format_failure:
    action: "Apply fixes and continue"
    reason: "Format issues are auto-fixable"
```

## Integration Points

### CI/CD Integration
```yaml
ci_integration:
  pre_commit: true
  pre_push: false
  github_actions: true
  status_check: "required"
```

### Statusline Integration
```yaml
statusline:
  component: "codecheck"
  status_file: "/tmp/.claude_codecheck_status_"
  update_frequency: "real-time"
  display_rules:
    - "Show error count when failed"
    - "Show time since last check"
    - "Use color coding for status"
```

## Notes

- Runs three specialized agents in optimal order
- Updates statusline in real-time during execution
- Preserves uncommitted changes
- **Uses typecheck:raw --force to bypass Turbo cache for typecheck accuracy**
- **Ensures consistency between local and CI environments**
- Integrates with existing build pipeline
- Prioritizes accuracy over speed for pre-deployment validation
- No longer tracks GitHub issue #101