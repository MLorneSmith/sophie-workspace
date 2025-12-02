# Implementation Report: Survey Slug Mismatch Fix

**Issue**: #835
**Date**: 2025-12-02
**Status**: Complete

## Summary

Fixed the "Survey Not Found" error on the assessment page by adding explicit `slug` fields to the survey seed data.

## Root Cause

The assessment page queries for surveys by `slug="self-assessment"`, but the seeded survey had an auto-generated slug derived from the title ("highstakes-presentations-selfassessment"). This mismatch caused the survey lookup to fail.

## Changes Made

### 1. surveys-converter.ts
- Added `slug: string` to `SurveyJson` interface
- Set `slug: surveyId` in survey object construction

### 2. surveys.json
- Regenerated with explicit slug fields:
  - `feedback` -> slug: "feedback"
  - `self-assessment` -> slug: "self-assessment"
  - `three-quick-questions` -> slug: "three-quick-questions"

### 3. package.json (lint-staged config)
- Fixed pattern matching to properly handle seed directory files
- Updated glob patterns to use bash conditionals for path exclusions

## Commits

1. `b0fefe049` - chore(config): align lint-staged with biome ignore for seed directory
2. `bfda18fd8` - fix(cms): add explicit slug field to survey seed data

## Validation

- All typecheck, lint, and format commands passed
- Database verified: surveys have correct slugs matching frontend queries
- Pre-commit hooks pass successfully

## Files Changed

```
apps/payload/src/seed/seed-conversion/converters/surveys-converter.ts  | 2 +
apps/payload/src/seed/seed-data/surveys.json                           | 79 changes
package.json                                                           | 9 changes
```
