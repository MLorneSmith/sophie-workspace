# Deprecated Quiz System Repair Scripts

As part of the implementation of the new Quiz System Repair, several existing scripts have been marked as deprecated. This document provides guidance on transitioning from these deprecated scripts to the new system.

## Deprecated Scripts

The following scripts have been marked as deprecated and should no longer be used:

| Deprecated Script                           | Replacement          |
| ------------------------------------------- | -------------------- |
| `quiz:fix:corrected`                        | `quiz:repair:system` |
| `fix:bidirectional-quiz-relationships`      | `quiz:repair:system` |
| `fix:quiz-paths-and-relationships`          | `quiz:repair:system` |
| `fix:enhanced-quiz-paths-and-relationships` | `quiz:repair:system` |
| `fix:format-questions-jsonb`                | `quiz:repair:system` |
| `fix:format-questions-jsonb-drizzle`        | `quiz:repair:system` |
| `fix:format-questions-jsonb-direct`         | `quiz:repair:system` |
| `fix:questions-jsonb-comprehensive`         | `quiz:repair:system` |
| `fix:unidirectional-quiz-questions`         | `quiz:repair:system` |
| `fix:comprehensive-quiz-fix`                | `quiz:repair:system` |
| `fix:direct-quiz-fix`                       | `quiz:repair:system` |
| `fix:quiz-question-relationships-enhanced`  | `quiz:repair:system` |
| `fix:quiz-array-relationships`              | `quiz:repair:system` |

## Transition Guide

### One-to-One Replacements

Most scripts can be directly replaced with the new system:

```bash
# Old approach
pnpm --filter @kit/content-migrations run fix:bidirectional-quiz-relationships

# New approach
pnpm --filter @kit/content-migrations run quiz:repair:system
```

### Targeted Repairs

For scripts that focused on specific aspects, use the appropriate flag with the new system:

1. For JSONB format fixes only:

```bash
# Old approach
pnpm --filter @kit/content-migrations run fix:questions-jsonb-comprehensive

# New approach - Not yet implemented but planned
pnpm --filter @kit/content-migrations run quiz:repair:system --jsonb-only
```

2. For relationship fixes only:

```bash
# Old approach
pnpm --filter @kit/content-migrations run fix:bidirectional-quiz-relationships

# New approach - Not yet implemented but planned
pnpm --filter @kit/content-migrations run quiz:repair:system --relationships-only
```

### Verification Scripts

For verification-only operations:

```bash
# Old approach
pnpm --filter @kit/content-migrations run verify:quiz-relationships-enhanced

# New approach
pnpm --filter @kit/content-migrations run quiz:repair:system:verify
```

## Runtime Behavior

### Old System

The deprecated scripts operated independently and often had overlapping functionality. This caused:

- Redundant fixes being applied
- Potential conflicts between scripts
- Inconsistent success/failure reporting
- No unified transaction management
- Limited verification options

### New System

The new Quiz System Repair provides:

- Unified repair process
- Comprehensive verification
- Transaction safety
- Better error reporting
- Dry run capabilities
- Integration with reset-and-migrate workflow

## PowerShell Integration

The new system is fully integrated into the content migration workflow via:

1. `quiz-system-repair.ps1` - PowerShell wrapper for the repair system
2. `loading-with-quiz-repair.ps1` - Updated loading phase with the new repair system
3. Updated `reset-and-migrate.ps1` to use the new loading phase

## Usage in Reset-and-Migrate

The system is fully integrated into the reset-and-migrate.ps1 script:

```powershell
# Running the full reset-and-migrate process
./reset-and-migrate.ps1

# Running with skip verification
./reset-and-migrate.ps1 -SkipVerification
```

When the script runs, it will:

1. Execute the standard setup phase
2. Process raw data and generate SQL files
3. Run the loading phase, which now includes:
   - Running content migrations
   - Importing downloads
   - **Running the new Quiz System Repair**
   - Running other relationship fixes
   - Verifying the database

## Future Development

As the new system proves its reliability, the deprecated scripts will eventually be removed completely. In the meantime, they are kept with deprecation notices to:

1. Maintain backward compatibility
2. Support existing automated processes that might rely on them
3. Enable fallback options if specific issues arise with the new system
4. Allow developers to compare behavior during the transition period

## Conclusion

By consolidating the quiz repair functionality into a single, comprehensive system, we've improved:

- Reliability: All repairs are performed in a single transaction
- Maintainability: Code is organized in a modular, easy-to-understand structure
- Efficiency: No redundant operations or database queries
- Error handling: Clearer error messages and better recovery options

The new Quiz System Repair addresses the root causes of relationship issues between quizzes and questions, ensuring reliable quiz functionality in both the CMS and frontend application.
