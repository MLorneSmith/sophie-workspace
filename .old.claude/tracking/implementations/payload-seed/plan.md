---
name: payload-seed
status: backlog
created: 2025-09-30T17:50:50Z
progress: 0%
specification: .claude/tracking/specs/payload-seed.md
github: https://github.com/MLorneSmith/2025slideheroes/issues/458
type: implementation-plan
---

# Implementation Plan: Payload CMS Seeding Infrastructure

## Overview

Implement a production-ready Payload CMS seeding solution using the **Local API approach** to systematically populate the Payload database with test and development data. This infrastructure will handle ~316 records across 10+ collections with complex polymorphic relationships, achieving complete automation of database seeding for development and testing environments.

**Strategic Decision**: Local API approach selected over direct SQL generation based on comprehensive analysis showing:

- **67% faster implementation** (2-3 days vs 6-8 days)
- **75% lower risk profile** (automatic validation and relationship handling)
- **80% less maintenance burden** (adapts to schema changes automatically)
- **Acceptable performance** (~82 seconds vs ~6 seconds for SQL)

**Business Impact**: Reduces manual database setup from 2-4 hours per developer to <2 minutes automated, eliminates data inconsistency issues, and enables reliable E2E testing infrastructure.

---

## Architecture Decisions

### Decision 1: Local API vs Direct SQL Approach

**Choice**: Payload Local API using `getPayload()` and `payload.create()`

**Rationale**:

- Payload automatically handles complex polymorphic relationship tables (`*_rels`)
- Built-in validation ensures data integrity
- Zero maintenance when schemas change
- Type-safe with generated TypeScript types
- Recommended pattern by Payload team

**Alternatives Considered**:

- **Direct SQL Generation**: 6-second seed time but 6-8 days implementation, high maintenance burden, 400+ manual relationship entries
- **Hybrid Approach**: Complexity without significant benefits

**Trade-offs Accepted**:

- 76-second slower seed time (82s vs 6s) - acceptable for dev/test environments
- Higher memory usage (~200-300MB) - not an issue for current dataset
- Cannot bypass Payload validation - actually a benefit for data integrity

⚠️ **Architecture Warning**: Performance Scaling

- **Issue**: Seed time scales linearly with record count
- **Impact**: At ~5,000 records (~20 minutes), SQL approach becomes necessary
- **Mitigation**: Monitor dataset growth, plan SQL migration if scaling beyond 3,000 records
- **Review Required**: Before expanding to production-scale datasets

---

### Decision 2: Reference Resolution Strategy

**Choice**: In-memory UUID cache with `{ref:collection:identifier}` pattern

**Rationale**:

- Existing JSON files already use this format (~400 references)
- Human-readable and git-friendly
- Simple regex replacement with O(1) lookup performance
- Easy to debug and validate

**Implementation**:

```typescript
// Reference format in JSON
"course": "{ref:courses:ddm}"
"downloads": ["{ref:downloads:template1}", "{ref:downloads:template2}"]

// Resolution
const idMap = new Map<string, string>();
idMap.set('courses:ddm', createdUUID);
// Replace {ref:courses:ddm} with actual UUID
```

**Alternatives Considered**:

- **Database lookups**: Too slow, N+1 query problem
- **Pre-generated UUIDs**: Breaks idempotency
- **Slug-based references**: Less flexible, collection conflicts

---

### Decision 3: Dependency Ordering

**Choice**: Fixed seed order based on foreign key dependencies

**Rationale**:

- Ensures references exist before use
- Prevents foreign key constraint violations
- Deterministic and predictable
- Easy to understand and validate

**Seed Order** (5 levels):

```typescript
Level 0: users, media, downloads (independent)
Level 1: posts, courses (depend on media/downloads)
Level 2: course-lessons, documentation (depend on courses)
Level 3: course-quizzes, surveys (depend on lessons)
Level 4: quiz-questions, survey-questions (depend on quizzes/surveys)
```

**Alternatives Considered**:

- **Dependency graph analysis**: Over-engineered for current needs
- **Parallel processing**: Requires complex conflict resolution
- **Topological sort**: Unnecessary complexity

---

### Decision 4: Error Handling Strategy

**Choice**: Continue on non-critical errors, fail on critical errors with retry logic

**Rationale**:

- Balances robustness with strictness
- Transient database issues resolved automatically
- Non-recoverable errors reported clearly
- Enables partial success scenarios

**Strategy**:

- **Transient errors** (network, locks): Retry 3 times with exponential backoff
- **Data errors** (validation failures): Log warning, skip record, continue
- **Critical errors** (missing references, config issues): Stop immediately

**Alternatives Considered**:

- **Fail-fast**: Too strict, one bad record blocks everything
- **Ignore all errors**: Dangerous, leads to incomplete data
- **Manual intervention**: Defeats automation purpose

---

### Decision 5: CLI Interface Design

**Choice**: Commander-based CLI with progressive flags

**Rationale**:

- Commander already in dependencies
- Familiar Unix-style flag patterns
- Easy to extend with new commands
- Supports dry-run and verbose modes

**Commands**:

```bash
pnpm seed:run                          # Full seed
pnpm seed:run --dry-run                # Validate only
pnpm seed:run -c courses,lessons       # Specific collections
pnpm seed:run -v                       # Verbose output
pnpm seed:validate                     # Pre-seed validation
pnpm seed:analyze                      # Dependency analysis
```

**Alternatives Considered**:

- **Inquirer prompts**: Too interactive for CI/CD
- **Config files**: Overkill for simple operations
- **Yargs**: Commander more lightweight

⚠️ **Architecture Warning**: CLI Complexity

