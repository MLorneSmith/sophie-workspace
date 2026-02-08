# Perplexity Research: Aikido Security GitHub Actions 402 Error

**Date**: 2026-01-22
**Agent**: perplexity-expert
**Search Type**: Chat API + Search API (combined)

## Query Summary

Researched Aikido Security GitHub Actions 402 error, focusing on:
1. What the 402 error means for Aikido GitHub Actions
2. Whether the free tier has changed recently
3. How to properly configure Aikido action to avoid paid feature errors
4. GitHub issues or discussions about this error

## Findings

### 1. What the 402 Error Means

The HTTP 402 "Payment Required" error in the Aikido Security GitHub Action indicates that your account is attempting to use features that require a paid plan. This error occurs when:

- **Attempting to use SAST scanning** (`fail-on-sast-scan: true`) on a free tier account
- **Attempting to use IaC scanning** (`fail-on-iac-scan: true`) on a free tier account
- Your Aikido account lacks sufficient credits or has exceeded usage limits
- Your subscription has expired or requires renewal

### 2. Free Tier vs Paid Features

**Free Tier Includes:**
- Dependency scanning (SCA - Software Composition Analysis)
- CVE detection for open source dependencies
- Basic vulnerability reporting

**Paid Plans Required For:**
- **SAST (Static Application Security Testing)** - Code analysis
- **IaC (Infrastructure as Code) scanning** - Terraform, CloudFormation, Kubernetes scanning
- License compliance scanning
- Advanced features like SAST review comments on PRs

### 3. Proper Configuration to Avoid 402 Errors

**Free Tier Configuration (Dependency Scanning Only):**

```yaml
name: Aikido Security
on:
  pull_request:
    branches:
      - '*'

jobs:
  aikido-security:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Detect new vulnerabilities
        uses: AikidoSec/github-actions-workflow@v1.0.13
        with:
          secret-key: ${{ secrets.AIKIDO_SECRET_KEY }}
          fail-on-timeout: true
          fail-on-dependency-scan: true    # FREE - This is supported
          fail-on-sast-scan: false          # PAID - Set to false for free tier
          fail-on-iac-scan: false           # PAID - Set to false for free tier
          minimum-severity: 'CRITICAL'
          timeout-seconds: 180
          post-scan-status-comment: 'off'   # Reduces API calls
          post-sast-review-comments: 'off'  # PAID feature - keep off
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

**Key Configuration Rules:**
| Option | Free Tier | Paid Plan |
|--------|-----------|-----------|
| `fail-on-dependency-scan` | Yes | Yes |
| `fail-on-sast-scan` | **No** (set to `false`) | Yes |
| `fail-on-iac-scan` | **No** (set to `false`) | Yes |
| `post-sast-review-comments` | **No** (set to `'off'`) | Yes |

### 4. Important Deprecation Notice

Aikido Security has added a deprecation warning to their GitHub Action:

> **Warning**: We do not recommend using this functionality anymore, but to use the PR gating via the Aikido Dashboard instead. It does not use CI minutes, has improved bulk PR management and is less error-prone. Check out [Aikido docs](https://docs.aikido.dev) for more information.

**Recommended Alternative:**
- Configure PR gating directly in the Aikido Security Dashboard
- This approach:
  - Does not consume CI minutes
  - Has improved bulk PR management
  - Is less error-prone
  - Provides better integration with Aikido's features

### 5. Aikido Pricing Information (2025/2026)

| Plan | Price | Users | Features |
|------|-------|-------|----------|
| Free (forever) | $0 | Unlimited | Dependency scanning, basic features |
| Basic | $350/month | 10 users | All Free features + more |
| Pro | $700/month | 10 users | All Basic + SAST, IaC |
| Advanced | $1,050/month | 10 users | All Pro + advanced features |
| Enterprise | Custom | Custom | Full feature set |

**Startup Discount**: Up to 30% for companies with <$1.5M funding and <10 team members

### 6. Troubleshooting Steps

If you encounter a 402 error:

1. **Check your Aikido account status** at [aikido.dev](https://aikido.dev)
2. **Verify your plan** includes the features you're using
3. **Update your workflow** to disable paid-only features:
   - Set `fail-on-sast-scan: false`
   - Set `fail-on-iac-scan: false`
   - Set `post-sast-review-comments: 'off'`
4. **Regenerate your API key** if it may have expired
5. **Consider migrating** to Aikido Dashboard PR gating (recommended by Aikido)

## Sources & Citations

- [AikidoSec/github-actions-workflow](https://github.com/AikidoSec/github-actions-workflow) - Official GitHub Action repository
- [Aikido Security GitHub Action Marketplace](https://github.com/marketplace/actions/aikido-security-github-action) - Action documentation
- [Aikido Pricing](https://www.aikido.dev/pricing) - Official pricing page
- [AikidoSec/ci-api-client](https://github.com/AikidoSec/ci-api-client) - CI API client for custom integrations
- [G2 Aikido Security Pricing](https://www.g2.com/products/aikido-security/pricing) - Third-party pricing information

## Key Takeaways

- **402 errors** occur when using paid features (SAST, IaC scanning) on a free tier account
- **Free tier** only supports dependency scanning (`fail-on-dependency-scan`)
- **Set `fail-on-sast-scan: false` and `fail-on-iac-scan: false`** to avoid 402 errors on free tier
- **Aikido recommends migrating** to Dashboard-based PR gating instead of the GitHub Action
- **No recent free tier changes** found - the free tier has consistently been limited to dependency scanning

## Related Searches

- Aikido Security Dashboard PR gating configuration
- Alternatives to Aikido for free SAST scanning
- Snyk vs Aikido free tier comparison
- Open source SAST tools for GitHub Actions
