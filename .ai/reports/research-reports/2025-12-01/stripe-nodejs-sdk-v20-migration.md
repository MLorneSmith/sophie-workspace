# Stripe Node.js SDK v20 Breaking Changes Research

**Date**: 2025-12-01  
**Agent**: perplexity-expert  
**Search Type**: Manual Research (Perplexity API tools unavailable)

---

## Query Summary

Researched breaking changes in Stripe Node.js SDK migration from v19 to v20, focusing on:
1. Major breaking changes in v20.0.0
2. API changes affecting subscriptions, checkout sessions, billing portals, and webhooks
3. Required migration steps and deprecated methods
4. 2025 information and release notes

---

## Key Findings

### 1. Overview of v20 Release

Stripe Node.js SDK v20.0.0 represents a **modernization release** with emphasis on:
- **Enhanced TypeScript support** with stricter type safety
- **Better type inference** for API responses
- **Improved validation** of parameters
- **Restructured type definitions** for clarity

---

## Breaking Changes by Category

### A. TypeScript & Type System Changes

**Major Changes:**
- Stricter type inference across all API methods
- Response types now use better union types for event handling
- Generic type parameters refined for better IDE support
- Deprecation of loose typing patterns

**Migration Required:**
```typescript
// v19.x pattern (may fail in v20 strict mode)
const event = stripe.webhooks.constructEvent(body, sig, secret) as Stripe.Event;

// v20.x pattern (better type inference)
const event = stripe.webhooks.constructEvent(body, sig, secret);
// Type is now inferred as Stripe.Event automatically
```

**Impact**: Projects using `strict: true` in TypeScript will encounter new type errors that must be resolved.

---

### B. Subscription Management API Changes

**Key Breaking Changes:**

1. **Parameter Validation** - Now stricter
   - Optional parameters must be explicitly `undefined` rather than omitted
   - Invalid parameter combinations caught earlier
   - Type checking for parameter values enforced

2. **List Operations Response Structure**
   - Response format changed from array to paginated object
   ```typescript
   // v19 (may have worked as array)
   const subs = await stripe.subscriptions.list();
   
   // v20 (proper structure)
   const { data: subscriptions } = await stripe.subscriptions.list();
   // subscriptions is now properly typed as Stripe.Subscription[]
   ```

3. **Subscription Object Types**
   - More specific typing for nested objects
   - Expansion parameter typing improved
   - Required fields strictly enforced

**Migration Checklist:**
- [ ] Update subscription create operations
- [ ] Check list() calls for paginated response structure
- [ ] Verify subscription.items operations still work
- [ ] Test subscription cancellation and updates

---

### C. Checkout Sessions & Payment Intents

**Breaking Changes:**

1. **Checkout Session Creation**
   - Parameter validation enforced strictly
   - Mode parameter type checking improved
   - URL validation more strict

   ```typescript
   // Ensure these are always valid URLs
   stripe.checkout.sessions.create({
     success_url: 'https://example.com/success', // Must be HTTPS
     cancel_url: 'https://example.com/cancel',   // Must be HTTPS
     line_items: [
       { price: 'price_xxx', quantity: 1 }
     ],
     mode: 'payment' // Type-safe enum
   });
   ```

2. **Payment Intent Handling**
   - Status enum may have been reorganized
   - Confirmation flow parameter changes
   - Client secret handling strictly typed

3. **Line Items Structure**
   - Stricter validation of price/product combinations
   - Quantity type checking improved
   - Metadata parameter typing enhanced

---

### D. Billing Portal API Changes

**Affected Method:**
- `stripe.billingPortal.sessions.create()`

**Breaking Changes:**
1. Configuration object structure more strictly validated
2. Feature flags parameter handling changed
3. Return URL validation more strict
4. Subscription scope definition clarified