- **Issue**: Too many flags can confuse users
- **Mitigation**: Provide sensible defaults, clear help text
- **Review Required**: User testing before team rollout

---

## Technical Components

### Frontend Components

**Not Applicable**: This is a backend seeding infrastructure with no frontend components.

### Backend Services

#### 1. Payload Local API Integration

**Module**: `apps/payload/src/seed/seed-engine/core/payload-initializer.ts`

**Responsibilities**:

- Initialize Payload with `getPayload()` using minimal seeding config
- Singleton pattern for performance (reuse connection)
- Environment variable validation
- Graceful cleanup on completion

**Key Patterns**:

```typescript
const payload = await getPayload({ config: seedingConfig });
// Use singleton throughout seeding process
// Cleanup automatically handled by Payload 3.x
```

**Configuration**:

- Uses `apps/payload/src/payload.seeding.config.ts` (minimal config for seeding)
- Separate from main `payload.config.ts` to avoid unnecessary initialization
- Environment: `DATABASE_URI`, `PAYLOAD_SECRET`

---

#### 2. JSON Data Loading

**Module**: `apps/payload/src/seed/seed-engine/loaders/json-loader.ts`

**Responsibilities**:

- Load JSON files from `apps/payload/src/seed/seed-data/`
- Parse and validate JSON structure
- Handle file system errors gracefully
- Return typed collection data

**Data Sources** (13 files, ~19k lines):

- `courses.json` - 1 record
- `course-lessons.json` - 25 records with complex relationships
- `course-quizzes.json` - 1 quiz definition
- `quiz-questions.json` - 94 questions with nested options
- `surveys.json` - ~10 survey definitions
- `survey-questions.json` - 246 questions (largest collection)
- `posts.json` - Blog content
- `documentation.json` - Help documentation
- `media-references.json` - 33+ media file references
- `download-references.json` - 4+ downloadable resources

**Validation**:

- JSON parse errors with line numbers
- Required field presence checks
- Type validation for critical fields

---

#### 3. Reference Resolution Engine

**Module**: `apps/payload/src/seed/seed-engine/resolvers/reference-resolver.ts`

**Responsibilities**:

- Parse `{ref:collection:identifier}` patterns throughout data structures
- Build in-memory UUID cache as records are created
- Recursively resolve nested references
- Validate all references before seeding begins

**Algorithm**:

```typescript
// Phase 1: Create record
const created = await payload.create({ collection, data });
resolver.register(collection, identifier, created.id);

// Phase 2: Resolve references in dependent records
const resolved = await resolver.resolve(dependentRecord);
// {ref:courses:ddm} → actual UUID from cache
```

**Complexity**: O(n) for resolution with O(1) cache lookups

**Reference Types**:

- **Simple**: `"{ref:courses:ddm}"` → UUID
- **Array**: `["{ref:downloads:template1}", "{ref:downloads:template2}"]` → [UUID1, UUID2]
- **Nested**: `{"author": {"id": "{ref:users:admin}"}}` → Nested resolution
- **Path-based**: `"{ref:media:/cms/images/lesson-0/thumb.png}"` → Media UUID

---

#### 4. Collection Processors

**Base Module**: `apps/payload/src/seed/seed-engine/processors/base-processor.ts`

**Processor Types**:

1. **ContentProcessor** (generic):
   - Handles standard collections (courses, posts, lessons, etc.)
   - Removes internal metadata (`_ref`, `_status`)
   - Creates records using `payload.create()`

2. **DownloadsProcessor** (specialized):
   - Preserves pre-assigned UUIDs when present
   - Handles external URL references
   - Validates file paths for media

3. **Future processors** (extensible):
   - UsersProcessor for auth-specific logic
   - MediaProcessor for file uploads
   - Custom validation per collection

**Pattern**:

```typescript
abstract class BaseProcessor {
  async preProcess(records): Promise<void>   // Validate batch
  async processRecord(record): Promise<string> // Create single record
  async postProcess(result): Promise<void>   // Verify results
}
```

---

#### 5. Seed Orchestrator

**Module**: `apps/payload/src/seed/seed-engine/core/seed-orchestrator.ts`

**Responsibilities**:

- Main execution coordinator
- Process collections in dependency order
- Manage reference cache lifecycle
- Track progress and report results
- Handle errors and retries

**Workflow**:

```
1. Initialize Payload → 2. Load JSON data → 3. Validate references
          ↓
4. For each collection in order:
   a. Pre-process records
   b. For each record:
      - Resolve references
      - Create via Payload API
      - Register in cache
   c. Post-process results
          ↓
5. Report summary → 6. Cleanup
```

---

### Data Layer

#### Database Schema Considerations

**Payload Relationship Pattern** (no changes needed):

```sql
-- Main table (created by Payload migrations)
CREATE TABLE payload.course_lessons (
  id UUID PRIMARY KEY,
  slug VARCHAR,
  title VARCHAR,
  content JSONB,
  -- No FK columns for relationships
);

-- Relationship table (auto-populated by Payload)
CREATE TABLE payload.course_lessons_rels (
  id SERIAL PRIMARY KEY,
  parent_id UUID NOT NULL,
  path VARCHAR NOT NULL,        -- 'downloads', 'course_id'
  downloads_id UUID,            -- Polymorphic FK
  courses_id UUID,
  "order" INTEGER               -- Array ordering
);
```

**Key Insight**: Payload Local API automatically populates `*_rels` tables based on collection config. **No manual SQL required** for relationships.

---

#### Data Migration Requirements

**None**: Existing Payload migrations handle all schema changes. Seeding only populates data.

---

#### Caching Strategy

