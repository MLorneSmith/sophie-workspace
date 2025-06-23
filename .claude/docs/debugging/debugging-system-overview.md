# Debugging System Overview

The Claude Code debugging system consists of two complementary commands that separate issue documentation from resolution, creating a systematic approach to debugging.

## System Components

### 1. Log Issue Command (`/log-issue`)

**Purpose**: Document issues systematically with diagnostic data
**Output**: Standardized issue specifications
**Storage**: Local files + optional GitHub issues

### 2. Debug Issue Command (`/debug-issue`)

**Purpose**: Resolve documented issues through focused debugging
**Input**: Issue specifications from log-issue
**Output**: Implemented fixes and resolution documentation

## Workflow

```
🐛 Issue Discovered
      ↓
📝 /log-issue [format]
      ↓
📄 Issue Specification Created
   ├── Diagnostic data collected
   ├── MCP tools executed
   ├── Environment captured
   └── Reproduction steps documented
      ↓
🔧 /debug-issue [issue-id]
      ↓
🔍 Focused Debugging Session
   ├── Read issue specification
   ├── Load relevant context
   ├── Reproduce issue
   ├── Implement fix
   └── Verify resolution
      ↓
✅ Issue Resolved & Documented
```

## Key Benefits

### Separation of Concerns

- **Documentation**: Capture all relevant data without fix pressure
- **Resolution**: Focus on solving with complete context
- **Collaboration**: Share specifications with team members

### Data-Driven Debugging

- MCP tools provide objective diagnostic data
- Systematic collection prevents missed information
- Historical data enables pattern recognition

### Knowledge Base Building

- Issues become searchable documentation
- Common patterns emerge over time
- Solutions can be referenced for similar issues

### Quality Assurance

- Standardized format ensures completeness
- Verification step confirms resolution
- Tests prevent regression

## Command Usage Examples

### Logging a Performance Issue

```bash
/log-issue github

# User provides:
# - Title: "Canvas editor slow with large presentations"
# - Type: performance
# - Severity: high
# - Steps to reproduce: Open presentation with 50+ slides

# System automatically:
# - Runs performance audit
# - Captures browser metrics
# - Checks database queries
# - Creates GitHub issue
```

### Debugging the Issue

```bash
/debug-issue ISSUE-1641234567-xyz

# System automatically:
# - Reads issue specification
# - Loads performance debugging context
# - Reproduces the issue
# - Analyzes diagnostic data
# - Implements optimizations
# - Verifies performance improvement
```

## File Organization

```
.claude/
├── commands/
│   ├── log-issue.md              # Documentation command
│   ├── debug-issue.md            # Resolution command
│   └── debugging-system-overview.md
├── issues/
│   ├── index.md                  # Issues registry
│   ├── issue-template.md         # Standard format
│   ├── patterns/                 # Common patterns
│   │   ├── slow-query-pattern.md
│   │   └── memory-leak-pattern.md
│   └── 2025-01-06-ISSUE-*.md     # Individual issues
└── docs/
    └── debugging/                # Context documentation
        ├── common-patterns.md
        ├── error-handling.md
        └── performance-debugging.md
```

## Integration Points

### GitHub Integration

- Issues can be created directly in GitHub
- Links maintained between local files and GitHub issues
- Comments and discussion happen in GitHub
- Resolution updates both local and GitHub

### MCP Tool Integration

- **browser-tools**: Console logs, network analysis, performance audits
- **postgres**: Database queries, performance monitoring, RLS policies
- **cloudflare-observability**: Worker logs and metrics
- **supabase**: Service logs and diagnostics

### Development Workflow

- Issues integrate with git branches and PRs
- Commit messages reference issue IDs
- Pull requests automatically close issues
- Tests prevent regression

## Advanced Features

### Pattern Recognition

The system builds a library of common issue patterns:

- Slow query patterns
- Memory leak patterns  
- CORS error patterns
- Type mismatch patterns

### Automated Analysis

Issue specifications include automated analysis:

- Error pattern matching
- Performance metric interpretation
- Suggested investigation areas
- Related component identification

### Team Collaboration

- Standardized format enables team handoffs
- Diagnostic data provides objective evidence
- Resolution documentation shares knowledge
- Pattern library prevents duplicate work

## Best Practices

### When to Log Issues

- Any unexpected behavior
- Performance degradation
- Error messages in production
- Regression after deployments
- User-reported problems

### Writing Good Issue Descriptions

- Clear, specific titles
- Complete reproduction steps
- Expected vs actual behavior
- Relevant context and environment
- Error messages and stack traces

### Debugging Systematically

- Always start with issue specification
- Follow diagnostic data, not assumptions
- Make incremental, tested changes
- Document findings for future reference
- Add tests to prevent regression

### Maintaining the System

- Review and update patterns regularly
- Archive resolved issues periodically
- Keep diagnostic tools updated
- Train team members on the workflow

## Common Scenarios

### Production Bug

1. `/log-issue github` - Document with all diagnostic data
2. Team triage in GitHub issue
3. `/debug-issue #123` - Systematic resolution
4. Deploy fix with monitoring

### Performance Investigation

1. `/log-issue file` - Collect performance metrics
2. Analyze patterns in data
3. `/debug-issue ISSUE-ID` - Implement optimizations
4. Verify improvement with same tools

### Regression Testing

1. `/log-issue file` - Document broken functionality
2. Compare with previous working state
3. `/debug-issue ISSUE-ID` - Identify and fix regression
4. Add tests to prevent future regressions

This system transforms ad-hoc debugging into a systematic, data-driven process that builds institutional knowledge and prevents issue recurrence.
