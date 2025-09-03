# GitHub Codespaces Secrets Configuration

This guide explains how to configure secrets for GitHub Codespaces in the 2025slideheroes project.

## Required Secrets

### Repository Secrets

These secrets should be configured at the repository level for use in GitHub Codespaces:

#### Core Application Secrets

- **`SUPABASE_URL`**: Your Supabase project URL
  - Format: `https://[project-ref].supabase.co`
  - Required for database connections

- **`SUPABASE_ANON_KEY`**: Supabase anonymous/public key
  - Used for client-side authentication
  - Safe to expose in browser

- **`SUPABASE_SERVICE_KEY`**: Supabase service role key
  - Used for server-side operations
  - **Keep this secret!**

- **`DATABASE_URL`**: PostgreSQL connection string
  - Format: `postgresql://postgres:[password]@[host]:5432/postgres`
  - Used for direct database connections

#### Authentication Secrets

- **`NEXTAUTH_SECRET`**: NextAuth.js secret for session encryption
  - Generate with: `openssl rand -base64 32`
  - Required for production

- **`NEXTAUTH_URL`**: Application URL for authentication callbacks
  - Format: `https://[codespace-name]-3000.githubpreview.dev`
  - Automatically set in Codespaces

#### Third-Party API Keys

- **`OPENAI_API_KEY`**: OpenAI API key for AI features
- **`STRIPE_SECRET_KEY`**: Stripe secret key for payments
- **`STRIPE_WEBHOOK_SECRET`**: Stripe webhook endpoint secret
- **`SENDGRID_API_KEY`**: SendGrid API key for email services
- **`CLOUDINARY_URL`**: Cloudinary URL for image uploads

### User Secrets

These secrets are personal to each developer and should be configured at the user level:

- **`GITHUB_TOKEN`**: Personal access token for GitHub API
  - Required scopes: `repo`, `workflow`, `read:org`
  - Generate at: <https://github.com/settings/tokens>

- **`NPM_TOKEN`**: NPM authentication token (if using private packages)

## Setting Up Secrets

### For Repository Secrets

1. Navigate to repository Settings → Secrets and variables → Codespaces
2. Click "New repository secret"
3. Add each secret with its name and value
4. These will be available to all Codespaces in this repository

### For User Secrets

1. Go to <https://github.com/settings/codespaces>
2. Click "New secret"
3. Select the repository (MLorneSmith/2025slideheroes)
4. Add your personal secret

### For Organization Secrets (if applicable)

1. Navigate to organization Settings → Secrets and variables → Codespaces
2. Click "New organization secret"
3. Select repository access (specific or all)
4. Add the secret

## Environment Variables in Codespaces

When a Codespace starts, secrets are automatically injected as environment variables.
They can be accessed in your application code:

```javascript
// Node.js/Next.js
const supabaseUrl = process.env.SUPABASE_URL;

// Client-side (Next.js)
const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
```

## Local Development Setup

For local development, create a `.env.local` file in the project root:

```bash
# Copy the example file
cp .env.example .env.local

# Edit with your local values
nano .env.local
```

## Security Best Practices

1. **Never commit secrets** to the repository
2. **Use different secrets** for development and production
3. **Rotate secrets regularly** (every 90 days recommended)
4. **Limit secret access** to only necessary services
5. **Monitor secret usage** through GitHub audit logs

## Secret Rotation

### Automated Rotation

Set up GitHub Actions to rotate secrets automatically:

```yaml
# .github/workflows/rotate-secrets.yml
name: Rotate Secrets
on:
  schedule:
    - cron: '0 0 1 */3 *' # Every 3 months
  workflow_dispatch:

jobs:
  rotate:
    runs-on: ubuntu-latest
    steps:
      - name: Rotate Supabase Keys
        run: |
          # Script to rotate keys via Supabase Management API
```

### Manual Rotation

1. Generate new secret values
2. Update in GitHub Codespaces settings
3. Update any deployed environments
4. Delete old secret values

## Troubleshooting

### Secret Not Available

If a secret is not available in your Codespace:

1. Check it's correctly configured in repository/user settings
2. Restart the Codespace to load new secrets
3. Verify the secret name matches exactly (case-sensitive)

### Secret Value Issues

- Ensure no extra whitespace in secret values
- Check for proper escaping of special characters
- Verify JSON secrets are properly formatted

### Access Denied

If you can't access secrets:

1. Verify you have repository access
2. Check organization policies for Codespaces
3. Ensure secrets are configured for the correct repository

## Testing Secrets

Test script to verify all secrets are loaded:

```bash
#!/bin/bash
# .devcontainer/scripts/test-secrets.sh

echo "Testing Codespaces Secrets..."

required_secrets=(
  "SUPABASE_URL"
  "SUPABASE_ANON_KEY"
  "DATABASE_URL"
  "NEXTAUTH_SECRET"
)

for secret in "${required_secrets[@]}"; do
  if [ -z "${!secret}" ]; then
    echo "❌ Missing: $secret"
  else
    echo "✅ Found: $secret"
  fi
done
```

## References

- [GitHub Codespaces Secrets Documentation](https://docs.github.com/en/codespaces/managing-your-codespaces/managing-encrypted-secrets-for-your-codespaces)
- [Dev Container Environment Variables](https://containers.dev/implementors/json_reference/#variables-in-devcontainerjson)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