**In-Memory Reference Cache**:

- Map<string, string> for reference resolution
- Lifecycle: Created at orchestrator start, destroyed at end
- No persistent cache needed (seeding is ephemeral operation)

**Performance**:

- 400 references fit easily in memory (~50KB)
- O(1) lookup performance
- Cleared after each seed run

---

#### Data Validation Rules

**Pre-Seeding Validation**:

1. All JSON files parse correctly
2. All referenced collections exist in Payload config
3. All `{ref:}` patterns are syntactically valid
4. Required fields present in all records

**Runtime Validation** (by Payload):

- Field type validation (string, number, JSONB, etc.)
- Required field enforcement
- Lexical content structure validation
- Unique constraint checks (slug, email, etc.)

**Post-Seeding Verification**:

1. Record counts match expectations
2. Sample relationship integrity checks
3. Lexical content parseable
4. No orphaned relationships

---

### Infrastructure

#### Deployment Considerations

**Environment Requirements**:

- Node.js 20+
- PostgreSQL 14+ (Supabase)
- Payload CMS 3.x
- Environment variables: `DATABASE_URI`, `PAYLOAD_SECRET`

**Execution Contexts**:

1. **Local Development**: Direct execution via `pnpm seed:run`
2. **CI/CD**: Automated in GitHub Actions after migrations
3. **Integration Tests**: Called by E2E test setup

**No Changes Needed**:

- Uses existing Supabase instance
- No new infrastructure provisioning
- Works with current Docker setup

---

#### Environment Configuration

**Environment Variables** (existing):

```bash
DATABASE_URI=postgresql://user:pass@localhost:54322/postgres
PAYLOAD_SECRET=your-secret-key
```

**Additional Config** (optional):

```bash
SEED_TIMEOUT=120000       # 2 minutes
SEED_MAX_RETRIES=3
SEED_BATCH_SIZE=50
```

---

#### Monitoring and Logging

**Logging Levels**:

- **INFO**: Progress updates, collection starts/completions
- **DEBUG**: Individual record creation (with `--verbose`)
- **WARN**: Non-critical errors (skipped records)
- **ERROR**: Critical failures (reference errors, config issues)

**Progress Indicators**:

```
┌──────────────────────────────────────────────────┐
│ Payload CMS Seeding Engine                      │
└──────────────────────────────────────────────────┘

courses              [████████████████████] 1/1 (100%)
✓ courses: 1 success, 0 failed, 245ms

course-lessons       [████████████████████] 25/25 (100%)
✓ course-lessons: 25 success, 0 failed, 6210ms

┌──────────────────────────────────────────────────┐
│ Seeding Complete!                                │
└──────────────────────────────────────────────────┘

Summary:
  ✓ Success: 316/316
  ✗ Failed:  0/316
  ⏱ Duration: 82.45s
  ⚡ Avg speed: 3.8 records/s
```

**Metrics Tracked**:

- Total records processed
- Success/failure counts per collection
- Duration per collection
- Overall throughput (records/second)
- Slowest collections (top 3)

---

#### Security Hardening

**Environment-Based Execution**:

```typescript
// Prevent accidental production seeding
if (process.env.NODE_ENV === 'production') {
  throw new Error('Seeding disabled in production environment');
}
```

**Database Safety**:

- Read-only checks (can be added if needed)
- Transaction support (future enhancement)
- Rollback capability (future enhancement)

**No Security Concerns**:

- Development/testing only
- No external API calls
- No sensitive data exposure
- Uses existing Payload authentication

---

## Implementation Phases

### Phase 1: Foundation (8 hours)

**Objective**: Create core infrastructure and CLI skeleton

**Tasks**:

- [ ] Create directory structure: `apps/payload/src/seed/seed-engine/`
- [ ] Implement TypeScript types (`types.ts`)
- [ ] Create configuration constants (`config.ts`)
- [ ] Implement CLI with Commander (`index.ts`)
- [ ] Build Payload initializer with singleton pattern
- [ ] Create base logger utility with chalk
- [ ] Unit test: Payload initialization
- [ ] Unit test: CLI argument parsing

**Deliverables**:

- Working CLI that accepts flags
- Payload initialization tested
- Basic error handling

**Key Files**:

- `apps/payload/src/seed/seed-engine/index.ts` - CLI entry
- `apps/payload/src/seed/seed-engine/core/payload-initializer.ts` - Payload setup
- `apps/payload/src/seed/seed-engine/types.ts` - TypeScript definitions
- `apps/payload/src/seed/seed-engine/config.ts` - Constants and seed order
- `apps/payload/src/seed/seed-engine/utils/logger.ts` - Colored logging

**Estimated Effort**: 8 hours

---

### Phase 2: Core Features (12 hours)

**Objective**: Implement seeding engine with reference resolution

**Tasks**:

- [ ] Implement JSON loader with validation
- [ ] Build reference resolver with regex parser
- [ ] Create reference cache with Map-based storage
- [ ] Implement base processor abstract class
- [ ] Create content processor for generic collections
- [ ] Create downloads processor for UUID preservation
- [ ] Build error handler with exponential backoff
- [ ] Implement progress tracker with ASCII bars
- [ ] Unit test: Reference resolution (all patterns)
- [ ] Unit test: JSON loading and validation
- [ ] Unit test: Error handler retry logic
- [ ] Integration test: Seed single collection (media)

**Deliverables**:

- Complete reference resolution system
- Working processors for all collection types
- Retry logic for transient failures
- Progress tracking with real-time updates

**Key Files**:

- `apps/payload/src/seed/seed-engine/loaders/json-loader.ts`
- `apps/payload/src/seed/seed-engine/resolvers/reference-resolver.ts`
- `apps/payload/src/seed/seed-engine/processors/base-processor.ts`
- `apps/payload/src/seed/seed-engine/processors/content-processor.ts`
- `apps/payload/src/seed/seed-engine/processors/downloads-processor.ts`
- `apps/payload/src/seed/seed-engine/utils/error-handler.ts`
- `apps/payload/src/seed/seed-engine/utils/progress-tracker.ts`

**Estimated Effort**: 12 hours

---

### Phase 3: Enhancement (6 hours)

**Objective**: Complete all collections and add advanced features

**Tasks**:

- [ ] Implement seed orchestrator with dependency ordering
- [ ] Add dry-run mode (validation without creation)
- [ ] Add verbose logging mode
- [ ] Implement collection filtering (--collections flag)
- [ ] Create dependency analyzer for troubleshooting
- [ ] Add performance monitoring
- [ ] Build post-seed validation
- [ ] Integration test: Full seed workflow (all collections)
- [ ] Integration test: Idempotency (run twice)
- [ ] Integration test: Reference resolution edge cases

**Deliverables**:

- Complete orchestrator handling all 10+ collections
- Dry-run validation mode
- Collection filtering for targeted seeding
- Performance metrics reporting

**Key Files**:

- `apps/payload/src/seed/seed-engine/core/seed-orchestrator.ts`
- `apps/payload/src/seed/seed-engine/validators/dependency-validator.ts`
- `apps/payload/src/seed/seed-engine/validators/data-validator.ts`
- `apps/payload/src/seed/seed-engine/utils/performance-monitor.ts`

**Estimated Effort**: 6 hours

---

### Phase 4: Polish & Deploy (4 hours)

**Objective**: Integration, documentation, and testing

**Tasks**:

- [ ] Add npm scripts to `apps/payload/package.json`
- [ ] Integrate with Supabase reset command
- [ ] Create comprehensive README
- [ ] Add JSDoc comments to all public functions
- [ ] Document troubleshooting guide
- [ ] Write E2E test: Full reset + seed workflow
- [ ] Write E2E test: Verify relationship integrity
- [ ] Write E2E test: Lexical content rendering
- [ ] Performance test: Measure actual seed time
- [ ] Load test: Verify memory usage within bounds

**Deliverables**:

- Complete documentation (README, JSDoc)
- Integration with existing workflows
- E2E test coverage for validation
- Performance benchmarks confirmed

**Key Files**:

- `apps/payload/README.md` - Updated with seeding section
- `apps/payload/docs/SEEDING.md` - Comprehensive guide
- `apps/e2e/tests/payload/seeding.spec.ts` - E2E validation
- `.claude/commands/database/supabase-reset.md` - Updated with --seed flag

**Estimated Effort**: 4 hours

---

## Task Categories (Preview)

High-level task categories for decomposition phase:

### Database & Models

- **Description**: Configure Payload collections and validate schema compatibility
- **Tasks**: Verify collection configs, test relationship handling, validate Lexical content structure
- **Estimated Effort**: 2 hours

### API Development

- **Description**: Implement core seeding API using Payload Local API
- **Tasks**: Build initializer, create processors, implement orchestrator
- **Estimated Effort**: 12 hours

### Data Processing

- **Description**: Reference resolution and JSON loading infrastructure
- **Tasks**: Build resolver, create cache, implement validators
- **Estimated Effort**: 8 hours

### CLI & Tooling

- **Description**: Command-line interface and user experience
- **Tasks**: Build CLI with Commander, add progress tracking, implement logging
- **Estimated Effort**: 6 hours

### Testing

- **Description**: Unit, integration, and E2E test coverage
- **Tasks**: Unit tests for resolvers, integration tests for seeding, E2E validation tests
- **Estimated Effort**: 8 hours

### Documentation

- **Description**: README, JSDoc, troubleshooting guide
- **Tasks**: Write comprehensive docs, add inline comments, create examples
- **Estimated Effort**: 4 hours

---

## Dependencies

### External Dependencies

**Required (existing)**:

- Payload CMS 3.57.0+ (already installed)
- Commander 12.1.0+ (already in dependencies)
- Chalk 5.3.0+ (already in dependencies)
- tsx (already in dependencies for TypeScript execution)
- PostgreSQL 14+ via Supabase (running locally)

**New Dependencies**: **None** - all required packages already present

### Internal Dependencies

**Must Exist Before Implementation**:

- ✅ `apps/payload/src/payload.config.ts` - Main Payload config
- ✅ `apps/payload/src/payload.seeding.config.ts` - Minimal seeding config
- ✅ `apps/payload/src/seed/seed-data/*.json` - 13 JSON seed files
- ✅ `apps/payload/src/collections/*.ts` - 12 collection schemas
- ✅ Supabase running locally (port 54322)

**Will Create**:

- `apps/payload/src/seed/seed-engine/` - Complete seeding infrastructure
- `apps/e2e/tests/payload/seeding.spec.ts` - E2E validation tests

### Blocking Dependencies

**Critical Path**:

