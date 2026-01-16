---
description: Refactoring Analysis Command
argument-hint: [file-or-directory-path]
model: opus
allowed-tools: [Read, Grep, Glob, Bash, Task, TodoWrite, AskUserQuestion]
---

# Refactoring Analysis Command

**CRITICAL: THIS IS AN ANALYSIS-ONLY TASK**
```
DO NOT MODIFY ANY CODE FILES
DO NOT CREATE ANY TEST FILES
DO NOT EXECUTE ANY REFACTORING
ONLY ANALYZE AND GENERATE A REPORT
```

You are a senior software architect specializing in TypeScript/Next.js refactoring for the SlideHeroes codebase. You understand the project's patterns: `enhanceAction` for server actions, service layer architecture, schema-first validation with Zod, and loader patterns for data fetching.

## YOUR TASK

1. **PARSE** the target file(s) from `$ARGUMENTS`
2. **ANALYZE** for refactoring opportunities using SlideHeroes patterns
3. **CREATE** a detailed refactoring plan (analysis only)
4. **WRITE** the plan to: `.ai/reports/chore-reports/YYYY-MM-DD/pending-refactor-analysis-<slug>.md`
5. **CREATE** GitHub issue and rename report with issue number

**OUTPUT**: A comprehensive markdown report file saved to the reports directory

---

## ARGUMENT PARSING

### Parse Target File Path

1. **Extract target from $ARGUMENTS**:
   ```
   Target: $ARGUMENTS
   ```

2. **Validate target**:
   - If `$ARGUMENTS` is empty, use AskUserQuestion to prompt:
     "Which file or directory would you like to analyze for refactoring?"
   - If path is relative, resolve from project root
   - If path is a directory, analyze all `.ts`/`.tsx` files within

3. **Supported targets**:
   ```bash
   # Single file
   /refactor apps/web/app/home/[account]/kanban/server-actions.ts

   # Directory (analyzes all TypeScript files)
   /refactor apps/web/app/home/[account]/course/

   # Package
   /refactor packages/features/auth/src/
   ```

4. **Validate file exists** using Read tool before proceeding

---

## DIRECTORY PROCESSING (When Target is Directory)

If `$ARGUMENTS` resolves to a directory, execute this workflow before proceeding to analysis phases.

### Step 1: Discover Files

**Use Glob to find all TypeScript files**:
```bash
# Discover all TypeScript files in target directory
Glob: "**/*.ts" in $ARGUMENTS
Glob: "**/*.tsx" in $ARGUMENTS
```

**Exclude from analysis**:
- `*.test.ts`, `*.spec.ts` (test files - analyze separately if needed)
- `*.d.ts` (type declaration files)
- Files in `node_modules/` (dependencies)
- Files in `dist/`, `.next/`, `build/` (build artifacts)

**Store discovered files** for subsequent processing.

### Step 2: Categorize & Prioritize Files

Sort discovered files into priority tiers based on refactoring impact:

| Priority | File Pattern | Rationale |
|----------|--------------|-----------|
| **Critical** | `*server-actions.ts` >300 lines | High complexity, service extraction candidates |
| **Critical** | Any file >800 lines | Immediate decomposition needed |
| **High** | `*server-actions.ts` any size | Pattern compliance check |
| **High** | `*.tsx` components >400 lines | Component decomposition candidates |
| **Medium** | `*.service.ts` files | Service layer review |
| **Medium** | `*.schema.ts` files | Schema consolidation review |
| **Medium** | `*-page.loader.ts` files | Loader pattern compliance |
| **Standard** | All other `.ts`/`.tsx` files | General analysis |

### Step 3: Track Progress with TodoWrite

**Create tracking todos for batch processing**:

```
TodoWrite with todos:
- "Discover and categorize files in [directory]" (in_progress)
- "Analyze critical priority files ([count])" (pending)
- "Analyze high priority files ([count])" (pending)
- "Analyze medium priority files ([count])" (pending)
- "Analyze standard priority files ([count])" (pending)
- "Generate consolidated refactoring report" (pending)
- "Create GitHub issue" (pending)
```

Update status as each batch completes. Mark individual file analysis as sub-tasks if >10 files in a tier.

### Step 4: Parallel File Analysis

**Batch processing strategy**:

1. **Read files in parallel** - Use multiple Read tool calls in single message (5-10 files per batch to manage context)

2. **Grep patterns across directory** - Run pattern searches on entire directory:
   ```bash
   # Server action patterns
   Grep: "enhanceAction\s*\(" in $ARGUMENTS
   Grep: "schema:\s*\w+Schema" in $ARGUMENTS

   # Service layer patterns
   Grep: "Service\(" in $ARGUMENTS

   # Schema patterns
   Grep: "z\.object\(" in $ARGUMENTS

   # Loader patterns
   Grep: "import 'server-only'" in $ARGUMENTS
   Grep: "Promise\.all\(" in $ARGUMENTS

   # Anti-patterns
   Grep: "any" type usage in $ARGUMENTS
   Grep: "// TODO" comments in $ARGUMENTS
   ```

3. **Aggregate metrics per file**:
   - Line count
   - Function count
   - Complexity indicators (branching statements, nesting depth)
   - Pattern compliance flags

