# Makerkit MFA Research Report - Issue #308

**Date**: 2025-09-05  
**Issue**: #308 - Critical MFA Bypass  
**Research Focus**: Makerkit's MFA Implementation Standards

## Executive Summary

Research confirms that **the MFA bypass in your codebase is NOT a Makerkit pattern**. Makerkit enforces strict MFA requirements for super-admin users. The commented-out MFA check appears to be a local development workaround that became permanent.

## Key Findings from Makerkit Research

### 1. Makerkit's Official MFA Policy

- **Version 2.5.0+**: MFA is **MANDATORY** for super-admin users
- **No Production Bypasses**: Makerkit never recommends disabling MFA in production
- **Strict Enforcement**: Super-admin panel (`/admin`) requires both:
  - `super-admin` role in `raw_app_meta_data`
  - Active MFA (AAL2 authentication level)

### 2. Makerkit's Development Approach

Instead of commenting out security checks, Makerkit provides:

#### Test Credentials for Development

```text
Email: super-admin@makerkit.dev
Password: testingpassword
TOTP Secret: NHOHJVGPO3R3LKVPRMNIYLCDMBHUM2SE
```

#### Configuration-Based Control

```typescript
// Proper way to handle MFA in development
{
  enableMultiFactorAuth: process.env.NODE_ENV === 'production'
}
```

#### Environment Separation

- Development: Use test credentials with pre-configured MFA
- Production: Enforce real MFA for all super-admins

### 3. Comparison: Makerkit vs Your Implementation

| Aspect | Makerkit Template | Your Implementation | Status |
|--------|------------------|---------------------|---------|
| MFA Check | `if not public.is_aal2() then return false;` | `-- if not public.is_aal2() then` (commented) | ❌ VULNERABLE |
| Development Handling | Test credentials with MFA | MFA check disabled | ❌ INSECURE |
| Production Policy | MFA mandatory | MFA bypassed | ❌ CRITICAL |
| Code Location | `schemas/13-mfa.sql` | `migrations/20250417090400_admin_route_fix.sql` | ❌ OVERRIDE |

### 4. Why Your MFA Was Disabled

Based on commit `5b27ab38` analysis:

1. **Original Issue**: Admin route returning 404 errors
2. **Quick Fix Applied**: Commented out MFA check
3. **Intent**: Likely temporary workaround
4. **Result**: Became permanent (4+ months active)
5. **Root Cause**: Possibly MFA not configured for test accounts

## Makerkit's Recommended Architecture

### Proper is_super_admin() Implementation

```sql
CREATE OR REPLACE FUNCTION public.is_super_admin() 
RETURNS boolean AS $$
BEGIN
    -- MFA is REQUIRED - Never comment this out
    IF NOT public.is_aal2() THEN
        RETURN false;
    END IF;
    
    -- Check for super-admin role
    SELECT (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'super-admin' 
    INTO is_super_admin;
    
    RETURN COALESCE(is_super_admin, false);
END
$$ LANGUAGE plpgsql;
```

### Makerkit's MFA Enforcement Pattern

```typescript
// From Makerkit Remix version
const ENFORCE_MFA = true; // Never set to false in production

if (ENFORCE_MFA && !isAAL2) {
  throw new Error('MFA required for super-admin access');
}
```

## Recommended Fix Strategy

### Option 1: Full Makerkit Compliance (RECOMMENDED)

1. **Restore Original Function**: Apply the security migration immediately
2. **Setup MFA for Admins**: Ensure all super-admins have MFA configured
3. **Use Test Accounts**: For development, use Makerkit's test credentials
4. **Environment Config**: Use configuration flags, not code comments

### Option 2: Gradual Migration

If immediate enforcement would lock out admins:

```sql
-- Temporary transition function with logging
CREATE OR REPLACE FUNCTION public.is_super_admin() 
RETURNS boolean AS $$
DECLARE
    has_mfa boolean;
    is_admin boolean;
BEGIN
    -- Check MFA status
    SELECT public.is_aal2() INTO has_mfa;
    
    -- Check admin role
    SELECT (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'super-admin' 
    INTO is_admin;
    
    -- Log access attempt
    IF is_admin AND NOT has_mfa THEN
        RAISE WARNING 'Super-admin access without MFA: user_id=%', auth.uid();
        -- Temporarily allow but log (remove after grace period)
        RETURN is_admin;
    END IF;
    
    -- Standard check
    RETURN is_admin AND has_mfa;
END
$$ LANGUAGE plpgsql;
```

## Testing Considerations

### Makerkit's E2E Testing Approach

For E2E tests with MFA:

```typescript
// Use pre-configured test account
const TEST_ADMIN = {
  email: 'super-admin@makerkit.dev',
  password: 'testingpassword',
  totpSecret: 'NHOHJVGPO3R3LKVPRMNIYLCDMBHUM2SE'
};

// Generate TOTP token for tests
function generateTestTOTP() {
  return generateTOTP(TEST_ADMIN.totpSecret);
}
```

### Never Do This

```sql
-- WRONG: Don't comment out security in migrations
-- if not public.is_aal2() then
--     return false;
-- end if;
```

## Action Items

### Immediate (TODAY)

1. ✅ Confirm this is a local modification, not Makerkit pattern
2. 🔧 Apply security migration to restore MFA check
3. 📊 Audit which admins need MFA setup

### Short-term (THIS WEEK)

1. 📧 Notify all admins to enable MFA
2. 🔑 Provide MFA setup documentation
3. 🧪 Update E2E tests with proper MFA handling

### Long-term

1. 🔒 Implement environment-based configuration
2. 📝 Document proper development practices
3. 🚨 Add security scanning to prevent future bypasses

## Conclusion

Your MFA bypass is **definitely not a Makerkit pattern**. Makerkit:

- **Never recommends** commenting out MFA checks
- **Provides proper tools** for development (test accounts, config flags)
- **Enforces MFA** for super-admin access in production
- **Documents** clear security requirements

The commented-out MFA check was likely a quick fix that violated Makerkit's security model. It should be restored immediately to comply with both Makerkit's standards and general security best practices.

## References

- Makerkit Version: 2.5.0+ (MFA mandatory)
- Your Override: Migration `20250417090400_admin_route_fix.sql`
- Commit: `5b27ab38` (April 17, 2025)
- Duration Active: 4+ months
- Security Impact: CRITICAL

---

**⚠️ RECOMMENDATION**: Restore Makerkit's original MFA enforcement immediately. Use their documented development patterns instead of bypassing security.
