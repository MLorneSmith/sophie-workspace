---
allowed-tools: Bash, Read, Write, LS
---

# Feature Analyze

Analyze feature tasks to identify parallel work streams for maximum efficiency.

## Usage
```
/feature:analyze <feature_name> [task_number]
```

## Quick Check

1. **Verify implementation exists:**
   ```bash
   test -f .claude/implementations/$ARGUMENTS/plan.md || echo "❌ Implementation not found. Run: /feature:plan $ARGUMENTS"
   ```

2. **Check for existing analysis:**
   - If task_number provided: Check `.claude/implementations/$ARGUMENTS/${task_number}-analysis.md`
   - If exists: "⚠️ Analysis already exists. Overwrite? (yes/no)"

## Instructions

### 1. Read Implementation Context

Read implementation plan from `.claude/implementations/$ARGUMENTS/plan.md` to understand:
- Feature scope
- Technical requirements
- Task breakdown

If task_number provided, read specific task from `.claude/implementations/$ARGUMENTS/${task_number}.md`

### 2. Identify Parallel Work Streams

Analyze tasks to identify independent work that can run in parallel:

**Common Patterns:**
- **Database Layer**: Schema, migrations, models, RLS policies
- **Service Layer**: Business logic, data access, server actions
- **API Layer**: Endpoints, validation, middleware, authentication
- **UI Layer**: Components, pages, styles, client logic
- **Test Layer**: Unit tests, integration tests, E2E tests
- **Documentation**: API docs, README updates, user guides
- **Infrastructure**: CI/CD, Docker, deployment configs
- **Type System**: Type definitions, interfaces, generics

**Key Questions:**
- What files will be created/modified?
- Which changes can happen independently?
- What are the dependencies between changes?
- Where might conflicts occur?

### 3. Create Analysis File

For specific task analysis:

Get current datetime: `date -u +"%Y-%m-%dT%H:%M:%SZ"`

Create `.claude/implementations/$ARGUMENTS/${task_number}-analysis.md`:

```markdown
---
task: ${task_number}
title: ${task_title}
analyzed: ${current_datetime}
estimated_hours: ${total_hours}
parallelization_factor: ${1.0-5.0}
---

# Parallel Work Analysis: Task #${task_number}

## Overview
${Brief description of what needs to be done}

## Parallel Streams

### Stream A: ${Stream Name}
**Scope**: ${What this stream handles}
**Files**:
- ${file_pattern_1}
- ${file_pattern_2}
**Agent Type**: ${agent_from_mapping}
**Can Start**: immediately
**Estimated Hours**: ${hours}
**Dependencies**: none

### Stream B: ${Stream Name}
**Scope**: ${What this stream handles}
**Files**:
- ${file_pattern_1}
- ${file_pattern_2}
**Agent Type**: ${agent_from_mapping}
**Can Start**: immediately
**Estimated Hours**: ${hours}
**Dependencies**: none

### Stream C: ${Stream Name}
**Scope**: ${What this stream handles}
**Files**:
- ${file_pattern_1}
**Agent Type**: ${agent_from_mapping}
**Can Start**: after Stream A completes
**Estimated Hours**: ${hours}
**Dependencies**: Stream A

## Coordination Points

### Shared Files
${List any files multiple streams need to modify}:
- `src/types/index.ts` - Streams A & B (coordinate type updates)
- `package.json` - Stream B (add dependencies)

### Sequential Requirements
${List what must happen in order}:
1. Database schema before API endpoints
2. API types before UI components
3. Core logic before tests

## Conflict Risk Assessment
- **Low Risk**: Streams work on different directories
- **Medium Risk**: Some shared type files, manageable with coordination
- **High Risk**: Multiple streams modifying same core files

## Parallelization Strategy

**Recommended Approach**: ${sequential|parallel|hybrid}

${If parallel}: Launch Streams A, B simultaneously. Start C when A completes.
${If sequential}: Complete Stream A, then B, then C.
${If hybrid}: Start A & B together, C depends on A, D depends on B & C.

## Expected Timeline

With parallel execution:
- Wall time: ${max_stream_hours} hours
- Total work: ${sum_all_hours} hours
- Efficiency gain: ${percentage}%

Without parallel execution:
- Wall time: ${sum_all_hours} hours

## Notes
${Any special considerations, warnings, or recommendations}
```