### Step 5: Cross-File Dependency Analysis

**When analyzing a directory, also check**:

1. **Internal imports** - Which files import from each other?
   ```bash
   Grep: "from '\.\/" in each file
   Grep: "from '\.\./" in each file
   ```

2. **Shared dependencies** - Common external imports across files
   ```bash
   Grep: "from '@kit/" across all files
   ```

3. **Circular dependencies** - Files that import each other (anti-pattern)

4. **Missing co-located files**:
   - `server-actions.ts` without corresponding `*.service.ts`
   - `page.tsx` without `*-page.loader.ts`
   - Actions without `*.schema.ts`

### Step 6: Directory-Level Metrics Summary

**Generate aggregate statistics**:

```markdown
## Directory Overview: [path]

| Metric | Value | Threshold | Status |
|--------|-------|-----------|--------|
| Total files | X | - | - |
| Total lines | Y | - | - |
| Files >400 lines | Z | 0 | ⚠️/✅ |
| Files >800 lines | W | 0 | ❌/✅ |
| Server actions without service | N | 0 | ⚠️/✅ |
| Missing schemas | M | 0 | ⚠️/✅ |
| Missing loaders | L | 0 | ⚠️/✅ |

### File-by-File Summary
| File | Lines | Type | Issues | Priority |
|------|-------|------|--------|----------|
| server-actions.ts | 440 | actions | No service | CRITICAL |
| TaskBoard.tsx | 650 | component | Too large | HIGH |
| ... | ... | ... | ... | ... |
```

### Step 7: Consolidated Recommendations

**Group recommendations by impact**:

1. **Immediate Actions** (Critical priority files)
   - List specific extractions needed
   - Estimated complexity reduction

2. **Short-term Improvements** (High priority)
   - Pattern compliance fixes
   - Service layer extractions

3. **Technical Debt Reduction** (Medium priority)
   - Schema consolidation
   - Loader pattern adoption

4. **Maintenance Items** (Standard priority)
   - Minor refactoring opportunities
   - Code style improvements

---

## REFACTORING ANALYSIS FRAMEWORK

### Core Principles (SlideHeroes Specific)
1. **Safety Net Assessment**: Analyze test coverage against Vitest patterns
2. **Pattern Compliance**: Check adherence to enhanceAction, service layer, schemas
3. **Incremental Strategy**: Plan extractions of 40-60 line blocks
4. **Verification Planning**: Design test strategy using project test patterns

### Multi-Agent Analysis Workflow

1. **Codebase Discovery Agent**: Analyze imports, exports, and dependencies
2. **Pattern Compliance Agent**: Check SlideHeroes-specific patterns
3. **Test Coverage Agent**: Evaluate existing Vitest tests
4. **Complexity Analysis Agent**: Measure complexity metrics
5. **Architecture Agent**: Propose target architecture following project conventions
6. **Risk Assessment Agent**: Evaluate risks and create mitigation strategies
7. **Directory Structure Agent**: Analyze naming conventions, depth, co-location, and package extraction candidates
8. **Planning Agent**: Create step-by-step refactoring plan
9. **Documentation Agent**: Synthesize findings into report

---

## PHASE 1: PROJECT CONTEXT & PATTERN ANALYSIS

### 1.1 SlideHeroes Context Loading

**Load relevant context documentation**:
```bash
# Use conditional docs to load relevant context
slashCommand /conditional_docs refactor "[target file description]"
```

Read the suggested documentation files to understand relevant patterns.

### 1.2 Current State Assessment (SlideHeroes Calibrated)

**File Analysis Thresholds**:

| Metric | Warning | Critical | Notes |
|--------|---------|----------|-------|
| File size | >400 lines | >800 lines | Most project files are 100-400 lines |
| Server actions file | >300 lines | >500 lines | Extract to service layer |
| Component file | >400 lines | >700 lines | Decompose into sub-components |
| Schema file | >200 lines | >400 lines | Split into domain schemas |
| Loader file | >150 lines | >300 lines | Check for parallel fetching |
| Function size | >50 lines | >100 lines | Extract helper functions |
| Cyclomatic complexity | >10 | >20 | Simplify conditionals |
| Parameters | >4 | >6 | Use parameter object pattern |
| Nesting depth | >3 | >5 | Extract to functions |

**Project-Specific Detection Priorities**:
- `*server-actions.ts` >300 lines → HIGH (extract to service)
- `_components/*.tsx` >400 lines → HIGH (decompose)
- Files with >30 branching statements → HIGH
- Functions >50 lines → MEDIUM
- `*.schema.ts` >20 fields → MEDIUM (split schema)
- Missing `server-only` import in server files → LOW

### 1.3 Server Action Pattern Analysis

**Detect enhanceAction Usage**:
```bash
# Count server actions in target file
Grep: "enhanceAction\s*\(" in target file

# Check for schema validation
Grep: "schema:\s*\w+Schema" in target file

# Check for service layer usage
Grep: "Service\(" in target file
```

**Server Action Anti-Patterns**:

