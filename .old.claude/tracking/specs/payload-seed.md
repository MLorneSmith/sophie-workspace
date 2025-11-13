---
name: payload-seed
description: Payload CMS Local API seeding infrastructure for development and testing environments
status: draft
created: 2025-09-30T17:33:01Z
type: feature-spec
priority: critical
approach: local-api
estimated_effort: 2-3 days
---

# Feature Specification: Payload CMS Seeding Infrastructure

## Executive Summary

Implement a production-ready Payload CMS seeding solution using the Local API approach to systematically populate the Payload database with test and development data. This feature will provide automated, reliable, and maintainable database seeding for ~316 records across 10+ collections with complex polymorphic relationships.

**Business Value**: Enables reliable database resets with complete test data, reducing manual setup time from hours to seconds and eliminating data inconsistency issues in development/testing environments.

**Strategic Decision**: Use Payload Local API approach over direct SQL generation based on comprehensive analysis showing 67% faster implementation (2-3 days vs 6-8 days), 75% lower risk profile, and 80% less maintenance burden while accepting 76-second slower seed time (~82s vs ~6s).

---

## Problem Statement

### Current State

The Payload seed data infrastructure is **60% complete** with critical gaps:

✅ **Working Components**:

- Raw data collection: 107 files in `seed-data-raw/` (lessons, quizzes, surveys, posts)
- Conversion tooling: `seed-conversion/` with multi-format parsers (mdoc, YAML, TypeScript, HTML)
- JSON output: 13 files in `seed-data/` (~19k lines) with reference system

❌ **Critical Gaps**:

- No automated seeding mechanism (JSON → Database)
- Manual SQL files incomplete (8/16 files empty, ~50% coverage)
- Relationship tables (`*_rels`) mostly unpopulated
- No validation of seeded data integrity
- No integration with database reset workflow

### Impact

**Development Team**:

- Manual database setup takes 2-4 hours per developer
- Inconsistent test data across environments
- Difficult to reproduce issues locally
- Time wasted debugging data-related problems

**Testing/CI**:

- Cannot reliably test Payload functionality end-to-end
- E2E tests may fail due to missing seed data
- No way to verify relationship integrity

**Blocking Issues**:

- Issue #9: Bunny video block implementation needs proper seed data (relates to Lexical conversion)
- Database reset command incomplete without seeding option
- Team onboarding friction

---

## User Stories

### Story 1: Developer Database Reset

**As a** developer working on Payload features
**I want** to reset my local database with complete, valid test data
**So that** I can develop and test features with realistic content without manual setup

**Acceptance Criteria**:

- [ ] Single command resets database and seeds all collections: `pnpm seed:fresh`
- [ ] Seed completes successfully in under 2 minutes
- [ ] All collections populated: courses, lessons, quizzes, questions, surveys, media, downloads, posts, documentation
- [ ] All relationships correctly established (course→lessons, lessons→downloads, etc.)
- [ ] Lexical content properly formatted for rich text rendering
- [ ] Idempotent execution (can run multiple times safely)
- [ ] Clear progress output showing seeding status per collection
- [ ] Error messages actionable if seeding fails

---

### Story 2: Standalone Seeding Script

**As a** developer or CI/CD pipeline
**I want** to seed the database independently of reset operations
**So that** I can populate existing databases or test seeding in isolation

**Acceptance Criteria**:

