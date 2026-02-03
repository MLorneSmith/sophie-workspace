# Context7 Research: RunsOn GitHub App Installation

**Date**: 2026-02-03
**Agent**: context7-expert
**Libraries Researched**: runs-on/runs-on, websites/runs-on

## Query Summary
User moved repository from personal GitHub account to 'slideheroes' organization and RunsOn runners are not picking up jobs. Need GitHub App installation URL and configuration steps for new organization.

## Findings

### RunsOn GitHub App Installation

RunsOn uses a **private GitHub App** that is created during the CloudFormation stack deployment. This is NOT a public GitHub App from the marketplace - each RunsOn installation creates its own GitHub App specific to that AWS deployment.

#### Key Points

1. **Private GitHub App**: When you deploy RunsOn via CloudFormation, it creates a private GitHub App registered to your AWS account
2. **Organization-Specific**: The GitHub App must be installed on each GitHub organization/account that needs to use the runners
3. **Installation via CloudFormation Outputs**: The GitHub App installation URL is available in the CloudFormation stack outputs

### How to Add RunsOn to a New Organization

#### Step 1: Get the GitHub App Installation URL

From the CloudFormation stack that was used for the original deployment:

```bash
aws cloudformation describe-stacks \
  --stack-name runs-on-prod \
  --region us-east-1 \
  --query "Stacks[0].Outputs[?OutputKey=='GitHubAppInstallUrl' || OutputKey=='RunsOnEntryPoint'].[OutputKey,OutputValue]" \
  --output table
```

Alternatively, access the RunsOn dashboard (the `RunsOnEntryPoint` URL from outputs) and find the GitHub App installation link there.

#### Step 2: Install the App on the New Organization

1. Navigate to the GitHub App installation URL from the CloudFormation outputs
2. Select "slideheroes" organization
3. Choose either "All repositories" or select specific repositories
4. Click "Install"

#### Step 3: Update CloudFormation Stack (if needed)

If your CloudFormation stack was configured for a specific organization, you may need to update the `GithubOrganization` parameter:

```bash
aws cloudformation update-stack \
  --stack-name runs-on-prod \
  --region us-east-1 \
  --use-previous-template \
  --parameters \
    ParameterKey=GithubOrganization,ParameterValue=slideheroes \
    ParameterKey=LicenseKey,UsePreviousValue=true \
    ParameterKey=EmailAddress,UsePreviousValue=true
```

**Note**: If you want to support multiple organizations, you may need to configure the stack differently or deploy separate stacks.

### Configuration Changes When Transferring Repos

#### 1. GitHub App Installation
- The GitHub App must be installed on the destination organization
- Repository access must be granted (all repos or specific repos)

#### 2. Repository Configuration File
The `.github/runs-on.yml` file in your repository should continue to work, but verify:

```yaml
# .github/runs-on.yml
runners:
  default:
    image: ubuntu24-full-x64
    cpu: 2
    ram: 8
```

#### 3. Workflow Files
Check that your workflow `runs-on` labels match your RunsOn configuration:

```yaml
jobs:
  build:
    runs-on: runs-on,runner=2cpu-linux-x64,env=production
```

#### 4. Environment Configuration
If using environments, ensure they match:

```yaml
runs-on: runs-on,env=production
```

### Troubleshooting Steps

1. **Verify GitHub App Installation**
   - Go to `https://github.com/organizations/slideheroes/settings/installations`
   - Confirm RunsOn app is listed
   - Check repository access permissions

2. **Check CloudWatch Logs**
   ```bash
   awslogs get --aws-region us-east-1 /aws/apprunner/RunsOnService-xxx/yyy/application -w -s 30m --timestamp
   ```

3. **Verify Webhook Delivery**
   - Go to GitHub App settings > Advanced > Recent Deliveries
   - Check for failed webhook deliveries

4. **Check Stack Status**
   ```bash
   aws cloudformation describe-stacks \
     --stack-name runs-on-prod \
     --region us-east-1 \
     --query "Stacks[0].{Status:StackStatus}"
   ```

## Key Takeaways

- RunsOn uses a **private GitHub App** created during CloudFormation deployment, not a public marketplace app
- The GitHub App installation URL is found in **CloudFormation stack outputs**
- When moving to a new organization, you must **install the GitHub App** on that organization
- You may need to **update the CloudFormation stack** if the `GithubOrganization` parameter was set to the old account
- The `.github/runs-on.yml` and workflow files should work after app installation

## Relevant URLs

- RunsOn Installation Guide: https://runs-on.com/guides/install/
- GitHub App Permissions: https://runs-on.com/configuration/updating-github-app-permissions/
- Troubleshooting: https://runs-on.com/guides/troubleshoot/
- Stack Configuration: https://runs-on.com/configuration/stack-config/

## Sources

- runs-on/runs-on via Context7 (runs-on/runs-on)
- RunsOn Website via Context7 (websites/runs-on)