| Anti-Pattern | Detection | Recommendation |
|--------------|-----------|----------------|
| Fat action | >50 lines inside enhanceAction callback | Extract to service class |
| Missing schema | enhanceAction without `schema:` option | Add Zod schema validation |
| Direct DB calls | Supabase queries inside action (no service) | Move to service layer |
| Missing logger | No `getLogger()` call | Add structured logging |
| Mixed concerns | UI logic in server action | Separate concerns |
| Inconsistent returns | Mix of throw and return { success: false } | Standardize pattern |

**Analysis Output Format**:
```md
### Server Action Analysis
| Action Name | Lines | Has Schema | Uses Service | Issues |
|-------------|-------|------------|--------------|--------|
| createTask | 85 | ✅ | ❌ | Extract to TaskService |
| updateTask | 45 | ✅ | ❌ | Consider service layer |
```

### 1.4 Service Layer Compliance Analysis

**Service Pattern Detection**:
```bash
# Find existing services in same directory/package
Glob: "**/*.service.ts" in target directory

# Check if server actions have corresponding services
# server-actions.ts should have domain.service.ts
```

**Expected Pattern**:
```typescript
// ✅ Good: Service layer pattern
// task.service.ts
export function createTaskService(client: SupabaseClient<Database>) {
  return new TaskService(client);
}

class TaskService {
  constructor(private readonly client: SupabaseClient<Database>) {}
  async createTask(data: CreateTaskInput): Promise<Task> { /* ... */ }
}

// server-actions.ts (thin layer)
export const createTask = enhanceAction(
  async (data, user) => {
    const service = createTaskService(getSupabaseServerClient());
    return await service.createTask(data);
  },
  { schema: CreateTaskSchema }
);
```

**Compliance Output**:
```md
| Server Actions File | Lines | Has Service | Compliance |
|--------------------|-------|-------------|------------|
| kanban/server-actions.ts | 440 | ❌ None | ⚠️ Extract to service |
```

### 1.5 Schema-First Development Analysis

**Schema Pattern Detection**:
```bash
# Find Zod schemas
Glob: "**/*.schema.ts" in target directory
Grep: "z\.object\(|z\.string\(|z\.number\(" in target files

# Find inline type definitions (anti-pattern)
Grep: "interface\s+\w+\s*\{|type\s+\w+\s*=" in non-schema files
```

**Schema Health Checks**:

| Check | Detection | Recommendation |
|-------|-----------|----------------|
| Schema file exists | Glob for `*.schema.ts` | Create `domain.schema.ts` |
| Types derived from schemas | Check for `z.infer<typeof>` | Use `z.infer<typeof Schema>` |
| Inline types | `interface`/`type` in action files | Extract to schema file |
| Duplicate schemas | Same schema in multiple files | Consolidate to single source |

**Expected Pattern**:
```typescript
// ✅ Good: Schema-first with type derivation
// task.schema.ts
export const CreateTaskSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().optional(),
});
export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;

// ❌ Bad: Inline type without schema
interface CreateTaskInput { title: string; }
```

### 1.6 Data Fetching Pattern Analysis

**Loader Pattern Detection**:
```bash
# Find loader files
Glob: "**/*.loader.ts" in target directory

# Check for parallel fetching
Grep: "Promise\.all\(" in loader files

# Check for server-only import
Grep: "import 'server-only'" in loader files
```

**Loader Pattern Compliance**:

| Check | Status | Recommendation |
|-------|--------|----------------|
| Loader file exists for page | ✅/❌ | Create `*-page.loader.ts` |
| Uses `import 'server-only'` | ✅/❌ | Add server-only import |
| Uses `Promise.all()` | ✅/❌ | Parallelize independent fetches |
| Returns typed data | ✅/❌ | Add return type annotation |

**Expected Pattern**:
```typescript
// ✅ Good: Loader pattern
// projects-page.loader.ts
import 'server-only';

export async function loadProjectsPageData(
  client: SupabaseClient<Database>,
  slug: string,
) {
  return Promise.all([
    loadProjects(client, slug),
    loadWorkspace(client, slug),
  ]);
}
```

### 1.7 Error Handling Pattern Analysis

**Error Pattern Detection**:
```bash
# Find error handling patterns in server actions
Grep: "return \{ success: false" in server action files
Grep: "throw new Error\(" in server action files
Grep: "try \{" blocks in server action files
```

**Error Handling Consistency**:

| Pattern Found | Count | Standard? |
|---------------|-------|-----------|
| `{ success: false, error: string }` | X | ✅ Standard |
| `throw new Error()` | Y | ⚠️ Non-standard for actions |
| No error handling | Z | ❌ Missing |

**Recommended Standard**:
```typescript
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export const createTask = enhanceAction(
  async (data, user): Promise<ActionResult<Task>> => {
    try {
      const service = createTaskService(getSupabaseServerClient());
      const task = await service.createTask(data);
      return { success: true, data: task };
    } catch (error) {
      const logger = await getLogger();
      logger.error({ error }, 'Failed to create task');
      return { success: false, error: 'Failed to create task' };
    }
  },
  { schema: CreateTaskSchema }
);
```

---

## PHASE 2: TEST COVERAGE ANALYSIS

### 2.1 Test Discovery

**Find test files for target**:
```bash
# Find corresponding test files
Glob: "**/*.test.ts" or "**/*.spec.ts" matching target name

# Check for server action tests
Grep: "describe.*server-actions" in test files

# Check for E2E selectors
Grep: "data-testid" in component files
```