- [ ] Standalone command available: `pnpm seed` (alias: `pnpm --filter payload seed`)
- [ ] Works with existing database (doesn't require reset)
- [ ] Handles conflicts gracefully (skips or updates existing records)
- [ ] Returns meaningful exit codes (0 = success, 1 = failure)
- [ ] Outputs JSON summary for programmatic consumption (with `--json` flag)
- [ ] Supports dry-run mode: `pnpm seed --dry-run`
- [ ] Supports single collection seeding: `pnpm seed --collection courses`

---

### Story 3: Supabase Reset Integration

**As a** developer using the Supabase reset command
**I want** an option to automatically seed after reset
**So that** I get a fully populated database in one command

**Acceptance Criteria**:

- [ ] Supabase reset command accepts `--seed` flag
- [ ] Seeding happens automatically after schema migration
- [ ] Option is documented in command help text
- [ ] Failure during seeding doesn't corrupt database (transactional)
- [ ] Can specify seed collections: `--seed --collections courses,lessons`

---

### Story 4: Reference Resolution

**As a** seeding system
**I want** to automatically resolve `{ref:collection:identifier}` placeholders
**So that** relationships are correctly established with actual UUIDs

**Acceptance Criteria**:

- [ ] All `{ref:}` patterns detected and resolved before creation
- [ ] Reference map built from created records (identifier → UUID)
- [ ] Nested references supported (references within referenced objects)
- [ ] Clear error if reference target doesn't exist
- [ ] Reference mapping logged for debugging
- [ ] Supports multiple reference formats: `{ref:courses:ddm}`, `{ref:media:/path/to/image.png}`

---

### Story 5: Validation and Error Handling

**As a** developer debugging seeding issues
**I want** comprehensive error messages and validation
**So that** I can quickly identify and fix data problems

**Acceptance Criteria**:

- [ ] Pre-seeding validation: all JSON files exist and parse correctly
- [ ] Schema validation: field types match Payload collection configs
- [ ] Reference validation: all `{ref:}` targets exist before resolution
- [ ] Relationship validation: foreign key constraints satisfied
- [ ] Post-seeding verification: record counts match expectations
- [ ] Detailed error logs with file/line numbers for failures
- [ ] Summary report showing success/failure per collection
- [ ] Rollback support if critical errors occur mid-seeding

---

### Story 6: E2E Testing Verification

**As a** QA engineer or developer
**I want** Playwright E2E tests to verify seeded data integrity
**So that** we have confidence the seeding process works correctly

**Acceptance Criteria**:

- [ ] E2E test suite: `apps/e2e/tests/payload-seeding.spec.ts`
- [ ] Test: All collections have expected record counts
- [ ] Test: Sample lesson has correct relationships (course, downloads)
- [ ] Test: Lexical content renders without errors
- [ ] Test: Media files are accessible
- [ ] Test: Quiz questions linked to correct quiz
- [ ] Test: Survey relationships intact
- [ ] Test: Seeding is idempotent (can run twice without duplicates)
- [ ] Tests run in CI/CD pipeline

---

### Story 7: Bunny Video Block Data (Issue #9 Related)

**As a** content renderer
**I want** Bunny video data properly structured in seed data
**So that** the BunnyVideo block component can render videos correctly

**Acceptance Criteria**:

- [ ] Investigate current Lexical conversion of Bunny video shortcodes
- [ ] Determine if conversion issue exists or if data structure is correct
- [ ] Document expected data structure for BunnyVideo block:

  ```json
  {
    "type": "bunny-video",
    "videoId": "2620df68-c2a8-4255-986e-24c1d4c1dbf2",
    "libraryId": "264486",
    "aspectRatio": "16:9",
    "children": [{"type": "text", "text": ""}]
  }
  ```

- [ ] Update conversion if needed, or document that current structure is correct
- [ ] Verify lessons with `bunny_video_id` field render correctly
- [ ] Add E2E test confirming video block renders

---

## Requirements

### Functional Requirements

#### FR1: Core Seeding Engine

- **FR1.1**: Load all JSON files from `apps/payload/src/seed/seed-data/`
- **FR1.2**: Initialize Payload Local API with config
- **FR1.3**: Process collections in dependency order to satisfy foreign keys
- **FR1.4**: Create records using `payload.create()` method
- **FR1.5**: Track created record IDs for reference resolution
- **FR1.6**: Handle errors gracefully with retries for transient failures

#### FR2: Reference Resolution System

- **FR2.1**: Parse JSON for `{ref:collection:identifier}` patterns
- **FR2.2**: Build reference map: `collection:identifier → UUID`
- **FR2.3**: Replace references with actual UUIDs before record creation
- **FR2.4**: Support nested references in arrays and objects
- **FR2.5**: Validate all references exist before seeding begins
- **FR2.6**: Log reference resolution for debugging

#### FR3: Relationship Handling

- **FR3.1**: Payload automatically populates `*_rels` tables (no manual handling)
- **FR3.2**: Array fields (e.g., `downloads: []`) preserved as arrays
- **FR3.3**: Single relationships (e.g., `course_id`) resolved to UUIDs
- **FR3.4**: Polymorphic relationships handled correctly
- **FR3.5**: Relationship order maintained for ordered arrays

#### FR4: Validation System

- **FR4.1**: Pre-seeding: Validate JSON files parse correctly
- **FR4.2**: Pre-seeding: Validate all referenced collections exist
- **FR4.3**: Pre-seeding: Validate collection schemas match Payload config
- **FR4.4**: Post-seeding: Verify expected record counts
- **FR4.5**: Post-seeding: Spot-check relationships established
- **FR4.6**: Generate validation report with pass/fail per collection

#### FR5: CLI Interface

- **FR5.1**: Command: `pnpm seed` (standalone seeding)
- **FR5.2**: Command: `pnpm seed:fresh` (reset + seed)
- **FR5.3**: Flag: `--dry-run` (validate without creating records)
- **FR5.4**: Flag: `--collection <name>` (seed single collection)
- **FR5.5**: Flag: `--verbose` (detailed logging)
- **FR5.6**: Flag: `--json` (JSON output for programmatic use)
- **FR5.7**: Exit codes: 0 (success), 1 (failure)

#### FR6: Supabase Reset Integration

- **FR6.1**: Update `supabase-reset` command to accept `--seed` flag
- **FR6.2**: Execute seeding after successful schema migration
- **FR6.3**: Transactional behavior: rollback if seeding fails
- **FR6.4**: Optional collection filtering: `--seed-collections courses,lessons`

#### FR7: Logging and Progress

- **FR7.1**: Display progress per collection: "Seeding courses: 1/1 ✅"
- **FR7.2**: Show total progress: "Overall: 316/316 records (100%)"
- **FR7.3**: Log errors with context: file, record ID, field name
- **FR7.4**: Execution summary: total time, records created, errors
- **FR7.5**: Structured logging for CI/CD consumption

---

### Non-Functional Requirements

#### NFR1: Performance

- **NFR1.1**: Complete seeding in under 2 minutes for ~316 records
- **NFR1.2**: Memory usage under 512MB during execution
- **NFR1.3**: Support for larger datasets (tested up to 5,000 records)
- **Target**: 82 seconds for current dataset (acceptable per analysis)

#### NFR2: Reliability

- **NFR2.1**: 100% success rate for valid seed data
- **NFR2.2**: Idempotent execution (safe to run multiple times)
- **NFR2.3**: Graceful degradation on network/DB issues
- **NFR2.4**: No data corruption on partial failures
- **NFR2.5**: Automatic retry for transient errors (3 attempts)

#### NFR3: Maintainability

- **NFR3.1**: Zero-maintenance schema tracking (uses Payload config)
- **NFR3.2**: Self-documenting code with JSDoc comments
- **NFR3.3**: Modular architecture for easy extension
- **NFR3.4**: Configuration via simple TypeScript file
- **NFR3.5**: Estimated maintenance: <1 hour per quarter

#### NFR4: Developer Experience

- **NFR4.1**: Simple onboarding: single command to seed database
- **NFR4.2**: Clear error messages with actionable guidance
- **NFR4.3**: Progress indicators for long operations
- **NFR4.4**: Comprehensive documentation with examples
- **NFR4.5**: Integration with existing tooling (pnpm scripts)

#### NFR5: Type Safety

- **NFR5.1**: Full TypeScript typing for all seeding functions
- **NFR5.2**: Type inference from Payload generated types
- **NFR5.3**: No use of `any` or `unknown` types
- **NFR5.4**: Compile-time validation of collection names

#### NFR6: Testability

- **NFR6.1**: Unit tests for reference resolution (>90% coverage)
- **NFR6.2**: Integration tests for seeding logic
- **NFR6.3**: E2E tests for full seeding workflow
- **NFR6.4**: Mock support for testing without actual database

---

## Success Criteria

### Quantitative Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| **Seeding Time** | < 120 seconds | Time from command start to completion |
| **Success Rate** | 100% | Records created / Records attempted |
| **Error Rate** | 0% | Failed seedings / Total seeding runs |
| **Code Coverage** | > 90% | Unit + integration tests |
| **E2E Test Pass Rate** | 100% | Passing E2E tests / Total E2E tests |
| **Documentation Completeness** | 100% | All functions/commands documented |
| **Memory Usage** | < 512 MB | Peak memory during seeding |
| **Developer Setup Time** | < 5 minutes | Fresh checkout to seeded database |

### Qualitative Criteria

✅ **Developer Satisfaction**:

- Team reports seeding is easy and reliable
- No manual database setup required
- Consistent environments across team

✅ **Data Integrity**:

- All relationships correctly established
- No orphaned records
- Content renders correctly in Payload admin UI

✅ **Operational Readiness**:

- Seeding works in local, CI/CD, and staging environments
- Failures are self-explanatory and actionable
- No manual intervention required for common scenarios

✅ **Future-Proof**:

- Easy to add new collections
- Adapts automatically to schema changes
- Scales to larger datasets without modification

---

## Technical Considerations

### Architecture Overview

```
┌─────────────────────────────────────────────────┐
│  CLI Entry Point (seed/index.ts)                │
│  - Argument parsing                             │
│  - Environment setup                            │
│  - Main orchestration                           │
└────────────────┬────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────┐
│  Data Loader (loaders/json-loader.ts)           │
│  - Load JSON files                              │
│  - Parse and validate structure                 │
│  - Return collection data                       │
└────────────────┬────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────┐
│  Reference Resolver (resolvers/reference.ts)    │
│  - Build reference map from records             │
│  - Replace {ref:} with actual IDs               │
│  - Validate all references exist                │
└────────────────┬────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────┐
│  Payload API Seeder (seeders/payload.ts)        │
│  - Initialize Payload Local API                 │
│  - Create records in dependency order           │
│  - Track created IDs                            │
│  - Handle errors and retries                    │
└────────────────┬────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────┐
│  Validator (validators/post-seed.ts)            │
│  - Verify record counts                         │
│  - Spot-check relationships                     │
│  - Generate validation report                   │
└────────────────┬────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────┐
│  Output / Summary Report                        │
│  - Success/failure status                       │
│  - Timing metrics                               │
│  - Error details                                │
└─────────────────────────────────────────────────┘
```

### Technology Stack

- **Runtime**: Node.js 20+, TypeScript 5+
- **Payload API**: `payload` package (Local API)
- **CLI Framework**: `commander` for argument parsing
- **Logging**: `chalk` for colored terminal output
- **Testing**: Vitest (unit/integration), Playwright (E2E)
- **Validation**: Zod schemas (optional, for extra safety)

### Dependency Order

Collections must be seeded in this order to satisfy foreign key constraints:

```typescript
const DEPENDENCY_ORDER = [
  ['users'],                      // No dependencies
  ['media', 'downloads'],         // Independent
  ['courses'],                    // Depends on downloads
  ['posts', 'documentation'],     // Depends on media
  ['course_lessons'],             // Depends on courses, downloads
  ['course_quizzes', 'surveys'],  // Depends on courses, course_lessons
  ['quiz_questions'],             // Depends on course_quizzes
  ['survey_questions'],           // Depends on surveys
];
```

### Key Design Decisions

#### Decision 1: Local API vs Direct SQL

**Chosen**: Local API approach
**Rationale**:

- 67% faster implementation (2-3 days vs 6-8 days)
- 75% lower risk (automatic validation and relationships)
- 80% less maintenance (adapts to schema changes)
- Acceptable performance for dataset size (~82s vs ~6s)

**Trade-offs Accepted**:

- Slower seeding time (acceptable for dev/test environments)
- Higher memory usage (not an issue for current dataset)

#### Decision 2: Reference Format

**Chosen**: Keep existing `{ref:collection:identifier}` format
**Rationale**:

- Already implemented in JSON files
- Human-readable and git-friendly
- Easy to update manually if needed
- Simple regex replacement logic

#### Decision 3: Error Handling Strategy

**Chosen**: Continue on non-critical errors, fail on critical errors
**Rationale**:

- Non-critical: Missing optional field → Log warning, continue
- Critical: Invalid reference, schema mismatch → Stop and report
- Provides balance between strictness and usability

#### Decision 4: Bunny Video Investigation (Issue #9)

**Chosen**: Investigate separately, document findings, proceed with current structure
**Rationale**:

- Current structure may already be correct (`bunny_video_id` field exists)
- BunnyVideo block expects `videoId` field (matches)
- Lexical shortcode `{% bunny bunnyvideoid="..." /%}` may be intentional for admin editing
- Need to verify block rendering works with current data structure
- If issue exists, fix conversion separately from seeding feature

**Investigation Scope**:

1. Check if BunnyVideo block renders with current seed data
2. Verify `bunny_video_id` field mapping
3. Document expected Lexical structure for video blocks
4. Update conversion tool only if rendering fails

---

## Dependencies

### Internal Dependencies

- `apps/payload/payload.config.ts` - Payload configuration
- `apps/payload/src/seed/seed-data/` - JSON seed data files
- `apps/payload/src/seed/seed-conversion/` - Existing conversion tooling
- `.claude/commands/database/supabase-reset.md` - Reset command (to be updated)

### External Dependencies

- Payload CMS 3.x Local API
- Supabase (PostgreSQL) running locally or remotely
- Node.js 20+
- pnpm workspace configuration

### Blocking Dependencies

- ✅ Payload config must be valid and up-to-date
- ✅ Supabase instance must be running
- ✅ JSON seed data files must exist and be valid
- ⚠️ Bunny video investigation (Issue #9) - Not blocking, but related

---

## Risk Assessment

### Technical Risks

| Risk | Severity | Likelihood | Mitigation |
|------|----------|-----------|------------|
| **Payload API breaking changes** | Medium | Low | Version lock Payload, test on upgrades |
| **Memory exhaustion on large datasets** | Low | Low | Batch processing if needed (future) |
| **Reference resolution failures** | Medium | Medium | Comprehensive validation before seeding |
| **Hook interference** | Low | Low | Document hook behavior, use `disableHooks` if needed |
| **Seeding timeout in CI/CD** | Low | Medium | Increase CI timeout limits |

### Operational Risks

| Risk | Severity | Likelihood | Mitigation |
|------|----------|-----------|------------|
| **Team unfamiliarity with seeding** | Low | Medium | Clear documentation, examples |
| **Seed data becomes stale** | Medium | High | Regular updates to seed data, documented process |
| **Production seeding accident** | Critical | Very Low | Prevent via environment checks, separate command |
| **CI/CD failures due to seeding** | Medium | Low | Comprehensive E2E tests, rollback support |

### Timeline Risks

| Risk | Severity | Likelihood | Mitigation |
|------|----------|-----------|------------|
| **Bunny video investigation delays** | Low | Medium | Timebox investigation to 2 hours, proceed regardless |
| **Scope creep (additional features)** | Medium | Medium | Strict adherence to spec, defer enhancements |
| **Testing takes longer than expected** | Low | Low | Allocate buffer time for E2E test development |

**Overall Risk Level**: 🟡 **Medium** (manageable with proper execution)

---

## Out of Scope

The following items are explicitly **NOT** included in this feature:

❌ **Production Seeding**:

- This feature is for development/testing only
- Production data import requires separate, more robust tooling
- Security concerns prevent using same approach

❌ **SQL Generator Approach**:

- Comprehensive SQL generation tool
- Manual `*_rels` table population
- Direct database manipulation

❌ **Seed Data Creation**:

- Creating new raw seed data files
- Content authoring or curation
- Media file uploads (assumes media references exist)

❌ **Payload Admin UI Seeding**:

- Seeding via Payload admin interface
- Browser-based seeding tools
- GraphQL API seeding

❌ **Performance Optimization**:

- Advanced batching strategies
- Parallel collection processing
- Database connection pooling
- These can be added later if needed

❌ **Seed Data Versioning**:

- Git-based seed data versioning
- Rollback to previous seed states
- Seed data diffing tools

❌ **Custom Collection Handling**:

- Special logic for collections beyond the 10 core collections
- Plugin collection seeding
- Third-party integration seeding

❌ **Complete Bunny Video Fix** (Issue #9):

- Full resolution of Bunny video Lexical conversion
- This is investigated but not fully implemented in seeding feature
- Separate issue can address if changes needed

---

## Timeline Estimate

### Phase 1: Core Implementation (1.5 days)

**Day 1 Morning** (4 hours):

- [ ] Create directory structure: `apps/payload/src/seed/`
- [ ] Implement JSON data loader
- [ ] Implement reference resolver (simple version)
- [ ] Create basic CLI entry point

**Day 1 Afternoon** (4 hours):

- [ ] Implement Payload API seeder
- [ ] Add dependency ordering logic
- [ ] Implement error handling and retries
- [ ] Test with 1-2 simple collections (media, downloads)

**Day 2 Morning** (4 hours):

- [ ] Extend to all collections
- [ ] Implement progress logging
- [ ] Add validation system
- [ ] Test full seeding workflow locally

---

### Phase 2: Integration & Testing (0.75 days)

**Day 2 Afternoon** (4 hours):

- [ ] Add CLI flags (--dry-run, --collection, --verbose, --json)
- [ ] Integrate with Supabase reset command
- [ ] Add npm scripts to package.json
- [ ] Write unit tests for reference resolver

**Day 3 Morning** (2 hours):

- [ ] Write integration tests for seeding logic
- [ ] Create E2E test suite for validation
- [ ] Test idempotency and error scenarios

---

### Phase 3: Documentation & Polish (0.5 days)

**Day 3 Afternoon** (2 hours):

- [ ] Document seeding architecture in README
- [ ] Add JSDoc comments to all functions
- [ ] Update Supabase reset command documentation
- [ ] Create troubleshooting guide

**Day 3 Evening** (2 hours):

- [ ] Investigate Bunny video structure (Issue #9 related)
- [ ] Document findings
- [ ] Update spec if needed
- [ ] Final testing and validation

---

### Phase 4: Review & Deployment (0.25 days)

**Day 4 Morning** (2 hours):

- [ ] Code review and feedback incorporation
- [ ] Final E2E test run in CI/CD
- [ ] Merge to main branch
- [ ] Team walkthrough and training

---

### Buffer & Contingency (0.5 days)

- Debugging unexpected issues
- Bunny video investigation extension if needed
- Additional testing if E2E tests reveal problems

---

**Total Estimated Effort**: 2.5-3 days (20-24 hours)

**Confidence Level**: High (80%) - Well-defined scope, existing analysis, clear requirements

---

## Implementation Notes

### File Structure

```
apps/payload/src/seed/
├── index.ts                    # CLI entry point and orchestration
├── config.ts                   # Seeding configuration
├── loaders/
│   └── json-loader.ts          # Load JSON seed data files
├── resolvers/
│   └── reference-resolver.ts   # {ref:} placeholder resolution
├── seeders/
│   └── payload-seeder.ts       # Payload Local API seeding logic
├── validators/
│   ├── pre-seed-validator.ts   # Validate before seeding
│   └── post-seed-validator.ts  # Verify after seeding
└── utils/
    ├── logger.ts               # Structured logging
    ├── progress.ts             # Progress bar/indicators
    └── error-handler.ts        # Error handling utilities
```

### Configuration Example

```typescript
// seed/config.ts
export const seedConfig = {
  dataDir: './src/seed/seed-data',
  collections: DEPENDENCY_ORDER,

  options: {
    retryAttempts: 3,
    retryDelay: 1000, // ms
    disableHooks: false,
    verbose: false,
  },

  validation: {
    preCheck: true,
    postCheck: true,
    strictMode: false, // Fail on warnings
  },
};
```

### Reference Resolution Example

```typescript
// resolvers/reference-resolver.ts
export function resolveReferences(
  data: any,
  idMap: Map<string, string>
): any {
  const resolved = JSON.parse(JSON.stringify(data));
  const refPattern = /\{ref:([^:]+):([^}]+)\}/g;

  const str = JSON.stringify(resolved);
  const resolvedStr = str.replace(refPattern, (match, collection, id) => {
    const key = `${collection}:${id}`;
    const actualId = idMap.get(key);

    if (!actualId) {
      throw new Error(`Reference not found: ${match}`);
    }

    return actualId;
  });

  return JSON.parse(resolvedStr);
}
```

---

## Testing Strategy

### Unit Tests (Vitest)

- Reference resolver: all edge cases (nested, missing, invalid)
- JSON loader: file handling, parsing errors
- Dependency ordering: correct order, circular detection
- Error handling: retries, rollback logic

**Target**: >90% code coverage

### Integration Tests (Vitest + Test DB)

- Full seeding workflow on test database
- Idempotency: run twice, verify no duplicates
- Partial seeding: single collection only
- Error scenarios: missing files, invalid data

**Target**: All happy paths + major error scenarios

### E2E Tests (Playwright)

- `tests/payload-seeding.spec.ts`:
  - Reset database and seed
  - Verify all collections populated
  - Check relationship integrity
  - Test Lexical content rendering
  - Verify Bunny video data structure
  - Confirm idempotent behavior

**Target**: 100% pass rate in CI/CD

---

## Monitoring and Observability

### Logging Levels

- **ERROR**: Critical failures (exit 1)
- **WARN**: Non-critical issues (continue execution)
- **INFO**: Progress updates, summaries
- **DEBUG**: Detailed execution flow (with `--verbose`)

### Metrics to Track

- Total seeding time
- Records created per collection
- Errors encountered (with collection/record context)
- Memory usage peak
- Reference resolution time

### Success Indicators

- Exit code 0 (success)
- "✨ Database seed complete!" message
- All collections show ✅ status
- Validation report: 100% pass

---

## Rollout Plan

### Phase 1: Local Development (Week 1)

- Implement core seeding functionality
- Test with dev team (2-3 developers)
- Gather feedback, iterate

### Phase 2: CI/CD Integration (Week 2)

- Add to GitHub Actions workflows
- Test E2E suite with seeding
- Monitor for flaky tests or timing issues

### Phase 3: Team Adoption (Week 2-3)

- Document in team wiki
- Conduct team walkthrough
- Update onboarding documentation
- Retire old manual setup process

### Phase 4: Ongoing Maintenance (Ongoing)

- Monitor for Payload API changes
- Update seed data as collections evolve
- Add new collections as needed
- Quarterly review of performance and reliability

---

## Documentation Deliverables

### README Update

- Add "Database Seeding" section to `apps/payload/README.md`
- Include quickstart guide
- Link to detailed documentation

### Comprehensive Guide

- Create `apps/payload/docs/SEEDING.md` with:
  - Architecture overview
  - Usage examples
  - Troubleshooting guide
  - FAQ section
  - Contributing guidelines for seed data

### Inline Documentation

- JSDoc comments on all public functions
- Type definitions for all interfaces
- Example usage in function docstrings

### Command Help Text

- `pnpm seed --help` shows all options
- Clear descriptions for each flag
- Examples of common use cases

---

## Future Enhancements (Post-MVP)

These items are intentionally deferred but documented for future consideration:

### Performance Optimizations

- Batch processing for large collections (>1000 records)
- Parallel collection seeding where dependencies allow
- Connection pooling for database efficiency
- Streaming JSON parsing for large files

### Advanced Features

- Seed data versioning and rollback
- Incremental seeding (only changed collections)
- Custom transformers for specific collection types
- Seed data generation from templates

### Operational Improvements

- Metrics dashboard for seeding health
- Automated seed data updates from production (sanitized)
- Seed data diffing and comparison tools
- Integration with Payload admin UI for one-click seeding

### Scalability

- Support for 10k+ records per collection
- Distributed seeding for very large datasets
- Cloud storage for seed data files
- CDN integration for media references

---

## Appendix A: Collection Details

### Collection Inventory

| Collection | Records | Relationships | Complexity |
|------------|---------|--------------|------------|
| `users` | TBD | None | Low |
| `media` | 33 | None | Low |
| `downloads` | 4 | None | Low |
| `courses` | 1 | downloads[] | Medium |
| `course_lessons` | 25 | course, downloads[], quiz?, survey? | High |
| `course_quizzes` | 1 | course, lesson, questions[] | High |
| `quiz_questions` | 94 | quiz, options[] (nested) | Medium |
| `surveys` | ~10 | lesson, questions[] | High |
| `survey_questions` | 246 | survey, options[] (nested) | Medium |
| `posts` | TBD | author, featuredImage | Medium |
| `documentation` | TBD | featuredImage, parent | Medium |

**Total**: ~316+ records, ~400+ relationships

---

## Appendix B: Bunny Video Investigation (Issue #9)

### Current State

**Seed Data Structure** (course-lessons.json):

```json
{
  "_ref": "course-lessons:lesson-0",
  "bunny_video_id": "2620df68-c2a8-4255-986e-24c1d4c1dbf2",
  "bunny_library_id": "264486",
  "content": {
    "root": {
      "children": [{
        "type": "paragraph",
        "children": [{
          "type": "text",
          "text": "{% bunny bunnyvideoid=\"2620df68-...\" /%}"
        }]
      }]
    }
  }
}
```

**BunnyVideo Block Schema** (blocks/BunnyVideo/config.ts):

```typescript
{
  slug: "bunny-video",
  fields: [
    { name: "videoId", type: "text" },
    { name: "libraryId", type: "text", defaultValue: "264486" },
    { name: "aspectRatio", type: "select", defaultValue: "16:9" },
    // ... other fields
  ]
}
```

### Questions to Answer

1. **Is the shortcode intended?**
   - Should Lexical content contain shortcode or structured block?
   - Does Payload admin UI need shortcode for editing?

2. **Field mapping clarity:**
   - Is `bunny_video_id` field on lesson separate from Lexical content?
   - Which takes precedence: field or block in content?

3. **Rendering behavior:**
   - Does current structure render correctly in frontend?
   - Do we need both field and block, or just one?

### Investigation Tasks (During Implementation)

- [ ] Check if lessons with `bunny_video_id` render videos
- [ ] Verify BunnyVideo block component expects structured Lexical blocks
- [ ] Test if shortcode in Lexical is processed by template processor
- [ ] Document expected structure for both scenarios
- [ ] Update conversion only if rendering fails

### Potential Outcomes

**Outcome A: Current structure is correct**

- Document that shortcode is intentional
- Confirm template processor handles conversion
- No changes needed to seed data or conversion

**Outcome B: Need structured Lexical blocks**

- Update `markdown-to-lexical.ts` to convert shortcode to block
- Re-run conversion: `pnpm seed:convert`
- Validate new structure renders correctly

**Outcome C: Both approaches valid**

- Document when to use each approach
- Support both in seeding system
- No immediate changes required

---

## Appendix C: Error Handling Scenarios

### Pre-Seeding Errors

| Error | Cause | Recovery |
|-------|-------|----------|
| **Missing JSON file** | Collection file doesn't exist | Skip collection, warn user |
| **Invalid JSON** | Parse error in JSON file | Stop, show line number |
| **Invalid reference** | `{ref:}` target doesn't exist | Stop, list all invalid refs |
| **Schema mismatch** | Field type doesn't match config | Warn, attempt coercion |
| **Payload not initialized** | Config error or DB down | Stop, show error message |

### During-Seeding Errors

| Error | Cause | Recovery |
|-------|-------|----------|
| **Validation failure** | Field value doesn't pass Payload validation | Log error, skip record |
| **Duplicate key** | Record ID already exists | Skip (idempotent), log warning |
| **Foreign key violation** | Reference to non-existent record | Stop, show dependency chain |
| **Timeout** | Payload API call hangs | Retry 3 times, then fail |
| **Memory limit** | Dataset too large | Batch processing (future enhancement) |

### Post-Seeding Errors

| Error | Cause | Recovery |
|-------|-------|----------|
| **Count mismatch** | Expected 25 lessons, got 20 | Warn, list missing records |
| **Orphaned relationship** | Relationship exists but target missing | Warn, provide cleanup query |
| **Invalid Lexical** | Lexical content doesn't parse | Warn, list affected records |

---

## Appendix D: Performance Benchmarks

### Expected Performance (Current Dataset)

| Operation | Time | Notes |
|-----------|------|-------|
| **Load JSON files** | ~1s | 13 files, ~19k lines |
| **Build reference map** | ~2s | ~316 records |
| **Validate references** | ~1s | ~400 references |
| **Seed users** | ~1s | Minimal records |
| **Seed media** | ~6s | 33 records |
| **Seed downloads** | ~1s | 4 records |
| **Seed courses** | ~1s | 1 record |
| **Seed lessons** | ~12s | 25 records (complex relationships) |
| **Seed quizzes** | ~2s | 1 record + questions |
| **Seed quiz questions** | ~20s | 94 records |
| **Seed surveys** | ~4s | ~10 records |
| **Seed survey questions** | ~50s | 246 records |
| **Post-validation** | ~2s | Spot checks |
| **TOTAL** | **~82s** | Well under 2-minute target |

### Scaling Projections

| Dataset Size | Projected Time | Notes |
|--------------|----------------|-------|
| 500 records | ~2 min | Year 1 projection |
| 1,500 records | ~6 min | Year 2 projection |
| 5,000 records | ~20 min | Year 3 - consider optimization |
| 25,000 records | ~100 min | Year 5 - likely need SQL approach |

---

## Appendix E: Reference Formats

### Standard Reference

```json
"course_id": "{ref:courses:ddm}"
```

Resolves to: `decks-for-decision-makers` (course slug used as ID)

### Array Reference

```json
"downloads": [
  "{ref:downloads:slide-templates}",
  "{ref:downloads:swipe-file}"
]
```

Resolves to: Array of download UUIDs

### Nested Reference

```json
"author": {
  "id": "{ref:users:admin@example.com}",
  "name": "Admin User"
}
```

Resolves nested `id` field to user UUID

### Path-Based Reference (Media)

```json
"featuredImage": "{ref:media:/cms/images/lesson-0/thumbnail.png}"
```

Resolves to: Media record UUID matching path

---

## Appendix F: Related Issues and Work

### Related GitHub Issues

- **Issue #9**: Bunny video block implementation (related to Lexical structure)
- **Issue TBD**: Supabase reset enhancements
- **Issue TBD**: E2E test coverage for Payload

### Related Documentation

- `reports/2025-09-30/payload-seed-audit-report.md` - Comprehensive infrastructure audit
- `reports/2025-09-30/payload-seeding-approach-analysis.md` - SQL vs Local API analysis
- `apps/payload/src/seed/seed-conversion/README.md` - Existing conversion tooling
- `.claude/commands/database/supabase-reset.md` - Database reset command

### Related Commands

- `/database:supabase-reset` - Reset database (to be enhanced with seeding)
- `/testing:e2e-test-writer` - E2E test generation (for validation tests)

---

## Approval and Sign-off

**Specification Status**: Draft
**Created**: 2025-09-30
**Author**: AI Assistant (Claude Code)
**Reviewed By**: [Pending]
**Approved By**: [Pending]

**Next Steps**:

1. Review specification with team
2. Approve approach and timeline
3. Create GitHub issue/epic
4. Begin Phase 1 implementation

---

**Document Version**: 1.0
**Last Updated**: 2025-09-30T17:33:01Z
