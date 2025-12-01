# Stripe Node.js SDK v20 - Quick Reference Guide

**For SlideHeroes Team** - 2025-12-01

## TL;DR - What Changed?

| Aspect | Impact | Action |
|--------|--------|--------|
| **Types** | Better inference, fewer assertions needed | Remove `as Stripe.X` assertions |
| **List APIs** | Return paginated objects `{data: [...]}` | Use destructuring: `const { data } = stripe.x.list()` |
| **Validation** | Much stricter parameter checking | Review error messages, ensure valid inputs |
| **Webhooks** | Better event type narrowing | Remove type assertions in handlers |
| **URLs** | HTTPS strictly enforced | Verify all URLs in checkout sessions |

---

## 5-Minute Migration Checklist

```bash
# 1. Upgrade package
pnpm add stripe@^20.0.0

# 2. Find all type errors
pnpm typecheck

# 3. Fix each error (most will be trivial)
# - Remove `as Stripe.X` assertions
# - Add `.data` to list operations
# - Verify URLs are HTTPS

# 4. Test
pnpm --filter web test:unit
pnpm --filter web test:integration

# 5. Deploy
```

---

## Common Fixes (Copy-Paste)

### Fix 1: List Operations
```typescript
// BEFORE
const subs = await stripe.subscriptions.list();
subs.forEach(s => console.log(s.id));

// AFTER
const { data: subs } = await stripe.subscriptions.list();
subs.forEach(s => console.log(s.id));
```

### Fix 2: Webhook Events
```typescript
// BEFORE
const event = stripe.webhooks.constructEvent(body, sig, secret) as Stripe.Event;

// AFTER
const event = stripe.webhooks.constructEvent(body, sig, secret);
// Type inference handles it automatically
```

### Fix 3: Remove Type Assertions
```typescript
// BEFORE
const sub = await stripe.subscriptions.retrieve(id) as Stripe.Subscription;

// AFTER
const sub = await stripe.subscriptions.retrieve(id);
// Already typed as Stripe.Subscription
```

### Fix 4: Checkout Session URLs
```typescript
// BEFORE
success_url: 'http://localhost:3000/success' // ❌ HTTP

// AFTER
success_url: 'https://example.com/success' // ✅ HTTPS
```

---

## Methods Affected (Reference)

**No behavioral changes** - just typing and validation:

- `stripe.subscriptions.*` (all methods)
- `stripe.checkout.sessions.*` (all methods)
- `stripe.billingPortal.sessions.*` (all methods)
- `stripe.webhooks.constructEvent()`
- `stripe.customers.*` (all methods)
- `stripe.invoices.*` (all methods)

---

## If You Get Stuck

1. **Type error with "Property X does not exist"**
   - Check if it's a list operation (use `.data`)
   - Check if you need to remove type assertion

2. **"Invalid URL" error**
   - All URLs must be HTTPS
   - Check checkout session success_url and cancel_url

3. **Webhook type errors**
   - Remove `as Stripe.Event` assertions
   - Type narrowing works automatically now

4. **"Parameter X is required"**
   - v20 is stricter about required fields
   - Check Stripe API docs for what's needed

---

## Testing After Upgrade

**Minimum tests:**
- Create a test subscription
- List subscriptions
- Cancel a subscription
- Create checkout session
- Process a test webhook event

**If these 5 things work, you're good to deploy.**

---

**Full Report**: See `stripe-nodejs-sdk-v20-migration.md` for detailed migration guide
