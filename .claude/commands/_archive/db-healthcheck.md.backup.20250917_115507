---
description: Validate database connectivity, performance metrics, and schema integrity
category: database
allowed-tools: Bash(psql:*), Bash(npx:*), Bash, Read, Glob, Task

mcp-tools: mcp__postgres__pg_monitor_database, mcp__postgres__pg_debug_database
---

# Db-healthcheck Command

Validate database connectivity, performance metrics, and schema integrity

## 1. PURPOSE

Define the strategic objective and measurable success criteria.

### Primary Objective
Ensure database integrity, performance, and availability

### Success Criteria
- ✅ Operation completes successfully (100% success rate)
- ✅ All validations pass
- ✅ No data corruption or loss
- ✅ Performance within benchmarks
- ✅ Clear actionable output provided

### Scope Boundaries
- **Included**: Connection testing, query performance, index analysis
- **Excluded**: Schema migrations, data manipulation
- **Constraints**: Read-only operations, no schema changes

## 2. ROLE

You are a **Database Reliability Engineer** with deep expertise in:
- Database performance optimization
- Query analysis and tuning
- Schema design and validation
- Connection pool management

### Authority Level
- **Full visibility** into system state
- **Decision authority** for operation strategies
- **Advisory role** for improvements
- **Escalation power** for critical issues

### Expertise Domains
- Database systems
- Query optimization
- Performance tuning

## 3. INSTRUCTIONS

Execute these action-oriented steps for db healthcheck.

### Phase 1: Validation & Discovery

1. **Validate** environment and prerequisites:
   ```bash
   pg_isready || npx supabase status
   ```

2. **Load** dynamic context for current state:
   ```bash
   # Load relevant context
test -f .claude/context/db-healthcheck.md && cat .claude/context/db-healthcheck.md
   ```

3. **Discover** available resources and options:
   ```bash
   ls -la
   ```

4. **Analyze** discovered data for patterns and issues

5. **Prepare** execution plan based on analysis

### Phase 2: Execution

6. **Execute** primary operation with validation:
   ```bash
   npx supabase db diff
   ```

7. **Monitor** execution progress and capture results

8. **Handle** any errors or edge cases

### Phase 3: Verification & Cleanup

9. **Verify** operation success with checks:
   ```bash
   pg_isready && echo "SELECT 1" | psql
   ```

10. **Report** results with actionable next steps

## 4. MATERIALS

Context, constraints, and patterns for db healthcheck.

### Dynamic Context Loading

```bash
# Load project-specific configuration
CONTEXT_FILE=".claude/context/db-healthcheck-config.md"
if [ -f "$CONTEXT_FILE" ]; then
    source "$CONTEXT_FILE"
fi
```

### Operation Patterns

| Pattern | Condition | Action |
|---------|-----------|--------|
| **Normal** | Standard case | Execute normally |
| **Edge Case** | Boundary condition | Apply special handling |
| **Error State** | Operation failed | Implement recovery |
| **Success** | Operation complete | Verify and report |

### Error Recovery Patterns

1. **Connection failed**: Check credentials → Verify network → Retry
2. **Query timeout**: Analyze query plan → Add indexes → Retry
3. **Lock timeout**: Wait and retry → Kill blocking query
4. **Schema mismatch**: Run migrations → Verify schema

## 5. EXPECTATIONS

Define success criteria, output format, and validation methods.

### Output Format

```text
✅ Operation Completed
======================
Status: Success
Duration: 2.3s
Results: [operation-specific output]
Next steps: [actionable items]
```

### Validation Criteria

| Check | Success Indicator | Failure Action |
|-------|-------------------|----------------|
| Prerequisites | All tools available | Install missing tools |
| Environment | Correct directory | Navigate to project root |
| Permissions | Read/write access | Fix permissions |
| State | Valid state | Reset or recover |
| Result | Expected output | Debug and retry |

### Performance Benchmarks

- Validation: <1 second
- Execution: <5 seconds
- Verification: <2 seconds
- Total operation: <10 seconds

### Error Handling Matrix

```typescript
const errorHandlers = {
  "connection refused": "Start database service",
  "authentication failed": "Check credentials",
  "timeout": "Check network and retry",
  "table not found": "Run migrations first"
}
```

### Integration Points

- **Delegate to**: `postgres-expert`, `database-expert`
- **MCP Tools**: `pg_monitor_database`, `pg_debug_database`
- **Related Commands**: `/db/migrate`, `/db/seed`, `/db/backup`

## Usage Examples

```bash
# Basic usage
/db-healthcheck

# With options
/db-healthcheck --verbose

# With arguments
/db-healthcheck <arg>
```

## Success Indicators

✅ Command executes without errors
✅ All validations pass
✅ Expected output generated
✅ Performance within limits
✅ No side effects observed
✅ Clear next steps provided