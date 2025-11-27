# Context7 Research: Supabase Email Testing with Mailpit/Inbucket

**Date**: 2025-11-27
**Agent**: context7-expert
**Libraries Researched**: supabase/cli, supabase/auth, axllent/mailpit

## Query Summary

Researched Supabase local development email testing to determine:
1. How Supabase handles email in local development (SMTP configuration)
2. Mailpit/Inbucket API endpoints and usage
3. How invitation emails are sent in Supabase Auth
4. Configuration needed in config.toml for email testing

## Findings

### 1. Supabase Local Email Handling

**Important Discovery**: Supabase CLI uses **Inbucket** (not Mailpit) as the default email testing server for local development.

#### SMTP Configuration in config.toml

The project's `/home/msmith/projects/2025slideheroes/apps/web/supabase/config.toml` shows:

```toml
# Email testing server. Emails sent with the local dev setup are not actually sent - rather, they
# are monitored, and you can view the emails that would have been sent from the web interface.
[inbucket]
# Port to use for the email testing server web interface.
# Changed from 54324-54326 to avoid Windows Hyper-V port reservation conflicts
port = 54524
smtp_port = 54525
pop3_port = 54526
```

**Key Ports**:
- **Web Interface**: 54524 (default 54324)
- **SMTP**: 54525 (default 54325)
- **POP3**: 54526 (default 54326)

#### Email Template Configuration

```toml
[auth.email]
enable_signup = true
double_confirm_changes = true
enable_confirmations = false  # DISABLED for testing to prevent email bounce issues

[auth.email.template.invite]
subject = "You are invited to Makerkit"
content_path = "./supabase/templates/invite-user.html"

[auth.email.template.confirmation]
subject = "Confirm your email"
content_path = "./supabase/templates/confirm-email.html"

[auth.email.template.recovery]
subject = "Reset your password"
content_path = "./supabase/templates/reset-password.html"

[auth.email.template.email_change]
subject = "Confirm your email change"
content_path = "./supabase/templates/change-email-address.html"

[auth.email.template.magic_link]
subject = "Sign in to Makerkit"
content_path = "./supabase/templates/magic-link.html"
```

### 2. Supabase Auth Email Sending

#### Invitation Email Flow

**API Endpoint**: `POST /invite`

**Authentication Required**: `service_role` or `supabase_admin` JWT

**Request**:
```json
{
  "email": "email@example.com"
}
```

**Response**:
```json
{
  "id": "11111111-2222-3333-4444-5555555555555",
  "email": "email@example.com",
  "confirmation_sent_at": "2016-05-15T20:49:40.882805774-07:00",
  "created_at": "2016-05-15T19:53:12.368652374-07:00",
  "updated_at": "2016-05-15T19:53:12.368652374-07:00",
  "invited_at": "2016-05-15T19:53:12.368652374-07:00"
}
```

**Email Template Variables**:
```html
<h2>You have been invited</h2>

<p>
  You have been invited to create a user on {{ .SiteURL }}. Follow this link to
  accept the invite:
</p>
<p><a href="{{ .ConfirmationURL }}">Accept the invite</a></p>
```

**Template Variables Available**:
- `{{ .SiteURL }}` - Base URL from config
- `{{ .Email }}` - User's email address
- `{{ .ConfirmationURL }}` - Link to confirm/accept invite

#### Other Email Types

**Magic Link** (`POST /magiclink`):
```html
<h2>Magic Link</h2>
<p>Follow this link to login:</p>
<p><a href="{{ .ConfirmationURL }}">Log In</a></p>
```

**Password Recovery** (`POST /recover`):
```html
<h2>Reset Password</h2>
<p>Follow this link to reset the password for your user:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
```

**Email Confirmation** (`POST /signup`):
```html
<h2>Confirm your signup</h2>
<p>Follow this link to confirm your user:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your mail</a></p>
```

#### Generate Email Action Links (Admin)

**Endpoint**: `POST /admin/generate_link`

**Use Case**: Generate email action links programmatically for testing

**Request**:
```json
{
  "type": "invite",
  "email": "email@example.com",
  "redirect_to": "https://example.com/onboarding"
}
```

