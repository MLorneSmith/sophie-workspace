# Context7 Research: Supabase SSR Cookie Authentication

**Date**: 2026-01-15
**Agent**: context7-expert
**Libraries Researched**: @supabase/ssr (supabase/ssr)

## Summary

Comprehensive documentation on Supabase SSR cookie handling for authentication sessions.

## Key Findings

### 1. Cookie Encoding
- Default: base64url encoding (RFC 4648 compliant)
- Functions: stringToBase64URL(), stringFromBase64URL()
- Options: cookieEncoding: base64url (default) or raw (legacy)

### 2. Cookie Parsing/Serialization
- parseCookieHeader() - Parse Cookie header from requests
- serializeCookieHeader() - Create Set-Cookie header for responses

### 3. Cookie Chunking
- MAX_CHUNK_SIZE: 3180 bytes default
- createChunks(name, value) - Split large tokens
- combineChunks(name, retrieveFn) - Reconstruct from chunks
- isChunkLike(cookieName, baseName) - Check if chunk

### 4. Cookie Interfaces
- CookieMethodsBrowser: getAll(), setAll() (both required)
- CookieMethodsServer: getAll() required, setAll() optional for read-only

### 5. Critical Middleware Pattern
- setAll MUST update BOTH request AND response cookies
- getAll() MUST return ALL cookies (for chunk reconstruction)
- Server components are READ-ONLY
- Use middleware for session refresh

### 6. Known Issues
- Domain mismatch blocks cookie transmission
- sameSite:strict blocks OAuth cross-site redirects
- secure:true requires HTTPS
- Size limits (~4KB) require chunking

### 7. Testing
- Use isSingleton: false to avoid state leakage

## Sources
- @supabase/ssr via Context7
