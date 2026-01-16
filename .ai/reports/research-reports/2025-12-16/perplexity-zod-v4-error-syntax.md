# Perplexity Research: Zod v4 String Validation Error Syntax

**Date**: 2025-12-16
**Agent**: perplexity-expert
**Search Type**: Chat API + Search API

## Query Summary

Investigated whether `required_error` was changed to `error` in Zod v4 for string validation custom error messages. This is for diagnosing a production bug where Stripe webhook validation might be failing.

## Findings

### Key Change: `required_error` is DROPPED in Zod v4

**Yes, the syntax has changed significantly.** The `required_error` and `invalid_type_error` parameters have been **completely removed** in Zod v4, not just renamed.

### Zod v3 Syntax (OLD - No longer works in v4)

```typescript
z.string({
  required_error: `Please provide the variable STRIPE_SECRET_KEY`,
}).min(1)
```

### Zod v4 Syntax (NEW - Correct)

```typescript
z.string({
  error: `Please provide the variable STRIPE_SECRET_KEY`,
}).min(1)
```

**Or with conditional logic for different error types:**

```typescript
z.string({
  error: (issue) => issue.input === undefined
    ? `Please provide the variable STRIPE_SECRET_KEY`  // for missing/undefined
    : `Invalid type for STRIPE_SECRET_KEY`              // for wrong type
}).min(1)
```

### Why This Changed

From the official migration guide at https://zod.dev/v4/changelog:

> The `invalid_type_error` / `required_error` params have been dropped. These were hastily added years ago as a way to customize errors that was less verbose than `errorMap`. They came with all sorts of footguns (they can't be used in conjunction with `errorMap`) and do not align with Zod's actual issue codes (there is no `required` issue code).

### Complete Migration Pattern

| Zod v3 | Zod v4 |
|--------|--------|
| `required_error: "message"` | `error: "message"` or `error: (issue) => ...` |
| `invalid_type_error: "message"` | `error: (issue) => ...` with conditional |
| `message: "..."` in validators | `error: "..."` (message still works but deprecated) |
| `errorMap: fn` | `error: fn` (can return string directly) |

### Important Notes

1. **The simple `error` param works**: Your proposed syntax `z.string({ error: "message" }).min(1)` IS CORRECT for Zod v4.

2. **Conditional errors for different scenarios**: If you need different messages for "missing" vs "wrong type", use the function form.

3. **Per-validation messages also work**:
   ```typescript
   z.string()
     .min(1, { error: "Cannot be empty" })  // or just .min(1, "Cannot be empty")
   ```

4. **Global config option**: You can set global error customization:
   ```typescript
   z.config({
     customError: (issue) => {
       if (issue.code === "invalid_type" && (issue.input == null || issue.input === "")) {
         return "Required field";
       }
       return undefined;
     },
   });
   ```

## Sources & Citations

- [Zod v4 Migration Guide](https://zod.dev/v4/changelog) - Official migration documentation
- [GitHub Discussion #4780](https://github.com/colinhacks/zod/discussions/4780) - Library author compatibility discussion
- [Zod v4 Codemod](https://www.hypermod.io/explore/zod-v4) - Automated migration tool documentation

## Key Takeaways

- **YES**, `required_error` was replaced by `error` in Zod v4
- The syntax `z.string({ error: "message" }).min(1)` is **CORRECT** for Zod v4
- If validation is failing, check that you're actually using Zod v4 (import from `zod/v4` or version 4.x)
- The old `required_error` syntax will likely throw a TypeScript error or be silently ignored in v4

## Related Searches

- Check if project is using Zod v4 vs v3 (`package.json` dependencies)
- Verify import paths (`zod` vs `zod/v4`)
- Review all Zod schemas for `required_error` usage that needs migration
