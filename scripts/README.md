# Test Scripts

This directory contains test and utility scripts for development purposes.

## Setup

Before running any test scripts, you need to create a `.env.test` file in the root directory with the following variables:

```bash
# Test Environment Variables
# This file contains credentials for local testing only
# These are NOT production credentials

# Local Supabase credentials (from Supabase CLI)
TEST_SUPABASE_URL=http://127.0.0.1:54321
TEST_SUPABASE_SERVICE_ROLE_KEY=your-local-supabase-service-role-key

# PDF.co API key for testing
TEST_PDF_CO_API_KEY=your-test-pdf-co-api-key

# Test user email
TEST_USER_EMAIL=test2@slideheroes.com

# Payload CMS URL for local development
TEST_PAYLOAD_URL=http://localhost:3020
```

## Security Note

The `.env.test` file is excluded from version control. Never commit credentials to the repository.

## Available Scripts

### test-certificate-generation.ts

Tests the certificate generation process by marking all lessons as complete for a test user.

```bash
pnpm tsx scripts/test-certificate-generation.ts
```

### update-test-user-progress.ts

Updates progress for a test user to simulate course completion.

```bash
pnpm tsx scripts/update-test-user-progress.ts
```
