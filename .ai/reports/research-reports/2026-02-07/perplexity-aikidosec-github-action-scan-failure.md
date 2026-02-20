# Perplexity Research: AikidoSec GitHub Actions Workflow Scan Failure

**Date**: 2026-02-07
**Agent**: perplexity-expert
**Search Type**: Chat API (sonar-pro) + Search API

## Query Summary

Investigated the AikidoSec/github-actions-workflow scan failure with error `start scan failed: {"status_code":400,"reason_phrase":"read"}` when using `@v1.0.13`. Research covered: known issues, latest versions, error meaning, and recommended fixes/workarounds.

## Findings

### 1. Known Issues & Repository Status

The `AikidoSec/github-actions-workflow` repository is **effectively deprecated**. Key indicators:

- **Official deprecation warning** in the README (added May 8, 2025): "We do not recommend using this functionality anymore, but to use the PR gating via the Aikido Dashboard instead. It does not use CI minutes, has improved bulk PR management and is less error-prone."
- The Issues tab shows only **1 open issue** (at time of search), and the repo has minimal community activity (16 stars, 0 watchers, 5 forks).
- No public issues specifically matching the `status_code:400, reason_phrase:"read"` error were found, suggesting this may be an API-side change or intermittent service issue rather than a widely-reported bug.

### 2. Version Status - v1.0.13 is NOT the Latest

**v1.0.13 is significantly outdated.** While the GitHub Marketplace still shows v1.0.13 as "Latest" for the action listing, the **actions/action-versions** repository shows the actual GitHub-side releases have continued separately. More importantly:

- **v1.0.13** was released **May 10, 2024** (nearly 2 years ago)
- The repository's last commit was **May 8, 2025** (the deprecation warning)
- No new functional releases have been published since v1.0.13
- The action is effectively abandoned in favor of dashboard-based PR gating

**Important**: v1.0.13 IS the last release of this particular action - but AikidoSec has moved to entirely different integration methods rather than updating this action.

### 3. Error Analysis: `{"status_code":400,"reason_phrase":"read"}`

The error means:

- **`status_code: 400`** = HTTP 400 Bad Request from Aikido's backend scan initiation API
- **`reason_phrase: "read"`** = This is an unusual HTTP reason phrase. Standard HTTP 400 uses "Bad Request". The `"read"` phrase likely indicates one of:
  - **API-side validation failure**: The Aikido API rejected the scan request because the secret key only has "read" permissions and lacks scan initiation capabilities
  - **Expired or invalid secret key**: The `AIKIDO_SECRET_KEY` may have been rotated, expired, or the associated CI integration was reconfigured in the Aikido dashboard
  - **API contract change**: Since the action hasn't been updated since May 2024, Aikido may have changed their API contract, and the old action payload format is no longer accepted
  - **Transient API issue**: Aikido's backend may have experienced a temporary issue

**Most likely cause**: Since AikidoSec deprecated this action and recommends dashboard-based PR gating instead, they may have changed their API in ways that break the old GitHub Action. The `"read"` reason phrase suggests the API key or endpoint may have been downgraded to read-only access as part of the deprecation process.

### 4. Recommended Fixes & Workarounds

#### Option A: Migrate to Aikido Dashboard PR Gating (Recommended)

AikidoSec's officially recommended approach. This eliminates the GitHub Action entirely.

**Setup Steps:**
1. Go to Aikido Dashboard > **Integrations > PR Quality Gating**
2. Select **GitHub** and choose "PR Gating Configuration Via Aikido Dashboard"
3. Install the **Aikido PR Checks app** on your GitHub organization
4. Configure repos and severity thresholds in the Aikido interface
5. Remove the `AikidoSec/github-actions-workflow` step from your CI workflow

**Benefits:**
- Does NOT consume CI minutes
- Improved bulk PR management
- Less error-prone than the GitHub Action
- Granular per-repo configuration
- Supports SCA, SAST, IaC, Secrets, Malware, and License scanning

**Dashboard URL**: https://help.aikido.dev/pr-and-release-gating/aikido-ci-gating-functionality

