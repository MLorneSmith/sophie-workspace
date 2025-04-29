# Quiz System Repair - Testing Guide

This guide provides instructions for testing and deploying the new Quiz System Repair implementation.

## Prerequisites

1. Ensure your development environment is set up correctly:
   - Local Supabase database is running
   - Node.js and PNPM are installed
   - All project dependencies are installed

## Testing Approaches

### 1. Direct Testing via Command Line

You can test the Quiz System Repair independently using the following commands:

```bash
# Analysis only mode - safe, read-only operation
pnpm --filter @kit/content-migrations run quiz:repair:system:analyze

# Verification only mode - checks the current state without making changes
pnpm --filter @kit/content-migrations run quiz:repair:system:verify

# Dry run mode - shows what changes would be made without actually making them
pnpm --filter @kit/content-migrations run quiz:repair:system:dry-run

# Full repair mode - performs all fixes and verifies the results
pnpm --filter @kit/content-migrations run quiz:repair:system
```

### 2. Testing via Reset-and-Migrate

The Quiz System Repair is now integrated into the main reset-and-migrate.ps1 script and will run as part of the relationship fixing phase. To test:

```powershell
# Run with default options
./reset-and-migrate.ps1

# Run with skip verification
./reset-and-migrate.ps1 -SkipVerification
```

Our implementation is designed to coexist with the existing quiz repair scripts to ensure backward compatibility.

## Verifying Results

After running the Quiz System Repair, you can verify the results using these approaches:

### 1. Check the Logs

Review the terminal output for:

- Number of primary relationships created
- Number of bidirectional relationships created
- Number of quizzes with updated JSONB format
- Verification results and any remaining issues

### 2. Run Independent Verification

```bash
# Run the standalone verification tool
pnpm --filter @kit/content-migrations run quiz:repair:system:verify

# Run the comprehensive quiz relationship verification
pnpm --filter @kit/content-migrations run verify:comprehensive-quiz-relationships

# Run the diagnostic to see current relationship state
pnpm --filter @kit/content-migrations run diagnostic:quiz-relationships
```

### 3. Manual Verification in Payload CMS

1. Start the Payload CMS server:

   ```bash
   cd apps/payload
   pnpm dev
   ```

2. Navigate to http://localhost:3000/admin
3. Log in with admin credentials
4. Check the following collections:
   - Course Quizzes: Verify all quizzes are listed and properly display their associated questions
   - Quiz Questions: Verify all questions properly link back to their parent quizzes

### 4. Frontend Testing

1. Start the web application:

   ```bash
   cd apps/web
   pnpm dev
   ```

2. Navigate to http://localhost:3000
3. Log in to the application
4. Navigate to course lessons with quizzes and verify they load correctly without errors
5. Take quizzes to confirm they function as expected

## Troubleshooting Common Issues

### Issue: Some quizzes still don't appear in Payload CMS

**Potential Solutions:**

- Check quiz-to-question relationships in database:
  ```sql
  SELECT * FROM payload.course_quizzes_rels WHERE path = 'questions' AND quiz_questions_id IS NOT NULL;
  ```
- Verify question-to-quiz relationships:
  ```sql
  SELECT * FROM payload.quiz_questions_rels WHERE field = 'quiz_id';
  ```
- Check JSONB format in quizzes:
  ```sql
  SELECT id, title, jsonb_array_length(questions) as question_count FROM payload.course_quizzes;
  ```

### Issue: Frontend NextJS errors when accessing lesson pages

**Potential Solutions:**

- Check browser console for specific error messages
- Verify quiz_id references in lessons:
  ```sql
  SELECT id, title, quiz_id, quiz_id_fallback FROM payload.course_lessons WHERE quiz_id IS NOT NULL OR quiz_id_fallback IS NOT NULL;
  ```
- Clear browser cache and refresh the page

### Issue: Transaction fails during repair process

**Potential Solutions:**

- Run in dry run mode to identify specific issues
- Try running individual components separately:

  ```bash
  # Handle only primary relationships
  pnpm --filter @kit/content-migrations run quiz:repair:system --primary-only

  # Handle only bidirectional relationships
  pnpm --filter @kit/content-migrations run quiz:repair:system --bidirectional-only

  # Handle only JSONB format
  pnpm --filter @kit/content-migrations run quiz:repair:system --jsonb-only
  ```

## Adding New Capabilities

To extend this system with new capabilities:

1. Create new modules in packages/content-migrations/src/scripts/repair/quiz-system/
2. Update types.ts with new interfaces as needed
3. Add new functionality to the index.ts orchestration
4. Update CLI options in run-quiz-system-repair.ts
5. Run tests to ensure compatibility with existing functionality

## Deployment Considerations

- This system is designed to work as part of the content migration process
- The integration with reset-and-migrate.ps1 ensures it runs at the appropriate time
- No additional deployment steps are required beyond normal project deployment
- The system is compatible with both development and production environments

## Monitoring and Maintenance

- Review migration logs in z.migration-logs/ after running reset-and-migrate
- Periodically run verification to ensure relationships remain consistent
- Consider scheduling automated verification as part of CI/CD processes
