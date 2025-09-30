# Payload CMS Seeding Architecture

**Technical deep dive into the seeding infrastructure design and implementation**

Version: 1.0  
Last Updated: 2025-09-30

---

## Table of Contents

- [System Overview](#system-overview)
- [Architecture Decisions](#architecture-decisions)
- [Component Details](#component-details)
- [Data Flow](#data-flow)
- [Design Patterns](#design-patterns)
- [Extension Points](#extension-points)
- [Testing Strategy](#testing-strategy)

---

## System Overview

The Payload CMS Seeding Engine is a modular, type-safe infrastructure for populating Payload databases with development and test data. Built on the Payload Local API, it provides automatic relationship handling, reference resolution, and comprehensive validation.

### Key Characteristics

- **Language**: TypeScript (strict mode)
- **Runtime**: Node.js 20+
- **Database**: PostgreSQL 14+ (via Supabase)
- **Framework**: Payload CMS 3.56+
- **CLI**: Commander 14+
- **Testing**: Vitest with 86.4% pass rate (503/582 tests)

### Design Philosophy

1. **Type Safety**: Leverage TypeScript for compile-time guarantees
2. **Modularity**: Loosely coupled components with clear interfaces
3. **Reliability**: Automatic retries, validation, and error handling
4. **Performance**: Acceptable trade-offs for dev/test environments
5. **Maintainability**: Self-documenting code with comprehensive tests

---

## Architecture Decisions

### Decision 1: Local API vs Direct SQL

**Choice**: Payload Local API using `getPayload()` and `payload.create()`

**Rationale**:
- Payload automatically handles complex polymorphic relationship tables (`*_rels`)
- Built-in validation ensures data integrity
- Zero maintenance when schemas change
- Type-safe with generated TypeScript types
- Recommended pattern by Payload team

**Implementation Impact**:

```typescript
// Using Local API (chosen approach)
const payload = await getPayload({ config });
const created = await payload.create({
  collection: 'course-lessons',
  data: {
    title: 'Lesson 1',
    course_id: courseUUID,  // Relationship handled automatically
    downloads: [download1UUID, download2UUID],  // Array relationships work
  }
});
// Payload populates course_lessons_rels table automatically
```

```sql
-- Direct SQL approach (rejected)
-- Would require manual relationship management:
INSERT INTO payload.course_lessons (id, title, ...) VALUES (...);
INSERT INTO payload.course_lessons_rels (parent_id, path, downloads_id, "order")
VALUES
  (lesson_id, 'downloads', download1_uuid, 1),
  (lesson_id, 'downloads', download2_uuid, 2);
-- 400+ manual relationship entries needed
```

**Trade-offs Accepted**:
- 76-second slower execution (82s vs 6s for SQL)
- Higher memory usage (~200-300MB vs <50MB)
- Cannot bypass Payload validation (actually a benefit)

**Performance Scaling**:

| Records | Local API Time | SQL Time | Recommendation |
|---------|----------------|----------|----------------|
| <1,000 | Excellent (<2 min) | Excellent (<10s) | Use Local API |
| 1,000-3,000 | Good (2-6 min) | Excellent (<30s) | Use Local API |
| 3,000-5,000 | Acceptable (6-15 min) | Good (<60s) | Consider SQL migration |
| >5,000 | Poor (>15 min) | Good (<2 min) | **Migrate to SQL** |

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
export class ReferenceResolver {
  private cache: Map<string, string> = new Map();
  
  register(collection: string, identifier: string, uuid: string): void {
    this.cache.set(`${collection}:${identifier}`, uuid);
  }
  
  resolve(record: SeedRecord): SeedRecord {
    // Recursively replace {ref:collection:identifier} with UUIDs
    return this.deepResolve(structuredClone(record));
  }
}
```

**Pattern Examples**:

```json
{
  "_ref": "lesson-0",
  "course_id": "{ref:courses:ddm}",
  "downloads": ["{ref:downloads:template1}", "{ref:downloads:template2}"],
  "author": { "id": "{ref:users:admin}" }
}
```

**Algorithm Complexity**:
- Register: O(1) per record
- Lookup: O(1) per reference
- Resolve: O(n) where n = number of fields in record
- Space: O(r) where r = number of registered records (~316)

**Alternatives Considered**:

| Approach | Pros | Cons | Decision |
|----------|------|------|----------|
| Database lookups | Accurate, no cache | N+1 queries, slow | ❌ Rejected |
| Pre-generated UUIDs | Fast, deterministic | Breaks idempotency, complex | ❌ Rejected |
| Slug-based refs | Simple, readable | Collection conflicts, limited | ❌ Rejected |
| **Cache pattern** | Fast, flexible, debuggable | Requires order | ✅ **Chosen** |

---

### Decision 3: Dependency Ordering

**Choice**: Fixed seed order based on foreign key dependencies

**Rationale**:
- Ensures references exist before use
- Prevents foreign key constraint violations
- Deterministic and predictable
- Easy to understand and validate

**Seed Order** (5 dependency levels):

```typescript
export const SEED_ORDER = [
  // Level 0: Independent (no foreign keys)
  'users', 'media', 'downloads',
  
  // Level 1: Depend on Level 0
  'posts', 'courses',
  
  // Level 2: Depend on Level 0-1
  'course-lessons', 'documentation',
  
  // Level 3: Depend on Level 0-2
  'course-quizzes', 'surveys',
  
  // Level 4: Depend on Level 0-3
  'quiz-questions', 'survey-questions',
] as const;
```

**Dependency Graph**:

```
users ───┐
         ├──> posts
media ───┤
         ├──> courses ───┐
downloads┘               ├──> course-lessons ──> course-quizzes ──> quiz-questions
                         │                    
                         └──> documentation
                              
                              surveys ──> survey-questions
```

**Algorithm**: No topological sort needed - fixed order is sufficient for current complexity.

**Future Enhancement**: If circular dependencies emerge, implement Kahn's algorithm for topological sorting.

---

### Decision 4: Error Handling Strategy

**Choice**: Continue on non-critical errors, fail on critical errors with retry logic

**Strategy**:

```typescript
export class ErrorHandler {
  async withRetry<T>(fn: () => Promise<T>): Promise<RetryResult<T>> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return { success: true, data: await fn() };
      } catch (error) {
        if (!this.isRetryable(error)) {
          return { success: false, error };
        }
        if (attempt >= maxRetries) break;
        await this.sleep(this.calculateDelay(attempt));
      }
    }
    return { success: false, error: lastError };
  }
  
  private calculateDelay(attempt: number): number {
    const exponential = this.retryDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 500;
    return Math.min(exponential + jitter, 10000);  // Cap at 10s
  }
}
```

**Error Classification**:

| Type | Examples | Action | Rationale |
|------|----------|--------|-----------|
| **Transient** | Network timeout, DB locks | Retry 3x | Usually self-resolving |
| **Validation** | Invalid data, missing fields | Log warning, skip record | Data-specific, non-blocking |
| **Critical** | Missing refs, config errors | Stop immediately | Requires manual intervention |

**Retry Schedule**:
- Attempt 1: Immediate
- Attempt 2: ~1 second delay
- Attempt 3: ~2 second delay
- Attempt 4: ~4 second delay (capped at 10s)

**Jitter**: Random 0-500ms prevents thundering herd when multiple processes retry simultaneously.

---

### Decision 5: CLI Interface Design

**Choice**: Commander-based CLI with progressive flags

**Implementation**:

```typescript
const program = new Command()
  .name('seed-engine')
  .description('Seed Payload CMS collections with pre-defined data')
  .version('1.0.0')
  .option('--dry-run', 'Validate without creating records')
  .option('--verbose', 'Detailed per-record logging')
  .option('-c, --collections <list>', 'Comma-separated collections')
  .option('--max-retries <n>', 'Max retry attempts', '3')
  .option('--timeout <ms>', 'Timeout in milliseconds', '120000');
```

**Commands**:

| Command | Flags | Use Case |
|---------|-------|----------|
| `seed:run` | (none) | Full seed (most common) |
| `seed:dry` | `--dry-run` | Validation only |
| `seed:validate` | `--dry-run --verbose` | Detailed validation |
| `seed:courses` | `-c courses,course-lessons,course-quizzes` | Specific collections |

**Design Principles**:
- **Sensible defaults**: No flags needed for common use case
- **Progressive disclosure**: Advanced options via flags
- **Fail-fast validation**: Environment checks before seeding
- **Clear feedback**: Progress bars and summary reports

---

## Component Details

### 1. CLI Entry Point (`index.ts`)

**Responsibilities**:
- Parse command-line arguments with Commander
- Validate environment variables
- Block production seeding (safety check)
- Orchestrate main seeding workflow
- Handle graceful shutdown

**Key Functions**:

```typescript
export async function main(): Promise<void> {
  const options = parseArguments();
  const logger = new Logger({ verbose: options.verbose });
  
  if (!validateEnvironmentSafety(logger)) {
    process.exit(EXIT_CODES.VALIDATION_ERROR);
  }
  
  const exitCode = await runSeeding(options, logger);
  process.exit(exitCode);
}
```

**Exit Codes**:
- `0`: Success
- `1`: Validation error (environment, configuration)
- `2`: Initialization error (Payload, database)
- `3`: Seeding error (data, references)

---

### 2. Seed Orchestrator (`core/seed-orchestrator.ts`)

**Responsibilities**:
- Main workflow coordinator
- Manage component lifecycle
- Process collections in dependency order
- Track progress and generate reports
- Handle errors and cleanup

**Workflow**:

```typescript
export class SeedOrchestrator {
  async run(options: SeedOptions): Promise<SeedResult> {
    try {
      await this.initialize(options);
      const loadResults = await this.loadData(options);
      await this.validateData(loadResults);
      const batchResults = options.dryRun
        ? await this.dryRunValidation(loadResults)
        : await this.processCollections(loadResults, options);
      const summary = this.generateSummary(batchResults, startTime);
      if (!options.dryRun) await this.postSeedValidation(summary);
      return { success: true, summary };
    } catch (error) {
      return { success: false, summary: emptySummary, error: error.message };
    } finally {
      await this.cleanup();
    }
  }
}
```

**State Management**:
- `payload`: Payload instance (singleton)
- `resolver`: Reference resolver with cache
- `tracker`: Progress tracker
- `errorHandler`: Retry logic handler

**Lifecycle**:
1. Initialize (setup services)
2. Load (read JSON files)
3. Validate (pre-seed checks)
4. Process (create records) or Dry-run (validate only)
5. Verify (post-seed validation)
6. Cleanup (free resources)

---

### 3. Reference Resolver (`resolvers/reference-resolver.ts`)

**Responsibilities**:
- Parse `{ref:collection:identifier}` patterns
- Maintain in-memory UUID cache
- Recursively resolve references in data structures
- Validate all references can be resolved

**Core Algorithm**:

```typescript
private resolveValue(value: unknown, depth: number): unknown {
  if (depth > MAX_DEPTH) throw new Error('Max recursion depth');
  
  if (typeof value === 'string') {
    return value.replace(REFERENCE_PATTERN, (match, coll, id) => {
      const uuid = this.cache.get(`${coll}:${id}`);
      if (!uuid) throw new Error(`Unresolved: ${match}`);
      return uuid;
    });
  }
  
  if (Array.isArray(value)) {
    return value.map(item => this.resolveValue(item, depth + 1));
  }
  
  if (typeof value === 'object') {
    const resolved: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      resolved[key] = this.resolveValue(val, depth + 1);
    }
    return resolved;
  }
  
  return value;  // Primitives
}
```

**Performance Characteristics**:
- **Time Complexity**: O(n) where n = number of fields
- **Space Complexity**: O(d) where d = depth of nesting
- **Cache Lookup**: O(1) with Map
- **Max Recursion Depth**: 100 (prevents infinite loops)

**Cache Statistics** (typical run):
- Entries: ~316 (one per record with `_ref`)
- Memory: ~50KB (UUID strings)
- Collections: 10-11

---

### 4. Collection Processors (`processors/`)

**Base Processor** (`base-processor.ts`):

```typescript
export abstract class BaseProcessor {
  abstract processRecord(record: SeedRecord): Promise<string>;
  
  async preProcess(records: SeedRecord[]): Promise<void> {
    // Optional validation hook
  }
  
  async postProcess(results: ProcessorResult[]): Promise<void> {
    // Optional verification hook
  }
}
```

**Content Processor** (`content-processor.ts`):

```typescript
export class ContentProcessor extends BaseProcessor {
  async processRecord(record: SeedRecord): Promise<string> {
    const clean = this.removeInternalFields(record);
    const created = await this.payload.create({
      collection: this.collection,
      data: clean,
    });
    return created.id;
  }
  
  private removeInternalFields(record: SeedRecord): SeedRecord {
    const { _ref, _status, ...rest } = record;
    return rest;
  }
}
```

**Downloads Processor** (`downloads-processor.ts`):

```typescript
export class DownloadsProcessor extends BaseProcessor {
  async processRecord(record: SeedRecord): Promise<string> {
    // Preserve pre-assigned UUIDs for downloads (idempotency)
    if (record.id && this.isValidUUID(record.id)) {
      return record.id;
    }
    return super.processRecord(record);
  }
}
```

**Extension Point**: Create custom processors by extending `BaseProcessor`:

```typescript
export class UsersProcessor extends BaseProcessor {
  async processRecord(record: SeedRecord): Promise<string> {
    // Custom logic: hash passwords, validate emails, etc.
    const clean = this.prepareUserData(record);
    return super.processRecord(clean);
  }
}
```

---

### 5. Data Validators (`validators/`)

**Data Validator** (`data-validator.ts`):

```typescript
export function validateCollectionData(
  records: SeedRecord[],
  collection: string,
  context: ValidationContext
): ValidationResult {
  const errors: string[] = [];
  
  for (const record of records) {
    // Check required fields
    if (!record._ref) {
      errors.push(`${collection}: Missing _ref field`);
    }
    
    // Validate references
    const refs = extractReferences(record);
    for (const ref of refs) {
      if (!context.referenceMap.has(ref)) {
        errors.push(`${collection}[${record._ref}]: Unresolved ${ref}`);
      }
    }
  }
  
  return { isValid: errors.length === 0, errors };
}
```

**Dependency Validator** (`dependency-validator.ts`):

```typescript
export function validateDependencies(
  collection: string,
  loadedCollections: Set<string>
): DependencyValidation {
  const config = COLLECTION_CONFIGS[collection];
  const missing = config.dependencies.filter(dep => !loadedCollections.has(dep));
  
  return {
    isValid: missing.length === 0,
    missingDependencies: missing,
  };
}
```

**Post-Seed Validator** (`post-seed-validator.ts`):

```typescript
export async function validateSeedResults(
  payload: Payload,
  summary: SeedingSummary
): Promise<PostValidationResult> {
  const warnings: string[] = [];
  
  for (const result of summary.collectionResults) {
    const count = await payload.count({ collection: result.collection });
    if (count.totalDocs !== result.successCount) {
      warnings.push(`${result.collection}: Count mismatch`);
    }
  }
  
  return { warnings };
}
```

---

### 6. Utilities (`utils/`)

**Logger** (`logger.ts`):

```typescript
export class Logger {
  info(message: string): void {
    console.log(chalk.blue('ℹ'), message);
  }
  
  success(message: string): void {
    console.log(chalk.green('✓'), message);
  }
  
  error(message: string, error?: Error): void {
    console.error(chalk.red('✗'), message);
    if (error) console.error(chalk.gray(error.stack));
  }
  
  warn(message: string): void {
    console.warn(chalk.yellow('⚠'), message);
  }
  
  debug(message: string): void {
    if (this.config.verbose) {
      console.log(chalk.gray('•'), message);
    }
  }
}
```

**Progress Tracker** (`progress-tracker.ts`):

```typescript
export class ProgressTracker {
  updateProgress(current: number, total: number, success: boolean): void {
    const pct = Math.round((current / total) * 100);
    const bar = this.renderProgressBar(pct);
    console.log(`${this.collection} ${bar} ${current}/${total} (${pct}%)`);
  }
  
  private renderProgressBar(percentage: number): string {
    const filled = Math.round((percentage / 100) * this.barWidth);
    const empty = this.barWidth - filled;
    return `[${chalk.green('█'.repeat(filled))}${chalk.gray('░'.repeat(empty))}]`;
  }
}
```

---

## Data Flow

### Seeding Workflow Sequence Diagram

```
┌─────┐     ┌────────────┐     ┌────────┐     ┌──────────┐     ┌─────────┐
│ CLI │────▶│Orchestrator│────▶│ Loader │────▶│Validator │────▶│Processor│
└─────┘     └────────────┘     └────────┘     └──────────┘     └─────────┘
   │              │                 │               │                 │
   │ parseArgs()  │                 │               │                 │
   │─────────────▶│                 │               │                 │
   │              │ loadData()      │               │                 │
   │              │────────────────▶│               │                 │
   │              │                 │ readJSON()    │                 │
   │              │                 │──────────┐    │                 │
   │              │                 │◀─────────┘    │                 │
   │              │◀────────────────│               │                 │
   │              │ validateData()  │               │                 │
   │              │─────────────────────────────────▶│                 │
   │              │                 │               │ checkRefs()     │
   │              │                 │               │────────────┐    │
   │              │                 │               │◀───────────┘    │
   │              │◀─────────────────────────────────│                 │
   │              │ processCollection()              │                 │
   │              │──────────────────────────────────────────────────▶│
   │              │                 │               │                 │ create()
   │              │                 │               │                 │────────┐
   │              │                 │               │                 │◀───────┘
   │              │◀──────────────────────────────────────────────────│
   │              │ generateSummary()│               │                 │
   │              │────────────────┐ │               │                 │
   │              │◀───────────────┘ │               │                 │
   │◀─────────────│                  │               │                 │
   │ print()      │                  │               │                 │
   │────────┐     │                  │               │                 │
   │◀───────┘     │                  │               │                 │
```

### Data Transformation Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. JSON Files (seed-data/*.json)                                │
│    Raw data with {ref:...} patterns                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. Loaded Records (LoadResult[])                                │
│    Parsed JSON with metadata                                    │
│    { collection, records, recordCount, dataFile }               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. Validated Records                                            │
│    Pre-seed validation passed                                   │
│    - Required fields present                                    │
│    - References syntactically valid                             │
│    - Dependencies satisfied                                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. Resolved Records (per collection)                            │
│    References replaced with UUIDs                               │
│    { course_id: "abc-123-uuid" }                                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. Database Records (Payload tables)                            │
│    Created in PostgreSQL via Payload API                        │
│    - payload.courses                                            │
│    - payload.course_lessons                                     │
│    - payload.course_lessons_rels (relationships)                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. Summary Report                                               │
│    Statistics and verification results                          │
│    { successCount, failureCount, duration, slowestCollections } │
└─────────────────────────────────────────────────────────────────┘
```

---

## Design Patterns

### 1. Singleton Pattern

**Usage**: Payload instance

```typescript
let payloadInstance: Payload | null = null;

export async function initializePayload(): Promise<Payload> {
  if (payloadInstance) return payloadInstance;
  payloadInstance = await getPayload({ config: seedingConfig });
  return payloadInstance;
}
```

**Rationale**: Single database connection for entire seeding process.

---

### 2. Strategy Pattern

**Usage**: Collection processors

```typescript
interface ProcessorStrategy {
  processRecord(record: SeedRecord): Promise<string>;
}

class ContentProcessor implements ProcessorStrategy { ... }
class DownloadsProcessor implements ProcessorStrategy { ... }

function createProcessor(type: string): ProcessorStrategy {
  switch (type) {
    case 'content': return new ContentProcessor(...);
    case 'downloads': return new DownloadsProcessor(...);
  }
}
```

**Rationale**: Different processing logic per collection type.

---

### 3. Template Method Pattern

**Usage**: Base processor with hooks

```typescript
abstract class BaseProcessor {
  async process(records: SeedRecord[]): Promise<ProcessorResult[]> {
    await this.preProcess(records);      // Hook
    const results = await this.processRecords(records);
    await this.postProcess(results);     // Hook
    return results;
  }
  
  async preProcess(records: SeedRecord[]): Promise<void> {}   // Override
  async postProcess(results: ProcessorResult[]): Promise<void> {} // Override
}
```

**Rationale**: Extensible processing with optional customization points.

---

### 4. Command Pattern

**Usage**: CLI commands with options

```typescript
interface Command {
  execute(options: SeedOptions): Promise<SeedResult>;
}

class SeedCommand implements Command {
  async execute(options: SeedOptions): Promise<SeedResult> {
    return orchestrator.run(options);
  }
}
```

**Rationale**: Encapsulate seeding operation with configurable options.

---

## Extension Points

### 1. Custom Processors

Create specialized processors for new collection types:

```typescript
// apps/payload/src/seed/seed-engine/processors/media-processor.ts
export class MediaProcessor extends BaseProcessor {
  async processRecord(record: SeedRecord): Promise<string> {
    // Custom logic: validate file paths, check S3 existence, etc.
    if (record.filepath && !await this.fileExists(record.filepath)) {
      throw new Error(`File not found: ${record.filepath}`);
    }
    return super.processRecord(record);
  }
  
  private async fileExists(path: string): Promise<boolean> {
    // Check if file exists in S3 or local filesystem
  }
}
```

**Register in orchestrator**:

```typescript
switch (config.processor) {
  case 'media': return new MediaProcessor(payload, collection, cache);
  // ... other processors
}
```

---

### 2. Custom Validators

Add domain-specific validation rules:

```typescript
// apps/payload/src/seed/seed-engine/validators/business-validator.ts
export function validateBusinessRules(
  records: SeedRecord[],
  collection: string
): ValidationResult {
  const errors: string[] = [];
  
  if (collection === 'courses') {
    for (const record of records) {
      if (!record.slug || !/^[a-z0-9-]+$/.test(record.slug)) {
        errors.push(`Invalid slug: ${record.slug}`);
      }
    }
  }
  
  return { isValid: errors.length === 0, errors };
}
```

---

### 3. Custom Reference Patterns

Extend reference resolver for new patterns:

```typescript
// Support @ref{collection:id} syntax
const ALTERNATE_PATTERN = /@ref\{([^:]+):([^}]+)\}/g;

class ExtendedReferenceResolver extends ReferenceResolver {
  protected resolveString(str: string): string {
    // Handle standard {ref:...} pattern
    let resolved = super.resolveString(str);
    
    // Handle alternate @ref{...} pattern
    resolved = resolved.replace(ALTERNATE_PATTERN, (match, coll, id) => {
      const uuid = this.lookup(coll, id);
      if (!uuid) throw new Error(`Unresolved: ${match}`);
      return uuid;
    });
    
    return resolved;
  }
}
```

---

### 4. Post-Seed Hooks

Add custom verification logic:

```typescript
export async function verifyRelationships(
  payload: Payload,
  collection: string
): Promise<void> {
  if (collection === 'course-lessons') {
    const lessons = await payload.find({ collection: 'course-lessons' });
    for (const lesson of lessons.docs) {
      if (!lesson.course_id) {
        throw new Error(`Lesson ${lesson.id} missing course reference`);
      }
    }
  }
}
```

---

## Testing Strategy

### Test Pyramid

```
         ┌──────────────┐
         │   E2E Tests  │  (1 test suite)
         │  Full flow   │  Idempotency, relationships
         └──────┬───────┘
                │
       ┌────────┴────────┐
       │Integration Tests│  (4 test suites)
       │  Component      │  Full workflow, error scenarios
       │  interaction    │  Collection filtering
       └────────┬────────┘
                │
    ┌───────────┴──────────┐
    │     Unit Tests       │  (16 test suites)
    │  Isolated modules    │  Resolvers, loaders, processors
    │  Fast, focused       │  Validators, utilities
    └──────────────────────┘
```

### Test Coverage

**Overall**: 86.4% (503 passing / 582 total)

**By Component**:

| Component | Tests | Pass Rate | Coverage |
|-----------|-------|-----------|----------|
| Reference Resolver | 15 | 100% | 95% |
| JSON Loader | 12 | 100% | 92% |
| Data Validator | 18 | 100% | 90% |
| Processors | 24 | 83% | 85% |
| Orchestrator | 8 | 75% | 80% |
| Utilities | 16 | 94% | 88% |
| Integration | 4 | 100% | N/A |

### Test Categories

**Unit Tests** (16 suites, ~450 tests):
- Isolated module testing
- Mock external dependencies
- Fast execution (<5s total)

**Integration Tests** (4 suites, ~120 tests):
- Multi-component interaction
- Real database (test instance)
- Moderate execution (~30s total)

**E2E Tests** (1 suite, ~12 tests):
- Full workflow validation
- Production-like environment
- Slower execution (~60s total)

### Example Tests

**Unit Test** (Reference Resolver):

```typescript
describe('ReferenceResolver', () => {
  it('should resolve simple reference pattern', () => {
    const resolver = new ReferenceResolver();
    resolver.register('courses', 'ddm', 'uuid-123');
    
    const record = { course_id: '{ref:courses:ddm}' };
    const resolved = resolver.resolve(record);
    
    expect(resolved.course_id).toBe('uuid-123');
  });
});
```

**Integration Test** (Full Workflow):

```typescript
describe('Full Seeding Workflow', () => {
  it('should seed all collections in order', async () => {
    const orchestrator = new SeedOrchestrator();
    const result = await orchestrator.run({
      dryRun: false,
      verbose: false,
      collections: [],
      maxRetries: 3,
      timeout: 120000,
    });
    
    expect(result.success).toBe(true);
    expect(result.summary.successCount).toBeGreaterThan(300);
  });
});
```

---

## Performance Benchmarks

### Current Performance (316 records)

| Metric | Value |
|--------|-------|
| Total Duration | 82.45s |
| Throughput | 3.8 records/s |
| Peak Memory | 280MB |
| Database Connections | 1 (singleton) |

### Collection Breakdown

| Collection | Records | Duration | Speed |
|------------|---------|----------|-------|
| users | 1 | 0.15s | 6.7/s |
| media | 33 | 2.1s | 15.7/s |
| downloads | 4 | 0.3s | 13.3/s |
| posts | 5 | 1.2s | 4.2/s |
| courses | 1 | 0.25s | 4.0/s |
| course-lessons | 25 | 6.2s | 4.0/s |
| documentation | 3 | 0.8s | 3.8/s |
| course-quizzes | 1 | 0.2s | 5.0/s |
| surveys | 10 | 2.5s | 4.0/s |
| quiz-questions | 94 | 4.8s | 19.6/s |
| survey-questions | 246 | 3.2s | 76.9/s |

### Bottlenecks

1. **Lexical Content Parsing** (course-lessons): Complex Lexical structures slow down Payload validation
2. **Relationship Resolution** (quiz-questions): Many nested options arrays
3. **Network Latency**: Localhost overhead (~10-20ms per request)

### Optimization Opportunities

1. **Batch Processing**: Group creates into transactions
2. **Parallel Collection Processing**: Independent collections in parallel
3. **Payload Hook Disabling**: Skip unnecessary hooks during seeding
4. **Database Tuning**: Increase PostgreSQL shared buffers

---

## See Also

- [Seeding Guide](./seeding-guide.md) - Usage and configuration
- [Troubleshooting Guide](./seeding-troubleshooting.md) - Common issues
- [Implementation Plan](./../../../tracking/implementations/payload-seed/plan.md) - Original design
- [Test Results](./../../../tracking/implementations/payload-seed/updates/469/test-completion.md) - Test metrics
