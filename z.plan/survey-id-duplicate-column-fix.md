# Survey ID Duplicate Column Fix

## Issue Description

When attempting to edit a lesson in the Payload CMS admin interface, the following error occurs:

```
ERROR: column "survey_id_id" specified more than once
```

This error prevents users from editing lessons that have survey relationships, significantly impacting the content management workflow for course materials.

## System Context

Our application uses Payload CMS integrated with a Makerkit-based Next.js 15 app as the content management system. The content migration system populates Payload CMS collections, including courses, lessons, quizzes, and surveys.

The system follows a two-phase process:

1. One-time processing of data by running `pnpm run process:raw-data` in `\packages\content-migrations`
2. Running database migration files and seed files

The applications share a single Supabase PostgreSQL database, with Payload content stored in the `payload` schema.

## Root Cause Analysis

### How Payload Handles Relationship Fields

Payload CMS automatically adds an `_id` suffix to relationship fields in the database. When defining a relationship field like `survey_id` in a collection configuration, Payload automatically creates a database column named `survey_id_id`.

### The Duplicate Column Definition

In the `CourseLessons` collection configuration (`apps/payload/src/collections/CourseLessons.ts`), there are **two sources for the same column**:

1. The standard relationship field:

```typescript
{
  name: 'survey_id',
  type: 'relationship',
  relationTo: 'surveys' as any,
  hasMany: false,
  admin: {
    description: 'The survey associated with this lesson (if any)',
  },
}
```

2. An explicitly defined field:

```typescript
{
  name: 'survey_id_id',
  type: 'text',
  admin: {
    hidden: true, // Hide this field in the admin UI
  },
  hooks: {
    beforeChange: [
      ({ data }: { data?: any }) => {
        // Copy the value from survey_id to survey_id_id if survey_id exists
        if (data?.survey_id) {
          if (typeof data.survey_id === 'object' && data.survey_id.id) {
            return data.survey_id.id
          }
          return data.survey_id
        }
        return undefined
      },
    ],
  },
}
```

### SQL Generation Process Leading to Error

When Payload attempts to update a lesson, it generates an SQL query that includes both column definitions. Since PostgreSQL doesn't allow duplicate column names in queries, it throws the error: `column "survey_id_id" specified more than once`.

The database schema confirms this issue, as we can see both `survey_id` and `survey_id_id` columns in the `course_lessons` table:

```sql
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'payload' AND table_name = 'course_lessons';
```

The query results show both columns exist:

```
id
title
slug
description
content
lesson_number
estimated_duration
published_at
quiz_id
quiz_id_id
course_id
course_id_id
featured_image_id
featured_image_id_id
media_id
created_at
updated_at
survey_id
survey_id_id
```

## Proposed Solution

### Specific Changes Needed

Remove the explicitly defined `survey_id_id` field from the `CourseLessons` collection configuration in `apps/payload/src/collections/CourseLessons.ts`. This will allow Payload to automatically manage the relationship without duplicate column references.

### Rationale

The explicit `survey_id_id` field was likely added to ensure compatibility with existing database schemas or migration scripts. However, with Payload's automatic relationship handling, this explicit definition is redundant and causes conflicts in SQL generation.

The standard relationship field (`survey_id`) is sufficient, as Payload will automatically create and manage the corresponding `survey_id_id` column in the database.

### Potential Impacts

1. **Data Consistency**: Removing the explicit field definition won't affect the database schema, as both fields map to the same column. The hooks on the explicit field were designed to keep the values in sync, which won't be necessary after the fix.

2. **Migration System**: If there are custom migrations or seed scripts that explicitly manage the `survey_id_id` field, they might need adjustment. However, they should continue to work as the database column will still exist.

## Implementation Steps

1. **Edit the Collection Definition**:

   - Modify `apps/payload/src/collections/CourseLessons.ts` to remove the explicit `survey_id_id` field
   - Keep the standard `survey_id` relationship field

2. **Test the Fix**:

   - Restart the Payload app
   - Try editing a lesson with a survey to verify the error is resolved

3. **Verify Data Integrity**:
   - Confirm that existing relationships between lessons and surveys are maintained
   - Check that new relationships can be created correctly

## Future Recommendations

### Best Practices for Payload Relationships

1. **Use Standard Relationship Fields**: Rely on Payload's built-in relationship handling instead of creating explicit ID fields.

2. **Consistent Naming**: Be careful with field names that end with `_id` when they're relationships, as Payload will add another `_id` suffix in the database.

3. **Review Collection Definitions**: Examine other collections for similar patterns of duplicate fields and apply the same fix where needed.

### System Improvements

1. **Documentation**: Update content migration documentation to clarify how Payload handles relationships.

2. **Verification Scripts**: Consider adding a verification step to check for duplicate field definitions in collection configurations.

3. **Database Review**: Periodically review the database schema to ensure it aligns with the collection definitions.

## Conclusion

The issue of duplicate `survey_id_id` column references stems from having both an automatic and an explicit definition of the same field. By removing the explicit definition and relying on Payload's automatic relationship handling, we can resolve the error while maintaining data integrity and system functionality.