**Response**:
```json
{
  "action_link": "http://localhost:9999/verify?token=TOKEN&type=TYPE&redirect_to=REDIRECT_URL",
  "email_otp": "EMAIL_OTP",
  "hashed_token": "TOKEN",
  "verification_type": "TYPE",
  "redirect_to": "REDIRECT_URL"
}
```

**Types Available**:
- `signup` - New user registration
- `invite` - User invitation
- `magiclink` - Passwordless login
- `recovery` - Password reset

### 3. Inbucket/Mailpit API Reference

**Project Uses**: The project uses **Mailpit** (not Inbucket) based on the actual implementation in `/home/msmith/projects/2025slideheroes/apps/e2e/tests/utils/mailbox.ts`

#### API Endpoints

**Base URL**: `http://127.0.0.1:54524`

##### Search for Messages
```
GET /api/v1/search?query=to:{email}
```

**Response**:
```typescript
{
  total: number;
  unread: number;
  count: number;
  messages_count: number;
  start: number;
  tags: string[];
  messages: MessageSummary[];
}
```

**MessageSummary Schema**:
```typescript
{
  ID: string;
  MessageID: string;
  Read: boolean;
  From: { Name: string; Address: string };
  To: Array<{ Name: string; Address: string }>;
  Cc: Array<{ Name: string; Address: string }>;
  Bcc: Array<{ Name: string; Address: string }>;
  ReplyTo: Array<{ Name: string; Address: string }>;
  Subject: string;
  Created: string;
  Tags: string[];
  Size: number;
  Attachments: number;
  Snippet: string;
}
```

##### Get Specific Message
```
GET /api/v1/message/{messageId}
```

**Response**:
```typescript
{
  ID: string;
  MessageID: string;
  From: EmailAddress;
  To: EmailAddress[];
  Cc: EmailAddress[];
  Bcc: EmailAddress[];
  ReplyTo: EmailAddress[];
  ReturnPath: string;
  Subject: string;
  ListUnsubscribe: {
    Header: string;
    Links: string[];
    Errors: string;
    HeaderPost: string;
  };
  Date: string;
  Tags: string[];
  Text: string;      // Plain text body
  HTML: string;      // HTML body
  Size: number;
  Inline: unknown[];
  Attachments: unknown[];
}
```

##### Delete Messages
```
DELETE /api/v1/messages
```

**Request Body**:
```json
{
  "Ids": ["message-id-1", "message-id-2"]
}
```

#### Implementation Example (from mailbox.ts)

**Search for Email**:
```typescript
const url = `${Mailbox.URL}/api/v1/search?query=to:${email}`;
const response = await fetch(url);
const messagesResponse = await response.json() as MessagesResponse;
```

**Filter by Subject**:
```typescript
const message = messagesResponse.messages.filter(item => 
  item.Subject.indexOf(params.subject) !== -1
).reduce((acc, item) => {
  // Get latest by timestamp
  if (new Date(acc.Created).getTime() < new Date(item.Created).getTime()) {
    return item;
  }
  return acc;
});
```

**Get Full Message**:
```typescript
const messageUrl = `${Mailbox.URL}/api/v1/message/${messageId}`;
const messageResponse = await fetch(messageUrl);
const json = await messageResponse.json();
```

**Extract Link from Email**:
```typescript
import { parse } from "node-html-parser";

const el = parse(json.HTML);
const linkHref = el.querySelector("a")?.getAttribute("href");
```

**Extract OTP Code**:
```typescript
const otpCode = json.HTML.match(/Your one-time password is: (\d{6})/)?.[1];
```

### 4. E2E Testing Patterns

#### Mailbox Utility Class

Located at: `/home/msmith/projects/2025slideheroes/apps/e2e/tests/utils/mailbox.ts`

**Key Methods**:

```typescript
class Mailbox {
  static URL = "http://127.0.0.1:54524";

  // Visit confirmation link from email
  async visitMailbox(email: string, params: {
    deleteAfter: boolean;
    subject?: string;
  }): Promise<void>

  // Extract OTP code from email
  async getOtpFromEmail(email: string, deleteAfter = false): Promise<string>

  // Get email with filtering
  async getEmail(email: string, params: {
    deleteAfter: boolean;
    subject?: string;
  }): Promise<MessageResponse>
}
```

