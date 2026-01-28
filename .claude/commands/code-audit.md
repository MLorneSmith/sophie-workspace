---
description: Comprehensive code quality audit leveraging specialized skills for React, SEO, UI/UX, and database patterns
allowed-tools: Task, Bash(git *), Glob, Grep, Read, Write, Skill
argument-hint: '[target] - e.g., "S1362", "S1362.I1", "S1362.I1.F1", "apps/web/app/home", "recent changes"'
---

# Code Audit

## Purpose

Evaluate code quality, identify weaknesses, and provide actionable recommendations. This audit leverages specialized skills for React/Next.js best practices, web design guidelines, SEO compliance, and Supabase/Postgres patterns.

**Supports Alpha Spec auditing**: Provide a spec ID (S#), initiative ID (S#.I#), or feature ID (S#.I#.F#) to audit the implementation against spec requirements.

## Current Repository State

!`git status --short && echo "---" && git log --oneline -5`

## Pre-Audit Analysis

Before launching audit agents, analyze the scope:

### Input Type Detection

Detect the type of input from **$ARGUMENTS**:

```typescript
const input = '$ARGUMENTS';
let auditMode: 'alpha-spec' | 'alpha-initiative' | 'alpha-feature' | 'directory' | 'changes';
let specNum, initPriority, featPriority;

if (input.match(/^S\d+\.I\d+\.F\d+$/)) {
  // Alpha Feature: S1362.I1.F1
  auditMode = 'alpha-feature';
  const match = input.match(/S(\d+)\.I(\d+)\.F(\d+)/);
  specNum = match[1]; initPriority = match[2]; featPriority = match[3];
} else if (input.match(/^S\d+\.I\d+$/)) {
  // Alpha Initiative: S1362.I1
  auditMode = 'alpha-initiative';
  const match = input.match(/S(\d+)\.I(\d+)/);
  specNum = match[1]; initPriority = match[2];
} else if (input.match(/^S\d+$/)) {
  // Alpha Spec: S1362
  auditMode = 'alpha-spec';
  specNum = input.slice(1);
} else if (input.includes('change') || input.includes('recent')) {
  auditMode = 'changes';
} else {
  auditMode = 'directory';
}
```

---

## Alpha Spec Audit Mode

When auditing an Alpha spec implementation (S#, S#.I#, or S#.I#.F#):

### Step 1: Resolve Alpha Paths

Use Glob to find the spec directory:
```
Glob tool:
  pattern: .ai/alpha/specs/S[specNum]-Spec-*
```

Extract path constants:
```markdown
| Variable | Example | Description |
|----------|---------|-------------|
| SPEC_DIR | `.ai/alpha/specs/S1362-Spec-user-dashboard` | Spec root directory |
| SPEC_ID | `S1362` | Semantic spec ID |
```

### Step 2: Read Spec Documents

Read the spec and related documents to understand requirements:

**For Spec-level audit (S#)**:
```
Read: ${SPEC_DIR}/spec.md
Read: ${SPEC_DIR}/README.md (initiatives overview)
```

**For Initiative-level audit (S#.I#)**:
```
Glob: ${SPEC_DIR}/S${specNum}.I${initPriority}-Initiative-*
Read: ${INIT_DIR}/initiative.md
Read: ${INIT_DIR}/README.md (features overview)
```

**For Feature-level audit (S#.I#.F#)**:
```
Glob: ${INIT_DIR}/S${specNum}.I${initPriority}.F${featPriority}-Feature-*
Read: ${FEAT_DIR}/feature.md
Read: ${FEAT_DIR}/tasks.json
```

### Step 3: Extract Implementation Files

From `tasks.json` files, extract the files that were created/modified:

```bash
# Find all tasks.json files in scope
find ${SPEC_DIR} -name "tasks.json" -type f

# For each tasks.json, extract output paths
cat ${FEAT_DIR}/tasks.json | jq -r '.tasks[].outputs[]?.path' | sort -u
```

Build a list of all implementation files to audit:
- New files created (`"type": "new"`)
- Modified files (`"type": "modified"`)

### Step 4: Read Spec Requirements

Extract key requirements for the audit:

**From spec.md**:
- Section 4: Success Metrics (quantifiable goals)
- Section 5: Key Capabilities (must-have features)
- Section 6: User Personas (who the feature serves)
- Section 8: Risks (areas needing extra scrutiny)

**From feature.md**:
- Acceptance Criteria (Must Have + Nice to Have)
- User Story (expected behavior)
- Vertical Slice Components (layer coverage)

**From tasks.json**:
- `acceptance_criterion` per task
- `verification_command` per task

### Step 5: Launch Audit Agents with Spec Context

When launching audit agents, include spec context:

```
Additional context for all agents:
- SPEC_ID: S${specNum}
- SPEC_REQUIREMENTS: [extracted from spec.md Section 5]
- ACCEPTANCE_CRITERIA: [extracted from feature.md]
- IMPLEMENTATION_FILES: [extracted from tasks.json]

Audit these specific files against both:
1. Standard code quality criteria (skills-based)
2. Spec compliance (acceptance criteria met?)
```

---

## Standard Audit Mode

### Target Identification

Based on **$ARGUMENTS**, determine:
- **Scope**: Specific files/directories, recent changes, or full application
- **File Types**: Components (TSX), server actions, database schemas, API routes, styles
- **Audit Focus**: Which audit aspects are relevant to the target

### Scope Determination

If reviewing "changes" or "recent":
```bash
git diff --name-only HEAD~10
```

If reviewing a directory:
```bash
find [target] -type f \( -name "*.ts" -name "*.tsx" -name "*.sql" -name "*.css" \) | head -50
```

## Audit Strategy

Based on **$ARGUMENTS** and file types present, launch relevant audit agents:

| File Type | Audit Agents to Launch |
|-----------|----------------------|
| React/TSX components | React Best Practices, UI/UX Guidelines, Architecture |
| Server actions/loaders | React Best Practices, Security, Architecture |
| SQL/Database schemas | Supabase Postgres, Security |
| Pages/Routes | SEO Audit, React Best Practices, Documentation |
| Styles/CSS | UI/UX Guidelines |
| API routes | Security, React Best Practices, Documentation |
| Test files | Testing Quality |
| Documentation/README | Documentation & API |
| Alpha Spec (S#) | All 9 + Spec Compliance (10 agents) |
| Alpha Initiative (S#.I#) | All 9 + Spec Compliance (10 agents) |
| Alpha Feature (S#.I#.F#) | All 9 + Spec Compliance (10 agents) |
| Mixed/Full | All 9 agents (10 if Alpha) |

## Audit Agents

Use the Task tool to invoke the appropriate agents concurrently:

### 1. React & Next.js Best Practices

```
Subagent: code-explorer
Description: React best practices audit
Prompt: Audit React/Next.js code quality in: $ARGUMENTS

INVOKE THE SKILL: Use the Skill tool to invoke "react-best-practices" before analysis.

After loading the skill, analyze for:

**CRITICAL - Eliminating Waterfalls:**
- Sequential awaits that could be parallel (Promise.all)
- Missing Suspense boundaries for data fetching
- Waterfalls in API routes

**CRITICAL - Bundle Size:**
- Barrel file imports (lucide-react, @mui, etc.)
- Missing dynamic imports for heavy components
- Non-critical third-party libs in initial bundle

**HIGH - Server-Side Performance:**
- Missing React.cache() for deduplication
- Excessive data serialization at RSC boundaries
- Sequential fetching in server components

**MEDIUM - Re-render Optimization:**
- Missing memoization (memo, useMemo, useCallback)
- Object dependencies in useEffect
- Stale closure risks in callbacks

**MEDIUM - Rendering Performance:**
- SVG animations without wrapper div
- Missing content-visibility for lists
- Static JSX not hoisted

Output format:
```
file:line - [PRIORITY] [RULE-ID] Issue description
Recommendation: Specific fix
```
```

### 2. UI/UX & Web Design Guidelines

```
Subagent: code-explorer
Description: UI/UX guidelines audit
Prompt: Audit UI/UX compliance in: $ARGUMENTS

INVOKE THE SKILL: Use the Skill tool to invoke "web-design-guidelines" to fetch latest guidelines.

After loading guidelines, check for:

**Accessibility:**
- Missing ARIA labels/roles
- Insufficient color contrast
- Missing focus indicators
- Keyboard navigation issues
- Missing alt text on images

**Responsive Design:**
- Hardcoded widths/heights
- Missing responsive breakpoints
- Mobile-first patterns
- Touch target sizes

**Component Quality:**
- Proper loading states
- Error boundary coverage
- Empty state handling
- Form validation UX
- Consistent spacing/typography

**Performance UX:**
- Loading skeleton usage
- Optimistic updates
- Progress indicators
- Animation performance

Output format:
```
file:line - [PRIORITY] Issue description
Recommendation: Specific fix
```
```

### 3. SEO Compliance

```
Subagent: code-explorer
Description: SEO audit
Prompt: Audit SEO compliance in: $ARGUMENTS

INVOKE THE SKILL: Use the Skill tool to invoke "seo-audit" for guidelines.

Focus on codebase SEO patterns:

**Crawlability & Indexation:**
- Dynamic routes with proper generateStaticParams
- Metadata exports on pages
- robots.txt and sitemap.xml generation
- Canonical URL handling

**On-Page Optimization:**
- Page metadata (title, description)
- Heading hierarchy (H1, H2, H3)
- Image alt attributes
- Semantic HTML usage

**Technical SEO:**
- Core Web Vitals optimization
- Image optimization (next/image)
- Font loading strategy
- Link prefetching

**Content Structure:**
- Open Graph / Twitter meta tags
- JSON-LD structured data
- Internal linking patterns

Output format:
```
file:line - [PRIORITY] SEO issue description
Impact: How this affects search ranking
Fix: Specific recommendation
```
```

### 4. Supabase & Postgres Best Practices

```
Subagent: code-explorer
Description: Database patterns audit
Prompt: Audit Supabase/Postgres patterns in: $ARGUMENTS

INVOKE THE SKILL: Use the Skill tool to invoke "supabase-postgres-best-practices" for guidelines.

After loading the skill, analyze:

**CRITICAL - Query Performance:**
- Missing indexes on filtered columns
- N+1 query patterns
- Inefficient JOIN operations
- Missing query result limits

**CRITICAL - Security & RLS:**
- Tables without RLS enabled
- Policies without proper permission checks
- Security definer functions without safeguards
- SQL injection vulnerabilities

**HIGH - Schema Design:**
- Missing foreign key constraints
- Improper data types
- Missing NOT NULL constraints
- Enum usage patterns

**MEDIUM - Connection Management:**
- Connection pooling configuration
- Transaction handling
- Connection leak risks

**LOW - Advanced Features:**
- Missing partial indexes
- Unused index opportunities
- View materialization candidates

Output format:
```
file:line - [PRIORITY] [CATEGORY] Issue description
Impact: Performance/security impact
Fix: SQL or code fix
```
```

### 5. Security Audit

```
Subagent: code-explorer
Description: Security patterns audit
Prompt: Perform security audit of: $ARGUMENTS

Focus on SlideHeroes security patterns:

**Input Validation:**
- Server actions without Zod schemas
- Missing enhanceAction wrapper
- Unvalidated route parameters
- File upload validation

**Authentication & Authorization:**
- Routes missing auth middleware
- Server actions without auth: true
- Direct database access bypassing RLS
- Team permission verification gaps

**Data Protection:**
- Sensitive data in client components
- API keys in source code
- Logging sensitive information
- CORS misconfiguration

**Injection Prevention:**
- Dynamic SQL construction
- Template literal SQL
- Unescaped user input in HTML
- eval() or Function() usage

**Multi-Tenant Security:**
- Account isolation gaps
- Cross-tenant data access
- Team membership verification
- Admin privilege escalation

Output format:
```
file:line - [SEVERITY] [CATEGORY] Vulnerability description
Risk: Potential exploit scenario
Remediation: Specific fix with code example
```
```

### 6. Code Quality & Maintainability

```
Subagent: code-explorer
Description: Code quality audit
Prompt: Audit code quality and maintainability in: $ARGUMENTS

Analyze for SlideHeroes patterns:

**TypeScript:**
- 'any' type usage
- Missing type annotations
- Implicit 'any' in callbacks
- Type assertion abuse (as any)

**Error Handling:**
- Missing try/catch in async functions
- Generic catch blocks
- Swallowed errors
- Missing error boundaries

**Code Organization:**
- Mixed client/server imports
- Missing 'use server' or 'use client' directives
- Circular dependencies
- Barrel file anti-patterns

**Logging & Observability:**
- Missing structured logging
- Console.log in production code
- Missing context in error logs
- Untracked async operations

**Patterns & Conventions:**
- Inconsistent naming conventions
- Missing data-testid attributes
- Hardcoded strings (i18n)
- Dead code / unused exports

Output format:
```
file:line - [PRIORITY] Issue description
Impact: Maintainability/reliability impact
Recommendation: Specific fix
```
```

### 7. Architecture & Design Review

```
Subagent: code-explorer
Description: Architecture review with end-to-end analysis
Prompt: Review architecture and design patterns in: $ARGUMENTS

Analyze the complete impact and architectural context:

**Module Organization:**
- Separation of concerns (UI/business logic/data)
- Feature module boundaries
- Package dependencies and coupling
- Monorepo package structure alignment

**Design Patterns:**
- Consistent pattern usage across codebase
- Server Component vs Client Component decisions
- Data fetching patterns (loaders vs inline)
- State management approach consistency

**Dependency Management:**
- Import direction (no circular dependencies)
- Abstraction layer usage (@kit packages)
- Third-party dependency isolation
- Feature flag architecture

**Scalability Concerns:**
- Component reusability
- Code duplication across features
- Shared utility extraction opportunities
- Multi-tenant architecture adherence

**SlideHeroes Specific:**
- Personal vs Team account route organization
- Feature package isolation
- Supabase client usage patterns
- Billing/subscription architecture

THINK THIS THROUGH END-TO-END:
- Trace architectural impacts: How do changes affect dependent systems?
- Map the complete data/control flow through the architecture
- Identify what breaks when components fail or change
- Consider the full deployment and integration pipeline

Output format:
```
file:line - [PRIORITY] [CATEGORY] Architectural issue
Impact: System-wide implications
Recommendation: Refactoring approach
```
```

### 8. Testing Quality Review

```
Subagent: code-explorer
Description: Testing quality review
Prompt: Review test quality and coverage for: $ARGUMENTS

Analyze testing patterns in the codebase:

**Test Coverage:**
- Missing tests for critical paths
- Untested server actions
- Untested edge cases
- Coverage gaps in security-critical code

**Test Quality:**
- Meaningful assertions (not just "renders without crashing")
- Testing actual behavior, not implementation details
- Proper test isolation (no shared state)
- Clear, descriptive test names

**Test Organization:**
- Co-located unit tests (*.test.ts)
- E2E tests in apps/e2e/tests/
- Test helper reusability
- Fixture and mock organization

**E2E Patterns:**
- Page Object Model usage
- Authentication state handling
- Data cleanup strategies
- Flaky test detection

**Mock vs Real:**
- Over-mocking (testing mocks, not code)
- Under-mocking (slow/flaky tests)
- Database test isolation
- External service mocking

**SlideHeroes Specific:**
- Multi-tenant test scenarios
- Team permission testing
- Billing flow coverage
- AI feature testing approach

Output format:
```
file:line - [PRIORITY] Testing issue description
Impact: Risk of undetected bugs
Recommendation: Test improvement or addition
```
```

### 9. Documentation & API Review

```
Subagent: code-explorer
Description: Documentation and API review
Prompt: Review documentation and API design for: $ARGUMENTS

Analyze documentation completeness and API quality:

**Code Documentation:**
- Complex function documentation
- Type/interface documentation
- Non-obvious logic explanations
- TODO/FIXME/HACK audit

**API Design:**
- Server action naming consistency
- Return type consistency
- Error response patterns
- Breaking change risks

**Developer Experience:**
- README completeness for packages
- Setup/configuration documentation
- Environment variable documentation
- Migration guides for changes

**Type Documentation:**
- JSDoc/TSDoc coverage on exports
- Generic type explanations
- Union type documentation
- Zod schema descriptions

**SlideHeroes Specific:**
- Feature package README files
- Schema file documentation
- RLS policy documentation
- Webhook endpoint documentation

**API Consistency:**
- Naming conventions across endpoints
- Response shape consistency
- Error handling patterns
- Pagination/filtering patterns

Output format:
```
file:line - [PRIORITY] Documentation/API issue
Impact: Developer experience or integration risk
Recommendation: Documentation addition or API improvement
```
```

### 10. Spec Compliance Review (Alpha Spec Mode Only)

**Only launch this agent when auditing an Alpha spec (S#, S#.I#, or S#.I#.F#).**

```
Subagent: code-explorer
Description: Alpha spec compliance audit
Prompt: Review implementation compliance against Alpha spec requirements.

CONTEXT PROVIDED:
- SPEC_ID: [from pre-audit analysis]
- SPEC_FILE: [path to spec.md]
- FEATURE_FILES: [paths to feature.md files]
- TASKS_FILES: [paths to tasks.json files]
- IMPLEMENTATION_FILES: [extracted from tasks.json outputs]

Read the spec documents and audit implementation against requirements:

**Acceptance Criteria Compliance:**
For each feature.md, verify:
- [ ] All "Must Have" acceptance criteria are implemented
- [ ] Implementation matches the User Story behavior
- [ ] Vertical slice components are all present (UI → Logic → Data)

**Task Completion Verification:**
For each task in tasks.json:
- [ ] Output files exist at specified paths
- [ ] `verification_command` passes (if specified)
- [ ] `acceptance_criterion` is met

**Spec Requirements Alignment:**
From spec.md:
- [ ] Key Capabilities (Section 5) are implemented
- [ ] Success Metrics (Section 4) are achievable with current implementation
- [ ] Technical constraints (Section 7) are respected
- [ ] Risks (Section 8) have been addressed or mitigated

**Implementation Gaps:**
- Missing files listed in tasks.json outputs
- Partial implementations (files exist but incomplete)
- Deviations from spec requirements
- Unimplemented acceptance criteria

**Quality vs Spec Trade-offs:**
- Features implemented differently than specified (document rationale)
- Scope reductions from original spec
- Technical debt introduced vs spec timeline

Output format:
```
[SPEC_ITEM] Status: PASS/PARTIAL/FAIL
Location: file:line (if applicable)
Requirement: [quote from spec/feature/task]
Implementation: [what was actually done]
Gap: [if PARTIAL/FAIL, what's missing]
```

Summary format:
```
## Spec Compliance Summary

| Level | Item | Status | Notes |
|-------|------|--------|-------|
| Spec | Key Capability 1 | PASS/PARTIAL/FAIL | [notes] |
| Feature | S1362.I1.F1 AC1 | PASS/PARTIAL/FAIL | [notes] |
| Task | S1362.I1.F1.T1 | PASS/PARTIAL/FAIL | [notes] |

Acceptance Criteria: X/Y passed (Z%)
Tasks Verified: X/Y passed (Z%)
```
```

## Post-Audit Consolidation

After all agents complete, consolidate findings:

### Cross-Pattern Analysis
- **Root Causes**: Identify systemic issues appearing across multiple areas
- **Interconnected Issues**: Note how one issue may cause another
- **Priority Conflicts**: Resolve competing recommendations

### Report Generation

Create a comprehensive audit report saved to `.ai/reports/code-audit/`:

```markdown
# Code Audit Report

**Target**: [directory/files audited]
**Date**: [timestamp]
**Commit**: [git hash]

## Executive Summary

[2-3 paragraphs summarizing overall code health, critical findings, and recommended priorities]

## Audit Scores

| Aspect | Score | Critical | High | Medium | Low |
|--------|-------|----------|------|--------|-----|
| React/Next.js | X/10 | N | N | N | N |
| UI/UX Guidelines | X/10 | N | N | N | N |
| SEO Compliance | X/10 | N | N | N | N |
| Database Patterns | X/10 | N | N | N | N |
| Security | X/10 | N | N | N | N |
| Code Quality | X/10 | N | N | N | N |
| Architecture | X/10 | N | N | N | N |
| Testing Quality | X/10 | N | N | N | N |
| Documentation | X/10 | N | N | N | N |
| Spec Compliance | X/10 | N | N | N | N |

**Overall Score**: X/10

## Spec Compliance Summary (Alpha Audits Only)

> Include this section only when auditing an Alpha spec (S#, S#.I#, S#.I#.F#)

**Spec**: [S# - Spec Name]
**Scope**: [Spec / Initiative / Feature level]

### Acceptance Criteria Status

| Feature | Criteria | Status | Notes |
|---------|----------|--------|-------|
| S#.I#.F1 | AC1: [description] | ✅ PASS / ⚠️ PARTIAL / ❌ FAIL | [notes] |
| S#.I#.F1 | AC2: [description] | ✅ PASS / ⚠️ PARTIAL / ❌ FAIL | [notes] |

**Acceptance Criteria**: X/Y passed (Z%)

### Task Verification Status

| Task ID | Task Name | Output Files | Verification | Status |
|---------|-----------|--------------|--------------|--------|
| S#.I#.F#.T1 | [name] | ✅ All exist | ✅ Passed | ✅ PASS |
| S#.I#.F#.T2 | [name] | ⚠️ 2/3 exist | ❌ Failed | ⚠️ PARTIAL |

**Tasks Verified**: X/Y passed (Z%)

### Implementation Gaps

| Gap Type | Location | Spec Requirement | Current State | Priority |
|----------|----------|------------------|---------------|----------|
| Missing file | [path] | [from tasks.json] | Does not exist | HIGH |
| Incomplete | [path:line] | [from AC] | Partial implementation | MEDIUM |
| Deviation | [path:line] | [from spec] | Different approach | LOW |

## Critical Issues (Must Fix)

### [Issue 1 Title]
- **Location**: file:line
- **Category**: [React|UI|SEO|Database|Security|Quality|Architecture|Testing|Documentation|Spec]
- **Description**: [detailed description]
- **Impact**: [what could go wrong]
- **Recommendation**:
```[language]
[code fix example]
```

[Repeat for each critical issue]

## High Priority Issues

[Same format as critical, grouped by category]

## Medium Priority Issues

[Condensed format: file:line - description - recommendation]

## Low Priority / Tech Debt

[List format with brief descriptions]

## Strengths Identified

- [Positive patterns found]
- [Well-implemented areas]
- [Good practices to preserve]

## Recommended Action Plan

### Immediate (This Sprint)
1. [Critical fix 1]
2. [Critical fix 2]

### Short-Term (Next 2 Sprints)
1. [High priority improvements]

### Long-Term (Backlog)
1. [Systemic improvements]
2. [Refactoring opportunities]

## Skills Used

- react-best-practices (Vercel Engineering)
- web-design-guidelines (Vercel Labs)
- seo-audit (SlideHeroes)
- supabase-postgres-best-practices (Supabase)

---
*Generated by Code Audit Command*
*Report saved to: .ai/reports/code-audit/[filename].md*
```

## Report Filename Convention

Save report to: `.ai/reports/code-audit/YYYY-MM-DD-[target-slug].md`

**Alpha Spec Examples**:
- `2026-01-27-S1362-user-dashboard.md` (full spec audit)
- `2026-01-27-S1362.I1-dashboard-foundation.md` (initiative audit)
- `2026-01-27-S1362.I1.F1-dashboard-page.md` (feature audit)

**Directory Examples**:
- `2026-01-27-apps-web-home.md`
- `2026-01-27-recent-changes.md`
- `2026-01-27-database-schemas.md`

## Completion Criteria

A code audit is **COMPLETE** when:

### Standard Audit
- [ ] Target scope identified and files listed
- [ ] All relevant audit agents launched (up to 9 agents based on file types)
- [ ] Skills invoked for each applicable audit area (4 specialized skills)
- [ ] Findings consolidated from all agents
- [ ] Report generated with scores and prioritized issues
- [ ] Report saved to `.ai/reports/code-audit/`
- [ ] Summary provided to user with key findings

### Alpha Spec Audit (Additional)
- [ ] Spec/Initiative/Feature documents read and requirements extracted
- [ ] Implementation files extracted from tasks.json
- [ ] Spec Compliance agent launched (10th agent)
- [ ] Acceptance criteria verification completed
- [ ] Task output verification completed
- [ ] Spec Compliance Summary included in report

## Usage Examples

### Alpha Spec Audits

```bash
# Audit entire spec implementation
/code-audit S1362

# Audit specific initiative
/code-audit S1362.I1

# Audit specific feature
/code-audit S1362.I1.F1
```

### Directory Audits

```bash
# Audit specific feature directory
/code-audit apps/web/app/home/(user)/kanban

# Audit recent changes
/code-audit recent changes

# Audit database layer
/code-audit apps/web/supabase/schemas

# Audit all components
/code-audit packages/ui/src

# Full application audit
/code-audit apps/web
```

## Notes

- Audit findings are recommendations, not mandates
- Context matters - some "issues" may be intentional trade-offs
- Security findings should be prioritized and reviewed carefully
- Performance improvements should be measured before/after
- UI/UX recommendations may require design team input
