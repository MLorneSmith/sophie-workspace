# Cookie Flow Diagram: E2E Authentication Fix

## Problem: Cookie Not Transmitted in Cross-Site Context

```
┌─────────────────────────────────────────────────────────────────┐
│                    CI ENVIRONMENT (GitHub Actions)              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  E2E Global Setup (Playwright)                          │   │
│  │  Origin: github.actions (runner context)                │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │                                                          │   │
│  │  1. Authenticate via Supabase API                       │   │
│  │     ✅ Success: JWT tokens received                     │   │
│  │                                                          │   │
│  │  2. Create cookies with sameSite: "Lax"  ❌ PROBLEM     │   │
│  │     {                                                    │   │
│  │       name: "sb-xxx-auth-token",                        │   │
│  │       domain: "*.vercel.app",                           │   │
│  │       sameSite: "Lax",  ← Blocks cross-site             │   │
│  │       secure: true                                      │   │
│  │     }                                                    │   │
│  │                                                          │   │
│  │  3. Save storage state to .auth/user.json               │   │
│  │     ✅ Cookies saved in storage state file              │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                             │                                   │
│                             │ Load storage state                │
│                             ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  E2E Test (Playwright Browser Context)                  │   │
│  │  Origin: github.actions (runner context)                │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │                                                          │   │
│  │  4. Navigate to https://*.vercel.app/home               │   │
│  │                                                          │   │
│  │     Browser checks: Should I send cookies?              │   │
│  │     - Cookie domain: *.vercel.app ✅ Match              │   │
│  │     - Cookie path: / ✅ Match                           │   │
│  │     - Cookie secure: true ✅ HTTPS request              │   │
│  │     - Cookie sameSite: Lax ❌ BLOCKS (cross-site!)      │   │
│  │                                                          │   │
│  │     Result: ❌ Cookie NOT sent with request             │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                             │                                   │
│                             │ HTTP Request WITHOUT cookie       │
│                             ▼                                   │
└─────────────────────────────────────────────────────────────────┘
                               │
                               │
                               ▼
         ┌─────────────────────────────────────────────┐
         │  Vercel Preview Deployment                  │
         │  https://2025slideheroes-xxx.vercel.app     │
         ├─────────────────────────────────────────────┤
         │                                             │
         │  5. Middleware: Check for auth session      │
         │                                             │
         │     Request headers:                        │
         │     - Cookie: (empty) ❌ No auth cookie     │
         │                                             │
         │     Result: No session found                │
         │                                             │
         │  6. Redirect to /auth/sign-in?next=/home    │
         │     ❌ Test fails waiting for team-selector │
         │                                             │
         └─────────────────────────────────────────────┘
```

## Solution: Use sameSite: "None" for Cross-Site Compatibility

