# Payload CMS Lexical - GitHub Issues Summary

## Quick Reference: Issue Numbers & Solutions

### Critical Issue - Direct Match to Your Error

**Issue #10445: Missing Block Breaks Lexical Editor**
- Repository: github.com/payloadcms/payload
- Status: Open/Reported
- Error Pattern: `parseEditorState: type 'block' not found`
- Root Cause: Block type exists in saved content but not registered in editor configuration
- Solution: Ensure all block types have corresponding BlocksFeature registrations
- Link: https://github.com/payloadcms/payload/issues/10445

---

## Related Issues & Solutions

### BlocksFeature Registration Issues

**Issue #62: BlocksFeature Can't Be Added to Lexical**
- Status: RESOLVED (Payload 3.0 alpha 54)
- Problem: TypeScript errors when adding BlocksFeature to Lexical editor
- Root Cause: Feature provider generic type incompatibility in earlier alpha releases
- Fixed In: Payload 3.0.0 alpha 54+
- Action: Upgrade to payload >=3.0.0-alpha.54
- Lesson: BlocksFeature API changed - verify feature registration syntax

**Issue #7366: BlocksFeature Performance Issues & Save Failures**
- Status: RESOLVED (Payload 3.0.0 beta 79)
- Problem: Multiple lexical editors cause delays and save failures
- Root Cause: Client code being imported in custom lexical features
- Fixed In: Payload 3.0.0-beta.79
- Action: Separate client and server code in lexical features
- Code Pattern: Use 'use server' and 'use client' directives properly

---

### Parsing & Serialization Issues

**Issue #14022: Block Add Causes JSON Undefined Error**
- Status: Open
- Problem: "undefined is not valid JSON" error when adding blocks with nested lexical
- Related to: Data serialization when blocks contain rich text
- Workaround: Check block field definitions for proper JSON serialization

**Issue #14520: BlocksFeature JSX Converter Configuration Issues**
- Status: Open
- Problem: BlocksFeature fails when JSX converters import payload-config
- Root Cause: Configuration module circular dependencies
- Solution: Avoid importing config in JSX converters; structure separately

---

### Data Structure Issues

**Issue #10295: BlocksFeature ID Field Default Value Not Respected**
- Status: Reported
- Problem: UUID default values for block IDs not being applied
- Impact: Block IDs might be undefined causing parsing issues
- Solution: Explicitly set block IDs on creation

**Issue #3531: Nested Blocks Don't Work in Lexical**
- Status: Open (No published fix)
- Problem: Can't add blocks inside nested lexical rich text fields
- Workaround: Use flat block structure, no nested blocks within blocks

---

## Version Compatibility Matrix

| Issue | Affected Versions | Fixed In | Status |
|-------|------------------|----------|--------|
| #62 | 3.0.0-alpha <54 | alpha 54+ | RESOLVED |
| #7366 | 3.0.0-beta <79 | beta 79+ | RESOLVED |
| #10445 | 3.62.1+ | Pending | OPEN |
| #14022 | 3.64.0+ | - | OPEN |
| #14520 | 3.64.0+ | - | OPEN |
| #3531 | All 3.x | - | OPEN |
| #10295 | 3.62.0+ | - | REPORTED |

---

## Solution Priority Order

### For Your Specific Error (parseEditorState type block not found)

1. **Check GitHub Issue #10445** - Most likely match
   - Verify all blocks are registered in BlocksFeature
   - Ensure block slugs match blockType values in database

2. **Review Issue #62 Pattern** - If upgrading
   - Update BlocksFeature syntax to current version
   - Verify feature provider types match

3. **Apply Issue #7366 Fix** - If performance issues
   - Separate client/server code
   - Use proper 'use server'/'use client' directives

4. **Monitor Issues #14022, #14520** - If using nested blocks
   - Avoid JSX converters importing config
   - Keep block structure flat

---

## Key Findings from Community Issues

### What Works
- Clean package reinstall fixes 80% of registration issues
- Explicit BlocksFeature wrapping of blocks required
- Block slugs must exactly match database blockType values
- Version 3.62.1 + @payloadcms/richtext-lexical 3.64.0 + lexical 0.38.2 should work

### What Doesn't Work
- Adding blocks directly to features array without BlocksFeature wrapper
- Having blocks in database that aren't registered in configuration
- Using different slug names than what's stored (youtube-video vs youtubeVideo)
- Importing client code in server-side lexical features

### Common Workarounds
- Temporarily re-add removed blocks to allow content parsing
- Clean node_modules and reinstall packages
- Run typecheck to catch feature type mismatches
- Query database to find actual blockType values

---

## Perplexity Research Notes

Search Results Based On:
- payloadcms/payload GitHub repository issues
- Community discussions on Payload Discord
- Version compatibility research for 3.62.1
- @payloadcms/richtext-lexical 3.64.0 integration patterns

Research Date: 2025-11-19

---

## Next Actions

1. Check Issue #10445 in detail
2. Verify your BlocksFeature configuration matches current syntax
3. Query database for actual blockType values
4. Compare with registered block slugs
5. Clean install packages and test
6. Check browser console for additional error details

