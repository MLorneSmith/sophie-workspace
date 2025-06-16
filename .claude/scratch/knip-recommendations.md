# Knip Phase 2 Implementation Recommendations

## Summary of Analysis

Based on the Knip analysis, here's what we found:

### 1. ✅ Already Completed

- Removed 26 eslint.config.mjs files (replaced by Biome)
- Removed 3 tooling/eslint files
- Updated knip.json to preserve MakerKit template features

### 2. 🔍 Key Findings

#### Unused Files (33 total)

- **26 ESLint configs**: ✅ Removed (safe - replaced by Biome)
- **6 MakerKit template files**: ⚠️ Preserved (may use in future)
- **1 duplicate API file**: `course-enhanced.ts` (safe to remove)

#### Unused Dependencies (31 total)

Categories:

1. **Payload CMS deps** (10): Lexical editor, image processing, etc - might be needed
2. **MakerKit template deps** (4): Turnstile CAPTCHA, data tables, email templates
3. **Truly unused** (17): Old dependencies that can be removed

#### Other Issues

- **Unresolved imports** (4): Path issues with payload-types
- **Unlisted binaries** (33): Mostly eslint references
- **Duplicate exports** (5): Minor cleanup needed

## Recommended Actions

### Phase 2A: Safe Cleanup (Do Now)

1. Remove `packages/cms/payload/src/api/course-enhanced.ts`
2. Clean up truly unused dependencies:
   - `gray-matter`, `js-yaml`, `execa` from payload
   - `uuid` from payload (use crypto.randomUUID())
   - Old `portkey-ai` package (using @portkey-ai/vercel-provider now)

### Phase 2B: Fix Import Issues

1. Create proper TypeScript path alias for payload types
2. Or move payload-types to a shared package

### Phase 2C: Dependency Audit (Careful Review)

1. Review each "unused" dependency with team
2. Document why template dependencies are kept
3. Add comments in package.json for clarity

### Phase 2D: Configuration Updates

1. Update knip.json with more specific ignores
2. Add knip to CI as informational (non-blocking)
3. Schedule quarterly dependency audits

## Do NOT Remove (MakerKit Template Features)

- Auth components (OTP, account hints)
- Billing utilities (multi-plan support)
- Testimonial plugin
- Turnstile CAPTCHA integration
- React Table (might be used in admin)
- Email templates system

## Next Steps

1. Get team consensus on template features to keep
2. Document dependency decisions
3. Set up regular Knip audits (quarterly)
4. Consider creating a "template-features.md" doc