```
┌─────────────────────────────────────────────────────────────────┐
│                    CI ENVIRONMENT (GitHub Actions)              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  E2E Global Setup (Playwright)                          │   │
│  │  Origin: github.actions (runner context)                │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │                                                          │   │
│  │  1. Authenticate via Supabase API                       │   │
│  │     ✅ Success: JWT tokens received                     │   │
│  │                                                          │   │
│  │  2. Create cookies with sameSite: "None"  ✅ FIXED      │   │
│  │     {                                                    │   │
│  │       name: "sb-xxx-auth-token",                        │   │
│  │       domain: "*.vercel.app",                           │   │
│  │       sameSite: "None",  ← Allows cross-site            │   │
│  │       secure: true       ← Required for sameSite=None   │   │
│  │     }                                                    │   │
│  │                                                          │   │
│  │  3. Save storage state to .auth/user.json               │   │
│  │     ✅ Cookies saved in storage state file              │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                             │                                   │
│                             │ Load storage state                │
│                             ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  E2E Test (Playwright Browser Context)                  │   │
│  │  Origin: github.actions (runner context)                │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │                                                          │   │
│  │  4. Navigate to https://*.vercel.app/home               │   │
│  │                                                          │   │
│  │     Browser checks: Should I send cookies?              │   │
│  │     - Cookie domain: *.vercel.app ✅ Match              │   │
│  │     - Cookie path: / ✅ Match                           │   │
│  │     - Cookie secure: true ✅ HTTPS request              │   │
│  │     - Cookie sameSite: None ✅ ALLOWS (cross-site OK!)  │   │
│  │                                                          │   │
│  │     Result: ✅ Cookie SENT with request                 │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                             │                                   │
│                             │ HTTP Request WITH cookie          │
│                             ▼                                   │
└─────────────────────────────────────────────────────────────────┘
                               │
                               │
                               ▼
         ┌─────────────────────────────────────────────┐
         │  Vercel Preview Deployment                  │
         │  https://2025slideheroes-xxx.vercel.app     │
         ├─────────────────────────────────────────────┤
         │                                             │
         │  5. Middleware: Check for auth session      │
         │                                             │
         │     Request headers:                        │
         │     - Cookie: sb-xxx-auth-token=<JWT>       │
         │       ✅ Auth cookie present                │
         │                                             │
         │     Result: Session found and validated     │
         │                                             │
         │  6. Allow access to /home                   │
         │     ✅ Page loads with team-selector        │
         │     ✅ Test passes                          │
         │                                             │
         └─────────────────────────────────────────────┘
```

## Local Environment: Works with sameSite: "Lax"

```
┌─────────────────────────────────────────────────────────────────┐
│                LOCAL DEVELOPMENT ENVIRONMENT                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  E2E Global Setup (Playwright)                          │   │
│  │  Origin: localhost                                      │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │                                                          │   │
│  │  1. Create cookies with sameSite: "Lax"  ✅ OK          │   │
│  │     {                                                    │   │
│  │       name: "sb-127-auth-token",                        │   │
│  │       domain: "localhost",                              │   │
│  │       sameSite: "Lax",  ← OK for same-origin            │   │
│  │       secure: false     ← HTTP is OK locally            │   │
│  │     }                                                    │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                             │                                   │
│                             │ Load storage state                │
│                             ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  E2E Test (Playwright Browser Context)                  │   │
│  │  Origin: localhost                                      │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │                                                          │   │
│  │  2. Navigate to http://localhost:3001/home              │   │
│  │                                                          │   │
│  │     Browser checks: Should I send cookies?              │   │
│  │     - Cookie domain: localhost ✅ Match                 │   │
│  │     - Cookie path: / ✅ Match                           │   │
│  │     - Cookie secure: false ✅ HTTP request              │   │
│  │     - Cookie sameSite: Lax ✅ ALLOWS (same-origin!)     │   │
│  │                                                          │   │
│  │     Result: ✅ Cookie SENT (same-origin = no CSRF risk) │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                             │                                   │
│                             │ HTTP Request WITH cookie          │
│                             ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Docker Test Server (localhost:3001)                    │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │                                                          │   │
│  │  3. Middleware: Check for auth session                  │   │
│  │                                                          │   │
│  │     Request headers:                                    │   │
│  │     - Cookie: sb-127-auth-token=<JWT>                   │   │
│  │       ✅ Auth cookie present                            │   │
│  │                                                          │   │
│  │     Result: Session found and validated                 │   │
│  │                                                          │   │
│  │  4. Allow access to /home                               │   │
│  │     ✅ Page loads with team-selector                    │   │
│  │     ✅ Test passes                                      │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## SameSite Policy Decision Tree

```
┌─────────────────────────────────────────────────────────────┐
│  Should the browser send this cookie with the request?      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
           ┌────────────────────────────────┐
           │  Is this a SAME-ORIGIN request? │
           │  (Origin matches cookie domain) │
           └────────────────────────────────┘
                    │                │
                    │ YES            │ NO (CROSS-SITE)
                    ▼                ▼
           ┌─────────────┐    ┌──────────────────┐
           │  SEND       │    │  Check sameSite  │
           │  (Lax/None) │    │  policy          │
           └─────────────┘    └──────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                 │
                    ▼                 ▼                 ▼
              ┌─────────┐      ┌──────────┐     ┌──────────┐
              │ Strict  │      │   Lax    │     │   None   │
              ├─────────┤      ├──────────┤     ├──────────┤
              │ BLOCK   │      │ BLOCK    │     │ SEND if  │
              │ (always)│      │ (cross-  │     │ secure=  │
              │         │      │  site)   │     │ true     │
              └─────────┘      └──────────┘     └──────────┘
                   ❌              ❌                 ✅
                               (CI fails)        (CI works)
