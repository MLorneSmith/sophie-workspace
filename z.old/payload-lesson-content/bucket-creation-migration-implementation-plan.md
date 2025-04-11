# Certificates Bucket Creation Migration Implementation Plan

## Summary

This plan outlines the implementation of a SQL migration file to create the certificates bucket in Supabase, rather than relying entirely on the PowerShell script approach. The current approach in the `reset-and-migrate.ps1` script attempts to create the bucket using Supabase CLI commands, but this approach has been encountering issues with different CLI versions and command syntax.

## Changes Implemented

1. **Migration File Creation**

   - Created a new Supabase migration file at `apps/web/supabase/migrations/20250411200114_create_certificates_bucket.sql`
   - Implemented robust SQL that:
     - Attempts to create the bucket using multiple syntax variations to accommodate different Supabase versions
     - Sets appropriate storage policies for public read access and authenticated user operations
     - Includes comprehensive error handling to ensure the migration continues even if the bucket already exists
     - Uses a non-critical approach consistent with the project's requirements

2. **Script Handling**
   - The existing bucket creation code in `scripts/orchestration/utils/supabase.ps1` will be maintained as a fallback
   - This provides a dual approach where:
     - During normal database migrations, the SQL approach will handle bucket creation
     - During specialized reset-and-migrate operations, the script can still attempt bucket creation if needed

## Benefits

1. **Reliability**: SQL migrations are more reliable than CLI commands across different environments
2. **Version Independence**: The migration approach works regardless of CLI version
3. **Reproducibility**: The bucket creation is now part of the standard migration workflow
4. **Documentation**: The process is explicitly documented in both the migration file and this plan
5. **Error Handling**: Both approaches now have robust error handling for non-critical failures

## Integration with Existing System

The bucket creation is now handled at two levels:

1. **Database Migration Level**: Through the SQL migration file during database setup
2. **Script Fallback Level**: Through the improved PowerShell script for extra reliability

This dual approach ensures maximum probability of success while maintaining the non-critical nature of the bucket creation step.

## Validation

The migration was tested with:

- The Supabase migration system
- Multiple Supabase versions to ensure compatibility
- Error scenarios to verify robust handling

## Related Changes

- Updated `z.docs/content-migration/warning-fixes-summary.md` to document the improved approach

## Next Steps

1. Consider improving the logging in the script to check if the bucket already exists before attempting creation
2. Remove the bucket creation step from the script entirely in a future update if the migration approach proves 100% reliable
