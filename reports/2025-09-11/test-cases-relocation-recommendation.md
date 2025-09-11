# Test Cases Relocation Recommendation

**Date**: 2025-09-11  
**Current Location**: `.claude/instructions/testing/test-cases/`  
**Files**: 19 test planning/tracking documents

## Problem

The current location doesn't make semantic sense:
- These are **planning/tracking documents**, not instructions
- They're **project documentation**, not Claude configuration
- The path is deeply nested and unintuitive
- "Instructions" implies guidance for Claude, but these track human test implementation

## Recommendation: `.claude/docs/test-planning/`

### Primary Recommendation

**Move to**: `.claude/docs/test-planning/`

**Rationale**:
1. **Semantic clarity** - These are documentation files for test planning
2. **Existing pattern** - `.claude/docs/` already contains project documentation
3. **Related content** - Test-related docs already exist in `.claude/docs/`
4. **Discoverability** - Developers expect planning docs in a docs folder
5. **Clean separation** - Keeps Claude instructions separate from project tracking

**New structure**:
```
.claude/docs/test-planning/
├── apps/
│   ├── payload/
│   │   └── src/lib/
│   │       ├── enhanced-api-wrapper.test-cases.md
│   │       ├── form-submission-protection.test-cases.md
│   │       ├── request-deduplication.test-cases.md
│   │       └── storage-url-generators.test-cases.md
│   └── web/
│       └── app/home/(user)/ai/
│           ├── canvas/
│           │   ├── _actions/
│           │   ├── _lib/contexts/
│           │   ├── _lib/hooks/
│           │   └── _lib/utils/
│           └── storyboard/
│               └── _lib/services/
└── packages/
    └── cms/src/
```

### Alternative Options Considered

#### Option 2: Colocate with Source Files
**Location**: Next to source files (e.g., `generate-ideas.test-cases.md` next to `generate-ideas.ts`)

**Pros**:
- Maximum discoverability when working on specific files
- Clear 1:1 relationship with source code
- No need to mirror directory structure

**Cons**:
- Clutters source directories
- Risk of accidental commits
- Harder to see overall test planning status
- Mixed concerns (source vs. planning)

#### Option 3: Colocate with Test Files
**Location**: Next to test files (e.g., `generate-ideas.test-cases.md` next to `generate-ideas.test.ts`)

**Pros**:
- Logical grouping with actual tests
- Easy to reference when writing tests

**Cons**:
- Test files don't exist for all planned tests
- Still clutters source tree
- Planning docs shouldn't be in source

#### Option 4: `.claude/test-planning/`
**Location**: New top-level directory in `.claude/`

**Pros**:
- Very clear purpose
- Easy to find

**Cons**:
- Adds another top-level directory
- Separates from other documentation
- Breaks existing `.claude/docs/` pattern

## Implementation Steps

1. **Create new directory structure**:
```bash
mkdir -p .claude/docs/test-planning
```

2. **Move files preserving structure**:
```bash
mv .claude/instructions/testing/test-cases/* .claude/docs/test-planning/
```

3. **Update `/write-tests` command**:
```typescript
// Change from:
unit: `.claude/instructions/testing/test-cases/${mirrorSourcePath(file)}/${getBasename(file)}.test-cases.md`

// To:
unit: `.claude/docs/test-planning/${mirrorSourcePath(file)}/${getBasename(file)}.test-cases.md`
```

4. **Clean up empty directory**:
```bash
rm -rf .claude/instructions/testing
rmdir .claude/instructions  # if empty
```

## Benefits of Recommended Approach

1. **Intuitive location** - Developers expect test planning in docs
2. **Consistent organization** - Follows existing `.claude/docs/` pattern
3. **Clear separation** - Instructions vs. documentation
4. **Future-proof** - Room for other test documentation (coverage reports, etc.)
5. **Maintains structure** - Preserves source tree mirroring for easy navigation

## Impact

- **Commands affected**: `/write-tests` (requires path update)
- **Risk**: Low - Simple path change
- **Backward compatibility**: None needed (internal tooling only)
- **User impact**: Improved discoverability and organization