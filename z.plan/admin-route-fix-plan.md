# Admin Route 404 Error Analysis and Fix Plan

## Issue Overview

When a superuser (specifically test2@slideheroes.com) attempts to access the route `/admin`, a 404 error is returned. This occurs despite the user having the correct `super-admin` role in their `raw_app_meta_data`.

## Root Cause Analysis

After investigating the issue, I've identified a mismatch between how the super admin permissions are stored and how they're being checked:

1. **Database Schema Analysis**

   - User `test2@slideheroes.com` has the correct permission in `raw_app_meta_data` as `{"role": "super-admin", ...}`
   - The current implementation of the `is_super_admin()` function checks the `is_super_admin` column in the `auth.users` table, which is `null` for this user

2. **Current implementation**

   ```sql
   -- Current implementation of is_super_admin() in our database
   CREATE OR REPLACE FUNCTION public.is_super_admin()
   RETURNS boolean
   LANGUAGE sql
   SECURITY DEFINER
   SET search_path TO 'public'
   AS $function$
     SELECT EXISTS (
       SELECT 1
       FROM auth.users
       WHERE id = auth.uid() AND is_super_admin = true
     );
   $function$
   ```

3. **Makerkit Implementation**
   The reference Makerkit implementation is different and checks:

   ```sql
   -- Makerkit implementation
   create or replace function public.is_super_admin() returns boolean
       set search_path = '' as
   $$
   declare
       is_super_admin boolean;
   begin
       if not public.is_aal2() then
           return false;
       end if;

       select (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'super-admin' into is_super_admin;

       return coalesce(is_super_admin, false);
   end
   $$ language plpgsql;
   ```

   This implementation:

   - First verifies MFA authentication via the `is_aal2()` function
   - Then checks if the user has the 'super-admin' role in their JWT app_metadata

## Implementation Plan

To align with the Makerkit implementation and fix the issue, we will:

1. **Create or replace the necessary functions**:

   - `is_aal2()`: To check if the user has MFA/2FA authentication
   - `is_super_admin()`: To check for the super-admin role in app_metadata

2. **Implement the functions according to Makerkit's approach**:

   - Use Makerkit's SQL implementation as a reference
   - Adapt if necessary for our specific setup

3. **Add the appropriate permissions**:

   - Grant execute permissions to authenticated users

4. **Handle MFA considerations**:
   - Implement MFA-related policies if required
   - Consider making MFA enforcement optional based on configuration

## Implementation Considerations

1. **MFA Requirement**

   - Makerkit has MFA as a requirement for super admins
   - We need to decide if we want to maintain this requirement or make it optional initially

2. **Data Migration**

   - No data migration is needed since users already have the correct role in `raw_app_meta_data`

3. **Testing Approach**
   - Test with existing superuser account (test2@slideheroes.com)
   - Verify admin route access works correctly after implementation

## Expected Outcome

After implementation, the super admin user will be correctly identified by the system when accessing the `/admin` route, and the 404 error will be resolved.
