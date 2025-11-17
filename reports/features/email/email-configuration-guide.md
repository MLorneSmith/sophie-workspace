# Email Configuration Guide - Supabase Email Bounce Resolution

## Overview

This guide provides the complete solution for resolving Supabase email bouncing issues by implementing custom SMTP providers.

## Problem Summary

Supabase project `ldebzombxtszzcgnylgq` experienced high bounce rates due to:

- Using shared Supabase email infrastructure
- Test email addresses in code (`test@example.com`)
- No custom SMTP configuration

## Solution: Custom SMTP Implementation

### Option 1: Resend (Recommended)

#### Step 1: Set up Resend Account

1. Go to [resend.com](https://resend.com)
2. Sign up and verify your account
3. Add and verify your domain
4. Generate an API key

#### Step 2: Environment Variables

Add these to your production environment:

```bash
# Resend Configuration
MAILER_PROVIDER=resend
RESEND_API_KEY=re_your_api_key_here
EMAIL_SENDER=noreply@yourdomain.com
CONTACT_EMAIL=contact@yourdomain.com
```

### Option 2: Custom SMTP (Alternative)

#### Step 1: Choose SMTP Provider

Popular options:

- AWS SES
- SendGrid
- Mailgun
- Gmail SMTP (for testing only)

#### Step 2: SMTP Environment Variables

```bash
# SMTP Configuration
MAILER_PROVIDER=nodemailer
EMAIL_HOST=smtp.your-provider.com
EMAIL_PORT=587
EMAIL_USER=your-email@domain.com
EMAIL_PASSWORD=your-smtp-password
EMAIL_TLS=true
EMAIL_SENDER=noreply@yourdomain.com
CONTACT_EMAIL=contact@yourdomain.com
```

## Current Environment Files

### Development (.env.local)

```bash
# Use local InBucket for development
MAILER_PROVIDER=nodemailer
EMAIL_HOST=localhost
EMAIL_PORT=54325
EMAIL_TLS=false
EMAIL_SENDER=test@makerkit.dev
CONTACT_EMAIL=test@makerkit.dev
```

### Test (.env.test) - Already Configured ✅

```bash
EMAIL_SENDER=test@makerkit.dev
EMAIL_PORT=54325
EMAIL_HOST=localhost
EMAIL_TLS=false
EMAIL_USER=user
EMAIL_PASSWORD=password
```

### Production - NEEDS CONFIGURATION ⚠️

Choose either Resend or SMTP configuration above.

## Supabase Configuration

### Update Auth Settings

1. Go to Supabase Dashboard → Authentication → Settings
2. Scroll to "SMTP Settings"
3. Enable "Enable custom SMTP"
4. Configure:
   - **Host**: smtp.resend.com (for Resend) or your SMTP host
   - **Port**: 587
   - **Username**: resend (for Resend) or your SMTP username
   - **Password**: Your Resend API key or SMTP password
   - **Sender email**: <noreply@yourdomain.com>

## Code Improvements Implemented ✅

### 1. Email Validation

- Created `email-validator.ts` with strict validation
- Blocks test domains (`example.com`, `test.com`, etc.)
- Environment-specific routing

### 2. Environment Detection

- Automatic detection of development/test/production
- Skips email sending in test environments
- Uses appropriate SMTP configuration per environment

### 3. Enhanced Contact Form

- Added email validation before sending
- Better error handling
- Environment-aware email routing

## Testing Instructions

### 1. Development Testing

```bash
# Start local Supabase (includes InBucket)
pnpm supabase:web:start

# View test emails at: http://localhost:54324
# Your app emails will appear here instead of being sent
```

### 2. Production Testing

```bash
# Test with a real email address
# Check deliverability with tools like:
# - mail-tester.com
# - mxtoolbox.com
```

## Monitoring and Maintenance

### Email Deliverability Best Practices

1. **Domain Authentication**: Set up SPF, DKIM, DMARC records
2. **Bounce Handling**: Monitor and handle bounced emails
3. **List Hygiene**: Remove invalid email addresses
4. **Content Quality**: Avoid spammy content

### Monitoring Tools

- Resend Dashboard (if using Resend)
- Your SMTP provider's analytics
- Email deliverability testing tools

## Troubleshooting

### Common Issues

#### "Invalid email domain" error

- Check that you're not using test domains in production
- Verify the email validation logic

#### Emails not sending

- Check environment variables are set correctly
- Verify SMTP credentials
- Check firewall/network restrictions

#### Still getting bounces

- Verify domain authentication (SPF/DKIM)
- Check email content for spam indicators
- Monitor bounce reasons in your email provider

### Debug Commands

```bash
# Check current mailer provider
echo $MAILER_PROVIDER

# Test SMTP connection (if using nodemailer)
node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransporter({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_TLS !== 'false',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});
transporter.verify().then(console.log).catch(console.error);
"
```

## Next Steps

1. ✅ **Code improvements implemented**
2. ⚠️ **Choose and configure email provider** (Resend or SMTP)
3. ⚠️ **Set production environment variables**
4. ⚠️ **Update Supabase Auth SMTP settings**
5. ⚠️ **Test email delivery**
6. ⚠️ **Set up domain authentication (SPF/DKIM/DMARC)**
7. ⚠️ **Monitor deliverability**

## Success Metrics

- Zero bounced emails from Supabase
- Improved email deliverability rates
- No test emails in production
- Proper environment separation
- Full control over email infrastructure