### 2.2 SlideHeroes Test Requirements

| Component Type | Required Tests | Notes |
|----------------|----------------|-------|
| Server Actions | Unit tests with schema validation | Mock enhanceAction |
| Services | Unit tests with mocked client | Test business logic |
| Components | Integration tests (optional) | data-testid for E2E |
| Pages | E2E tests | Playwright coverage |
| Schemas | Validation tests | Test edge cases |

### 2.3 Test Gap Identification

**Output Format**:
```md
### Missing Tests for Target

**Server Actions**:
| Action | Test File | Status |
|--------|-----------|--------|
| createTask | kanban.test.ts | ✅ Covered |
| updateTask | kanban.test.ts | ❌ Missing |

**Components**:
| Component | data-testid | E2E Coverage |
|-----------|-------------|--------------|
| TaskCard | ✅ Present | ❌ Not covered |
```

**Mock Pattern Requirements**:
```typescript
// Required mock for enhanceAction tests
vi.mock('@kit/next/actions', () => ({
  enhanceAction: vi.fn((fn, options) => {
    return async (data: unknown) => {
      if (options?.schema) {
        const result = options.schema.safeParse(data);
        if (!result.success) return { success: false, error: 'Validation failed' };
        data = result.data;
      }
      return fn(data, mockUser);
    };
  }),
}));
```

---

## PHASE 3: COMPLEXITY ANALYSIS

### 3.1 Metrics Calculation

**SlideHeroes Complexity Thresholds**:

| Metric | Good | Warning | Critical |
|--------|------|---------|----------|
| Cyclomatic Complexity | ≤10 | 11-20 | >20 |
| Lines per Function | ≤50 | 51-100 | >100 |
| Function Parameters | ≤3 | 4-5 | >5 |
| File Lines | ≤400 | 401-800 | >800 |
| Nesting Depth | ≤3 | 4-5 | >5 |
| Branching Statements | ≤20 | 21-30 | >30 |

**Output Table**:
```md
| Function/Class | Lines | Cyclomatic | Parameters | Nesting | Risk |
|----------------|-------|------------|------------|---------|------|
| createTask | 85 | 12 | 2 | 3 | MEDIUM |
| handleSubmit | 125 | 25 | 4 | 5 | HIGH |
```

### 3.2 Automated Tooling Analysis

**Run these commands if available**:
```bash
# Dead code detection with Knip
npx knip --reporter compact 2>/dev/null || echo "Knip not installed"

# Circular dependency detection
npx madge --circular --extensions ts,tsx $TARGET_PATH 2>/dev/null || echo "madge not installed"

# Type coverage measurement
npx type-coverage --detail $TARGET_PATH 2>/dev/null || echo "type-coverage not installed"

# ESLint complexity check
npx eslint $TARGET_PATH --rule 'complexity: ["error", 10]' --format compact 2>/dev/null
```

**Tool Results Output**:
```md
### Automated Analysis Results

**Knip (Dead Code)**:
- Unused exports: [list or "None found"]
- Unused dependencies: [list or "None found"]

**Madge (Circular Dependencies)**:
- Cycles found: [Yes/No]
- Details: [list cycles]

**Type Coverage**: [X]%

**ESLint Complexity**: [functions exceeding threshold]
```

### 3.3 Monorepo Cross-Package Analysis

**Package Import Detection**:
```bash
# Find imports from other packages
Grep: "from '@kit/" in target files

# Check for internal imports (anti-pattern)
Grep: "@kit/\w+/src/" in target files
```

**Cross-Package Issues**:

| Issue | Detection | Recommendation |
|-------|-----------|----------------|
| Deep imports | `@kit/package/src/internal` | Use public API |
| Circular deps | Package A ↔ Package B | Extract shared module |
| Barrel bloat | Large barrel imports | Use direct imports |

**Import Analysis Output**:
```md
| Source File | Imports From | Type | Status |
|------------|--------------|------|--------|
| apps/web/... | @kit/ui | Public API | ✅ |
| apps/web/... | @kit/ui/src/button | Internal | ⚠️ Use @kit/ui/button |
```

---

## PHASE 4: REFACTORING STRATEGY

### 4.1 React/Next.js Component Analysis

**Component Pattern Detection**:
```bash
# Detect large client components
Grep: "'use client'" in component files >400 lines

# Count useState calls (many = code smell)
Grep: "useState\(" count per component

# Detect missing Suspense
Grep: "async function.*Page" without Suspense
```

**Component Anti-Patterns**:

| Anti-Pattern | Detection | Recommendation |
|--------------|-----------|----------------|
| Large client component | >400 lines with 'use client' | Extract custom hooks |
| Many useState | >4 separate useState | Use single state object |
| Missing Suspense | Async component without boundary | Add Suspense |
| Inline handlers | Complex onClick/onChange | Extract to functions |
| Prop drilling | >3 levels | Use context/composition |

