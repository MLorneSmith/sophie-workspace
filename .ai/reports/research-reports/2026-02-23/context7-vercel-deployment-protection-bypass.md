# Context7 Research: Vercel Deployment Protection Bypass for Automation

**Date**: 2026-02-23
**Agent**: context7-expert
**Libraries Researched**: vercel/vercel, llmstxt/vercel_llms-full_txt, openapi/openapi_vercel_sh

## Query Summary
Researched Vercel deployment protection bypass mechanisms for automation/CI/CD, including:
1. x-vercel-protection-bypass header behavior with SSO/Vercel Authentication
2. Custom domains vs vercel.app domain bypass differences
3. protectionBypass API field and automation-bypass scope
4. Caveats about bypass secrets with custom/branch-linked domains
5. x-vercel-set-bypass-cookie header and query parameter approaches
6. Vercel recommended CI/CD bypass approach

## Findings

### 1. x-vercel-protection-bypass Header

The x-vercel-protection-bypass header is the primary mechanism to bypass deployment protection.

What Gets Bypassed:
- Password Protection
- Vercel Authentication (SSO)
- Trusted IPs checks
- System Mitigations (requests normally blocked by Vercel Firewall)
- Bot Protection (requests will not trigger Bot protection challenges)

What Does NOT Get Bypassed:
- Active DDoS Mitigations (IP blocks, subnet blocks, pattern blocks remain in effect)
- Rate Limits During Attacks (rate limiting during detected attacks still applies)
- Security Challenges During Attacks (challenge requirements triggered by attack patterns)

### 2. Custom Domains vs vercel.app Domains

- Custom domains use Strict-Transport-Security: max-age=63072000 without includeSubDomains and preload directives
- Protection bypass via alias API (PATCH /aliases/id/protection-bypass) works for both custom and vercel.app URLs
- Bypass secret is project-scoped, not domain-scoped (works same on all domains)
- Branch-linked custom domains can have separate protection bypass settings via the aliases API

### 3. protectionBypass API Field

Project-Level: PATCH /v1/projects/idOrName/protection-bypass
- generate: Create a new bypass secret (optional custom value, optional note)
- revoke: Revoke existing secret (required secret, required regenerate boolean)
- update: Update existing (required secret, optional isEnvVar boolean, optional note)

### 4. x-vercel-set-bypass-cookie Header

- true: Sets bypass cookie with SameSite=Lax (for direct browser access)
- samesitenone: Sets bypass cookie with SameSite=None (for iframes/cross-site)

### 5. CI/CD Recommended Approach

HTTP Header method with VERCEL_AUTOMATION_BYPASS_SECRET environment variable.

## Key Takeaways
- Bypass secret is project-scoped and works identically on custom domains and vercel.app
- HTTP header method recommended for CI/CD; query parameter for webhooks
- x-vercel-set-bypass-cookie: true for browser-based testing; samesitenone for iframes
- VERCEL_AUTOMATION_BYPASS_SECRET auto-populated when isEnvVar: true set in API
- Password protection JWT tokens are URL-specific and cannot be reused across URLs

## Sources
- Vercel CLI documentation via Context7 (vercel/vercel)
- Vercel official documentation via Context7 (llmstxt/vercel_llms-full_txt)
- Vercel REST API OpenAPI spec via Context7 (openapi/openapi_vercel_sh)
