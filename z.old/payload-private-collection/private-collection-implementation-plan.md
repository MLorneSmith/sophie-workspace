# Private Collection Implementation Plan

## Overview and Requirements

We need to create a new Payload CMS collection called "Private" which will be a collection of posts that should not be indexable by Google. This collection should be:

1. Modeled after the existing `Posts` collection
2. Accessible from a frontend route under `apps/web/app/(marketing)/private/[slug]`
3. Populated with content from raw HTML files located in `packages/content-migrations/src/data/raw/bpm`
4. Integrated with the content migration system

## Technical Architecture

### 1. Payload Collection Definition

The new Private collection will have the same structure as the Posts collection:

- Fields for title, slug, description, content (Lexical rich text)
- Publishing status and date
- Categories and tags
- Image relationships
- Downloads relationships

### 2. Frontend Routes

We'll create the necessary Next.js routes:

- `apps/web/app/(marketing)/private/[slug]/page.tsx` - Dynamic route for private content
- Reuse existing components from the blog implementation

### 3. Migration Scripts

We'll create a migration script based on the existing post migration:

- `packages/content-migrations/src/scripts/core/migrate-private-direct.ts`
- It will process HTML content from the `bpm` directory
- Convert the content to Lexical format for Payload CMS
- Insert content directly into the database

### 4. Database Tables

The implementation will create:

- `payload.private` - Main collection table
- `payload.private_categories` - Categories for private posts
- `payload.private_tags` - Tags for private posts
- `payload.private_rels` - Relationship table for relationships
- `payload.private__downloads` - Junction table for downloads

## Detailed Implementation Steps

### 1. Payload Collection Creation

1. Create `apps/payload/src/collections/Private.ts`:

   - Copy structure from `Posts.ts`
   - Adjust labels, descriptions
   - Maintain the same field structure and hooks

2. Add the collection to Payload config in `apps/payload/src/payload.config.ts`

### 2. Next.js Route Implementation

1. Create the dynamic route page:

   - `apps/web/app/(marketing)/private/[slug]/page.tsx`
   - Model after `apps/web/app/(marketing)/blog/[slug]/page.tsx`
   - Ensure proper metadata with noindex directives

2. Reuse the Post component with adjustments as needed:
   - `apps/web/app/(marketing)/private/_components/post.tsx` (if needed)

### 3. Migration Script Development

1. Create `packages/content-migrations/src/scripts/core/migrate-private-direct.ts`:

   - Model after `migrate-posts-direct.ts`
   - Update paths to read from `src/data/raw/bpm`
   - Update table names and collection references
   - Maintain error handling and logging

2. Create test utilities to verify the migration:
   - Add verification scripts if needed

### 4. Integration with Migration Process

1. Update the migration orchestration:

   - Add a call to the private migration in `scripts/orchestration/phases/loading.ps1`
   - Add verification steps

2. Add SQL generation if needed:
   - Add to the processing phase if necessary

## Testing Strategy

1. Test the Payload collection definition:

   - Verify fields in Payload admin UI
   - Test CRUD operations

2. Test the migration script:

   - Run against test data
   - Verify content conversion to Lexical format
   - Check database entries

3. Test the frontend routes:

   - Ensure content displays correctly
   - Verify SEO settings

4. Test integration with migration process:
   - Run the full reset-and-migrate process
   - Verify content is properly loaded

## Potential Issues and Mitigations

1. **HTML Conversion**:

   - The HTML content might have complex structures difficult to convert to Lexical format
   - Mitigation: Implement fallback plaintext conversion

2. **Database Schema Changes**:

   - Adding new tables might require careful migration handling
   - Mitigation: Test local migrations thoroughly before committing

3. **Migration Process Integration**:

   - The direct migration might conflict with other migrations
   - Mitigation: Run migration in the right phase of the process

4. **SEO Configuration**:
   - Need to ensure content is not indexed
   - Mitigation: Add explicit noindex meta tags and test with search console tools

## Implementation Timeline

1. Payload Collection Creation - 1 hour
2. Next.js Route Implementation - 1 hour
3. Migration Script Development - 2 hours
4. Integration and Testing - 1 hour

Total estimated time: 5 hours