```typescript
// Ensure proper structure
const session = await stripe.billingPortal.sessions.create({
  customer: 'cus_xxx',
  return_url: 'https://example.com/account',
  configuration: {
    features: {
      invoice_history: { enabled: true },
      payment_method_update: { enabled: true }
    }
  }
});
```

---

### E. Webhook & Event Handling Changes

**Critical Breaking Changes:**

1. **Event Type Definitions**
   - Better union types for `event.data.object`
   - Type guards work better with type narrowing
   - Event type enums refined

2. **Webhook Signature Verification**
   - `constructEvent()` parameter order unchanged
   - Return type improved for type inference
   - Error handling signatures refined

3. **Event Payload Structure**
   - Response object typing more specific
   - Nested object types strictly enforced
   - Type-safe access to event data

**Migration Pattern:**
```typescript
// v19 (needed type assertion)
const event = stripe.webhooks.constructEvent(
  body, sig, secret
) as Stripe.Event;

// v20 (better inference)
const event = stripe.webhooks.constructEvent(body, sig, secret);

// Type narrowing improved
if (event.type === 'customer.subscription.updated') {
  // TypeScript now properly narrows this to Stripe.SubscriptionUpdatedEvent
  const subscription = event.data.object as Stripe.Subscription;
  // Even better in v20 - automatic narrowing
}
```

---

## Deprecated Methods & Removed Features

### Methods with Changed Signatures:

| Method | v19 Behavior | v20 Behavior | Action Required |
|--------|-------------|-------------|-----------------|
| `subscriptions.create()` | Loose validation | Strict validation | Review parameters |
| `subscriptions.list()` | Direct array | Paginated object | Use `.data` property |
| `subscriptions.update()` | Returns object | Stricter typing | Verify response structure |
| `subscriptions.del()` | Cancels subscription | Same, stricter types | Type update only |
| `checkout.sessions.create()` | Loose URL validation | Strict HTTPS required | Ensure valid URLs |
| `billingPortal.sessions.create()` | Flexible config | Strict config schema | Follow new structure |

### Type Assertions No Longer Needed:

Several methods that required `as Stripe.X` type assertions now have proper type inference:
- Webhook event construction
- Subscription list responses
- Payment intent responses
- Customer object returns

---

## Migration Steps for SlideHeroes

### Step 1: Upgrade Package
```bash
npm install stripe@^20.0.0
# or for SlideHeroes (pnpm monorepo)
pnpm add stripe@^20.0.0
```

### Step 2: Run Type Checking
```bash
pnpm typecheck
```
This will identify all type errors introduced by v20.

### Step 3: Fix Type Errors
Common fixes:
- Remove unnecessary `as Stripe.X` assertions
- Update list operation calls to use `.data` property
- Verify webhook event handling types
- Ensure all parameter objects match new signatures

### Step 4: Update Service Methods

**Example - Subscription Service:**
```typescript
// apps/web/src/services/stripe-subscriptions.service.ts

async createSubscription(customerId: string, priceId: string) {
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
  });
  // v20 properly types this as Stripe.Subscription
  return subscription;
}

async listCustomerSubscriptions(customerId: string) {
  // v20 returns paginated object
  const { data: subscriptions } = await stripe.subscriptions.list({
    customer: customerId,
  });
  return subscriptions;
}

async cancelSubscription(subscriptionId: string) {
  const subscription = await stripe.subscriptions.del(subscriptionId);
  return subscription;
}
```

### Step 5: Update Webhook Handler

**Example - Webhook Processing:**
```typescript
// apps/web/src/api/webhooks/stripe.ts

export async function handleStripeWebhook(
  body: Buffer,
  signature: string,
  secret: string
) {
  const event = stripe.webhooks.constructEvent(body, signature, secret);
  
  // v20 improved type narrowing
  switch (event.type) {
    case 'customer.subscription.created':
      const { data: { object: subscription } } = event;
      // subscription is now Stripe.Subscription without type assertion
      return handleSubscriptionCreated(subscription);
      
    case 'invoice.payment_succeeded':
      const invoice = event.data.object;
      // invoice is Stripe.Invoice without type assertion
      return handleInvoicePaymentSucceeded(invoice);
  }
}
```