**Decomposition Strategy**:
```md
### Current Structure
ComponentName.tsx (921 lines)
├── State (150 lines) → Extract to useComponentState.ts
├── Handlers (200 lines) → Extract to useComponentHandlers.ts
├── Sub-components (200 lines) → Extract to components/
└── Main JSX (221 lines) → Keep in index.tsx

### Recommended Structure
ComponentName/
├── index.tsx (50 lines)
├── hooks/
│   ├── useComponentState.ts
│   └── useComponentHandlers.ts
├── components/
│   ├── SubComponentA.tsx
│   └── SubComponentB.tsx
└── utils/helpers.ts
```

### 4.2 Extraction Strategy (SlideHeroes Patterns)

**Pattern Selection**:
- Server action >50 lines → Extract to service
- Component >400 lines → Decompose to sub-components
- Repeated logic → Extract to shared utility
- Complex conditionals → Extract to well-named predicates
- Data clumps → Extract to Zod schema

**Extraction Size Guidelines**:
- Functions: 20-50 lines (sweet spot: 30-40)
- Services: 100-300 lines (focused domain)
- Components: 100-400 lines (single responsibility)
- Schemas: 50-200 lines (domain-scoped)

---

## PHASE 5: RISK ASSESSMENT

### 5.1 Risk Matrix

| Risk | Likelihood | Impact | Score | Mitigation |
|------|------------|--------|-------|------------|
| Breaking API | Medium | High | 6 | Keep public API, deprecate |
| Performance regression | Low | Medium | 3 | Benchmark before/after |
| Test failures | Medium | Low | 2 | Run tests after each change |
| Type errors | Low | Low | 1 | TypeScript catches most |

### 5.2 Mitigation Strategies

- **Feature flags**: Use for gradual rollout of significant changes
- **Incremental commits**: Small, focused commits for easy rollback
- **Test first**: Write characterization tests before refactoring
- **Type safety**: Leverage TypeScript to catch errors early

---

## PHASE 6: DIRECTORY & FILE STRUCTURE ANALYSIS

### 6.1 Directory Naming Convention Validation

**Check directory naming patterns**:
```bash
# Find directories not following underscore-prefix convention
# In route directories, private dirs should use underscore prefix

# Validate kebab-case naming
find $TARGET_PATH -type d -name "*[A-Z]*"  # Find directories with uppercase (anti-pattern)

# Check for proper private directory prefixes
ls -d $TARGET_PATH/*/ 2>/dev/null | xargs -I {} basename {}
```

**Expected Patterns**:

| Directory Type | Pattern | Example | Anti-Pattern |
|----------------|---------|---------|--------------|
| Private components | `_components/` | `app/home/_components/` | `components/` at route level |
| Private utilities | `_lib/` | `app/home/_lib/server/` | `lib/` at route level |
| Server utilities | `_lib/server/` | `_lib/server/loader.ts` | Server code in `_lib/` root |
| Server actions | `_actions/` | `_actions/create-task.ts` | `actions/` (no underscore) |
| Private types | `_types/` | `_lib/_types/editor-types.ts` | Inline types |
| Route groups | `(name)/` | `(marketing)/` | No grouping for related routes |
| Dynamic segments | `[param]/` | `[account]/` | N/A |

**Validation Output**:
```md
### Directory Naming Issues
| Path | Current | Expected | Recommendation |
|------|---------|----------|----------------|
| app/home/components/ | components/ | _components/ | Rename to underscore-prefix |
| app/api/Users/ | Users/ | users/ | Use kebab-case |
```

### 6.2 File Naming Convention Validation

**Check file naming patterns**:
```bash
# Find TypeScript files not following kebab-case (have uppercase letters)
find $TARGET_PATH -name "*.ts" -o -name "*.tsx" | xargs -I {} basename {} | grep "[A-Z]"

# Check for correct suffixes
Glob: "**/*.service.ts"     # Services
Glob: "**/*.schema.ts"      # Schemas
Glob: "**/*-page.loader.ts" # Loaders
Glob: "**/*.test.ts"        # Tests
```

**Expected Naming Patterns**:

| File Type | Pattern | Example | Anti-Pattern |
|-----------|---------|---------|--------------|
| Components | `kebab-case.tsx` | `task-card.tsx` | `TaskCard.tsx` |
| Services | `kebab-case.service.ts` | `task.service.ts` | `taskService.ts` |
| Schemas | `kebab-case.schema.ts` | `task.schema.ts` | `TaskSchema.ts` |
| Loaders | `kebab-case-page.loader.ts` | `tasks-page.loader.ts` | `tasksLoader.ts` |
| Hooks | `use-kebab-case.ts` | `use-task-state.ts` | `useTaskState.ts` |
| Types | `kebab-case.types.ts` | `task.types.ts` | `TaskTypes.ts` |
| Server actions | `kebab-case-server-actions.ts` | `task-server-actions.ts` | `serverActions.ts` |
| Constants | `kebab-case.constants.ts` | `kanban.constants.ts` | `CONSTANTS.ts` |

**Naming Validation Output**:
```md
### File Naming Issues
| File | Current Name | Expected Name | Issue |
|------|--------------|---------------|-------|
| TaskCard.tsx | TaskCard.tsx | task-card.tsx | Use kebab-case |
| useTaskState.ts | useTaskState.ts | use-task-state.ts | Use kebab-case |
```

### 6.3 Directory Structure Depth Analysis

**Check for over-nested structures**:

```bash
# Find directories nested >4 levels deep from target root
find $TARGET_PATH -type d -mindepth 5

# Count nesting levels
find $TARGET_PATH -type d | awk -F/ '{print NF-1, $0}' | sort -rn | head -10
```

**Depth Guidelines**:

| Max Depth | Context | Recommendation |
|-----------|---------|----------------|
| 3 levels | `_lib/` subdirectories | `_lib/hooks/form/` is OK, deeper is too much |
| 2 levels | `_components/` | `_components/editor/toolbar.tsx` is OK |
| 4 levels | Route nesting | Beyond this, consider route groups or extraction |

**Over-Nesting Detection**:
```md
### Over-Nested Directories
| Path | Depth | Recommendation |
|------|-------|----------------|
| _lib/utils/helpers/string/format/ | 5 | Flatten to _lib/utils/string-format/ |
| _components/forms/fields/text/variants/ | 5 | Flatten or extract to package |
```

### 6.4 Route Structure Validation (Next.js Specific)

**Check route organization**:

```bash
# Find route directories missing co-located utilities
find $TARGET_PATH -name "page.tsx" -exec dirname {} \; | while read dir; do
  [ ! -d "$dir/_lib" ] && [ $(find "$dir" -maxdepth 1 -name "*.ts" | wc -l) -gt 2 ] && echo "$dir"
done

# Check for missing layouts in nested routes
find $TARGET_PATH -type d -exec test ! -e {}/layout.tsx -a -e {}/page.tsx \; -print

# Find server actions not in _lib/server/
Grep: "'use server'" in files outside _lib/server/
```

**Route Pattern Validation**:

| Pattern | Check | Recommendation |
|---------|-------|----------------|
| Group routes | Related public routes grouped | Use `(marketing)/` for public pages |
| Dynamic routes | Descriptive segment naming | `[accountId]` not `[id]` |
| Catch-all routes | Appropriate usage | `[...slug]` for docs, blog |
| Route co-location | `_lib/`, `_components/` present | Create when >2 related utility files |
| Server separation | Server code in `_lib/server/` | Move server-only code to dedicated dir |

**Route Structure Output**:
```md
### Route Structure Issues
| Route Path | Issue | Recommendation |
|------------|-------|----------------|
| app/home/[account]/settings/ | No _lib/ directory, 5 utility files | Create _lib/ and organize |
| app/home/[account]/[id]/ | Non-descriptive dynamic segment | Rename to [projectId]/ |
```

### 6.5 Feature Boundary & Package Extraction Analysis

**Detect when code should be extracted to packages**:

```bash
# Find cross-route imports (importing from sibling route directories)
Grep: "from '@/app/home/(user)/" in target (excluding own directory)
Grep: "from '\\.\\./\\.\\./\\.\\./" in target  # Deep relative imports (3+ levels)

# Find duplicated utilities across routes
# Same function name in multiple _lib/ directories
```

**Extraction Signals**:

| Signal | Detection | Recommendation |
|--------|-----------|----------------|
| Cross-route imports | Importing from sibling route directories | Extract to `packages/features/` |
| Deep relative imports | `../../../` (3+ levels) | Extract to shared package |
| Duplicated utilities | Same helper in multiple `_lib/` dirs | Extract to `packages/shared/` |
| Reusable components | Component imported in >3 routes | Extract to `packages/ui/` |
| Shared business logic | Service used across features | Extract to `packages/features/[domain]/` |

**Package Extraction Output**:
```md
### Candidates for Package Extraction
| Current Location | Used In | Recommendation |
|-----------------|---------|----------------|
| app/home/(user)/ai/_lib/utils/ai-helpers.ts | 5 routes | Extract to packages/ai-gateway/src/ |
| app/home/_components/cost-badge.tsx | 4 features | Extract to packages/ui/src/cost-badge/ |
| app/home/(user)/*/task.service.ts | 3 features | Extract to packages/features/tasks/ |
```

### 6.6 Co-location Analysis

**Analyze file placement for proper co-location**:

```bash
# Find files that should be co-located but aren't
# Component helpers should be near their components

# Find orphaned utility files (single file in directory)
find $TARGET_PATH -type d -exec sh -c 'count=$(ls -1 "$1"/*.ts 2>/dev/null | wc -l); [ "$count" -eq 1 ] && echo "$1"' _ {} \;

# Find test files not co-located with implementation
Glob: "**/*.test.ts" and check if implementation exists in same directory
```

**Co-location Rules**:

| File Type | Co-locate With | Location Pattern |
|-----------|----------------|------------------|
| Component hooks | Component | `_components/feature/hooks/` or `_lib/hooks/` |
| Component types | Component | `_components/feature/types.ts` or `_lib/types/` |
| Route loaders | page.tsx | `_lib/server/*-page.loader.ts` |
| Route actions | page.tsx | `_lib/server/*-server-actions.ts` |
| Schemas | Actions/Services | `_lib/schemas/*.schema.ts` |
| Tests | Implementation | Same directory or `__tests__/` subdirectory |

**Co-location Issues Output**:
```md
### Co-location Issues
| File | Current Location | Recommended Location | Reason |
|------|------------------|---------------------|--------|
| task-helpers.ts | app/home/_lib/ | app/home/(user)/kanban/_lib/ | Only used by kanban |
| use-task-drag.ts | packages/shared/ | app/home/(user)/kanban/_lib/hooks/ | Feature-specific hook |
```

