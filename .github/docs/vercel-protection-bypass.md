# Vercel Deployment Protection Bypass for CI/CD

## Overview

This document explains how Vercel deployment protection works with our CI/CD pipeline and how to configure the
bypass mechanism for automated testing.

## Background

Vercel deployment protection prevents unauthorized access to preview and development deployments. While this is
excellent for security, it can block automated testing in CI/CD workflows. Vercel provides a "Protection Bypass for
Automation" feature to solve this problem.

## How It Works

1. **Protection Types**: Vercel offers three protection methods:
   - Vercel Authentication (default, free)
   - Password Protection (Pro/Enterprise)
   - Trusted IPs (Enterprise)

2. **Bypass Mechanism**: The bypass secret allows CI/CD workflows to access protected deployments using:
   - `x-vercel-protection-bypass` header for API requests
   - `x-vercel-set-bypass-cookie` header to set browser cookies for E2E tests

## Setup Instructions

### 1. Generate the Bypass Secret

1. Navigate to your [Vercel project dashboard](https://vercel.com/dashboard)
2. Go to **Settings → Deployment Protection**
3. Enable **Protection Bypass for Automation**
4. Click **Generate Secret** and copy the value

⚠️ **Important**: Regenerating the secret invalidates all previous deployments. You'll need to redeploy after regeneration.

### 2. Add Secrets to GitHub

Since we have two Vercel projects (Web and Payload), you need to add both secrets:

1. Go to your GitHub repository
2. Navigate to **Settings → Secrets and variables → Actions**
3. Add the Web project secret:
   - Name: `VERCEL_AUTOMATION_BYPASS_SECRET`
   - Value: Paste the secret from Web Vercel project
4. Add the Payload project secret:
   - Name: `VERCEL_AUTOMATION_BYPASS_SECRET_PAYLOAD`
   - Value: Paste the secret from Payload Vercel project
5. Click **Add secret** for each

### 3. Verify Configuration

The following files are configured to use the bypass secret:

- **`.github/workflows/dev-integration-tests.yml`**: Passes the secret to test jobs
- **`apps/e2e/playwright.config.ts`**: Adds bypass headers to all Playwright requests

## Troubleshooting

### Tests Getting 401/403 Errors

**Symptoms**: API calls return 401 Unauthorized or 403 Forbidden

**Solutions**:

1. Verify `VERCEL_AUTOMATION_BYPASS_SECRET` is set in GitHub Secrets
2. Check the secret hasn't been regenerated in Vercel (would require redeployment)
3. Ensure the workflow passes the secret to the test environment

### Playwright Tests Stuck on Auth Page

**Symptoms**: Browser tests redirect to Vercel authentication page

**Solutions**:

1. Confirm `x-vercel-set-bypass-cookie: true` header is set in Playwright config
2. Verify the base URL is correct in test configuration
3. Check that the secret is properly passed to Playwright environment

### GraphQL Introspection Failures

**Symptoms**: GraphQL introspection queries fail with "introspection not allowed"

**Solutions**:

1. Introspection is typically disabled in production/dev deployments
2. Use simple connectivity tests instead of introspection
3. Consider using a dedicated test GraphQL endpoint if introspection is needed

### Connection Timeouts

**Symptoms**: Tests timeout when trying to reach the deployment

**Solutions**:

1. Ensure deployment is fully ready before running tests
2. Check for Cloudflare protection or rate limiting
3. Verify the deployment URL is correct

## Environment Variables

These environment variables are used in our CI/CD pipeline:

| Variable | Description | Where Used |
|----------|-------------|------------|
| `VERCEL_AUTOMATION_BYPASS_SECRET` | The bypass secret from Web Vercel project | GitHub Actions, Playwright |
| `VERCEL_AUTOMATION_BYPASS_SECRET_PAYLOAD` | The bypass secret from Payload Vercel project | GitHub Actions, API tests |
| `PLAYWRIGHT_BASE_URL` | The deployment URL to test against | Playwright tests |
| `PLAYWRIGHT_API_URL` | The API/GraphQL endpoint URL | API tests |

## Best Practices

1. **Secret Rotation**: Plan for periodic secret rotation with coordinated redeployments
2. **Environment Isolation**: Use different secrets for different environments if needed
3. **Monitoring**: Set up alerts for authentication-related test failures
4. **Documentation**: Keep this documentation updated when configuration changes

## Related Files

- Workflow: `.github/workflows/dev-integration-tests.yml`
- Playwright Config: `apps/e2e/playwright.config.ts`
- Test Setup: `apps/e2e/global-setup.ts`

## References

- [Vercel Documentation: Protection Bypass for Automation](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation)
- [Playwright Documentation: Extra HTTP Headers](https://playwright.dev/docs/api/class-testoptions#test-options-extra-http-headers)
- [GitHub Actions: Using Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

## Support

If you encounter issues not covered here:

1. Check the [Vercel documentation](https://vercel.com/docs/deployment-protection)
2. Review recent workflow runs in GitHub Actions
3. Contact the DevOps team for assistance

---

Last updated: September 2025