### 4. Agent Mapping Reference

Use the agent-to-work-stream mapping from `.claude/rules/agent-coordination.md`:

- **Database Layer**: database-postgres-expert, database-mongodb-expert, database-expert
- **API/Backend Layer**: nodejs-expert, nestjs-expert  
- **Frontend Layer**: react-expert, react-performance-expert, nextjs-expert
- **Styling Layer**: frontend-css-styling-expert
- **Testing Layer**: jest-testing-expert, vitest-testing-expert, testing-expert
- **E2E Testing**: e2e-playwright-expert
- **Infrastructure**: infrastructure-docker-expert, infrastructure-github-actions-expert, devops-expert
- **Documentation**: documentation-expert
- **Type System**: typescript-expert, typescript-type-expert
- **Build/Config**: build-tools-webpack-expert, build-tools-vite-expert

### 5. Validate Analysis

Ensure:
- All major work is covered by streams
- File patterns don't unnecessarily overlap
- Dependencies are logical
- Agent types match the work type
- Time estimates are reasonable
- Parallelization factor is realistic (not overly optimistic)

### 6. Output

For single task analysis:
```
✅ Analysis complete for Task #${task_number}

Identified ${count} parallel work streams:
  Stream A: ${name} (${hours}h) - ${agent}
  Stream B: ${name} (${hours}h) - ${agent}
  Stream C: ${name} (${hours}h) - ${agent}
  
Parallelization potential: ${factor}x speedup
  Sequential time: ${total}h
  Parallel time: ${reduced}h

Files at risk of conflict:
  ${list shared files if any}

Next: Start work with /feature:start ${feature_name}
```

For full feature analysis:
```
✅ Analyzed ${task_count} tasks in feature ${feature_name}

Total parallelization opportunities:
  - ${count} tasks can run fully in parallel
  - ${count} tasks have partial parallelization
  - ${count} tasks must be sequential

Estimated time savings:
  Sequential: ${total_hours}h
  Parallel: ${reduced_hours}h
  Speedup: ${factor}x

High-risk coordination points:
  ${list major shared resources}

Ready to execute: /feature:start ${feature_name}
```

## Examples

### Example 1: Authentication Feature Task

```markdown
# Parallel Work Analysis: Task #001

## Overview
Implement user authentication with email/password and OAuth providers.

## Parallel Streams

### Stream A: Database Schema
**Scope**: User tables, auth tokens, sessions
**Files**:
- supabase/migrations/*.sql
- src/db/schema/*.ts
**Agent Type**: database-postgres-expert
**Can Start**: immediately
**Estimated Hours**: 2
**Dependencies**: none

### Stream B: Auth Service
**Scope**: Authentication logic, JWT handling
**Files**:
- src/services/auth/*.ts
- src/lib/auth/*.ts
**Agent Type**: nodejs-expert  
**Can Start**: immediately
**Estimated Hours**: 3
**Dependencies**: none

### Stream C: UI Components
**Scope**: Login/signup forms, auth guards
**Files**:
- src/components/auth/*.tsx
- src/app/(auth)/*.tsx
**Agent Type**: react-expert
**Can Start**: after Stream A
**Estimated Hours**: 4
**Dependencies**: Stream A (needs schema)

### Stream D: Tests
**Scope**: Unit and integration tests
**Files**:
- tests/auth/*.test.ts
- e2e/auth/*.spec.ts
**Agent Type**: jest-testing-expert
**Can Start**: after Streams B & C
**Estimated Hours**: 2
**Dependencies**: Streams B, C
```

## Important Notes

- Analysis is stored locally in the implementations directory
- Focus on practical parallelization, not theoretical maximum
- Consider agent expertise when assigning streams
- Account for coordination overhead in estimates
- Prefer clear separation over maximum parallelization
- Use realistic time estimates based on complexity