# Payload Posts Migration Steps

## Overview of Fixes

I've implemented the following fixes for the two issues we were experiencing:

1. **Content Truncation Fix**:

   - Modified `packages/content-migrations/src/scripts/core/migrate-posts-direct.ts` to properly handle Markdown to Lexical conversion
   - Added better logging to verify content length before and after conversion
   - Created testing scripts to verify proper conversion

2. **Parent Query Error Fix**:
   - Updated `packages/cms/payload/src/payload-client.ts` to avoid querying for child documents in non-hierarchical collections like 'posts'
   - Added a check to skip the parent-child relationship query for specific collections
   - Added better error handling and logging

## Testing Tools

I've created additional tools to help test and verify these fixes:

1. **Test Post Migration Script** (`test:post-migration`):

   - Tests the conversion of Markdown to Lexical format without modifying the database
   - Outputs detailed logs about the conversion process
   - Saves the raw Markdown content to a debug directory for manual inspection

2. **Verify Post Content Script** (`verify:post-content`):
   - Connects to the database and verifies existing posts
   - Checks that content is properly formatted and complete
   - Reports on any potential issues with content structure or truncation

## Migration Steps

To perform a complete migration with these fixes:

1. **Backup the Database**:

   ```powershell
   # Backup your database before proceeding
   ```

2. **Test the Markdown Conversion**:

   ```powershell
   cd packages/content-migrations
   pnpm run test:post-migration
   ```

   - Review the output to confirm that posts are being converted correctly
   - Check the debug directory for raw content and verify it matches the expected Lexical output

3. **Run the Reset and Migrate Process**:

   ```powershell
   ./reset-and-migrate.ps1
   ```

   - This will reset the database and run all migrations with the fixed scripts

4. **Verify the Database Content**:

   ```powershell
   cd packages/content-migrations
   pnpm run verify:post-content
   ```

   - Check that all posts have complete content with proper structure
   - Verify that no truncation is occurring

5. **Test the Blog Page Functionality**:
   - Navigate to the blog pages to ensure they load without errors
   - Verify that the "parent query" error is no longer appearing
   - Check that full content is displayed for all blog posts

## Notes on Implementation

1. **The Parent Query Issue**:

   - The fix recognizes that not all collections use parent-child relationships
   - We now skip the child document query for 'posts' collection
   - This pattern can be extended to other non-hierarchical collections if needed

2. **The Content Truncation Issue**:

   - The Markdown to Lexical conversion now properly handles the full content
   - We added Lexical node registration to support all required content types
   - Verification is in place to detect any future truncation issues

3. **Long-Term Improvements**:
   - Consider adding a flag to collection configurations to explicitly mark hierarchical vs non-hierarchical collections
   - Implement more robust error handling for Lexical conversion edge cases
   - Add these verification steps to the regular migration pipeline
