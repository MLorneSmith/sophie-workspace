# Quiz Management Scripts Deletion List

Based on the analysis of the content migration system and the current state of quiz management scripts, the following files can be safely deleted as they have been moved to their respective subdirectories.

## Files That Can Be Safely Deleted

### Root Directory (`packages/content-migrations/src/scripts/repair/quiz-management/`)

The following files in the root directory can be safely deleted:

1. `direct-quiz-fix.sql` (duplicate of `core/direct-quiz-fix.sql`)
2. `fix-invalid-quiz-references.ts` (moved to `utilities/fix-invalid-quiz-references.ts`)
3. `fix-lesson-quiz-field-name.ts` (moved to `lesson-quiz-relationships/fix-lesson-quiz-field-name.ts`)
4. `fix-lesson-quiz-references.ts` (moved to `lesson-quiz-relationships/fix-lesson-quiz-references.ts`)
5. `fix-lessons-quiz-references-sql.ts` (moved to `lesson-quiz-relationships/fix-lessons-quiz-references-sql.ts`)
6. `fix-questions-quiz-references.ts` (moved to `question-relationships/fix-questions-quiz-references.ts`)
7. `fix-quiz-id-consistency.ts` (moved to `utilities/fix-quiz-id-consistency.ts`)
8. `fix-quiz-question-relationships.ts` (moved to `question-relationships/fix-quiz-question-relationships.ts`)
9. `fix-quizzes-without-questions.ts` (moved to `question-relationships/fix-quizzes-without-questions.ts`)
10. `run-direct-quiz-fix.ts` (duplicate of `core/run-direct-quiz-fix.ts`)
11. `README.md.bak` (backup file that's no longer needed)

## Verification Steps Before Deletion

Before deleting these files, it's important to verify:

1. **Content Match**: Ensure the content of each file in its new location is identical to the original
2. **Import Path Updates**: Verify any imports pointing to these files have been updated to reference the new locations
3. **Package.json Updates**: Check that package.json script definitions have been updated to reference the new file paths
4. **Orchestration Script Updates**: Confirm that any orchestration scripts (e.g., `loading.ps1`) have been updated to call the scripts at their new locations

## Deletion Process

1. **Create Backups**: Before deleting, make a backup of all files to be deleted

   ```powershell
   # Example backup command
   mkdir -p packages/content-migrations/src/scripts/repair/quiz-management/pre-deletion-backup
   cp packages/content-migrations/src/scripts/repair/quiz-management/*.{ts,sql} packages/content-migrations/src/scripts/repair/quiz-management/pre-deletion-backup/
   ```

2. **Test Migration**: Run a full migration test to ensure everything still works with the reorganized structure

   ```powershell
   ./reset-and-migrate.ps1
   ```

3. **Delete Files**: Once verified, delete the duplicate files

   ```powershell
   # Example deletion commands
   rm packages/content-migrations/src/scripts/repair/quiz-management/direct-quiz-fix.sql
   rm packages/content-migrations/src/scripts/repair/quiz-management/fix-invalid-quiz-references.ts
   # ... and so on for all files to be deleted
   ```

## Additional Notes

- The deleted files are all duplicates of files that now exist in the proper subdirectories
- This deletion will not impact functionality as all scripts have been properly relocated
- In case of any issues, the backup files can be restored

## Future Work After Deletion

After successfully deleting these files:

1. Update documentation to reference the new file locations
2. Consider implementing the consolidation plan from `4-quiz-management-scripts-further-consolidation-plan.md` to further reduce duplication
3. Run additional tests to ensure everything continues to work correctly
