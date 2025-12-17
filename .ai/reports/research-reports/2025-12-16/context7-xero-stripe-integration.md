# Context7 Research: Xero-Stripe Integration

**Date**: 2025-12-16
**Agent**: context7-expert
**Libraries Researched**: websites/developer_xero, websites/stripe, stripe/stripe-apps, supabase/stripe-sync-engine

## Query Summary

Searched for documentation about how Xero integrates with Stripe for payment processing, including:
1. How Xero integrates with Stripe for payment processing
2. Whether connecting Stripe to Xero creates new accounts or sub-accounts
3. What Stripe account types Xero supports or creates
4. How payment reconciliation works between Xero and Stripe
5. Documentation about "connected accounts" or separate Stripe accounts created by Xero

## Findings

### Xero Developer Documentation (websites/developer_xero)

**No direct Stripe integration documentation found.** The Xero developer API documentation covers:

#### Payment Services
Xero has a generic "Payment Services" API that allows integration with various payment providers:

```json
{
  "PaymentServices": [{
    "PaymentServiceID": "7f0f43b1-9ba9-4ba4-a785-e677652c7d7e",
    "PaymentServiceName": "Awesome Pay",
    "PaymentServiceUrl": "https://www.awesomepay.com/?invoiceNo=[INVOICENUMBER]&currency=[CURRENCY]&amount=[AMOUNTDUE]&shortCode=[SHORTCODE]",
    "PayNowText": "Pay via AwesomePay",
    "PaymentServiceType": "Custom"
  }]
}
```

- Payment services can be applied to branding themes
- PaymentServiceTypes include: PayPal, Custom
- No explicit "Stripe" type documented in the API

#### Bank Feeds & Reconciliation
Xero supports bank feeds for transaction reconciliation:

- **Scope**: `bankfeeds` - Allows viewing and managing bank statement feeds
- **Scope**: `finance.bankstatementsplus.read` - Read-only access to bank statements and reconciled transactions
- **Scope**: `finance.cashvalidation.read` - Read-only access to reconciliation data

Bank transactions include reconciliation status (`IsReconciled: true/false`):
```json
{
  "BankTransactionID": "d20b6c54-7f5d-4ce6-ab83-55f609719126",
  "Type": "SPEND",
  "IsReconciled": "true",
  "BankAccount": {
    "AccountID": "ac993f75-035b-433c-82e0-7b7a2d40802c",
    "Code": "090",
    "Name": "Business Bank Account"
  }
}
```

#### Batch Payments
Xero supports batch payments for bulk invoice processing:

```http
POST https://api.xero.com/api.xro/2.0/BatchPayments
```

```json
{
  "Date": "2018-08-01",
  "Reference": "Particulars",
  "Account": {
    "AccountID": "ac993f75-035b-433c-82e0-7b7a2d40802c"
  },
  "Payments": [
    {
      "Invoice": { "InvoiceID": "d8ec835f-fef6-4d5c-ae41-28df59c57f11" },
      "Amount": 100
    }
  ]
}
```

### Stripe Documentation (websites/stripe)

#### Stripe Connect Accounts
Stripe supports creating connected accounts for platforms:

```json
// Create a Standard connected account
POST /v1/accounts
{
  "type": "standard"
}

// Response
{
  "id": "acct_1G2h3j4k5l6m7n8o",
  "object": "account",
  "type": "standard",
  "charges_enabled": false,
  "payouts_enabled": false
}
```

Account types include:
- **Standard**: Full Stripe Dashboard access
- **Express**: Limited Dashboard, managed by platform
- **Custom**: No Dashboard access, fully platform-controlled

#### Account Onboarding
Stripe provides account links for onboarding:

```json
POST /v1/account_links
{
  "account": "acct_1G2h3j4k5l6m7n8o",
  "refresh_url": "https://example.com/reauth",
  "return_url": "https://example.com/return",
  "type": "account_onboarding"
}
```

#### Financial Reporting
Stripe provides accounting reports via API:

```http
GET /reports/revenue_recognition.debit_credit_by_invoice.1
```

Returns debit/credit entries with:
- `accounting_period`
- `debit` / `credit` accounts
- `debit_gl_code` / `credit_gl_code` (General Ledger codes)
- `booked_date`
- Invoice, customer, subscription IDs

### Stripe Sync Engine (supabase/stripe-sync-engine)

This is a pattern for syncing Stripe data to PostgreSQL, useful for understanding data flow:

```typescript
const sync = new StripeSync({
  databaseUrl: 'postgres://user:pass@host:port/db',
  stripeSecretKey: 'sk_test_...',
  stripeWebhookSecret: 'whsec_...'
})

// Process webhooks for real-time sync
await sync.processWebhook(payload, signature)

// Backfill historical data
await sync.syncBackfill({
  object: 'product',
  created: { gte: 1643872333 }
})
```

Creates a `stripe` schema with tables matching Stripe's data model.

## Key Takeaways

1. **No Direct Xero-Stripe API Documentation**: Context7 does not contain documentation for the official Xero-Stripe integration. This integration is likely:
   - A proprietary Xero app available through the Xero App Store
   - Implemented via Stripe Apps (marketplace)
   - Handled through third-party integration services

2. **Xero Payment Services**: Xero's API supports custom payment services but doesn't have a built-in Stripe type. Stripe would integrate as either:
   - A "Custom" payment service type
   - A bank feed provider

3. **Stripe Connect vs Accounts**: If Xero creates Stripe accounts:
   - It would use Stripe Connect APIs
   - Could create Standard, Express, or Custom connected accounts
   - Connected accounts have their own payment capabilities and payouts

4. **Reconciliation Pattern**: Based on Xero's bank feeds API:
   - Stripe transactions would appear as bank transactions in Xero
   - Each transaction can be marked as reconciled (`IsReconciled: true`)
   - Batch payments can group multiple invoices into single payments

5. **No "Sub-Account" Terminology**: Neither Stripe nor Xero documentation uses "sub-account". The relevant concepts are:
   - Stripe: "Connected Accounts"
   - Xero: "Bank Accounts", "Payment Services"

## Recommendations for Further Research

1. **Xero App Store**: Check Xero's App Marketplace for the official Stripe integration details
2. **Stripe Apps Marketplace**: Look for Xero integration in Stripe's app ecosystem
3. **Stripe Connect Documentation**: If Xero creates connected accounts, review full Stripe Connect docs
4. **Third-Party Services**: Consider services like Zapier, Make (Integromat), or dedicated accounting sync tools

## Sources

- Xero Developer API via Context7 (websites/developer_xero)
- Stripe API Documentation via Context7 (websites/stripe)
- Stripe Apps Repository via Context7 (stripe/stripe-apps)
- Supabase Stripe Sync Engine via Context7 (supabase/stripe-sync-engine)

---

**Note**: The official Xero-Stripe integration is not documented in developer APIs because it's a pre-built integration managed through Xero's App Store, not a custom API implementation.
