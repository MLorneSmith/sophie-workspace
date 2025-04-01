# Content Migrations Cleanup Plan

## Scripts to Delete

The following scripts can be deleted as they have been replaced by the comprehensive `repair-all-relationships.ts` script:

1. `repair-media-relationships.ts`
2. `repair-documentation-relationships.ts`
3. `repair-posts-relationships.ts`
4. `repair-surveys-relationships.ts`
5. `repair-survey-questions-relationships.ts`
6. `repair-courses-relationships.ts`

## Scripts to Remove from package.json

The following scripts can be removed from package.json as they are no longer needed:

```json
"repair:media-relationships": "tsx src/scripts/repair-media-relationships.ts",
"repair:documentation-relationships": "tsx src/scripts/repair-documentation-relationships.ts",
"repair:posts-relationships": "tsx src/scripts/repair-posts-relationships.ts",
"repair:surveys-relationships": "tsx src/scripts/repair-surveys-relationships.ts",
"repair:survey-questions-relationships": "tsx src/scripts/repair-survey-questions-relationships.ts",
"repair:courses-relationships": "tsx src/scripts/repair-courses-relationships.ts",
```

## Scripts to Keep

The following scripts should be kept as they are still used in the reset-and-migrate.ps1 script or might be useful for development and testing:

1. `test-env.ts` - Used for testing environment variables
2. `test-auth.ts` - Used for testing authentication
3. `test-database-connection.ts` - Used for testing database connections
4. `create-admin-user.ts` - Used for creating admin users
5. `create-course.ts` - Used for creating courses
6. `migrate-all.ts` - Used for migrating all content
7. `migrate-all-direct.ts` - Used for direct migration of all content
8. `migrate-testimonials.ts` - Used for migrating testimonials
9. `update-docs-content.ts` - Used for updating documentation content
10. `migrate-course-lessons.ts` - Used for migrating course lessons
11. `migrate-course-quizzes.ts` - Used for migrating course quizzes
12. `migrate-course-quizzes-direct.ts` - Used for direct migration of course quizzes
13. `migrate-quiz-questions.ts` - Used for migrating quiz questions
14. `migrate-quiz-questions-direct.ts` - Used for direct migration of quiz questions
15. `fix-quiz-relationships.ts` - Used for fixing quiz relationships
16. `fix-relationships-direct.ts` - Used for direct fixing of relationships
17. `repair-all-relationships.ts` - Used in reset-and-migrate.ps1 for repairing all relationships
18. `migrate-posts.ts` - Used for migrating posts
19. `migrate-payload-docs.ts` - Used for migrating payload documentation
20. `migrate-payload-quizzes.ts` - Used for migrating payload quizzes
21. `migrate-collections-local-to-remote.ts` - Used for migrating collections from local to remote
22. `cleanup-remote-documentation.ts` - Used for cleaning up remote documentation
23. `cleanup-and-migrate-remote.ts` - Used for cleaning up and migrating remote content
24. `cleanup-collections.ts` - Used for cleaning up collections
25. `migrate-enhanced.ts` - Used for enhanced migration

## Other Scripts

The following scripts are not referenced in package.json but might be useful for development or testing:

1. `check-database-schema.ts`
2. `execute-payload-schema.ts`
3. `migrate-docs-enhanced.ts`

These scripts can be kept for now, but should be reviewed in the future to determine if they are still needed.