1. ✅ **Payload config valid** - Confirmed working
2. ✅ **Supabase instance running** - Local development setup
3. ✅ **JSON seed data exists** - 13 files with ~316 records
4. ⚠️ **Lexical conversion issue** - Bunny video shortcodes (Issue #9 related)

**Non-Blocking**:

- Lexical conversion can be fixed in parallel
- Seeding will work with current data structure
- Video rendering verification can happen post-implementation

---

## Risk Mitigation

### Technical Risks

| Risk | Probability | Impact | Mitigation Strategy |
|------|-------------|--------|---------------------|
| **Payload API breaking changes** | Low | Medium | Version lock Payload to 3.57.x, test on minor upgrades before accepting |
| **Memory exhaustion on large datasets** | Low | Low | Current dataset (316 records) well within limits; monitor if expanding >3,000 records |
| **Reference resolution failures** | Medium | High | Comprehensive pre-seed validation, clear error messages with missing reference details |
| **Payload hooks interfering** | Low | Medium | Document hook behavior, use `disableHooks` option if needed (future enhancement) |
| **Database connection issues** | Medium | Medium | Exponential backoff retry (3 attempts), clear error messages with connection details |
| **Lexical content parsing errors** | Low | Low | Payload handles validation, fail fast with clear error message |

**Overall Risk Level**: 🟢 **Low** (mature API, well-defined scope, comprehensive analysis)

### Operational Risks

| Risk | Probability | Impact | Mitigation Strategy |
|------|-------------|--------|---------------------|
| **Team unfamiliarity with seeding** | Medium | Low | Clear documentation, examples in README, team walkthrough session |
| **Seed data becomes stale** | High | Medium | Document update process, add to feature development checklist, quarterly review |
| **Accidental production seeding** | Very Low | Critical | Environment check blocks production, separate command from migrations, require explicit flag |
| **CI/CD timeouts** | Low | Medium | 120-second timeout is 40% buffer over 82s actual time, increase CI timeout if needed |
| **Incomplete relationships** | Low | High | Post-seed validation with spot checks, E2E tests verify critical relationships |

### Timeline Risks

| Risk | Probability | Impact | Mitigation Strategy |
|------|-------------|--------|---------------------|
| **Implementation takes longer than estimated** | Medium | Low | Buffer built into estimates (30 hours estimated, 24 hours likely), core functionality prioritized |
| **Testing reveals unexpected issues** | Low | Medium | Comprehensive unit tests catch issues early, integration tests validate end-to-end |
| **Lexical conversion delays** | Low | Low | Investigation timeboxed to 2 hours, can proceed with current structure |
| **Scope creep** | Medium | Medium | Strict adherence to specification, defer enhancements to post-MVP |

**Risk Response Plan**:

- **High Impact Risks**: Stop implementation, escalate immediately
- **Medium Impact Risks**: Document workaround, continue with caution
- **Low Impact Risks**: Log for future resolution, proceed

⚠️ **Critical Risk Alert**: None identified - all risks are low-medium with clear mitigations

---

## Success Criteria (Technical)

### Functional Criteria

- ✅ **All 316+ records seed successfully** with 100% success rate
- ✅ **All relationships correctly established** across `*_rels` tables
- ✅ **Reference resolution works** for all 400+ `{ref:}` patterns
- ✅ **Idempotent execution** - can run multiple times without errors
- ✅ **CLI flags functional** - dry-run, verbose, collection filtering
- ✅ **Error handling robust** - retries transient failures, reports permanent errors clearly

### Performance Criteria

- ✅ **Seeding completes in <120 seconds** for full dataset (target: 82 seconds)
- ✅ **Memory usage <512MB** during execution (expected: 200-300MB)
- ✅ **Progress feedback responsive** - updates every 100ms minimum
- ✅ **Dry-run validation <10 seconds** for pre-flight checks

### Quality Criteria

- ✅ **Unit test coverage >90%** for core modules (resolver, loader, error handler)
- ✅ **Integration tests pass** for single collection and full workflow
- ✅ **E2E tests validate** relationship integrity and Lexical rendering
- ✅ **No TypeScript errors** - strict mode enforced
- ✅ **No linting warnings** - ESLint clean
- ✅ **Documentation complete** - README, JSDoc, troubleshooting guide

### Integration Criteria

- ✅ **Supabase reset integration** - `pnpm supabase:web:reset --seed` works
- ✅ **Package.json scripts** - `pnpm seed:run`, `pnpm seed:validate`, `pnpm seed:dry`
- ✅ **CI/CD compatibility** - runs in GitHub Actions without modifications
- ✅ **E2E test hooks** - called automatically before Payload tests

---

## Estimated Effort

### By Phase

| Phase | Description | Hours |
|-------|-------------|-------|
| **Phase 1** | Foundation (CLI, types, Payload init) | 8 |
| **Phase 2** | Core Features (resolver, processors, loaders) | 12 |
| **Phase 3** | Enhancement (orchestrator, validation, filtering) | 6 |
| **Phase 4** | Polish & Deploy (docs, tests, integration) | 4 |
| **Total** | | **30 hours** |

**Confidence Level**: High (80%) - Well-defined scope, comprehensive analysis, clear requirements

### By Resource Type

| Resource Type | Hours | Percentage |
|---------------|-------|------------|
| **Backend Development** | 18 | 60% |
| **Testing (Unit + Integration + E2E)** | 8 | 27% |
| **Documentation** | 4 | 13% |
| **Total** | **30** | **100%** |

### By Risk Level

| Risk Level | Hours | Percentage |
|------------|-------|------------|
| **Low Risk** (standard implementation) | 20 | 67% |
| **Medium Risk** (reference resolution, error handling) | 8 | 27% |
| **High Risk** (none identified) | 0 | 0% |
| **Buffer** | 2 | 6% |
| **Total** | **30** | **100%** |

---

## Timeline Projection

**Start Date**: TBD (upon approval)

**Estimated Completion**: 4 days (based on 8-hour workdays)

**Milestones**:

- **Day 1**: Phase 1 complete (foundation)
- **Day 2**: Phase 2 complete (core features) - 75% functionality
- **Day 3**: Phase 3 complete (enhancement) - 95% functionality
- **Day 4**: Phase 4 complete (polish & deploy) - 100% production-ready

**Critical Path**: Phases must be completed sequentially (each builds on previous)

---

## Validation & Testing Strategy

### Unit Tests (Vitest)

**Coverage Target**: >90%

**Test Suites**:

1. **Reference Resolver** (`reference-resolver.test.ts`):
   - Simple reference resolution
   - Array reference resolution
   - Nested object resolution
   - Invalid reference detection
   - Missing reference errors
   - Cache registration and lookup
   - Edge cases (empty strings, null values)

2. **JSON Loader** (`json-loader.test.ts`):
   - Load single collection
   - Load all collections
   - Parse errors with line numbers
   - Missing file handling
   - Invalid JSON handling

3. **Error Handler** (`error-handler.test.ts`):
   - Exponential backoff calculation
   - Retry logic (1-3 attempts)
   - Non-retryable error detection
   - Error grouping and reporting

4. **Progress Tracker** (`progress-tracker.test.ts`):
   - Progress bar rendering
   - Collection reporting
   - Summary generation
   - ETA calculation

**Estimated Effort**: 4 hours

---

### Integration Tests (Vitest + Test DB)

**Coverage Target**: All happy paths + major error scenarios

**Test Suites**:

1. **Single Collection Seeding**:
   - Seed downloads collection (simplest)
   - Verify record created in database
   - Verify UUID registered in cache
   - Cleanup test data

2. **Full Workflow**:
   - Reset test database
   - Seed all collections in order
   - Verify record counts match expectations
   - Verify relationships in `*_rels` tables
   - Verify Lexical content structure

3. **Idempotency**:
   - Seed once
   - Seed again (should not duplicate)
   - Verify record counts unchanged
   - Verify no errors

4. **Error Scenarios**:
   - Missing JSON file
   - Invalid reference
   - Database connection failure (mocked)
   - Partial success (some records fail)

**Estimated Effort**: 3 hours

---

### E2E Tests (Playwright)

**Coverage Target**: 100% critical user flows

**Test Suites** (`apps/e2e/tests/payload/seeding.spec.ts`):

1. **Full Reset + Seed Workflow**:

   ```typescript
   test('reset database and seed successfully', async ({ page }) => {
     // Reset Supabase
     await exec('pnpm supabase:web:reset');

     // Seed Payload
     await exec('pnpm seed:run');

     // Verify Payload admin UI shows records
     await page.goto('http://localhost:3000/admin/collections/courses');
     await expect(page.locator('[data-test="course-ddm"]')).toBeVisible();
   });
   ```

2. **Relationship Integrity**:

   ```typescript
   test('lesson relationships are correct', async () => {
     const lesson = await payload.findOne({
       collection: 'course-lessons',
       where: { slug: { equals: 'lesson-0' } }
     });

     expect(lesson.downloads).toHaveLength(2);
     expect(lesson.course_id).toBeTruthy();
   });
   ```

3. **Lexical Content Rendering**:

   ```typescript
   test('lesson content renders without errors', async ({ page }) => {
     await page.goto('http://localhost:3000/courses/ddm/lessons/lesson-0');
     await expect(page.locator('[data-lexical-content]')).toBeVisible();
     // No Lexical parsing errors in console
   });
   ```

4. **Idempotent Execution**:

   ```typescript
   test('seeding twice does not duplicate records', async () => {
     await exec('pnpm seed:run');
     const countBefore = await countRecords('courses');

     await exec('pnpm seed:run');
     const countAfter = await countRecords('courses');

     expect(countAfter).toBe(countBefore);
   });
   ```

**Estimated Effort**: 1 hour

---

## Next Steps

### Immediate Actions (Day 1)

1. **Approve This Plan**:
   - Review architecture decisions
   - Confirm scope boundaries
   - Accept timeline estimate

2. **Fix Lexical Conversion** (if needed):
   - Investigate Bunny video shortcode issue
   - Update `apps/payload/src/seed/seed-conversion/utils/markdown-to-lexical.ts`
   - Re-run conversion: `pnpm seed:convert`
   - Timebox to 2 hours (can proceed without if necessary)

3. **Begin Phase 1**:
   - Create directory structure
   - Implement types and config
   - Build CLI skeleton

### Pre-Implementation Checklist

- ✅ Payload config valid and tested
- ✅ Supabase running locally
- ✅ JSON seed data exists and validated
- ✅ Environment variables configured
- ⚠️ Lexical conversion issue investigated (non-blocking)

### Rollout Plan

**Week 1: Implementation**

- Days 1-4: Complete all phases

**Week 2: Testing & Integration**

- Days 1-2: Comprehensive testing
- Day 3: Integration with Supabase reset
- Day 4: Team walkthrough and documentation

**Week 3: Team Adoption**

- Days 1-5: Monitor usage, gather feedback, iterate

---

## Appendix: File Structure

```
apps/payload/src/seed/
├── seed-engine/                        # New seeding infrastructure
│   ├── index.ts                        # CLI entry point
│   ├── types.ts                        # TypeScript definitions
│   ├── config.ts                       # Configuration constants
│   │
│   ├── core/                           # Core engine components
│   │   ├── payload-initializer.ts      # Payload Local API setup
│   │   ├── seed-orchestrator.ts        # Main orchestration logic
│   │   └── collection-processor.ts     # Per-collection seeding
│   │
│   ├── loaders/                        # JSON data loading
│   │   ├── json-loader.ts              # File system loader
│   │   └── validation-loader.ts        # Schema validation
│   │
│   ├── resolvers/                      # Reference resolution
│   │   ├── reference-resolver.ts       # Main resolver engine
│   │   ├── reference-parser.ts         # Parse {ref:...} syntax
│   │   └── reference-cache.ts          # In-memory UUID cache
│   │
│   ├── processors/                     # Collection-specific logic
│   │   ├── base-processor.ts           # Abstract base class
│   │   ├── content-processor.ts        # Generic content handler
│   │   └── downloads-processor.ts      # Downloads collection handler
│   │
│   ├── validators/                     # Validation layer
│   │   ├── dependency-validator.ts     # Collection dependency checks
│   │   └── data-validator.ts           # Business rules validation
│   │
│   └── utils/                          # Utilities
│       ├── logger.ts                   # Chalk-based colored logging
│       ├── progress-tracker.ts         # Progress reporting
│       ├── error-handler.ts            # Error handling & retries
│       └── performance-monitor.ts      # Performance metrics
│
├── seed-data/                          # Existing JSON files (unchanged)
│   ├── courses.json
│   ├── course-lessons.json
│   ├── quiz-questions.json
│   └── ... (13 total files)
│
└── seed-conversion/                    # Existing conversion scripts (unchanged)
    ├── utils/
    │   └── markdown-to-lexical.ts      # May need Bunny video fix
    └── ...
```

**Total New Files**: ~20 TypeScript modules + 3 test suites

**Estimated Lines of Code**: ~2,500 (well-structured, commented)

---

## Appendix: Key Algorithms

### Reference Resolution Algorithm

```typescript
/**
 * Resolves all {ref:collection:identifier} patterns recursively
 * Time Complexity: O(n) where n = number of fields in object
 * Space Complexity: O(d) where d = depth of nesting
 */
async resolve(record: SeedRecord): Promise<SeedRecord> {
  return this.deepResolve(structuredClone(record));
}

private deepResolve(obj: unknown): unknown {
  // Base case: string - check for reference pattern
  if (typeof obj === 'string') {
    return obj.replace(/\{ref:([^:]+):([^}]+)\}/g, (match, coll, id) => {
      const uuid = this.cache.get(`${coll}:${id}`);
      if (!uuid) throw new Error(`Unresolved: ${match}`);
      return uuid;
    });
  }

  // Recursive case: array
  if (Array.isArray(obj)) {
    return obj.map(item => this.deepResolve(item));
  }

  // Recursive case: object
  if (obj && typeof obj === 'object') {
    const resolved: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      resolved[key] = this.deepResolve(value);
    }
    return resolved;
  }

  // Base case: primitive
  return obj;
}
```

### Dependency Ordering Algorithm

```typescript
/**
 * Processes collections in fixed dependency order
 * Ensures all referenced records exist before creation
 */
const SEED_ORDER = [
  // Level 0: Independent collections
  'users', 'media', 'downloads',

  // Level 1: Depend on Level 0
  'posts', 'courses',

  // Level 2: Depend on Level 0-1
  'course-lessons', 'documentation',

  // Level 3: Depend on Level 0-2
  'course-quizzes', 'surveys',

  // Level 4: Depend on Level 0-3
  'quiz-questions', 'survey-questions',
];

// No topological sort needed - fixed order is sufficient
```

### Error Retry Algorithm

```typescript
/**
 * Exponential backoff with jitter
 * Retries transient errors up to maxRetries times
 */
async withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (!this.isRetryable(error)) throw error;
      if (attempt >= this.maxRetries) break;

      const delay = this.calculateDelay(attempt);
      await this.sleep(delay);
    }
  }

  throw lastError;
}

private calculateDelay(attempt: number): number {
  const exponential = this.retryDelay * Math.pow(2, attempt - 1);
  const jitter = Math.random() * 500;
  return Math.min(exponential + jitter, 10000); // Cap at 10s
}
```

---

**Plan Version**: 1.0
**Status**: Ready for approval and implementation
**Last Updated**: 2025-09-30T17:50:50Z

---

## Tasks Created - 2025-09-30T18:02:52Z

### Task Overview

Total Tasks: 12

- Parallel Tasks: 7 (58.3% - can run simultaneously)
- Sequential Tasks: 5 (41.7% - must run in order)
- Total Effort: 36 hours
- Optimal Execution: ~12 hours (with 3-4 parallel agents)
- Speedup Factor: 3.0x with parallel execution

### Task List

| ID | Task Name | Hours | Dependencies | Parallel | Agent |
|----|-----------|-------|--------------|----------|-------|
| 001 | Create directory structure and TypeScript types | 2 | None | ✅ | typescript-expert |
| 002 | Implement Payload initializer and base utilities | 3 | 001 | ❌ | nodejs-expert |
| 003 | Create CLI interface with Commander | 2 | 001, 002 | ❌ | nodejs-expert |
| 004 | Implement JSON data loader with validation | 2 | 001 | ✅ | nodejs-expert |
| 005 | Build reference resolution engine | 4 | 001 | ✅ | nodejs-expert |
| 006 | Create collection processors | 4 | 001, 002 | ✅ | nodejs-expert |
| 007 | Implement progress tracker utility | 2 | 001 | ✅ | nodejs-expert |
| 008 | Build seed orchestrator | 5 | 002, 004, 005, 006, 007 | ❌ | nodejs-expert |
| 009 | Add data validators | 3 | 001, 004, 005 | ✅ | nodejs-expert |
| 010 | Integrate with Supabase reset and add npm scripts | 2 | 003, 008 | ✅ | devops-expert |
| 011 | Create comprehensive test suite | 6 | 008, 009, 010 | ❌ | testing-expert |
| 012 | Create documentation and troubleshooting guide | 3 | 008, 010, 011 | ✅ | documentation-expert |

### Execution Strategy

#### Batch 1 - Foundation (Sequential, 2 hours)

- **Task**: 001
- **Agent**: typescript-expert
- **Description**: Create directory structure and type definitions
- **Critical**: Must complete before any other work begins

#### Batch 2 - Core Infrastructure (Mixed, 3 hours)

- **Sequential**: 002 (after 001)
- **Agent**: nodejs-expert
- **Description**: Payload initializer and utilities
- **Note**: Blocks some parallel work but enables others

#### Batch 3 - Parallel Core Features (Parallel, 4-5 hours)

- **Tasks**: 004, 005, 006, 007, 009 (can run simultaneously after 001/002)
- **Agents**: nodejs-expert (multiple instances)
- **Description**: JSON loader, reference resolver, processors, progress tracker, validators
- **Parallelization**: 5 tasks running concurrently = 5x speedup potential

#### Batch 4 - CLI (Sequential, 2 hours)

- **Task**: 003 (after 001, 002)
- **Agent**: nodejs-expert
- **Description**: Command-line interface
- **Note**: Can overlap with Batch 3

#### Batch 5 - Orchestration (Sequential, 5 hours)

- **Task**: 008 (after 002, 004, 005, 006, 007)
- **Agent**: nodejs-expert
- **Description**: Main orchestrator coordinating all components
- **Critical**: Integration point for all core features

#### Batch 6 - Integration & Testing (Mixed, 6-8 hours)

- **Parallel**: 010 (after 003, 008)
- **Sequential**: 011 (after 008, 009, 010)
- **Parallel**: 012 (can start after 008, 010)
- **Agents**: devops-expert, testing-expert, documentation-expert
- **Description**: Final integration, comprehensive testing, documentation

### Dependency Graph Validation

✅ **No circular dependencies detected**
✅ **All task references valid**
✅ **Critical path identified**: 001 → 002 → 008 → 011 (max chain depth: 4)
✅ **Parallel opportunities maximized**: 58.3% of tasks can run concurrently

### Dependency Analysis

**Level 0 (Foundation)**: Task 001 (2 hours)

- No dependencies, single task

**Level 1 (After Foundation)**: Tasks 002, 004, 005, 006, 007 (can start after 001)

- 5 tasks, 4 can run in parallel (004, 005, 006, 007)
- Task 002 must run first to enable later work
- Optimal: 3-4 hours with parallel execution

**Level 2 (After Core)**: Tasks 003, 008, 009 (require Level 1 completion)

- Task 003 depends on 001, 002 (2 hours)
- Task 009 can run in parallel (3 hours)
- Task 008 requires 002, 004, 005, 006, 007 (5 hours, critical path)
- Optimal: 5 hours (003 and 009 can overlap)

**Level 3 (Integration)**: Tasks 010, 011 (require Level 2 completion)

- Task 010 depends on 003, 008 (2 hours, can run in parallel with 012 setup)
- Task 011 depends on 008, 009, 010 (6 hours, critical path)

**Level 4 (Documentation)**: Task 012 (can start after 008, 010)

- 3 hours, can overlap with 011
- Documentation can be written while tests are running

### Performance Estimates

**Sequential Execution**: 36 hours

- All tasks run one after another
- No parallelization

**Parallel Execution (Optimal, 3-4 agents)**: ~12 hours

- Level 0: 2 hours (001)
- Level 1: 4 hours (002 + parallel 004,005,006,007)
- Level 2: 5 hours (008 is critical path, 003,009 overlap)
- Level 3: 6 hours (011 is critical path, 010,012 overlap)
- **Total**: ~12 hours wall-clock time

**Time Saved**: 24 hours (66.7% reduction)
**Speedup Factor**: 3.0x with optimal agent deployment

### Risk Factors

- **File conflicts**: None identified (tasks work on different files/modules)
- **Complexity**: 7/10 (moderate to high - reference resolution and orchestration are complex)
- **Dependencies**: Maximum chain depth of 4 tasks (001→002→008→011)
- **Integration points**: 2 critical (orchestrator in 008, testing in 011)
- **Testing dependencies**: Task 011 blocks final completion (must wait for all implementation)

### Agent Recommendations

- **typescript-expert**: Task 001 (types and structure)
- **nodejs-expert**: Tasks 002-009 (core implementation, can use multiple instances)
- **devops-expert**: Task 010 (integration and scripts)
- **testing-expert**: Task 011 (comprehensive testing)
- **documentation-expert**: Task 012 (guides and docs)

### Parallelization Opportunities

**Maximum Concurrent Tasks**:

- Batch 3: 5 tasks can run simultaneously (004, 005, 006, 007, 009)
- This is the widest parallelization point
- Requires 5 agent instances for maximum speedup

**Bottlenecks**:

1. Task 001 (foundation) - single entry point
2. Task 008 (orchestrator) - integration point
3. Task 011 (testing) - validation gate

**Optimization Strategy**:

- Start with 1 agent for 001 (2 hours)
- Scale to 4-5 agents for Batch 3 (4 hours)
- Reduce to 2-3 agents for Batch 5-6 (6-8 hours)
- Focus resources on critical path (008, 011)

---

## Next Steps

1. **Review task breakdown**: `ls -la .claude/tracking/implementations/payload-seed/*.md`
2. **Sync to GitHub**: `/feature:sync payload-seed` (creates 12 GitHub issues)
3. **Start parallel execution**: `/feature:start payload-seed` (launches agents)
4. **Monitor progress**: `/feature:status payload-seed` (real-time tracking)

**Ready for GitHub sync and parallel execution!**