**Usage Example**:
```typescript
import { Mailbox } from './utils/mailbox';

const mailbox = new Mailbox(page);

// Get invitation email and visit link
await mailbox.visitMailbox('test@example.com', {
  deleteAfter: true,
  subject: 'You are invited'
});

// Get OTP code for MFA
const otpCode = await mailbox.getOtpFromEmail('test@example.com', true);
```

#### Test Reliability Pattern (toPass)

**Always wrap email operations in `toPass()` for reliability**:

```typescript
await expect(async () => {
  const otpCode = await mailbox.getOtpCodeFromEmail(email);
  expect(otpCode).not.toBeNull();
  await auth.enterOtpCode(otpCode);
}).toPass({
  intervals: [500, 2500, 5000, 7500, 10_000, 15_000, 20_000]
});
```

**Why**: Email delivery can be delayed, network requests can fail temporarily.

### 5. Common Issues & Troubleshooting

#### Issue: Emails Not Arriving in Mailpit

**Diagnosis Steps**:

1. **Check Mailpit is running**:
   ```bash
   curl http://127.0.0.1:54524/api/v1/info
   ```

2. **Check Supabase services**:
   ```bash
   npx supabase status
   ```
   
   Should show:
   ```
   Inbucket URL: http://127.0.0.1:54524
   ```

3. **Verify SMTP configuration**:
   - SMTP port: 54525
   - SMTP host: 127.0.0.1

4. **Check email confirmations enabled**:
   ```toml
   [auth.email]
   enable_confirmations = true  # Must be true for confirmation emails
   ```

#### Issue: Email Template Not Rendering

**Common Causes**:
- Template file path incorrect in config.toml
- Template variables misspelled (case-sensitive)
- Template file doesn't exist

**Debug**:
```bash
# Check template files exist
ls -la apps/web/supabase/templates/

# Verify paths match config.toml
grep "content_path" apps/web/supabase/config.toml
```

#### Issue: API Returns Empty Messages Array

**Solutions**:
1. Add delay before checking mailbox:
   ```typescript
   await page.waitForTimeout(2000);
   const email = await mailbox.getEmail(email);
   ```

2. Use `toPass()` pattern with retries:
   ```typescript
   await expect(async () => {
     const email = await mailbox.getEmail(email);
     expect(email).not.toBeNull();
   }).toPass();
   ```

3. Check search query format:
   ```typescript
   // Correct: uses 'to:' prefix
   /api/v1/search?query=to:test@example.com
   
   // Incorrect: missing prefix
   /api/v1/search?query=test@example.com
   ```

#### Issue: Wrong Email Retrieved

**Solutions**:
1. Filter by subject:
   ```typescript
   await mailbox.getEmail(email, {
     subject: "You are invited",
     deleteAfter: true
   });
   ```

2. Delete old emails before test:
   ```typescript
   // Delete all messages for this email
   const messages = await fetch(
     `${Mailbox.URL}/api/v1/search?query=to:${email}`
   ).then(r => r.json());
   
   await fetch(`${Mailbox.URL}/api/v1/messages`, {
     method: 'DELETE',
     body: JSON.stringify({ Ids: messages.messages.map(m => m.ID) })
   });
   ```

3. Use unique email addresses per test:
   ```typescript
   const email = `test-${Date.now()}@example.com`;
   ```

### 6. Configuration Best Practices

#### Production SMTP (Not for Testing)

**For production**, configure real SMTP in environment variables:

```properties
GOTRUE_SMTP_HOST=smtp.sendgrid.net
GOTRUE_SMTP_PORT=587
GOTRUE_SMTP_USER=apikey
GOTRUE_SMTP_PASS=SG.xxxxxxxxxxxx
GOTRUE_SMTP_ADMIN_EMAIL=support@example.com
GOTRUE_MAILER_SUBJECTS_CONFIRMATION="Please confirm your email"
```

**Never use Inbucket/Mailpit in production** - they're development-only tools.

#### Local Development vs CI/CD

