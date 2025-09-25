# Aikido Security Integration Guide

## Overview

This document outlines the Aikido Security integration for the SlideHeroes project, which replaces Snyk due to free
tier limitations.

## Why Aikido Security?

- **Generous Free Tier**: Much more generous limits for small teams compared to Snyk
- **Comprehensive Scanning**: SCA (dependencies), SAST (code), secrets, IaC, and malware detection
- **Privacy-First**: Local scanning options available
- **Easy Integration**: Simple GitHub Actions integration

## Setup Instructions

### 1. Create Aikido Account

1. Sign up at [https://app.aikido.dev/](https://app.aikido.dev/)
2. Connect your GitHub organization/repository
3. Choose the appropriate plan (free tier is sufficient for basic needs)

### 2. Generate API Token

1. Navigate to the Continuous Integration Settings page:
   - Direct URL: [https://app.aikido.dev/settings/integrations/continuous-integration](https://app.aikido.dev/settings/integrations/continuous-integration)
   - Or go to Settings → Integrations → Continuous Integration
2. Click "Generate a token and copy"
3. **IMPORTANT**: Copy the token immediately (you won't be able to see it again)

### 3. Add GitHub Secret

1. Go to your GitHub repository settings
2. Navigate to Secrets and variables > Actions
3. Add a new repository secret:
   - Name: `AIKIDO_SECRET_KEY`
   - Value: [paste the token from step 2]

### 4. Workflow Integration

The integration has been added to the following workflows:

#### PR Validation (`pr-validation.yml`)

- Runs on every pull request
- Blocks PRs with high/critical vulnerabilities
- Posts comments on PRs when new issues are found

#### Weekly Security Scan (`security-weekly-scan.yml`)

- Runs every Monday at 9:00 AM UTC
- Comprehensive scan of all security aspects
- Creates GitHub issues for found vulnerabilities

## Configuration

### PR Validation Settings

```yaml
- uses: AikidoSec/github-actions-workflow@v1.0.13
  with:
    secret-key: ${{ secrets.AIKIDO_SECRET_KEY }}
    fail-on-timeout: true
    fail-on-dependency-scan: true
    fail-on-sast-scan: false # Enable when on paid plan
    fail-on-iac-scan: false # Enable when on paid plan
    minimum-severity: 'HIGH'
    timeout-seconds: 180
    post-scan-status-comment: 'only_if_new_findings'
    github-token: ${{ secrets.GITHUB_TOKEN }}
```

### Configuration Options

- **minimum-severity**: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
- **fail-on-timeout**: Whether to fail if scan times out
- **fail-on-dependency-scan**: Block on dependency vulnerabilities
- **fail-on-sast-scan**: Block on code vulnerabilities (paid feature)
- **fail-on-iac-scan**: Block on infrastructure issues (paid feature)
- **post-scan-status-comment**: `on`, `off`, `only_if_new_findings`

## Monitoring Results

### PR Comments

Aikido will automatically comment on PRs when new security issues are found.

### Aikido Dashboard

View detailed results at [https://app.aikido.dev/](https://app.aikido.dev/)

### GitHub Issues

Weekly scans create GitHub issues with summaries of found vulnerabilities.

## Comparison with Snyk

| Feature              | Snyk (Free) | Aikido (Free) |
| -------------------- | ----------- | ------------- |
| Private repo scans   | 200/month   | Much higher   |
| Dependency scanning  | ✅          | ✅            |
| SAST (code scanning) | Limited     | ✅            |
| Secret scanning      | ❌          | ✅            |
| IaC scanning         | Limited     | ✅            |
| Malware detection    | ❌          | ✅            |
| PR comments          | ✅          | ✅            |
| SARIF upload         | ✅          | ✅            |

## Troubleshooting

### Scan Timeouts

If scans are timing out:

1. Increase `timeout-seconds` in the workflow
2. Check if the repository is too large
3. Consider using local scanning option

### Missing Vulnerabilities

If known vulnerabilities aren't detected:

1. Ensure dependencies are installed before scanning
2. Check minimum severity settings
3. Review Aikido dashboard for detailed results

### Authentication Errors

If you see authentication errors:

1. Verify the `AIKIDO_SECRET_KEY` is set correctly
2. Check if the token has expired
3. Regenerate token if necessary

## Future Enhancements

1. **Enable SAST scanning** when upgrading to paid plan
2. **Enable IaC scanning** for infrastructure security
3. **Configure branch protection** to require Aikido checks
4. **Set up Slack notifications** for critical vulnerabilities

## Resources

- [Aikido Documentation](https://help.aikido.dev/)
- [GitHub Action Documentation](https://github.com/AikidoSec/github-actions-workflow)
- [Aikido Dashboard](https://app.aikido.dev/)