```

## Cookie Configuration Matrix

```
╔══════════════════╦══════════╦══════════╦════════╦══════════════════════╗
║ Environment      ║ Protocol ║ Domain   ║ Cross- ║ Recommended          ║
║                  ║          ║          ║ Site   ║ sameSite             ║
╠══════════════════╬══════════╬══════════╬════════╬══════════════════════╣
║ Localhost        ║ HTTP     ║ Same     ║ No     ║ Lax (default)        ║
║ (Dev)            ║          ║          ║        ║                      ║
╠══════════════════╬══════════╬══════════╬════════╬══════════════════════╣
║ Docker           ║ HTTP     ║ Same     ║ No     ║ Lax (default)        ║
║ (Test)           ║          ║          ║        ║                      ║
╠══════════════════╬══════════╬══════════╬════════╬══════════════════════╣
║ CI → Vercel      ║ HTTPS    ║ Cross    ║ YES    ║ None                 ║
║ (Integration)    ║          ║          ║        ║ (+ secure: true)     ║
╠══════════════════╬══════════╬══════════╬════════╬══════════════════════╣
║ Production       ║ HTTPS    ║ Same     ║ No     ║ Lax (default)        ║
║ (Real Users)     ║          ║          ║        ║                      ║
╚══════════════════╩══════════╩══════════╩════════╩══════════════════════╝
```

## Code Changes (Simplified)

### Before (Failed in CI)

```typescript
function getCookieDomainConfig(baseURL: string) {
  const hostname = new URL(baseURL).hostname;

  if (hostname.endsWith(".vercel.app")) {
    return {
      domain: hostname,
      isVercelPreview: true,
      sameSite: "Lax",  // ❌ BLOCKS cross-site transmission in CI
    };
  }

  return {
    domain: hostname,
    isVercelPreview: false,
    sameSite: "Lax",
  };
}
```

### After (Fixed)

```typescript
function getCookieDomainConfig(baseURL: string) {
  const hostname = new URL(baseURL).hostname;

  if (hostname.endsWith(".vercel.app")) {
    return {
      domain: hostname,
      isVercelPreview: true,
      sameSite: "None",  // ✅ ALLOWS cross-site transmission in CI
    };
  }

  return {
    domain: hostname,
    isVercelPreview: false,
    sameSite: "Lax",
  };
}
```

## Key Insights

### Why "Lax" Failed in CI

1. **Origin Context**: CI runners (GitHub Actions) have a different origin than the Vercel preview URL
2. **Browser Behavior**: Browser considers CI → Vercel request as "cross-site"
3. **SameSite Policy**: `Lax` blocks cookies in cross-site contexts (CSRF protection)
4. **Result**: No authentication cookies sent → middleware redirects to login

### Why "None" Works in CI

1. **Explicit Permission**: `None` explicitly allows cross-site cookie transmission
2. **Security Requirement**: Requires `secure: true` (HTTPS only)
3. **Vercel Context**: All Vercel preview URLs use HTTPS
4. **Result**: Authentication cookies sent → middleware recognizes session

### Why "Lax" Still Works Locally

1. **Same-Origin**: Localhost test → localhost server = same origin
2. **No Cross-Site**: Browser doesn't apply cross-site restrictions
3. **Default Behavior**: `Lax` is permissive for same-origin requests
4. **Result**: Authentication cookies sent normally

---

*Diagram created by Claude Code*
*Date: 2026-01-16*
