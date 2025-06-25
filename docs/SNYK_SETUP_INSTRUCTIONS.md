# Snyk Security Scanning Setup Instructions

This document provides step-by-step instructions to complete the Snyk security scanning integration for the SlideHeroes project.

## Prerequisites

- GitHub repository admin access
- Ability to create external accounts
- Access to repository settings and secrets

## Step 1: Create Snyk Account

1. **Sign up for Snyk**:

   - Go to [https://snyk.io/](https://snyk.io/)
   - Click "Sign up for free"
   - Use your GitHub account for SSO integration (recommended)

2. **Connect GitHub Repository**:

   - After signing up, go to [Snyk Projects](https://app.snyk.io/projects)
   - Click "Add projects"
   - Select "GitHub"
   - Authorize Snyk to access your GitHub repositories
   - Find and select the `2025slideheroes` repository
   - Click "Add selected repositories"

3. **Configure Repository Settings**:
   - Once the repository is imported, click on it in Snyk dashboard
   - Go to "Settings" tab
   - Configure scan frequency (recommended: daily for dependencies, weekly for full scan)
   - Enable "Auto-fix vulnerabilities" if desired
   - Set notification preferences

## Step 2: Generate Snyk API Token

1. **Create API Token**:

   - In Snyk dashboard, click on your profile (top-right)
   - Go to "Account Settings"
   - Navigate to "API Token" section
   - Click "Generate new token"
   - Give it a descriptive name: `slideheroes-github-actions`
   - Copy the token (you won't see it again)

2. **Token Permissions**:
   - The token will have the same permissions as your account
   - Ensure you have "Collaborator" or higher access to the repository in Snyk

## Step 3: Add GitHub Secret

1. **Navigate to Repository Settings**:

   - Go to GitHub repository: `https://github.com/MLorneSmith/2025slideheroes`
   - Click "Settings" tab
   - Click "Secrets and variables" → "Actions"

2. **Add SNYK_TOKEN Secret**:

   - Click "New repository secret"
   - Name: `SNYK_TOKEN`
   - Secret: Paste the API token from Step 2
   - Click "Add secret"

3. **Verify Secret**:
   - The secret should now appear in the list
   - Make sure the name is exactly `SNYK_TOKEN` (case-sensitive)

## Step 4: Test the Integration

1. **Manual Workflow Trigger**:

   - Go to "Actions" tab in GitHub repository
   - Find "Weekly Security Scan" workflow
   - Click "Run workflow" → "Run workflow" to test manually
   - Monitor the workflow execution for any errors

2. **Test PR Integration**:
   - Create a test branch and make a small change to `package.json`
   - Open a pull request
   - Verify that the "Security Scan" job runs in the PR validation workflow
   - Check that the job completes successfully

## Step 5: Configure Snyk Dashboard

1. **Set Up Notifications**:

   - In Snyk dashboard, go to organization settings
   - Configure email notifications for:
     - New high/critical vulnerabilities
     - Weekly summary reports
     - Failed security scans

2. **Configure Integrations**:

   - Enable GitHub integration for:
     - Automatic PR comments for vulnerabilities
     - GitHub Security Advisories sync
     - Dependency upgrade PRs (optional)

3. **Set Up Teams** (if multiple collaborators):
   - Invite team members to Snyk organization
   - Assign appropriate roles and permissions
   - Configure team notification preferences

## Step 6: Verify Security Policy

1. **Review Security Policy**:

   - The security policy was created at `docs/SECURITY.md`
   - Review and customize it for your specific needs
   - Update contact information and procedures as needed

2. **Enable GitHub Security Features**:
   - Go to repository Settings → Security
   - Enable "Vulnerability reporting"
   - Enable "Security advisories"
   - Configure "Code scanning" if not already enabled

## Expected Behavior

After completing setup, you should see:

### ✅ Pull Request Checks

- Security scan runs on every PR with dependency or code changes
- High/critical vulnerabilities block PR merges
- SARIF reports uploaded to GitHub Security tab

### ✅ Weekly Reports

- Automated weekly security scans every Monday 9 AM UTC
- GitHub issues created for any vulnerabilities found
- Comprehensive reports with detailed findings

### ✅ Dashboard Integration

- Real-time vulnerability monitoring in Snyk dashboard
- GitHub Security Advisories integration
- Dependency update recommendations

## Troubleshooting

### Common Issues

1. **"SNYK_TOKEN not found" Error**:

   - Verify the secret name is exactly `SNYK_TOKEN`
   - Check that the token was copied correctly (no extra spaces)
   - Regenerate the token if needed

2. **"Unauthorized" Error**:

   - Verify the Snyk token has correct permissions
   - Check that the repository is properly connected in Snyk dashboard
   - Ensure your Snyk account has access to the repository

3. **Workflow Not Running**:

   - Check the workflow file syntax using GitHub's workflow validator
   - Verify the repository has Actions enabled
   - Check if there are any repository-level restrictions

4. **No Vulnerabilities Detected**:
   - This is good! It means no high/critical vulnerabilities were found
   - You can verify by running a test with a known vulnerable package
   - Check Snyk dashboard for full scan results

### Getting Help

- **Snyk Documentation**: [https://docs.snyk.io/](https://docs.snyk.io/)
- **GitHub Actions Documentation**: [https://docs.github.com/en/actions](https://docs.github.com/en/actions)
- **SlideHeroes Security Policy**: [docs/SECURITY.md](./SECURITY.md)

## Security Best Practices

1. **Token Security**:

   - Never expose the SNYK_TOKEN in logs or code
   - Rotate the token periodically (every 90 days recommended)
   - Use least-privilege principles

2. **Vulnerability Management**:

   - Review and triage all high/critical vulnerabilities within 24-72 hours
   - Test all security updates in staging before production
   - Document any accepted risks with justification

3. **Monitoring**:
   - Set up alerts for security scan failures
   - Review weekly security reports
   - Monitor Snyk dashboard for new vulnerabilities

## Next Steps

After completing the setup:

1. **Test the Complete Flow**:

   - Create a test PR and verify security scanning works
   - Wait for the first weekly report to confirm automation
   - Review the first security findings

2. **Team Training**:

   - Share security policy with development team
   - Train team on vulnerability response procedures
   - Set up regular security review meetings

3. **Continuous Improvement**:
   - Monitor false positive rates and adjust thresholds
   - Regular review of security scanning configuration
   - Keep security documentation updated

---

**Status**: ✅ Implementation Complete - Setup Required  
**Priority**: High - Complete within 24 hours  
**Owner**: Repository Admin  
**Estimated Time**: 30-45 minutes
