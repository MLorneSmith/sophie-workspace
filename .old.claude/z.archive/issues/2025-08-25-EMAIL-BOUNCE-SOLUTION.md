# Supabase Email Bouncing Issue - Resolution Plan

## Issue Summary

Supabase project `ldebzombxtszzcgnylgq` has high bounce rates causing temporary email restrictions.

## Root Causes Identified

1. **Reliance on Supabase's shared email service** - Limited control and affected by other users
2. **Test email addresses in codebase** - `test@example.com`, `test@slideheroes.com` causing bounces
3. **No custom SMTP configured** - Missing production email provider setup
4. **Development email leakage** - Test emails potentially hitting production

## Solution Implementation

### Phase 1: Immediate Setup - Custom SMTP Provider

#### Option A: Resend (Recommended)

- Modern email service with good deliverability
- Already integrated in the codebase
- Simple API-based setup

#### Option B: Nodemailer with SMTP

- Traditional SMTP approach
- More configuration required
- Good for custom SMTP providers

### Phase 2: Environment Configuration

#### Production Environment Variables Needed

```bash
# For Resend
MAILER_PROVIDER=resend
RESEND_API_KEY=re_... # Get from resend.com

# Or for Nodemailer/SMTP
MAILER_PROVIDER=nodemailer
EMAIL_HOST=smtp.provider.com
EMAIL_PORT=587
EMAIL_USER=your-email@domain.com
EMAIL_PASSWORD=your-smtp-password
EMAIL_TLS=true

# Common
EMAIL_SENDER=noreply@yourdomain.com
CONTACT_EMAIL=contact@yourdomain.com
```

#### Test Environment Fixes

```bash
# Use localhost for development
EMAIL_HOST=localhost
EMAIL_PORT=54325
EMAIL_TLS=false
EMAIL_SENDER=test@makerkit.dev
```

### Phase 3: Supabase Project Configuration

Update Supabase Auth settings to use custom SMTP:

1. Go to Authentication > Settings > SMTP Settings
2. Enable custom SMTP
3. Configure sender details
4. Set up email templates

### Phase 4: Code Improvements

1. Replace test emails with proper validation
2. Add environment-specific email routing
3. Implement email validation before sending
4. Add bounce handling and monitoring

## Implementation Steps

### Step 1: Choose and Configure Email Provider

For Resend (Recommended):

1. Sign up at resend.com
2. Get API key
3. Verify domain
4. Set environment variables

### Step 2: Update Environment Configuration

### Step 3: Update Supabase Project

### Step 4: Clean Up Test Data

### Step 5: Testing and Monitoring

## Expected Outcomes

1. ✅ No more bounced emails
2. ✅ Full control over email delivery
3. ✅ Better deliverability rates
4. ✅ Proper development/production separation
5. ✅ Compliance with email standards

## Prevention Measures

1. Email validation at input
2. Environment-specific routing
3. Monitoring and alerts
4. Regular audit of email practices