**Local Development**:
- Use Inbucket/Mailpit with Supabase
- Real email flow testing
- Interactive debugging

**CI/CD**:
- Skip email verification with `SKIP_EMAIL_VERIFICATION=true`
- Or use dedicated email testing service (Mailosaur, MailSlurp)
- See `/home/msmith/projects/2025slideheroes/apps/e2e/docs/EMAIL-TESTING-STRATEGY.md`

#### Port Conflicts

**If default ports conflict**:

1. Update `config.toml`:
   ```toml
   [inbucket]
   port = 55524      # Web UI
   smtp_port = 55525 # SMTP
   pop3_port = 55526 # POP3
   ```

2. Update E2E test configuration:
   ```typescript
   class Mailbox {
     static URL = "http://127.0.0.1:55524";
   }
   ```

3. Restart Supabase:
   ```bash
   npx supabase stop
   npx supabase start
   ```

## Key Takeaways

1. **Supabase uses Inbucket** by default, but project uses **Mailpit** (compatible API)
2. **Mailpit API base URL**: `http://127.0.0.1:54524`
3. **Search endpoint**: `/api/v1/search?query=to:{email}`
4. **Get message endpoint**: `/api/v1/message/{messageId}`
5. **Delete endpoint**: `/api/v1/messages` (POST with `Ids` array)
6. **Email templates** configured in `config.toml` with custom HTML files
7. **Always use `toPass()`** wrapper for email operations in E2E tests
8. **Filter by subject** to get correct email when multiple exist
9. **Use unique emails** per test to avoid conflicts
10. **Enable confirmations** in config for emails to be sent

## Code Examples

### Send Invitation via Supabase Admin Client

```typescript
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

async function inviteUser(email: string) {
  const adminClient = getSupabaseServerAdminClient();
  
  const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
    redirectTo: 'http://localhost:3000/onboarding'
  });
  
  if (error) throw error;
  return data;
}
```

### Test Email Reception in E2E

```typescript
import { test, expect } from '@playwright/test';
import { Mailbox } from './utils/mailbox';

test('user receives invitation email', async ({ page }) => {
  const mailbox = new Mailbox(page);
  const email = `test-${Date.now()}@example.com`;
  
  // Trigger invitation
  await inviteUser(email);
  
  // Wait for email with retry logic
  await expect(async () => {
    const message = await mailbox.getEmail(email, {
      subject: 'You are invited',
      deleteAfter: false
    });
    expect(message).not.toBeNull();
    expect(message.Subject).toContain('You are invited');
    expect(message.HTML).toContain('Accept the invite');
  }).toPass({
    intervals: [500, 1000, 2000, 5000]
  });
});
```

### Parse Confirmation Link from Email

```typescript
import { parse } from 'node-html-parser';

async function getConfirmationLink(email: string): Promise<string> {
  const mailbox = new Mailbox(page);
  
  const message = await mailbox.getEmail(email, {
    subject: 'Confirm your email',
    deleteAfter: true
  });
  
  const htmlDoc = parse(message.HTML);
  const link = htmlDoc.querySelector('a')?.getAttribute('href');
  
  if (!link) {
    throw new Error('No confirmation link found in email');
  }
  
  return link;
}
```

## Related Documentation

- **Inbucket API Research**: `/home/msmith/projects/2025slideheroes/.ai/reports/research-reports/2025-11-27/perplexity-inbucket-api-reference.md`
- **Email Testing Strategy**: `/home/msmith/projects/2025slideheroes/apps/e2e/docs/EMAIL-TESTING-STRATEGY.md`
- **Mailbox Utility**: `/home/msmith/projects/2025slideheroes/apps/e2e/tests/utils/mailbox.ts`
- **Supabase Config**: `/home/msmith/projects/2025slideheroes/apps/web/supabase/config.toml`

## Sources

- **Supabase CLI Documentation** via Context7 (supabase/cli)
- **Supabase Auth Documentation** via Context7 (supabase/auth)
- **Mailpit Documentation** via Context7 (axllent/mailpit - limited)
- **Project Implementation**: Actual codebase analysis
- **Existing Research**: Perplexity research on Inbucket API