#### Option B: Use `@aikidosec/ci-api-client` CLI (For Custom CI Needs)

If you need programmatic CI integration rather than dashboard-managed:

```yaml
# GitHub Actions workflow using CLI instead
name: Aikido Security
on:
  pull_request:
    branches: ['*']

jobs:
  aikido-scan:
    runs-on: ubuntu-latest
    steps:
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '22'

      - name: Install Aikido CI Client
        run: npm install --global @aikidosec/ci-api-client

      - name: Run Aikido Scan
        run: |
          aikido-api-client scan \
            ${{ github.event.repository.name }} \
            ${{ github.event.pull_request.base.sha }} \
            ${{ github.event.pull_request.head.sha }} \
            --apikey ${{ secrets.AIKIDO_CLIENT_API_KEY }} \
            --fail-on-sast-scan \
            --minimum-severity-level CRITICAL
```

**NPM Package**: https://www.npmjs.com/package/@aikidosec/ci-api-client

**Note**: This requires a different API key (`AIKIDO_CLIENT_API_KEY`) from the CI integrations page, not the same `AIKIDO_SECRET_KEY` used by the deprecated action.

#### Option C: Immediate Workaround (Temporary)

If you need to unblock CI immediately while planning migration:

1. **Regenerate the secret key** in Aikido Dashboard > CI Integrations settings
2. Update `AIKIDO_SECRET_KEY` in GitHub repository secrets
3. **Re-run the workflow** - the error may be transient
4. If still failing, set `fail-on-timeout: false` temporarily to prevent CI blocking while you migrate

#### Option D: Make the Step Non-Blocking (Quick Fix)

Add `continue-on-error: true` to prevent the AikidoSec step from blocking your CI:

```yaml
- name: Detect new vulnerabilities
  uses: AikidoSec/github-actions-workflow@v1.0.13
  continue-on-error: true
  with:
    secret-key: ${{ secrets.AIKIDO_SECRET_KEY }}
    fail-on-timeout: true
    fail-on-dependency-scan: true
    fail-on-sast-scan: false
    fail-on-iac-scan: false
```

## Sources & Citations

- [AikidoSec/github-actions-workflow Repository](https://github.com/AikidoSec/github-actions-workflow) - Main repo with deprecation warning
- [Aikido Security GitHub Action - Marketplace](https://github.com/marketplace/actions/aikido-security-github-action) - v1.0.13 listed as latest
- [PR Gating Overview - Aikido Help](https://help.aikido.dev/pr-and-release-gating/aikido-ci-gating-functionality) - Dashboard PR gating docs
- [GitHub CI: PR Gating via Aikido Dashboard](https://help.aikido.dev/doc/github-ci-pr-gating-via-aikido-dashboard/docZayPeps1j) - Migration setup guide
- [@aikidosec/ci-api-client - npm](https://www.npmjs.com/package/@aikidosec/ci-api-client) - CLI alternative
- [GitHub Action Setup for Aikido CLI: Release Gating](https://help.aikido.dev/pr-and-release-gating/cli-for-pr-and-release-gating/github-action-setup-for-aikido-cli-release-gating) - CLI workflow example

## Key Takeaways

- **The GitHub Action is deprecated** - AikidoSec added an official deprecation warning in May 2025 and has not released updates since May 2024
- **v1.0.13 is the final release** - No newer version exists or will exist; the product direction has shifted
- **The 400 error with "read" reason** is most likely caused by API changes on Aikido's backend that break the old action, or an expired/misconfigured secret key
- **Migrate to Aikido Dashboard PR Gating** - This is AikidoSec's recommended replacement, saves CI minutes, and provides better management
- **Alternative**: Use `@aikidosec/ci-api-client` npm package for programmatic CI integration
- **Quick unblock**: Add `continue-on-error: true` to the step, or regenerate the secret key

## Related Searches

- Aikido local scanner setup for GitHub Enterprise (on-prem alternative)
- Aikido CI API client advanced configuration
- Comparing Aikido Dashboard PR Gating vs GitHub Action approach
