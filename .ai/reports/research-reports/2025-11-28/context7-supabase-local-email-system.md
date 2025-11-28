# Context7 Research: Supabase Local Email System

**Date**: 2025-11-28
**Agent**: context7-expert
**Libraries Researched**: supabase/cli, websites/supabase_com-docs

## Query Summary

The user wanted to verify whether Supabase now uses Mailpit instead of Inbucket as the default local email testing tool for local development. This research was conducted to confirm the current default mail system and identify any recent changes.

## Findings

### Current Default: InBucket

Based on the official Supabase documentation retrieved from Context7, **InBucket is still the default local email testing system** for Supabase local development.

### Documentation Evidence

From the official Supabase documentation (supabase.com/docs):

**1. InBucket Configuration Reference**

```toml
[inbucket]
enabled = true
```

The documentation explicitly states:
> "Enables the local InBucket service for email testing during development. InBucket provides a local email inbox for testing email functionality without sending actual emails. Enabled by default for local development."

**2. InBucket Port Configuration**

```toml
inbucket.port = 54324
inbucket.smtp_port = 54325
inbucket.pop3_port = 54326
```

The documentation confirms that InBucket runs on three ports:
- **Web Interface**: Port 54324 (default)
- **SMTP**: Port 54325 (default)
- **POP3**: Port 54326 (default)

**3. InBucket Email Sender Settings**

```toml
inbucket.admin_email = "admin@email.com"
inbucket.sender_name = "Admin"
```

The configuration shows InBucket-specific settings for the sender email address and display name.

### No Evidence of Mailpit

The Context7 search returned **zero references to Mailpit** in the Supabase CLI or documentation. All email-related configuration references point to InBucket.

### How to Access InBucket Locally

When running `supabase start`, InBucket is automatically started and can be accessed at:

**Web Interface**: `http://localhost:54324`

This provides a local email inbox where you can view all emails sent by your application during local development without them being sent to real email addresses.

## Key Takeaways

- **InBucket is the current default** local email testing tool for Supabase
- **No change to Mailpit** has occurred (as of the latest documentation)
- **Enabled by default** when running `supabase start`
- **Accessible at** `http://localhost:54324` for the web interface
- **Three ports configured**: Web UI (54324), SMTP (54325), POP3 (54326)
- **Configuration is in** `supabase/config.toml` under the `[inbucket]` section

## Configuration Example

From the official Supabase CLI documentation:

```toml
# Enable InBucket for local email testing
[inbucket]
enabled = true
port = 54324
smtp_port = 54325
pop3_port = 54326
admin_email = "admin@email.com"
sender_name = "Admin"
```

## Usage in Local Development

When working with authentication flows that send emails (password reset, email confirmation, magic links), InBucket captures all outgoing emails and displays them in the web interface at `http://localhost:54324`.

**Common workflow:**
1. Start Supabase: `supabase start`
2. Trigger an email action (e.g., sign up with email confirmation)
3. Open InBucket: `http://localhost:54324`
4. View the captured email and click confirmation links

## Sources

- **Supabase CLI** via Context7 (/supabase/cli)
- **Supabase Documentation** via Context7 (/websites/supabase_com-docs)
- **Configuration Reference**: https://supabase.com/docs/guides/cli/config
- **Local Development Guide**: https://supabase.com/docs/guides/local-development/customizing-email-templates

## Conclusion

Supabase has **NOT changed from InBucket to Mailpit**. InBucket remains the default and officially documented local email testing system for Supabase local development as of the latest documentation.
