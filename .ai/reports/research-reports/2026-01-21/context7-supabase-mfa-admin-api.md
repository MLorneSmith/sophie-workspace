# Context7 Research: Supabase MFA Admin API

**Date**: 2026-01-21
**Agent**: context7-expert
**Libraries Researched**: supabase/supabase, supabase/supabase-js

## Query Summary

Searched for methods to programmatically create MFA factors using the Supabase Auth Admin API, specifically for E2E test setup requiring pre-verified TOTP factors.

## Findings

### 1. No Admin API for Creating MFA Factors

The Supabase Auth Admin API (supabase.auth.admin.*) does **NOT** include a method to create MFA factors directly. The available admin methods are:

- admin.createUser() - Create users with email, password, metadata
- admin.listUsers() - List all users
- admin.getUserById() - Get user by ID
- admin.updateUserById() - Update user metadata
- admin.deleteUser() - Delete a user
- admin.generateLink() - Generate auth links (invite, recovery, etc.)
- admin.oauth.createClient() - Create OAuth clients

There is no admin.mfa.createFactor() or similar method.

### 2. Client-Side MFA Flow Only

Supabase MFA enrollment is designed to be user-initiated through the client-side API:

```typescript
// Enroll a new TOTP factor (generates secret and QR code)
const { data, error } = await supabase.auth.mfa.enroll({
  factorType: 'totp',
  friendlyName: 'iPhone' // optional
});

// data.id - factor ID
// data.totp.qr_code - QR code SVG
// data.totp.secret - TOTP secret (for authenticator apps)

// Challenge the factor
const { data: challengeData } = await supabase.auth.mfa.challenge({
  factorId: data.id
});

// Verify with OTP code from authenticator app
await supabase.auth.mfa.verify({
  factorId: data.id,
  challengeId: challengeData.id,
  code: '123456' // from authenticator app
});
```

### 3. MFA Factors Database Table

MFA factors are stored in auth.mfa_factors table. Based on documentation references, the table structure includes:

- id - UUID primary key
- user_id - References auth.users
- factor_type - 'totp' or 'phone'
- status - 'verified' or 'unverified'
- friendly_name - User-defined name
- secret - TOTP secret (encrypted)
- created_at - Timestamp
- updated_at - Timestamp

### 4. Potential Workaround: Direct Database Insertion

For E2E test setup, you could potentially insert directly into auth.mfa_factors using the service role key:

```sql
-- WARNING: This bypasses normal auth flow
INSERT INTO auth.mfa_factors (
  id,
  user_id,
  factor_type,
  status,
  friendly_name,
  secret,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'user-uuid-here',
  'totp',
  'verified',
  'iPhone',
  'NHOHJVGPO3R3LKVPRMNIYLCDMBHUM2SE',
  now(),
  now()
);
```

**Caveats:**
- The secret column may be encrypted at rest
- This bypasses normal security checks
- May not work as expected if GoTrue validates factor state differently
- Should ONLY be used in test environments

### 5. Recommended Approach for E2E Testing

1. **Option A: Programmatic Enrollment** (Recommended)
   - Use the client-side MFA API to enroll factors
   - Generate TOTP codes using a library like otpauth or otplib
   - Complete the verification flow programmatically

2. **Option B: Direct Database Insertion**
   - Insert into auth.mfa_factors using SQL
   - Use admin/service role client
   - Only for test environments

### 6. Related API Endpoints

MFA-related REST endpoints (rate-limited by IP):

- POST /auth/v1/factors/:id/challenge - Create MFA challenge
- POST /auth/v1/factors/:id/verify - Verify MFA challenge

## Key Takeaways

- Supabase does NOT have an Admin API method to create MFA factors programmatically
- MFA enrollment is designed to be user-initiated via client-side API
- For E2E testing, either:
  a. Use programmatic enrollment with TOTP code generation libraries
  b. Insert directly into auth.mfa_factors table (test env only)
- The auth.mfa_factors table stores factor data including secret, status, and type

## Sources

- Supabase Documentation via Context7 (/supabase/supabase)
- Supabase JS Client Documentation via Context7 (/supabase/supabase-js)
- Topics searched: mfa authentication admin, admin api auth user management, auth.mfa enroll listFactors, auth.mfa_factors database table schema, gotrue admin api factor