### 6.7 Restructure Plan Generation

**When structural issues are identified, generate explicit restructure plan**:

**Before/After Comparison Template**:
```md
### Recommended Directory Restructure

**Current Structure** (issues highlighted):
```
app/home/(user)/kanban/
├── page.tsx
├── server-actions.ts      ⚠️ 440 lines, no service extraction
├── TaskBoard.tsx          ⚠️ 650 lines, PascalCase filename
├── helpers.ts             ⚠️ Not in _lib/
├── types.ts               ⚠️ Not in _lib/
└── useKanban.ts           ⚠️ Not in _lib/hooks/
```

**Recommended Structure**:
```
app/home/(user)/kanban/
├── page.tsx
├── _components/
│   ├── task-board/
│   │   ├── index.tsx              # Main TaskBoard component
│   │   ├── task-card.tsx          # Extracted sub-component
│   │   ├── task-column.tsx        # Extracted sub-component
│   │   └── hooks/
│   │       └── use-drag-drop.ts   # Component-specific hook
│   └── kanban-header.tsx
├── _lib/
│   ├── server/
│   │   ├── kanban-page.loader.ts  # Data fetching
│   │   └── kanban-server-actions.ts # Thin action layer
│   ├── services/
│   │   └── task.service.ts        # Business logic
│   ├── schemas/
│   │   └── task.schema.ts         # Zod validation
│   ├── hooks/
│   │   └── use-kanban.ts          # Feature hooks
│   └── types/
│       └── kanban.types.ts        # Type definitions
```

**Migration Steps**:
1. [ ] Create `_components/` directory structure
2. [ ] Rename `TaskBoard.tsx` → `_components/task-board/index.tsx`
3. [ ] Extract sub-components from TaskBoard to separate files
4. [ ] Create `_lib/` directory structure
5. [ ] Move `server-actions.ts` → `_lib/server/kanban-server-actions.ts`
6. [ ] Extract business logic to `_lib/services/task.service.ts`
7. [ ] Move `types.ts` → `_lib/types/kanban.types.ts`
8. [ ] Move `helpers.ts` → `_lib/utils/kanban-helpers.ts`
9. [ ] Rename `useKanban.ts` → `_lib/hooks/use-kanban.ts`
10. [ ] Update all import statements
11. [ ] Run `pnpm typecheck` to verify no broken imports
12. [ ] Run `pnpm lint:fix` to fix any linting issues
```

### 6.8 Directory Analysis Summary Table

**Generate consolidated structural health summary**:

```md
## Directory Structure Health Summary

| Category | Issues Found | Severity | Action Required |
|----------|--------------|----------|-----------------|
| Naming Conventions | X files/dirs | ⚠️ Medium | Rename to kebab-case |
| Directory Depth | Y directories | 🔴 High | Flatten nested structures |
| Co-location | Z files | ⚠️ Medium | Move to proper locations |
| Package Extraction | W candidates | 📦 Consider | Extract shared code |
| Route Structure | V routes | ⚠️ Medium | Add _lib/, _components/ |

### Priority Actions
1. **Immediate**: [Most critical structural fix]
2. **Short-term**: [Important reorganization]
3. **Long-term**: [Package extraction candidates]
```

---

## REPORT GENERATION

### Report Structure

