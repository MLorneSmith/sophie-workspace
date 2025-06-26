# Snyk Security Scanning Setup Guide

This guide helps you set up Snyk for local development to match our CI/CD security requirements.

## Overview

Our project uses Snyk for security vulnerability scanning in both local development and CI/CD
pipelines. This ensures that security issues are caught early in the development process.

### CI/CD Configuration

Our CI/CD pipeline (`.github/workflows/pr-validation.yml`) is configured with:

- **Severity Threshold**: `high` (only high and critical vulnerabilities fail the build)
- **Fail On**: `upgradable` (fails when vulnerabilities have available fixes)
- **Products**: Snyk Open Source (dependencies) and Snyk Code (SAST)

## Prerequisites

- Node.js 20+ and pnpm installed
- A Snyk account (free tier is sufficient for most use cases)
- Access to the project repository

## Installation

Snyk CLI is already installed as a dev dependency in the project. To verify:

```bash
pnpm list snyk
```

## Authentication Setup

### 1. Get Your Snyk Token

Option A: Using the CLI (Recommended)

```bash
pnpm audit:auth
```

This will open your browser to authenticate with Snyk.

Option B: Manual token retrieval

1. Visit [https://app.snyk.io/account](https://app.snyk.io/account)
2. Copy your API token
3. Add it to your `.env` file:

   ```env
   SNYK_TOKEN=your_token_here
   ```

### 2. Authenticate Locally

```bash
# Load token from .env and authenticate
export $(grep SNYK_TOKEN .env | xargs) && snyk auth $SNYK_TOKEN
```

You should see: "Your account has been authenticated. Snyk is now ready to be used."

## Available Commands

We've configured several npm scripts for easy Snyk usage:

### Basic Security Audit

```bash
pnpm audit
```

Runs Snyk test on all projects with high severity threshold (matching CI/CD).

### Fix Vulnerabilities

```bash
pnpm audit:fix
```

Launches the Snyk wizard to help fix vulnerabilities interactively.

### Monitor Dependencies

```bash
pnpm audit:monitor
```

Sends a snapshot of your dependencies to Snyk for ongoing monitoring.

### Debug Mode

```bash
pnpm audit:debug
```

Runs Snyk with debug output for troubleshooting issues.

## Project Configuration

### .snyk Policy File

The `.snyk` file in the root directory configures:

- Exclusion patterns for test files and generated code
- Vulnerability ignore rules (use sparingly with justification)
- Project-specific settings

Key exclusions:

- Build outputs (`dist/`, `build/`, `.next/`)
- Test directories (`**/test/**`, `**/tests/**`)
- Development tools (`.storybook/`, `tooling/`)
- Documentation (`docs/`, `**/*.md`)

### Monorepo Support

Snyk automatically detects and scans all packages in our pnpm workspace:

- Root `package.json`
- All apps (`apps/*`)
- All packages (`packages/*`)
- Tooling packages (`tooling/*`)

## Usage in Development Workflow

### 1. Before Committing

Run a security check to catch issues early:

```bash
pnpm audit
```

### 2. When Adding Dependencies

After adding new dependencies, always check for vulnerabilities:

```bash
pnpm install some-package
pnpm audit
```

### 3. Handling Vulnerabilities

When vulnerabilities are found:

1. **Check if fixes are available**:

   ```bash
   pnpm audit:fix
   ```

2. **For vulnerabilities without fixes**:

   - Evaluate the risk
   - Consider alternative packages
   - If risk is acceptable, document in `.snyk` file with justification

3. **For false positives**:
   - Add to `.snyk` ignore list with clear explanation
   - Set expiration date for re-evaluation

## CI/CD Integration

Our GitHub Actions workflow automatically:

1. Runs `snyk test` on all pull requests
2. Fails builds for high/critical vulnerabilities with available fixes
3. Runs Snyk Code for static application security testing (SAST)
4. Uploads results as SARIF for GitHub Security tab integration

## Troubleshooting

### Common Issues

1. **Authentication Errors**

   - Ensure `SNYK_TOKEN` is set correctly in `.env`
   - Re-authenticate: `pnpm audit:auth`

2. **Timeout Issues**

   - Large monorepos may take time to scan
   - Use `--timeout=600000` for 10-minute timeout

3. **False Positives**

   - Review the vulnerability details
   - Check if it affects your usage
   - Document ignores in `.snyk` with justification

4. **pnpm Workspace Issues**
   - Ensure you're using pnpm v9.12.0 or later
   - Run `pnpm install` to update lockfile

### Debug Commands

```bash
# Check Snyk version
snyk --version

# Test authentication
snyk auth test

# Scan specific package
cd packages/specific-package
snyk test

# Get detailed vulnerability info
snyk test --json > snyk-report.json
```

## Best Practices

1. **Regular Scanning**: Run `pnpm audit` before each commit
2. **Stay Updated**: Keep dependencies updated to get security fixes
3. **Document Ignores**: Always provide clear reasons when ignoring vulnerabilities
4. **Monitor Production**: Use `pnpm audit:monitor` for production branches
5. **Review Reports**: Check Snyk dashboard for trends and new vulnerabilities

## Resources

- [Snyk CLI Documentation](https://docs.snyk.io/snyk-cli)
- [Snyk pnpm Support](https://docs.snyk.io/scan-applications/snyk-open-source/snyk-open-source-supported-languages-and-package-managers/javascript/pnpm)
- [Project Dashboard](https://app.snyk.io) (requires authentication)
- [Security Policy](./../SECURITY.md)

## Support

For issues or questions:

1. Check this guide and troubleshooting section
2. Review CI/CD logs for configuration reference
3. Contact the security team or DevOps for assistance
