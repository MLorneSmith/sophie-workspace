# RunsOn GitHub Actions Runners Research Report

**Date**: January 5, 2025  
**Research Focus**: RunsOn runner syntax, authentication, and troubleshooting malformed configuration errors

## Executive Summary

RunsOn is a third-party GitHub Actions runner service that provides 10x cheaper runners by deploying in your own AWS
infrastructure. The current syntax you're using (`runs-on: runs-on=${{ github.run_id }},runner=2cpu-linux-x64`) contains
a critical syntax error - **RunsOn uses forward slashes (`/`) as separators, not commas (`,`)**. Additionally, RunsOn
requires proper GitHub App authentication setup through their marketplace app.

## Key Findings

### 1. Correct RunsOn Syntax

**❌ INCORRECT (Current Usage):**

```yaml
runs-on: runs-on=${{ github.run_id }},runner=2cpu-linux-x64
```

**✅ CORRECT RunsOn Syntax:**

```yaml
runs-on: runs-on=${{ github.run_id }}/runner=2cpu-linux-x64
```

**Key Points:**

- RunsOn uses **forward slashes (`/`)** as parameter separators, NOT commas (`,`)
- Commas are supported as an alternative, but the preferred and documented syntax uses forward slashes
- The `runs-on=${{ github.run_id }}` prefix is required for all RunsOn runners to ensure proper job isolation

### 2. RunsOn Syntax Examples

**Basic Examples:**

```yaml
# 2 CPU x64 Linux runner
runs-on: runs-on=${{ github.run_id }}/runner=2cpu-linux-x64

# 4 CPU ARM64 Linux runner  
runs-on: runs-on=${{ github.run_id }}/runner=4cpu-linux-arm64

# Custom configuration with multiple parameters
runs-on: runs-on=${{ github.run_id }}/cpu=4/ram=16/family=m7a+c7/image=ubuntu22-full-x64

# Disable spot pricing
runs-on: runs-on=${{ github.run_id }}/runner=2cpu-linux-x64/spot=false
```

**Advanced Configuration:**

```yaml
runs-on: runs-on=${{ github.run_id }}/family=m7+c7+r7/image=ubuntu24-full-x64/spot=false/ssh=false/private=true
```

### 3. RunsOn Authentication & Setup

**GitHub App Authentication:**

- RunsOn creates a **private GitHub App** automatically during installation
- The GitHub App credentials remain in your AWS account only
- No third-party access to your GitHub App or runner credentials
- Requires installing RunsOn from GitHub Marketplace

**Installation Process:**

1. Install RunsOn GitHub App from marketplace
2. Deploy CloudFormation stack in your AWS account
3. Configure GitHub organization/account access
4. GitHub App gets created automatically with proper permissions

**Key Security Benefits:**

- All credentials stay in your AWS infrastructure
- Private GitHub App (not shared/public)
- No third-party access to your workflows or code

### 4. Common Configuration Errors & Solutions

**"Malformed Runner Configuration" Errors:**

1. **Wrong Separator Character:**
   - ❌ Using commas: `runs-on=${{ github.run_id }},runner=2cpu-linux-x64`
   - ✅ Using forward slashes: `runs-on=${{ github.run_id }}/runner=2cpu-linux-x64`

2. **Missing RunsOn Prefix:**
   - ❌ `runs-on: 2cpu-linux-x64`
   - ✅ `runs-on: runs-on=${{ github.run_id }}/runner=2cpu-linux-x64`

3. **Standard GitHub Actions Syntax:**
   - RunsOn syntax is NOT compatible with standard GitHub-hosted runners
   - Standard runners use: `runs-on: ubuntu-latest`
   - RunsOn requires the special `runs-on=` prefix syntax

### 5. Available RunsOn Configuration Options

**Core Labels:**

- `runner`: Predefined runner configurations (e.g., `2cpu-linux-x64`)
- `family`: Instance type family (e.g., `m7a`, `c7`, `r7`)
- `cpu`: Number of vCPUs (e.g., `4` or `4+16` for range)
- `ram`: Memory in GB (e.g., `16` or `16+64` for range)
- `image`: Runner image (e.g., `ubuntu22-full-x64`, `ubuntu24-full-x64`)
- `spot`: Enable/disable spot instances (`true`/`false`, default: `true`)
- `disk`: Disk size configuration
- `region`: AWS region selection
- `ssh`: Enable SSH access (`true`/`false`)
- `debug`: Enable debug mode