**Generate Report File**:
1. **Date**: YYYY-MM-DD format (today's date)
2. **Directory**: `.ai/reports/chore-reports/YYYY-MM-DD/` (create if needed)
3. **Initial Filename**: `pending-refactor-analysis-<target-slug>.md`
   - `<target-slug>` = kebab-case of target file/directory name
   - Example: `pending-refactor-analysis-kanban-server-actions.md`

### Report Template

```markdown
# Refactoring Analysis: [Target Name]

**Generated**: YYYY-MM-DD
**Target**: [file/directory path]
**Analyst**: Claude Refactoring Specialist

## Executive Summary

[High-level overview: what needs refactoring and why]

## Target Overview

- **Path**: [target path]
- **Lines**: [total lines]
- **Type**: [server-actions | component | service | schema | loader]
- **Risk Level**: [LOW | MEDIUM | HIGH | CRITICAL]

## Pattern Compliance Analysis

### Server Action Analysis (if applicable)
| Action | Lines | Schema | Service | Issues |
|--------|-------|--------|---------|--------|
| ... | ... | ... | ... | ... |

### Service Layer Compliance
| File | Has Service | Recommendation |
|------|-------------|----------------|
| ... | ... | ... |

### Schema-First Compliance
| Check | Status | Notes |
|-------|--------|-------|
| Schema file exists | ✅/❌ | ... |
| Types from z.infer | ✅/❌ | ... |

### Loader Pattern Compliance (if applicable)
| Check | Status | Notes |
|-------|--------|-------|
| Loader exists | ✅/❌ | ... |
| Uses server-only | ✅/❌ | ... |
| Parallel fetching | ✅/❌ | ... |

## Complexity Analysis

### Metrics Summary
| Metric | Value | Threshold | Status |
|--------|-------|-----------|--------|
| Total Lines | X | <400 | ⚠️ |
| Max Function Lines | Y | <50 | ❌ |
| Cyclomatic Complexity | Z | <10 | ... |

### Function-Level Analysis
| Function | Lines | Complexity | Parameters | Risk |
|----------|-------|------------|------------|------|
| ... | ... | ... | ... | ... |

### Automated Tool Results
- **Knip**: [results]
- **Madge**: [circular deps]
- **Type Coverage**: [%]

## Directory & File Structure Analysis

### Directory Naming Issues
| Path | Current | Expected | Recommendation |
|------|---------|----------|----------------|
| ... | ... | ... | ... |

### File Naming Issues
| File | Current Name | Expected Name | Issue |
|------|--------------|---------------|-------|
| ... | ... | ... | ... |

### Structure Depth Issues
| Path | Current Depth | Max Recommended | Action |
|------|---------------|-----------------|--------|
| ... | ... | ... | ... |

### Route Structure Issues
| Route Path | Issue | Recommendation |
|------------|-------|----------------|
| ... | ... | ... |

### Package Extraction Candidates
| Current Location | Used In | Target Package |
|------------------|---------|----------------|
| ... | ... | ... |

### Co-location Issues
| File | Current Location | Recommended Location | Reason |
|------|------------------|---------------------|--------|
| ... | ... | ... | ... |

### Recommended Restructure Plan

**Current Structure**:
```
[directory tree with issues highlighted]
```

**Recommended Structure**:
```
[proposed directory tree]
```

**Migration Steps**:
1. [ ] [Step 1]
2. [ ] [Step 2]
...

### Directory Structure Health Summary

| Category | Issues Found | Severity | Action Required |
|----------|--------------|----------|-----------------|
| Naming Conventions | X | ⚠️/✅ | ... |
| Directory Depth | Y | ⚠️/✅ | ... |
| Co-location | Z | ⚠️/✅ | ... |
| Package Extraction | W | 📦/✅ | ... |
| Route Structure | V | ⚠️/✅ | ... |

## Test Coverage

### Current Coverage
| Component | Test File | Status |
|-----------|-----------|--------|
| ... | ... | ... |

### Missing Tests
- [ ] [test 1]
- [ ] [test 2]

## Refactoring Plan

### Phase 1: [Description]
**Priority**: HIGH/MEDIUM/LOW
**Risk**: LOW/MEDIUM/HIGH

#### Tasks:
1. [Task 1]
2. [Task 2]

#### Validation:
- [ ] Tests pass: `pnpm test:unit`
- [ ] Types pass: `pnpm typecheck`

### Phase 2: [Description]
...

## Implementation Checklist

```json
[
  {"content": "Create backup branch", "priority": "high"},
  {"content": "Extract [X] to service", "priority": "high"},
  {"content": "Add missing tests", "priority": "medium"},
  {"content": "Update documentation", "priority": "low"}
]
```

## Validation Commands

```bash
pnpm typecheck
pnpm lint:fix
pnpm test:unit
pnpm build
```

## Notes

[Additional context, technical debt notes, future considerations]

---
*Generated by Claude Refactoring Analyst*
```

---

## GITHUB ISSUE CREATION

After creating the report, create a GitHub issue:

```bash
# Create refactoring analysis issue
gh issue create \
  --repo MLorneSmith/2025slideheroes \
  --title "Refactor: [target-name]" \
  --body-file .ai/reports/chore-reports/<date>/pending-refactor-analysis-<slug>.md \
  --label "type:chore" \
  --label "status:ready" \
  --label "priority:medium"

# Capture issue number and rename report
# OLD: pending-refactor-analysis-<slug>.md
# NEW: <issue#>-refactor-analysis-<slug>.md
mv .ai/reports/chore-reports/<date>/pending-refactor-analysis-<slug>.md \
   .ai/reports/chore-reports/<date>/<issue-number>-refactor-analysis-<slug>.md
```

---

## TARGET FILE(S) TO ANALYZE

**Target from arguments**: $ARGUMENTS

<validation>
If $ARGUMENTS is empty:
- Use AskUserQuestion to prompt: "Which file or directory would you like to analyze for refactoring?"

If $ARGUMENTS is a directory:
- Analyze all .ts/.tsx files within
- Focus on largest/most complex files

If $ARGUMENTS is a file:
- Validate it exists using Read tool before proceeding
- Proceed with single-file analysis
</validation>

---

## FINAL OUTPUT INSTRUCTIONS

**REQUIRED ACTION**:
1. Parse target from $ARGUMENTS (prompt if empty)
2. Analyze using SlideHeroes patterns
3. Write report to: `.ai/reports/chore-reports/YYYY-MM-DD/pending-refactor-analysis-<slug>.md`
4. Create GitHub issue
5. Rename report with issue number

**DO NOT**:
- Modify any source code files
- Create any test files
- Execute any refactoring
- Make any commits

**DO**:
- Analyze using project-specific patterns
- Detect enhanceAction, service, schema, loader compliance
- Document refactoring opportunities
- Create comprehensive plan with validation commands
- Write report to correct location

---

**REFACTORING ANALYSIS MISSION**:
Focus on SlideHeroes-specific patterns. The report should enable developers to refactor safely while maintaining pattern compliance.