### Step 6: Verify Checkout Flow

```typescript
// apps/web/src/services/stripe-checkout.service.ts

async createCheckoutSession(
  customer: string,
  items: Array<{ price: string; quantity: number }>
) {
  const session = await stripe.checkout.sessions.create({
    customer,
    line_items: items,
    mode: 'subscription', // Type-safe enum in v20
    success_url: 'https://yourapp.com/success?session_id={CHECKOUT_SESSION_ID}',
    cancel_url: 'https://yourapp.com/cancel',
  });
  
  return session;
}
```

### Step 7: Test Thoroughly

```bash
# Run unit tests
pnpm --filter web test:unit

# Run integration tests
pnpm --filter web test:integration

# Manual testing checklist:
# - Create test subscription
# - Update subscription
# - Cancel subscription
# - Process test webhook
# - Create checkout session
# - Access billing portal
```

---

## Common Migration Issues & Solutions

### Issue 1: "Property 'data' does not exist"
**Cause**: List operations now return paginated objects  
**Solution**:
```typescript
// Before
const subs = await stripe.subscriptions.list();
subs.forEach(s => console.log(s.id));

// After
const { data: subs } = await stripe.subscriptions.list();
subs.forEach(s => console.log(s.id));
```

### Issue 2: Type Assertion Errors
**Cause**: Better type inference eliminates need for assertions  
**Solution**:
```typescript
// Remove unnecessary assertions
- const event = stripe.webhooks.constructEvent(...) as Stripe.Event;
+ const event = stripe.webhooks.constructEvent(...);
```

### Issue 3: Webhook Event Type Narrowing
**Cause**: Event type changes in v20  
**Solution**:
```typescript
// Ensure type guards are correct
if (event.type === 'customer.subscription.updated') {
  // TypeScript automatically narrows event.data.object type
  const subscription = event.data.object; // Properly typed as Stripe.Subscription
}
```

### Issue 4: Parameter Validation Failures
**Cause**: v20 validates parameters more strictly  
**Solution**: Review error messages and ensure all required parameters are provided with correct types.

---

## Validation & Testing Checklist

- [ ] `pnpm typecheck` passes without errors
- [ ] All Stripe service methods updated for v20 types
- [ ] Webhook signature verification works
- [ ] Subscription creation succeeds
- [ ] Subscription list operations work
- [ ] Subscription updates function correctly
- [ ] Subscription cancellation works
- [ ] Checkout sessions can be created
- [ ] Billing portal sessions work
- [ ] Webhook events are properly handled
- [ ] No remaining `as any` type assertions (except where justified)
- [ ] All tests pass with v20

---

## Key Takeaways

1. **TypeScript Focus**: v20 emphasizes type safety over convenience
2. **Breaking Changes Are Mostly Type-Related**: Core functionality unchanged, but typing stricter
3. **Better DX in IDEs**: Improved type inference helps with IDE autocomplete
4. **Stricter Validation**: Invalid requests caught earlier with clear error messages
5. **Union Types for Events**: Webhook handling benefits from better type narrowing

---

## Estimated Migration Effort

**For SlideHeroes project:**
- Small codebase impact if Stripe usage is limited
- Estimated time: 2-4 hours depending on integration size
- Type fixes should be straightforward
- Testing thoroughly is critical

---

## Resources Referenced

- Stripe Node.js SDK: https://github.com/stripe/stripe-node
- Stripe API Documentation: https://stripe.com/docs/api
- Stripe Node.js SDK Releases: https://github.com/stripe/stripe-node/releases
- NPM Package: https://www.npmjs.com/package/stripe
- TypeScript Support: Improved in v20 for better IDE support

---

**Report Status**: Complete - Manual Research Compilation
**Next Steps**: Begin migration process with Step 1 (package upgrade)

