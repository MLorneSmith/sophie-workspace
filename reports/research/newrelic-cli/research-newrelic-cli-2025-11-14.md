# New Relic CLI - Comprehensive Research Report

**Research Date**: 2025-11-14
**Purpose**: Comprehensive documentation of New Relic CLI capabilities, commands, and integration patterns
**Status**: Complete

---

## Executive Summary

The New Relic CLI is a powerful command-line interface that enables programmatic interaction with New Relic's observability platform. It provides comprehensive functionality for managing APM applications, infrastructure monitoring, entities, workloads, synthetic monitors, and more. The CLI supports multiple output formats (JSON, YAML, Text), profile-based authentication, and integrates seamlessly with CI/CD pipelines for automation.

**Key Strengths**:
- 20+ command categories covering all major New Relic products
- NRQL query execution for flexible data retrieval
- NerdGraph GraphQL API access for advanced operations
- Multi-account management via profiles
- Docker and cross-platform support
- Automation-friendly output formats

---

## Table of Contents

1. [Installation Methods](#installation-methods)
2. [Authentication & Configuration](#authentication--configuration)
3. [Command Structure](#command-structure)
4. [Major Command Categories](#major-command-categories)
5. [NRQL Query Capabilities](#nrql-query-capabilities)
6. [Common Workflows & Use Cases](#common-workflows--use-cases)
7. [Output Formats & Data Handling](#output-formats--data-handling)
8. [Integration Patterns](#integration-patterns)
9. [Limitations & Considerations](#limitations--considerations)
10. [Sources & References](#sources--references)

---

## Installation Methods

The New Relic CLI offers multiple installation options across all major platforms:

### macOS

**Homebrew (Recommended)**:
```bash
brew install newrelic-cli
```

**Automated Install Script**:
```bash
curl -Ls https://download.newrelic.com/install/newrelic-cli/scripts/install.sh | bash
```

### Linux

**Automated Install Script**:
```bash
curl -Ls https://download.newrelic.com/install/newrelic-cli/scripts/install.sh | bash
```

**Snapcraft**:
```bash
sudo snap install newrelic-cli
```

### Windows

**Scoop**:
```bash
scoop bucket add newrelic-cli https://github.com/newrelic/newrelic-cli.git
scoop install newrelic-cli
```

**Chocolatey**:
```bash
choco install newrelic-cli
```

**MSI Installer**:
- Download from official New Relic download site
- Supports silent installation via PowerShell

### Docker

**Official Docker Image**:
```bash
docker pull newrelic/cli:latest

# Example usage
docker run -i --rm -e NEW_RELIC_API_KEY newrelic/cli \
  apm application search --name WebPortal --accountId 2508259
```

### Pre-built Binaries

Available on GitHub releases with PGP signature verification support. Can be installed anywhere in your system's `$PATH`.

### Development Build

**Requirements**:
- Go 1.19+
- GNU Make
- Git

**Build Commands**:
```bash
make build    # Outputs to bin/ARCH/newrelic
make test     # Unit and integration tests
make docs     # Generate documentation
```

---

## Authentication & Configuration

### Required Environment Variables

The New Relic CLI uses environment variables for authentication and configuration:

| Variable | Purpose | Required |
|----------|---------|----------|
| `NEW_RELIC_API_KEY` | User API key (prefix: NRAK) | Yes |
| `NEW_RELIC_ACCOUNT_ID` | Account identifier | Optional (can use flag) |
| `NEW_RELIC_REGION` | Region (US or EU) | Optional (defaults to US) |
| `NEW_RELIC_LICENSE_KEY` | Required for custom events | Context-dependent |
| `HTTPS_PROXY` | Proxy server configuration | Optional |

### Setup Authentication

**Basic Setup**:
```bash
export NEW_RELIC_API_KEY='your-personal-api-key'
export NEW_RELIC_ACCOUNT_ID='your-account-id'
```

**EU Region**:
```bash
export NEW_RELIC_REGION="EU"
```

**Custom Events**:
```bash
export NEW_RELIC_LICENSE_KEY='your-license-key'
```

**Proxy Configuration** (HTTPS only):
```bash
export HTTPS_PROXY=localhost:8888
```

### Profile Management

Profiles store credentials and settings for easy switching between accounts.

**Available Commands**:
- `newrelic profile add` - Create new profile
- `newrelic profile default` - Set default profile
- `newrelic profile delete` - Remove profile
- `newrelic profile list` - Show all profiles

**Profile Usage**:
```bash
# Add a profile
newrelic profile add --profile production --region us --apiKey YOUR_KEY

# Use specific profile
newrelic entity search --profile production --name MyApp

# Set default profile
newrelic profile default --profile production
```

### Configuration Management

**Available Commands**:
- `newrelic config get` - Retrieve configuration values
- `newrelic config list` - Display all settings
- `newrelic config set` - Modify configuration
- `newrelic config reset` - Restore defaults

### Shell Completion

Generate completion functions for your shell:

**Zsh**:
```bash
newrelic completion --shell zsh > /usr/local/share/zsh/functions/_newrelic
```

**Bash/Fish**: Similar pattern with appropriate shell flag

---

## Command Structure

### Global Flags

All commands support these global options:

| Flag | Type | Description |
|------|------|-------------|
| `-a, --accountId` | int | Account ID (overrides `NEW_RELIC_ACCOUNT_ID`) |
| `--debug` | boolean | Enable debug-level logging |
| `--format` | string | Output format: JSON, Text, YAML (default: JSON) |
| `-h, --help` | boolean | Display help information |
| `--plain` | boolean | Compact text output |
| `--profile` | string | Authentication profile to use |
| `--trace` | boolean | Enable trace-level logging |

### Command Patterns

Commands follow consistent naming conventions:
- **describe/get/search** - Retrieve/query operations
- **create** - Create new resources
- **update** - Modify existing resources
- **delete** - Remove resources
- **list** - Show multiple items

### Help System

```bash
newrelic --help                    # Top-level help
newrelic apm --help                # Command category help
newrelic apm deployment --help     # Subcommand help
```

---

## Major Command Categories

### 1. APM (Application Performance Monitoring)

**Parent Command**: `newrelic apm`

**Subcommands**:

**Application Management**:
- `newrelic apm application get` - Retrieve application details
- `newrelic apm application search` - Search for applications

**Example**:
```bash
newrelic apm application get --name WebPortal --accountId 2508259
```

**Deployment Markers**:
- `newrelic apm deployment create` - Create deployment marker
- `newrelic apm deployment delete` - Remove deployment marker
- `newrelic apm deployment list` - Display deployment markers

**Example**:
```bash
newrelic apm deployment create \
  --applicationId 123456 \
  --revision $(git rev-parse HEAD) \
  --description "Release v2.0" \
  --deploymentType BLUE_GREEN
```

**Deployment Options**:
- `--deploymentType`: BASIC, BLUE_GREEN, CANARY, OTHER, ROLLING, SHADOW
- `--description`: Text description
- `--groupId`: Correlate related events
- `--timestamp`: Deployment start time
- `--user`: User who performed deployment

### 2. Entity Management

**Parent Command**: `newrelic entity`

**Subcommands**:

**Entity Search**:
```bash
newrelic entity search [flags]
```

**Search Flags**:
- `-n, --name string` - Match by name
- `-d, --domain string` - Filter by domain
- `-t, --type string` - Match entity types
- `-s, --alert-severity string` - Filter by alert severity
- `--tag string` - Search by tags
- `-r, --reporting string` - Filter by reporting status (true/false)
- `-f, --fields-filter strings` - Restrict returned fields

**Example**:
```bash
newrelic entity search --name MyApp --type APPLICATION --reporting true
```

**Entity Tags**:
- `newrelic entity tags get --guid <guid>` - Retrieve tags
- `newrelic entity tags create` - Create tag:value pairs
- `newrelic entity tags delete` - Delete tags
- `newrelic entity tags delete-values` - Delete tag values
- `newrelic entity tags replace` - Replace all tags

**Tag Examples**:
```bash
# Create tag
newrelic entity tags create --guid ABC123 --tag env:production

# Bulk tagging with jq
newrelic apm application search --accountId 12345 | \
  jq -r '.[].guid' | \
  xargs -I {} newrelic entity tags create -g {} -t env:prod
```

**Entity Deployments**:
- Track deployments associated with entities

### 3. NRQL Queries

**Parent Command**: `newrelic nrql`

**Subcommands**:
- `newrelic nrql query` - Execute NRQL queries

**Required Flags**:
- `--accountId` (or `-a`) - Account to query
- `--query` (or `-q`) - NRQL query string

**Example**:
```bash
newrelic nrql query \
  --accountId 12345678 \
  --query 'SELECT count(*) FROM Transaction TIMESERIES'
```

**Output**: Returns JSON (default), Text, or YAML format

### 4. NerdGraph (GraphQL API)

**Parent Command**: `newrelic nerdgraph`

**Subcommands**:
- `newrelic nerdgraph query` - Execute GraphQL requests

**Purpose**: Direct access to New Relic's GraphQL API for advanced operations not covered by specific CLI commands.

**Example**:
```bash
newrelic nerdgraph query --query '{
  actor {
    user {
      name
      email
    }
  }
}'
```

### 5. Workload Management

**Parent Command**: `newrelic workload`

**Subcommands**:
- `newrelic workload create` - Create New Relic workload
- `newrelic workload delete` - Delete workload
- `newrelic workload duplicate` - Duplicate workload
- `newrelic workload get` - Retrieve workload details
- `newrelic workload list` - List all workloads
- `newrelic workload update` - Update workload

**Example**:
```bash
newrelic workload list --accountId 12345
newrelic workload get --guid ABC123
```

### 6. Synthetics Monitoring

**Parent Command**: `newrelic synthetics`

**Subcommands**:
- `newrelic synthetics monitor get` - Get monitor details
- `newrelic synthetics monitor list` - List all monitors
- `newrelic synthetics monitor search` - Search monitors

**Example**:
```bash
newrelic synthetics monitor list --accountId 12345
```

### 7. Custom Events

**Parent Command**: `newrelic events`

**Subcommands**:
- `newrelic events post` - Send custom events to New Relic

**Requirements**: `NEW_RELIC_LICENSE_KEY` environment variable

**Example**:
```bash
newrelic events post \
  --accountId 12345 \
  --event '{"eventType":"Payment","amount":123.45,"currency":"USD"}'
```

**Event Format**: JSON object with key-value pairs
- Attribute values: string, boolean, or number types

### 8. Agent Utilities

**Parent Command**: `newrelic agent`

**Subcommands**:
- `newrelic agent config` - Configuration utilities

**Configuration Utilities**:
- `migrateV3toV4` - Migrate agent config from v3 to v4
- `obfuscate` - Obfuscate sensitive data

**Example**:
```bash
newrelic agent config obfuscate --value "sensitive-data"
```

### 9. Installation & Setup

**Parent Command**: `newrelic install`

**Purpose**: Automate New Relic agent installation

**Key Flags**:
- `-y, --assumeYes` - Auto-accept all prompts
- `-n, --recipe strings` - Recipe names to install
- `-c, --recipePath strings` - Paths to recipe files
- `--localRecipes string` - Use local recipes
- `--tag string` - Apply tags (key:value format)
- `-t, --testMode` - Test without actual deployment

**Version-Specific Installation**:
```bash
# Install specific infrastructure agent version
newrelic install -n infrastructure-agent-installer@1.65.0

# Install latest (default)
newrelic install -n infrastructure-agent-installer
```

**Note**: Version specification works on Linux and Windows, not macOS.

### 10. API Access Key Management

**Parent Command**: `newrelic apiAccess`

**Subcommands**:
- `newrelic apiAccess apiAccessCreateKeys` - Create API keys (multi-account)
- `newrelic apiAccess apiAccessDeleteKeys` - Delete API keys
- `newrelic apiAccess apiAccessGetKey` - Fetch key by ID and type
- `newrelic apiAccess apiAccessUpdateKeys` - Update keys (multi-account)

**Features**:
- Multi-account support for create/update
- Individual key retrieval
- Batch deletion

### 11. NerdStorage

**Parent Command**: `newrelic nerdstorage`

**Purpose**: Manage NerdStorage documents and collections

**Operations**: Read, write, delete documents and collections

### 12. Reporting

**Parent Command**: `newrelic reporting`

**Purpose**: Report data into New Relic

### 13. Change Tracking

**Parent Command**: `newrelic changeTracking`

**Purpose**: Create change tracking events for performance analysis

**Use Case**: Track deployments, configuration changes, and correlate with performance metrics

### 14. Edge

**Parent Command**: `newrelic edge`

**Purpose**: Interact with New Relic Edge

### 15. Diagnostics

**Parent Command**: `newrelic diagnose`

**Purpose**: Troubleshoot New Relic installation

**Example**:
```bash
newrelic diagnose validate
```

### 16. Utility Commands

**Decode**:
- `newrelic decode entity` - Decode NR1 entities
- `newrelic decode url` - Decode NR1 URL strings

**Documentation**:
- `newrelic documentation` - Generate CLI documentation

**Version**:
- `newrelic version` - Display CLI version

**Completion**:
- `newrelic completion` - Generate shell completion scripts

### 17. Utils

**Parent Command**: `newrelic utils`

**Purpose**: Various utility methods

---

## NRQL Query Capabilities

### NRQL Overview

NRQL (New Relic Query Language) is a SQL-like query language for retrieving detailed observability data. It's similar to ANSI SQL and provides powerful data analysis capabilities.

### Basic Query Structure

```
SELECT function(attribute) [AS 'label'][, ...]
FROM data_type
[WHERE attribute [comparison] [AND|OR ...]]
[FACET attribute | function(attribute)]
[LIMIT number]
[SINCE time]
[UNTIL time]
[WITH TIMEZONE timezone]
[COMPARE WITH time]
[TIMESERIES time]
```

### Core Components

**1. SELECT and FROM** (Required):
```nrql
SELECT count(*) FROM Transaction
```

**2. WHERE Clause** (Filter data):
```nrql
SELECT count(*) FROM Transaction WHERE duration > 0.5
```

**3. FACET Clause** (Group by attribute):
```nrql
SELECT count(*) FROM Transaction FACET appName
SELECT uniqueCount(uuid) FROM Mobile FACET name
```

**4. TIMESERIES** (Time-based charts):
```nrql
SELECT count(*) FROM Transaction TIMESERIES
SELECT average(duration) FROM Transaction TIMESERIES 1 hour
```

**5. Time Ranges**:
```nrql
SELECT count(*) FROM Transaction SINCE 1 day ago
SELECT count(*) FROM Transaction SINCE 1 hour ago UNTIL 30 minutes ago
```

### Common Functions

**Aggregation Functions**:
- `count(*)` - Count all events
- `uniqueCount(attribute)` - Count distinct values
- `average(attribute)` - Calculate average
- `sum(attribute)` - Sum values
- `min(attribute)` - Minimum value
- `max(attribute)` - Maximum value
- `percentile(attribute, percentile)` - Calculate percentiles

**Time Functions**:
- `monthOf(timestamp)` - Extract month
- `weekOf(timestamp)` - Extract week
- `dateOf(timestamp)` - Extract date

### Advanced NRQL Features

**1. Multiple Data Sources**:
```nrql
SELECT count(*) FROM Transaction, PageView SINCE 3 days ago
```

**2. FACET with TIMESERIES**:
```nrql
SELECT count(*) FROM MobileRequest, MobileSession
FACET appName
TIMESERIES
```

**3. FACET with Time Functions**:
```nrql
SELECT count(*) FROM K8sDaemonsetSample
FACET monthOf(createdAt)
```

**4. Complex Calculations**:
```nrql
SELECT count(*) / uniqueCount(sessionId)
FROM MobileRequest, MobileSession
FACET appName
TIMESERIES
```

**5. FACET CASES** (Conditional grouping):
```nrql
SELECT count(*) FROM Transaction
FACET CASES (
  WHERE duration < 1.0 AS 'Fast',
  WHERE duration >= 1.0 AND duration < 3.0 AS 'Medium',
  WHERE duration >= 3.0 AS 'Slow'
)
```

### NRQL via CLI

**Execute NRQL Query**:
```bash
newrelic nrql query \
  --accountId 12345678 \
  --query 'SELECT count(*) FROM Transaction FACET appName TIMESERIES'
```

**Output Formats**:
```bash
# JSON (default)
newrelic nrql query --accountId 12345 --query 'SELECT count(*) FROM Transaction'

# YAML
newrelic nrql query --accountId 12345 --query 'SELECT count(*) FROM Transaction' --format yaml

# Text
newrelic nrql query --accountId 12345 --query 'SELECT count(*) FROM Transaction' --format text
```

### Event Types

Use `SHOW EVENT TYPES` to discover available data:
```nrql
SHOW EVENT TYPES SINCE 1 day ago
```

Common event types:
- `Transaction` - APM transactions
- `PageView` - Browser page views
- `Mobile` - Mobile monitoring events
- `SystemSample` - Infrastructure metrics
- `K8sPodSample` - Kubernetes pod data
- Custom event types from `events post`

---

## Common Workflows & Use Cases

### 1. Application Monitoring Workflow

**Step 1: Search for Application**
```bash
newrelic apm application search --name "WebPortal" --accountId 12345
```

**Step 2: Get Application Details**
```bash
newrelic apm application get --applicationId 123456 --accountId 12345
```

**Step 3: Tag Application**
```bash
# Extract GUID from search results
export APP_GUID=$(newrelic apm application search --name "WebPortal" | jq -r '.[0].guid')

# Add tags
newrelic entity tags create --guid $APP_GUID --tag env:production
newrelic entity tags create --guid $APP_GUID --tag team:platform
```

**Step 4: Query Performance Data**
```bash
newrelic nrql query \
  --accountId 12345 \
  --query "SELECT average(duration), count(*) FROM Transaction WHERE appName = 'WebPortal' FACET name SINCE 1 hour ago"
```

### 2. Deployment Tracking Workflow

**Create Deployment Marker** (integrated with Git):
```bash
newrelic apm deployment create \
  --applicationId 123456 \
  --revision $(git rev-parse HEAD) \
  --description "$(git log -1 --pretty=%B)" \
  --user "$(git config user.name)" \
  --deploymentType ROLLING
```

**List Recent Deployments**:
```bash
newrelic apm deployment list --applicationId 123456
```

**Track Performance Impact**:
```bash
newrelic nrql query \
  --accountId 12345 \
  --query "SELECT average(duration) FROM Transaction WHERE appName = 'WebPortal' TIMESERIES COMPARE WITH 1 day ago"
```

### 3. Bulk Entity Management

**Tag All Production Applications**:
```bash
# Find all applications
newrelic apm application search --accountId 12345 | \
  jq -r '.[].guid' | \
  xargs -I {} newrelic entity tags create --guid {} --tag env:production
```

**Search Tagged Entities**:
```bash
newrelic entity search --tag env:production --accountId 12345
```

### 4. Custom Event Tracking

**Send Business Events**:
```bash
# Payment event
newrelic events post \
  --accountId 12345 \
  --event '{"eventType":"Payment","amount":123.45,"currency":"USD","status":"success"}'

# User signup event
newrelic events post \
  --accountId 12345 \
  --event '{"eventType":"UserSignup","source":"web","plan":"premium"}'
```

**Query Custom Events**:
```bash
newrelic nrql query \
  --accountId 12345 \
  --query "SELECT count(*), sum(amount) FROM Payment WHERE status = 'success' FACET currency SINCE 1 day ago"
```

### 5. Infrastructure Monitoring

**Install Infrastructure Agent**:
```bash
# Latest version
newrelic install -n infrastructure-agent-installer -y

# Specific version
newrelic install -n infrastructure-agent-installer@1.65.0 -y
```

**Query Infrastructure Metrics**:
```bash
newrelic nrql query \
  --accountId 12345 \
  --query "SELECT average(cpuPercent), average(memoryUsedPercent) FROM SystemSample FACET hostname TIMESERIES"
```

### 6. Workload Management

**Create Workload** (grouping related entities):
```bash
newrelic workload create \
  --accountId 12345 \
  --name "E-commerce Platform" \
  # Additional flags for entity GUIDs, scope
```

**Monitor Workload Health**:
```bash
newrelic workload get --guid WORKLOAD_GUID
```

### 7. Synthetics Monitoring

**List Synthetic Monitors**:
```bash
newrelic synthetics monitor list --accountId 12345
```

**Get Monitor Details**:
```bash
newrelic synthetics monitor get --monitorId MONITOR_ID
```

### 8. CI/CD Integration

**GitHub Actions Example**:
```yaml
- name: Create Deployment Marker
  run: |
    newrelic apm deployment create \
      --applicationId ${{ secrets.NR_APP_ID }} \
      --revision ${{ github.sha }} \
      --description "Deploy from ${{ github.ref_name }}" \
      --user ${{ github.actor }}
  env:
    NEW_RELIC_API_KEY: ${{ secrets.NEW_RELIC_API_KEY }}
    NEW_RELIC_REGION: US
```

**Jenkins Pipeline Example**:
```groovy
stage('New Relic Deployment') {
    steps {
        sh '''
            newrelic apm deployment create \
                --applicationId ${NR_APP_ID} \
                --revision ${GIT_COMMIT} \
                --description "Build ${BUILD_NUMBER}"
        '''
    }
}
```

### 9. Multi-Account Management

**Setup Multiple Profiles**:
```bash
# Production account
newrelic profile add \
  --profile production \
  --region us \
  --apiKey PROD_API_KEY \
  --accountId 12345

# Staging account
newrelic profile add \
  --profile staging \
  --region us \
  --apiKey STAGING_API_KEY \
  --accountId 67890

# Set default
newrelic profile default --profile production
```

**Use Different Profiles**:
```bash
# Query production
newrelic nrql query --profile production --query "SELECT count(*) FROM Transaction"

# Query staging
newrelic nrql query --profile staging --query "SELECT count(*) FROM Transaction"
```

### 10. Data Analysis Pipeline

**Extract Data with jq**:
```bash
# Get application response times
newrelic nrql query \
  --accountId 12345 \
  --query "SELECT average(duration) FROM Transaction FACET appName" \
  --format json | jq '.[] | {app: .facet, avgDuration: .average}'

# Find slow transactions
newrelic nrql query \
  --accountId 12345 \
  --query "SELECT name, duration FROM Transaction WHERE duration > 5 LIMIT 100" \
  --format json | jq -r '.[] | "\(.name): \(.duration)s"'
```

---

## Output Formats & Data Handling

### Available Output Formats

The New Relic CLI supports three output formats:

| Format | Flag | Use Case |
|--------|------|----------|
| JSON | `--format json` (default) | Machine parsing, automation, piping to jq |
| YAML | `--format yaml` | Human-readable structured data, config files |
| Text | `--format text` | Human-readable terminal output |

**Plain Mode**: `--plain` flag outputs compact text without formatting

### JSON Output (Default)

**Example**:
```bash
newrelic apm application search --name WebPortal --accountId 12345
```

**Output**:
```json
[
  {
    "guid": "ABC123",
    "name": "WebPortal",
    "applicationId": 123456,
    "reporting": true,
    "permalink": "https://rpm.newrelic.com/accounts/12345/applications/123456",
    "entityType": "APM_APPLICATION_ENTITY"
  }
]
```

### YAML Output

**Example**:
```bash
newrelic apm application search --name WebPortal --format yaml
```

**Output**:
```yaml
- guid: ABC123
  name: WebPortal
  applicationId: 123456
  reporting: true
  permalink: https://rpm.newrelic.com/accounts/12345/applications/123456
  entityType: APM_APPLICATION_ENTITY
```

### Text Output

**Example**:
```bash
newrelic apm application search --name WebPortal --format text
```

**Output**: Human-readable table format

### Data Parsing with jq

**Extract Specific Fields**:
```bash
# Get GUIDs
newrelic apm application search --accountId 12345 | jq -r '.[].guid'

# Get names and IDs
newrelic apm application search --accountId 12345 | jq -r '.[] | "\(.name): \(.applicationId)"'

# Filter results
newrelic apm application search --accountId 12345 | jq '.[] | select(.reporting == true)'
```

**Complex Transformations**:
```bash
# Create CSV
newrelic nrql query \
  --accountId 12345 \
  --query "SELECT count(*) FROM Transaction FACET appName" | \
  jq -r '.[] | [.facet, .count] | @csv'

# Generate reports
newrelic entity search --accountId 12345 | \
  jq '{totalEntities: length, reporting: [.[] | select(.reporting == true)] | length}'
```

### Integration with Other Tools

**xargs for Bulk Operations**:
```bash
# Bulk tag entities
newrelic entity search --type APPLICATION | \
  jq -r '.[].guid' | \
  xargs -I {} newrelic entity tags create --guid {} --tag env:prod
```

**Combine with grep/awk**:
```bash
newrelic apm application search --format text | grep "production" | awk '{print $1}'
```

---

## Integration Patterns

### 1. CI/CD Pipelines

**GitHub Actions**:
```yaml
name: Deploy with New Relic Tracking
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy Application
        run: ./deploy.sh

      - name: Create Deployment Marker
        run: |
          newrelic apm deployment create \
            --applicationId ${{ secrets.NR_APP_ID }} \
            --revision ${{ github.sha }} \
            --description "Deploy from ${{ github.ref_name }}" \
            --user ${{ github.actor }} \
            --deploymentType ROLLING
        env:
          NEW_RELIC_API_KEY: ${{ secrets.NEW_RELIC_API_KEY }}
          NEW_RELIC_REGION: US
```

**Jenkins**:
```groovy
pipeline {
    agent any
    environment {
        NEW_RELIC_API_KEY = credentials('newrelic-api-key')
        NR_APP_ID = '123456'
    }
    stages {
        stage('Deploy') {
            steps {
                sh './deploy.sh'
            }
        }
        stage('New Relic Marker') {
            steps {
                sh '''
                    newrelic apm deployment create \
                        --applicationId ${NR_APP_ID} \
                        --revision ${GIT_COMMIT} \
                        --description "Build ${BUILD_NUMBER}"
                '''
            }
        }
    }
}
```

**GitLab CI**:
```yaml
deploy:
  stage: deploy
  script:
    - ./deploy.sh
    - |
      newrelic apm deployment create \
        --applicationId ${NR_APP_ID} \
        --revision ${CI_COMMIT_SHA} \
        --description "Deploy from ${CI_COMMIT_REF_NAME}" \
        --user ${GITLAB_USER_LOGIN}
  variables:
    NEW_RELIC_API_KEY: $NR_API_KEY
```

### 2. Docker Integration

**Dockerfile**:
```dockerfile
FROM alpine:latest
RUN apk add --no-cache curl bash
RUN curl -Ls https://download.newrelic.com/install/newrelic-cli/scripts/install.sh | bash

ENV NEW_RELIC_API_KEY=""
ENV NEW_RELIC_ACCOUNT_ID=""

ENTRYPOINT ["newrelic"]
```

**Docker Compose**:
```yaml
version: '3.8'
services:
  newrelic-cli:
    image: newrelic/cli:latest
    environment:
      - NEW_RELIC_API_KEY=${NEW_RELIC_API_KEY}
      - NEW_RELIC_ACCOUNT_ID=${NEW_RELIC_ACCOUNT_ID}
    volumes:
      - ./scripts:/scripts
```

### 3. Kubernetes Integration

**Job Example**:
```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: newrelic-deployment-marker
spec:
  template:
    spec:
      containers:
      - name: newrelic-cli
        image: newrelic/cli:latest
        env:
        - name: NEW_RELIC_API_KEY
          valueFrom:
            secretKeyRef:
              name: newrelic-secret
              key: api-key
        command:
        - newrelic
        - apm
        - deployment
        - create
        - --applicationId
        - "123456"
        - --revision
        - $(git rev-parse HEAD)
      restartPolicy: Never
```

### 4. Infrastructure as Code

**Terraform**:
```hcl
resource "null_resource" "newrelic_deployment" {
  provisioner "local-exec" {
    command = <<EOT
      newrelic apm deployment create \
        --applicationId ${var.nr_app_id} \
        --revision ${var.app_version} \
        --description "Terraform deployment"
    EOT

    environment = {
      NEW_RELIC_API_KEY = var.nr_api_key
    }
  }
}
```

### 5. Monitoring Automation

**Automated Health Checks**:
```bash
#!/bin/bash
# health-check.sh

APP_ID="123456"
THRESHOLD=1.0

# Query average response time
RESPONSE_TIME=$(newrelic nrql query \
  --accountId 12345 \
  --query "SELECT average(duration) FROM Transaction WHERE appName = 'WebPortal' SINCE 5 minutes ago" \
  --format json | jq -r '.[0].average')

if (( $(echo "$RESPONSE_TIME > $THRESHOLD" | bc -l) )); then
  echo "ALERT: Response time ${RESPONSE_TIME}s exceeds threshold ${THRESHOLD}s"
  # Send notification
else
  echo "OK: Response time ${RESPONSE_TIME}s"
fi
```

**Automated Tagging**:
```bash
#!/bin/bash
# auto-tag.sh

ENVIRONMENT=$1
TEAM=$2

# Find all applications and tag them
newrelic apm application search --accountId 12345 | \
  jq -r '.[].guid' | \
  while read -r guid; do
    newrelic entity tags create --guid "$guid" --tag "env:$ENVIRONMENT"
    newrelic entity tags create --guid "$guid" --tag "team:$TEAM"
  done
```

### 6. Reporting & Analytics

**Daily Report Script**:
```bash
#!/bin/bash
# daily-report.sh

ACCOUNT_ID=12345
DATE=$(date +%Y-%m-%d)
REPORT_FILE="nr-report-${DATE}.json"

# Gather metrics
echo "Gathering New Relic metrics for $DATE..."

# Transaction volume
TRANSACTIONS=$(newrelic nrql query \
  --accountId $ACCOUNT_ID \
  --query "SELECT count(*) FROM Transaction SINCE 1 day ago" \
  --format json)

# Error rate
ERRORS=$(newrelic nrql query \
  --accountId $ACCOUNT_ID \
  --query "SELECT percentage(count(*), WHERE error IS true) FROM Transaction SINCE 1 day ago" \
  --format json)

# Combine into report
jq -n \
  --argjson transactions "$TRANSACTIONS" \
  --argjson errors "$ERRORS" \
  '{date: $ENV.DATE, transactions: $transactions, errors: $errors}' \
  > "$REPORT_FILE"

echo "Report saved to $REPORT_FILE"
```

### 7. Change Tracking Integration

**Track Configuration Changes**:
```bash
# Track infrastructure changes
newrelic changeTracking create \
  --accountId 12345 \
  --entityGuid INFRASTRUCTURE_GUID \
  --changeType CONFIG \
  --description "Updated Kubernetes deployment" \
  --deployment true

# Track custom application changes
newrelic events post \
  --accountId 12345 \
  --event '{
    "eventType": "ChangeTracking",
    "changeType": "deployment",
    "service": "api-gateway",
    "version": "v2.3.0",
    "user": "deploy-bot"
  }'
```

### 8. Multi-Environment Management

**Environment-Specific Scripts**:
```bash
#!/bin/bash
# deploy-to-env.sh

ENV=$1  # production, staging, development

case $ENV in
  production)
    PROFILE="prod"
    APP_ID="123456"
    ;;
  staging)
    PROFILE="staging"
    APP_ID="789012"
    ;;
  *)
    echo "Unknown environment: $ENV"
    exit 1
    ;;
esac

# Deploy with environment-specific profile
newrelic apm deployment create \
  --profile "$PROFILE" \
  --applicationId "$APP_ID" \
  --revision "$(git rev-parse HEAD)" \
  --description "Deploy to $ENV"
```

---

## Limitations & Considerations

### 1. API Rate Limits

**Consideration**: New Relic API has rate limits
- **Impact**: Bulk operations may be throttled
- **Mitigation**: Implement retry logic, use batch operations when available, space out requests

### 2. Authentication Scope

**Consideration**: API keys are region-specific (US vs EU)
- **Impact**: Wrong region configuration causes authentication failures
- **Mitigation**: Set `NEW_RELIC_REGION` environment variable correctly

### 3. Proxy Support

**Limitation**: Only HTTPS proxies supported, not HTTP
- **Impact**: HTTP proxy configurations will fail
- **Mitigation**: Use HTTPS proxy or configure network to allow direct HTTPS access

### 4. Platform-Specific Features

**Limitation**: Infrastructure agent version specification doesn't work on macOS
- **Impact**: Cannot install specific agent versions on macOS via CLI
- **Mitigation**: Use manual installation for macOS or latest version only

### 5. Output Parsing Complexity

**Consideration**: JSON output structure may change between CLI versions
- **Impact**: Scripts using jq may break on updates
- **Mitigation**: Pin CLI version in production, test scripts after upgrades

### 6. NRQL Query Limits

**Limitation**: NRQL has inherent query limits
- Data retention periods vary by account type
- Query timeout limits
- Result set size limits
- **Mitigation**: Use appropriate time ranges, LIMIT clauses, and paginate large result sets

### 7. Docker Image Size

**Consideration**: Docker image includes Go runtime and dependencies
- **Impact**: Larger image size compared to standalone binary
- **Mitigation**: Use multi-stage builds if embedding in application images

### 8. Community Support Model

**Important**: New Relic CLI is a community project
- **Impact**: Not supported through New Relic Global Technical Support
- **Support Channels**: GitHub Issues, New Relic community forum
- **Mitigation**: Check GitHub issues for known problems, contribute fixes

### 9. Profile Management

**Consideration**: Profiles stored in user home directory
- **Impact**: Not suitable for containerized environments without volume mounts
- **Mitigation**: Use environment variables in containers instead of profiles

### 10. Command Complexity

**Consideration**: Some operations require multiple CLI calls
- **Example**: Getting entity GUID before tagging
- **Impact**: More complex scripts, potential race conditions
- **Mitigation**: Use command chaining with jq, implement idempotent operations

### 11. NRQL vs NerdGraph

**Consideration**: Some operations only available through NerdGraph
- **Impact**: Need to learn GraphQL for advanced operations
- **Mitigation**: Use `newrelic nerdgraph query` for operations not covered by specific commands

### 12. Event Data Ingestion

**Consideration**: Custom events require License Key, not API Key
- **Impact**: Different authentication for events vs queries
- **Mitigation**: Set both `NEW_RELIC_API_KEY` and `NEW_RELIC_LICENSE_KEY`

### 13. Error Handling

**Consideration**: CLI error messages may not always be detailed
- **Impact**: Debugging issues can be challenging
- **Mitigation**: Use `--debug` or `--trace` flags for verbose logging

### 14. Installation Dependencies

**Consideration**: Some installation methods require additional tools
- Homebrew requires Xcode Command Line Tools (macOS)
- Snap requires snapd (Linux)
- **Mitigation**: Review installation prerequisites for your platform

### 15. Breaking Changes

**Consideration**: As a community project, breaking changes may occur
- **Impact**: Scripts may need updates between versions
- **Mitigation**: Check release notes, use version pinning in production, test in staging

---

## Best Practices

### 1. Authentication Management

- **Use profiles** for multiple accounts/environments
- **Store API keys securely** (secrets managers, not in code)
- **Set region explicitly** to avoid authentication errors
- **Rotate API keys regularly** for security

### 2. Scripting & Automation

- **Use JSON format** for programmatic parsing with jq
- **Implement error handling** (check exit codes)
- **Add retry logic** for API rate limits
- **Pin CLI version** in production environments
- **Use `--debug`** during script development

### 3. CI/CD Integration

- **Create deployment markers** for all releases
- **Tag deployments** with metadata (user, version, type)
- **Correlate deployments** with performance metrics
- **Use GitHub Actions/Jenkins plugins** for simplified integration

### 4. Entity Management

- **Tag entities consistently** (env, team, service, etc.)
- **Use bulk operations** with jq and xargs
- **Maintain tag standards** across organization
- **Document tag schema** for team reference

### 5. Query Optimization

- **Use specific time ranges** (not unbounded queries)
- **Apply WHERE filters** to reduce data scanned
- **Use LIMIT** for large result sets
- **Test NRQL queries** in UI before automating

### 6. Output Handling

- **Choose appropriate format** (JSON for automation, Text for humans)
- **Use jq for parsing** (more reliable than grep/awk)
- **Validate JSON output** before processing
- **Handle empty results** gracefully

### 7. Infrastructure as Code

- **Store CLI commands** in version control
- **Use environment-specific configurations**
- **Automate tagging** during provisioning
- **Integrate with IaC tools** (Terraform, Ansible)

### 8. Monitoring & Alerting

- **Automate health checks** with NRQL queries
- **Send custom events** for business metrics
- **Create dashboards** from CLI-extracted data
- **Set up change tracking** for all deployments

---

## Sources & References

### Official Documentation

1. **New Relic CLI GitHub Repository**
   - URL: https://github.com/newrelic/newrelic-cli
   - Coverage: Installation, command reference, getting started
   - Status: Primary source, actively maintained

2. **New Relic CLI Documentation**
   - URL: https://docs.newrelic.com/docs/new-relic-solutions/tutorials/new-relic-cli/
   - Coverage: Tutorials, authentication, workflows
   - Status: Official documentation

3. **Command Reference**
   - URL: https://github.com/newrelic/newrelic-cli/tree/main/docs/cli
   - Coverage: Complete command documentation
   - Status: Auto-generated, comprehensive

4. **NRQL Reference**
   - URL: https://docs.newrelic.com/docs/nrql/nrql-syntax-clauses-functions/
   - Coverage: Query language syntax, functions, examples
   - Status: Official reference

5. **New Relic API Documentation**
   - URL: https://docs.newrelic.com/docs/apis/
   - Coverage: API concepts, keys, limits
   - Status: Official documentation

### Community Resources

6. **GitHub Issues**
   - URL: https://github.com/newrelic/newrelic-cli/issues
   - Coverage: Known issues, feature requests, community support
   - Status: Active community

7. **New Relic Community Forum**
   - Coverage: User discussions, troubleshooting, best practices
   - Status: Active community support

### Integration Examples

8. **Deployment Marker GitHub Action**
   - URL: https://github.com/newrelic/deployment-marker-action
   - Coverage: GitHub Actions integration patterns
   - Status: Official example

9. **Best Practices Guides**
   - APM Best Practices: https://docs.newrelic.com/docs/new-relic-solutions/best-practices-guides/full-stack-observability/apm-best-practices-guide/
   - Infrastructure Monitoring: https://docs.newrelic.com/docs/new-relic-solutions/best-practices-guides/full-stack-observability/infrastructure-monitoring-best-practices-guide/
   - Coverage: Configuration, tagging, alerting patterns
   - Status: Official guidance

### Related Tools

10. **Alternative CLIs**
    - nrql-cli (Python-based): https://github.com/anthonybloomer/nrql-cli
    - IBM New Relic CLI: https://github.com/IBM/newrelic-cli
    - Coverage: Alternative implementations for specific use cases

---

## Appendix: Quick Reference

### Essential Commands Cheat Sheet

```bash
# Authentication
export NEW_RELIC_API_KEY='your-key'
export NEW_RELIC_ACCOUNT_ID='your-account-id'

# Profile management
newrelic profile add --profile prod
newrelic profile default --profile prod

# APM
newrelic apm application search --name MyApp
newrelic apm deployment create --applicationId ID --revision REV

# Entity management
newrelic entity search --name MyApp --type APPLICATION
newrelic entity tags create --guid GUID --tag env:prod

# NRQL queries
newrelic nrql query --query "SELECT count(*) FROM Transaction"

# Custom events
newrelic events post --event '{"eventType":"Custom","key":"value"}'

# Workloads
newrelic workload list
newrelic workload get --guid GUID

# Synthetics
newrelic synthetics monitor list

# Installation
newrelic install -n infrastructure-agent-installer -y

# Help
newrelic --help
newrelic <command> --help
```

### Common Environment Variables

```bash
NEW_RELIC_API_KEY          # User API key (required)
NEW_RELIC_ACCOUNT_ID       # Account ID (optional, can use flag)
NEW_RELIC_REGION           # US or EU (default: US)
NEW_RELIC_LICENSE_KEY      # For custom events
HTTPS_PROXY                # Proxy configuration
NEW_RELIC_CLI_SKIP_CORE    # Skip core recipes during install
```

### Output Format Examples

```bash
# JSON (default)
newrelic entity search --name App

# YAML
newrelic entity search --name App --format yaml

# Text
newrelic entity search --name App --format text

# Compact text
newrelic entity search --name App --plain
```

### Common jq Patterns

```bash
# Extract GUIDs
... | jq -r '.[].guid'

# Extract field
... | jq -r '.[].name'

# Filter
... | jq '.[] | select(.reporting == true)'

# Transform
... | jq '{name: .name, id: .applicationId}'

# CSV output
... | jq -r '.[] | [.name, .id] | @csv'
```

---

## Conclusion

The New Relic CLI is a comprehensive tool for managing New Relic observability from the command line. Its strengths include:

1. **Broad Coverage**: 20+ command categories covering APM, infrastructure, synthetics, entities, and more
2. **Flexible Querying**: Full NRQL support for ad-hoc data analysis
3. **Automation-Ready**: Multiple output formats, profile management, environment variable support
4. **CI/CD Integration**: Deployment markers, custom events, tag management
5. **Cross-Platform**: Available on macOS, Linux, Windows, and Docker
6. **Active Development**: Community-driven with regular updates

**Best suited for**:
- DevOps automation and CI/CD pipelines
- Infrastructure as Code workflows
- Bulk entity management
- Custom reporting and analytics
- Multi-account/environment management
- Deployment tracking and change correlation

**Limitations to consider**:
- Community support model (not official support channel)
- API rate limits on bulk operations
- Region-specific authentication
- HTTPS-only proxy support
- Learning curve for NRQL and NerdGraph

This research provides a foundation for creating integration documentation and automation scripts for the SlideHeroes project or any other application requiring New Relic CLI integration.

---

**Report Generated**: 2025-11-14
**Total Sources Consulted**: 15+ official and community resources
**Research Coverage**: Complete across all major CLI capabilities
