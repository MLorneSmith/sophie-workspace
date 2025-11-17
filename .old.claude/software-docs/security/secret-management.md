# Secret Management Guide

## Overview

This guide outlines best practices for managing secrets, API keys, tokens, and other sensitive information in the SlideHeroes codebase. We use **TruffleHog** for automated secret detection to prevent accidental exposure of sensitive data.

## 🚨 Golden Rules

1. **NEVER commit secrets to Git** - Not even temporarily
2. **Use environment variables** - All secrets should be in `.env` files
3. **Follow the naming convention** - Use descriptive, uppercase names
4. **Rotate compromised secrets immediately** - If exposed, assume compromised
5. **Use separate keys for each environment** - Dev, staging, and production

## 🔒 Secret Detection System

### Automated Scanning

We use TruffleHog to scan for secrets in three places:

1. **Pre-commit hooks** - Scans staged files before commit
2. **Pull Request checks** - Blocks PRs containing secrets
3. **Weekly full scans** - Comprehensive history scanning

### What Gets Scanned

TruffleHog looks for patterns including:

- API keys (OpenAI, Anthropic, Stripe, etc.)
- Database passwords and connection strings
- JWT tokens and service keys
- Private keys and certificates
- Generic high-entropy strings

Configuration: `.trufflehog/config.yaml`

## 📝 Environment Variables

### Naming Convention

```bash
# Service Keys
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
PORTKEY_API_KEY=

# Database
DATABASE_URL=
POSTGRES_PASSWORD=

# Public Keys (safe to expose)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

### File Structure

```
.env                    # Shared development defaults
.env.local              # Local overrides (gitignored)
.env.production         # Production values (in CI/CD)
.env.example            # Template with dummy values
```

### Creating .env.example

Always provide an example file with dummy values:

```bash
# .env.example
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
STRIPE_SECRET_KEY=sk_test_XXXXXXXXXXXXXXXXXXXXXXXX
OPENAI_API_KEY=sk-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

## 🛡️ Best Practices

### 1. Use Server Actions for API Calls

```typescript
// ❌ BAD: Exposing API key in client
const response = await fetch('https://api.service.com', {
  headers: {
    'Authorization': `Bearer ${process.env.API_KEY}` // This exposes the key!
  }
});

// ✅ GOOD: Use server action
export async function fetchData() {
  'use server';
  
  const response = await fetch('https://api.service.com', {
    headers: {
      'Authorization': `Bearer ${process.env.API_KEY}`
    }
  });
  
  return response.json();
}
```

### 2. Validate Environment Variables

```typescript
// packages/env/index.ts
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  OPENAI_API_KEY: z.string().startsWith('sk-'),
});

export const env = envSchema.parse(process.env);
```

### 3. Use GitHub Secrets for CI/CD

Store production secrets in GitHub:

1. Go to Settings → Secrets and variables → Actions
2. Add each secret with the same name as in `.env`
3. Reference in workflows:

```yaml
env:
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
  STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
```

### 4. Separate Keys by Environment

```typescript
// Bad: Same key everywhere
const stripeKey = process.env.STRIPE_SECRET_KEY;

// Good: Environment-specific
const stripeKey = process.env.NODE_ENV === 'production'
  ? process.env.STRIPE_SECRET_KEY_PROD
  : process.env.STRIPE_SECRET_KEY_TEST;
```

## 🚫 Handling False Positives

If TruffleHog flags a false positive:

1. **Verify it's actually false** - Double-check it's not a real secret
2. **Add to .secretsignore** - Include the pattern or file
3. **Document why** - Add a comment explaining the exclusion

Example `.secretsignore` entry:

```bash
# Example API key in documentation
docs/api-examples.md:42:sk_test_example123

# Test fixtures with dummy keys
**/__tests__/fixtures/**
```

## 🔄 Secret Rotation

### When to Rotate

- After any potential exposure
- Regular schedule (quarterly recommended)
- When team members leave
- After security incidents

### Rotation Process

1. **Generate new secret** in the service dashboard
2. **Update in all environments** (local, staging, production)
3. **Deploy changes** to use new secret
4. **Revoke old secret** after confirming deployment
5. **Update documentation** if needed

## 🚨 If a Secret is Exposed

1. **Rotate immediately** - Don't wait, assume it's compromised
2. **Check logs** - Look for unauthorized usage
3. **Update all environments** - Ensure the old key can't be used
4. **Review Git history** - Remove from history if needed:

```bash
# Use BFG Repo-Cleaner for removing secrets from history
bfg --delete-files .env
bfg --replace-text passwords.txt
git push --force
```

5. **Document the incident** - Learn from it

## 🧪 Testing with Secrets

### Use Test Keys

Most services provide test/sandbox keys:

- Stripe: `sk_test_*` and `pk_test_*`
- Supabase: Separate project for testing
- OpenAI: Use playground or test quota

### Mock in Tests

```typescript
// __tests__/api.test.ts
vi.mock('@/lib/env', () => ({
  env: {
    STRIPE_SECRET_KEY: 'sk_test_mock_key_for_testing',
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test'
  }
}));
```

## 📋 Checklist for Developers

Before committing:

- [ ] No hardcoded secrets in code
- [ ] All secrets in environment variables
- [ ] `.env.local` is in `.gitignore`
- [ ] Created/updated `.env.example` with dummy values
- [ ] Tested with `git diff` to ensure no secrets
- [ ] Run `./scripts/git/trufflehog-scan.sh` manually if unsure

## 🔗 Resources

- [TruffleHog Documentation](https://github.com/trufflesecurity/trufflehog)
- [GitHub Secrets Management](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [12 Factor App - Config](https://12factor.net/config)

## 🤖 Automated Tools

### Pre-commit Hook

Automatically scans staged files:

```bash
# Runs via Husky and lint-staged
pnpm install
git add .
git commit -m "feat: add new feature" # TruffleHog runs here
```

### CI/CD Integration

Every PR is scanned:

- **PR Validation**: `.github/workflows/pr-validation.yml`
- **Secret Scanning**: `.github/workflows/trufflehog-scan.yml`
- **Weekly Scans**: Automated Sunday 2 AM UTC

### Manual Scan

Run a manual scan anytime:

```bash
# Scan current directory
trufflehog filesystem . --config=.trufflehog/config.yaml

# Scan specific file
trufflehog filesystem path/to/file.ts

# Scan git history
trufflehog git file://. --since-commit HEAD~10
```

---

Remember: **When in doubt, don't commit it!** Ask the team if you're unsure whether something is sensitive.
