# Perplexity Research: Xero and Stripe Integration

**Date**: 2025-12-16
**Agent**: perplexity-expert
**Search Type**: Chat API (sonar-pro) + Search API

## Query Summary

Investigated how Xero integrates with Stripe, specifically:
1. Whether Xero creates separate Stripe accounts during connection
2. The relationship between Xero and Stripe (Stripe Connect usage)
3. Why duplicate Stripe accounts named "[Business Name] (New)" might appear
4. How to identify Xero-created vs manually-created Stripe accounts
5. Best practices for managing multiple Stripe accounts with Xero

## Key Findings

### 1. Does Xero Create Separate Stripe Accounts?

**No, Xero does not independently create Stripe accounts.** During the Xero-Stripe connection flow:

- Xero redirects users to Stripe's OAuth authorization flow
- Users can either **select an existing Stripe account** OR **create a new one**
- If users click through the "create new" path (intentionally or accidentally), Stripe itself creates a new account
- The new account often appears as "[Business Name] (New)" in the Stripe dashboard

**Important**: This is standard Stripe OAuth behavior, not unique to Xero.

### 2. Does Xero Use Stripe Connect?

**No, Xero does NOT use Stripe Connect connected accounts.**

The Xero-Stripe integration uses a **standard OAuth connection** (similar to Standard Connect accounts for platform authorization), NOT the Express or Custom connected account types used by marketplaces.

Key differences:
- **Standard OAuth**: Your business Stripe account connects to Xero; you maintain full control and dashboard access
- **Express/Custom Connect**: These are sub-accounts created BY platforms for sellers/vendors (like Airbnb creates for hosts)

Xero is authorized to:
- Register as a payment service for invoices
- Import Stripe balance and payouts as bank feeds
- Reconcile payments automatically

### 3. Why Does "[Business Name] (New)" Appear?

This typically happens because:

1. **Accidental new account creation during OAuth**: If users weren't logged into their existing Stripe account OR selected "Create new account" instead of choosing the existing one, Stripe creates a fresh account

2. **Xero's setup wizard assumptions**: If Xero's connection wizard doesn't detect an existing Stripe account (user not logged in), it guides users through creating a new one

3. **Multiple business setup or regional accounts**: Some third-party tools that also integrate with Xero and Stripe create their own Stripe accounts for specific payment flows

### 4. How to Identify Account Origin

**To identify if an account was created by/for Xero vs manually:**

From the Stripe Dashboard:
- Check **creation date**: Xero-related accounts are created at the time of Xero connection
- Check **transaction history**: Original accounts have pre-Xero activity; new ones are empty
- Check **Settings > Connected Apps/Platforms**: Shows which platforms are connected via OAuth
- Check **account name**: "(New)" suffix often indicates duplicate creation during OAuth

From Xero:
- Go to **Settings > Payment Services > Stripe**
- Check which Stripe account is connected
- "(pending authentication)" indicates incomplete setup

### 5. Best Practices for Managing Duplicate Accounts

| Action | Recommendation | Rationale |
|--------|---------------|-----------|
| **Delete duplicate** | NOT recommended | Risk of data loss, payout disruption |
| **Disconnect in Xero** | RECOMMENDED | Simple, reversible, preserves data |
| **Merge accounts** | Not supported | Stripe does not support account merging |
| **Reconnect to original** | RECOMMENDED | Best long-term solution |

**Steps to reconnect Xero to the original Stripe account:**

1. In Xero: Go to **Settings > Payment Services > Stripe > Remove**
2. This disconnects the wrong account from Xero
3. Go to **Settings > Payment Services > Add Payment Service > Stripe**
4. Click **Connect to Stripe**
5. **Log into your original Stripe account** (the one you want to use)
6. **Select the correct account** when prompted (don't create new)
7. Ensure the bank account in Xero matches Stripe's payout bank

**Critical notes:**
- Stripe accounts and Xero organizations must use matching countries
- One Stripe account per Xero organization is the standard configuration
- Auto-reconciliation only works when one Stripe account is connected to one Xero org

### 6. Technical Details

**Xero-Stripe Integration Architecture:**
- Connection type: OAuth 2.0 authorization
- NOT Stripe Connect Express/Custom accounts
- Xero acts as an authorized application, not a marketplace platform
- Stripe maintains direct relationship with the merchant

**Stripe Account Types (for reference):**
- **Standard**: Full Stripe account with dashboard (what Xero connects to)
- **Express**: Limited dashboard, created by platforms for sellers
- **Custom**: White-label, no Stripe dashboard, fully platform-controlled

Xero users have **Standard** Stripe accounts - full accounts with complete dashboard access.

## Sources & Citations

1. [Xero + Stripe Partnership Page](https://www.xero.com/us/partnerships/stripe/)
2. [Setting up your Xero account with Stripe - Stripe Support](https://support.stripe.com/questions/setting-up-your-xero-account-with-stripe)
3. [Stripe Xero Integration - Xero App Store](https://apps.xero.com/us/app/stripe)
4. [Payouts and Reconciliation with Xero and Stripe](https://support.stripe.com/questions/payouts-and-reconciliation-with-xero-and-stripe)
5. [Multiple separate accounts - Stripe Documentation](https://docs.stripe.com/get-started/account/multiple-accounts)
6. [Create and manage multiple Stripe accounts](https://support.stripe.com/questions/create-and-manage-multiple-stripe-accounts)

## Key Takeaways

- Xero does NOT create Stripe accounts automatically - users create them during the OAuth flow
- Xero does NOT use Stripe Connect connected accounts (Express/Custom)
- "[Business Name] (New)" accounts appear when users accidentally create a new account instead of selecting existing
- To fix: Disconnect wrong account in Xero, reconnect using the correct existing Stripe account
- Never delete Stripe accounts without careful consideration - disconnect from Xero instead
- One Stripe account per Xero organization is the supported configuration

## Related Searches

For follow-up research if needed:
- Stripe OAuth vs Stripe Connect implementation details
- Xero multi-currency with multiple Stripe accounts
- Third-party Xero-Stripe sync tools (PayTraQer, Synder, Webgility)
