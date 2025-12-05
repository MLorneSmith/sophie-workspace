# Payload CMS BlocksFeature parseEditorState Error - Quick Fix

**Problem:** `parseEditorState: type block not found` error during server-side rendering

**Root Cause:** Version mismatch between payload@3.62.1 and @payloadcms/*@3.64.0

**Complexity:** 1-minute fix (update 1 line + reinstall)

---

## The One-Line Fix

**File:** `/home/msmith/projects/2025slideheroes/apps/payload/package.json`

**Change this:**
```json
"payload": "^3.62.1",
```

**To this:**
```json
"payload": "^3.64.0",
```

---

## Why This Fixes It

Payload CMS enforces strict version parity. When payload@3.62.1 and @payloadcms/richtext-lexical@3.64.0 don't match:
- Type definitions diverge
- BlocksFeature can't register blocks
- parseEditorState fails

When both are @3.64.0, everything aligns and works.

---

## Implementation (2 commands)

```bash
# 1. Reinstall dependencies
cd /home/msmith/projects/2025slideheroes
pnpm install

# 2. Verify the fix
npm ls payload 2>/dev/null | head -3
# Should show: payload@3.64.0
```

---

## Test It Works

```bash
pnpm dev
# Navigate to: Admin Panel → Posts → Edit a Post → Click Content field
# Expected: Blocks appear in editor menu
```

---

## Current Versions

```
Before:  payload@3.62.1  + @payloadcms/plugins@3.64.0 ❌
After:   payload@3.64.0  + @payloadcms/plugins@3.64.0 ✓
```

---

## Your Configuration Is Actually Correct

- ✓ BlocksFeature configured in global editor
- ✓ BlocksFeature configured in collection editors  
- ✓ All blocks properly exported
- ✓ Lexical version (0.35.0) correct
- ✓ No duplicate Lexical versions

The error is ONLY due to the version mismatch, not any configuration problem.

---

## If Error Persists

1. **Verify clean install:**
   ```bash
   npm ls payload 2>/dev/null | head -3
   # MUST show @3.64.0
   ```

2. **Check for Lexical duplication:**
   ```bash
   npm ls lexical 2>/dev/null
   # Should show only ONE version (0.35.0)
   ```

3. **Clear cache and rebuild:**
   ```bash
   pnpm build
   pnpm dev
   ```

---

## Reference: Payload's Version Coupling

```
payload@3.64.0  ← CORE
  ├─ @payloadcms/richtext-lexical@3.64.0 ✓
  ├─ @payloadcms/next@3.64.0 ✓
  ├─ @payloadcms/db-postgres@3.64.0 ✓
  └─ ... all @payloadcms/* packages MUST be @3.64.0
```

Any divergence = runtime failure.

---

## Key Insight

This is **not a bug or missing configuration**. It's a version alignment requirement.

Your code is correct. Just sync the version numbers.