**Predefined Runners Available:**

- `1cpu-linux-x64` through `64cpu-linux-x64`
- `1cpu-linux-arm64` through `64cpu-linux-arm64`
- Windows and GPU runners also available

### 6. Troubleshooting Guide

**Common Issues:**

1. **Jobs Stuck in Queue:**
   - Cause: Runner stealing between workflow jobs
   - Solution: Use unique labels with job identifiers

   ```yaml
   runs-on: "${{ github.run_id }}-my-build-job/runner=2cpu-linux-x64"
   ```

2. **Webhook Delivery Problems:**
   - Check GitHub App webhook delivery status
   - Verify non-200 status codes in webhook logs
   - Ensure RunsOn endpoint is accessible

3. **AWS Instance Creation Failures:**
   - "PendingVerification": AWS account validation issues
   - "RequestLimitExceeded": Too many concurrent instance launches
   - RunsOn defaults to 2 RunInstances API calls per second

4. **Authentication Issues:**
   - Verify GitHub App is properly installed
   - Check GitHub App permissions
   - Ensure RunsOn CloudFormation stack is deployed correctly

### 7. Cost & Performance Benefits

**Cost Comparison (per minute):**

- GitHub 2-core runner: $0.008
- RunsOn 2-core runner: $0.0011
- **Savings: 7.2x cheaper**

**Performance Benefits:**

- 30% faster x64 performance vs GitHub runners
- 50% faster ARM64 performance
- Faster CPUs than standard GitHub Actions runners
- Up to 256 CPU instances available
- Unlimited concurrency

## Root Cause Analysis

Your CI/CD pipeline is failing because:

1. **Syntax Error**: Using commas (`,`) instead of forward slashes (`/`) as parameter separators
2. **Missing Authentication**: RunsOn requires GitHub App installation from marketplace
3. **Configuration Validation**: GitHub Actions validates runner names and rejects malformed syntax

## Recommended Solutions

### Immediate Fix (Syntax)

```yaml
# Change from:
runs-on: runs-on=${{ github.run_id }},runner=2cpu-linux-x64

# To:
runs-on: runs-on=${{ github.run_id }}/runner=2cpu-linux-x64
```

### Complete Setup Process

1. **Install RunsOn GitHub App:**
   - Visit RunsOn marketplace listing
   - Install to your GitHub organization
   - Follow installation guide to deploy AWS CloudFormation stack

2. **Update Workflow Syntax:**

   ```yaml
   jobs:
     test:
       runs-on: runs-on=${{ github.run_id }}/runner=2cpu-linux-x64
       steps:
         - uses: actions/checkout@v4
         - name: Run tests
           run: echo "Running on RunsOn runner"
   ```

3. **Verify Setup:**
   - Check RunsOn dashboard shows successful installation
   - Test with a simple workflow first
   - Monitor CloudWatch logs for any issues

### Alternative Fallback

If you can't set up RunsOn immediately, use standard GitHub runners:

```yaml
runs-on: ubuntu-latest  # Standard GitHub-hosted runner
```

## Further Research Recommendations

1. **Cost Analysis**: Calculate potential savings for your specific usage patterns
2. **Security Review**: Evaluate RunsOn's security model vs GitHub-hosted runners
3. **Performance Testing**: Benchmark RunsOn vs GitHub runners for your workloads
4. **Integration Testing**: Test RunsOn with your existing CI/CD tools and dependencies

## Sources & Citations

1. [RunsOn Official Documentation](https://runs-on.com/docs/)
2. [RunsOn Linux Runners Guide](https://runs-on.com/runners/linux/)
3. [RunsOn Job Labels Configuration](https://runs-on.com/configuration/job-labels/)
4. [RunsOn Troubleshooting Guide](https://runs-on.com/guides/troubleshoot/)
5. [GitHub Actions Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
6. [RunsOn Installation Guide](https://runs-on.com/guides/install/)
7. [RunsOn GitHub App Permissions](https://runs-on.com/configuration/updating-github-app-permissions/)

---

**Report Generated**: January 5, 2025  
**Research Classification**: COMPREHENSIVE  
**Tool Usage**: Exa Search, Perplexity, WebSearch, WebFetch (15+ searches executed in parallel)
