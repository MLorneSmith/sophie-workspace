# New Relic CLI Integration - Quick Reference

Use New Relic CLI to monitor applications, track deployments, query performance data, and manage observability infrastructure.

## When to Use

- **Deployment Tracking**: Create deployment markers for release correlation
- **Performance Analysis**: Execute NRQL queries for metrics and trends
- **Entity Management**: Search, tag, and organize applications/services
- **Custom Events**: Send business metrics and custom telemetry
- **CI/CD Integration**: Automate monitoring during build/deploy pipelines

## Prerequisites

The New Relic CLI is installed and available in the project environment.

**Required Environment Variables** (set in `.env`):
```bash
NEW_RELIC_API_KEY=your-personal-api-key
NEW_RELIC_ACCOUNT_ID=your-account-id
NEW_RELIC_REGION=US  # or EU
```

## Basic Commands

### Track Deployments

```bash
# Create deployment marker with git info
newrelic apm deployment create \
  --applicationId 123456 \
  --revision $(git rev-parse HEAD) \
  --description "$(git log -1 --pretty=%B)" \
  --user "$(git config user.name)" \
  --deploymentType ROLLING

# List recent deployments
newrelic apm deployment list --applicationId 123456
```

### Query Performance Data

```bash
# Get transaction counts
newrelic nrql query \
  --accountId 12345 \
  --query 'SELECT count(*) FROM Transaction FACET appName SINCE 1 hour ago'

# Check error rates
newrelic nrql query \
  --accountId 12345 \
  --query 'SELECT percentage(count(*), WHERE error IS true) FROM Transaction TIMESERIES'

# Get response times
newrelic nrql query \
  --accountId 12345 \
  --query 'SELECT average(duration), percentile(duration, 95) FROM Transaction WHERE appName = "WebPortal" SINCE 1 day ago'
```

### Manage Entities

```bash
# Search for applications
newrelic apm application search --name WebPortal

# Search entities with filters
newrelic entity search --name MyApp --type APPLICATION --reporting true

# Get entity details
newrelic entity search --name MyApp | jq -r '.[0].guid'
```

### Tag Management

```bash
# Add tags to entity
newrelic entity tags create --guid ABC123 --tag env:production
newrelic entity tags create --guid ABC123 --tag team:platform

# Bulk tag applications
newrelic apm application search --accountId 12345 | \
  jq -r '.[].guid' | \
  xargs -I {} newrelic entity tags create --guid {} --tag env:prod

# Get entity tags
newrelic entity tags get --guid ABC123
```

### Send Custom Events

```bash
# Business event (requires NEW_RELIC_LICENSE_KEY)
newrelic events post \
  --accountId 12345 \
  --event '{"eventType":"Deployment","service":"api","version":"v2.3.0","success":true}'

# User action tracking
newrelic events post \
  --accountId 12345 \
  --event '{"eventType":"UserSignup","plan":"premium","source":"web"}'

# Query custom events
newrelic nrql query \
  --accountId 12345 \
  --query 'SELECT count(*) FROM Deployment WHERE success = true FACET service SINCE 1 week ago'
```

## Command Syntax

### Deployment Markers

```bash
newrelic apm deployment create \
  --applicationId ID \
  --revision REVISION \
  [--description DESCRIPTION] \
  [--user USER] \
  [--deploymentType TYPE]
```

**Deployment Types**: `BASIC`, `BLUE_GREEN`, `CANARY`, `ROLLING`, `SHADOW`, `OTHER`

### NRQL Queries

```bash
newrelic nrql query \
  --accountId ID \
  --query 'NRQL_QUERY' \
  [--format json|yaml|text]
```

### Entity Search

```bash
newrelic entity search \
  [--name NAME] \
  [--type TYPE] \
  [--domain DOMAIN] \
  [--tag TAG] \
  [--reporting true|false]
```

### Custom Events

```bash
newrelic events post \
  --accountId ID \
  --event '{"eventType":"TYPE","key":"value",...}'
```

**Note**: Requires `NEW_RELIC_LICENSE_KEY` environment variable.

## NRQL Query Patterns

### Basic Query Structure

```
SELECT function(attribute) [AS 'label']
FROM data_type
[WHERE attribute comparison value]
[FACET attribute]
[TIMESERIES [interval]]
[SINCE time]
[LIMIT number]
```

### Common Functions

- `count(*)` - Count all events
- `uniqueCount(attribute)` - Distinct values
- `average(attribute)` - Average value
- `sum(attribute)` - Sum values
- `percentile(attribute, 95)` - 95th percentile
- `max(attribute)`, `min(attribute)` - Min/max values

### Time Ranges

- `SINCE 1 hour ago`
- `SINCE 1 day ago`
- `SINCE 1 week ago`
- `SINCE 1 hour ago UNTIL 30 minutes ago`

### Example Queries

```bash
# Transaction volume by app
newrelic nrql query --accountId 12345 \
  --query "SELECT count(*) FROM Transaction FACET appName TIMESERIES"

# Slow transactions
newrelic nrql query --accountId 12345 \
  --query "SELECT name, duration FROM Transaction WHERE duration > 3 LIMIT 100"

# Error rate
newrelic nrql query --accountId 12345 \
  --query "SELECT percentage(count(*), WHERE error IS true) FROM Transaction"

# Response time percentiles
newrelic nrql query --accountId 12345 \
  --query "SELECT percentile(duration, 50, 95, 99) FROM Transaction SINCE 1 hour ago"

# Infrastructure CPU usage
newrelic nrql query --accountId 12345 \
  --query "SELECT average(cpuPercent) FROM SystemSample FACET hostname TIMESERIES"
```

## Common Workflows

### CI/CD Deployment Tracking

```bash
# Create marker with full context
newrelic apm deployment create \
  --applicationId $NR_APP_ID \
  --revision $CI_COMMIT_SHA \
  --description "Deploy from ${CI_BRANCH}" \
  --user $CI_USER \
  --deploymentType ROLLING

# Track performance impact
newrelic nrql query \
  --accountId $NR_ACCOUNT_ID \
  --query "SELECT average(duration) FROM Transaction COMPARE WITH 1 day ago"
```

### Application Monitoring

```bash
# Get application GUID
export APP_GUID=$(newrelic apm application search --name WebPortal | jq -r '.[0].guid')

# Tag application
newrelic entity tags create --guid $APP_GUID --tag env:production
newrelic entity tags create --guid $APP_GUID --tag team:platform

# Check performance
newrelic nrql query \
  --accountId 12345 \
  --query "SELECT average(duration), count(*) FROM Transaction WHERE appName = 'WebPortal' FACET name SINCE 1 hour ago"
```

### Health Checks

```bash
# Check response time threshold
RESPONSE_TIME=$(newrelic nrql query \
  --accountId 12345 \
  --query "SELECT average(duration) FROM Transaction WHERE appName = 'WebPortal' SINCE 5 minutes ago" \
  --format json | jq -r '.[0].average')

if (( $(echo "$RESPONSE_TIME > 1.0" | bc -l) )); then
  echo "ALERT: Response time ${RESPONSE_TIME}s exceeds threshold"
fi
```

### Bulk Operations with jq

```bash
# Extract GUIDs
newrelic entity search --type APPLICATION | jq -r '.[].guid'

# Filter and transform
newrelic apm application search | \
  jq '.[] | select(.reporting == true) | {name: .name, id: .applicationId}'

# Generate reports
newrelic nrql query \
  --accountId 12345 \
  --query "SELECT count(*) FROM Transaction FACET appName" | \
  jq -r '.[] | [.facet, .count] | @csv'
```

## Output Formats

### JSON (Default)

```bash
newrelic entity search --name MyApp
# Outputs structured JSON for programmatic parsing
```

### YAML

```bash
newrelic entity search --name MyApp --format yaml
# Human-readable structured format
```

### Text

```bash
newrelic entity search --name MyApp --format text
# Table format for terminal viewing
```

### Parsing with jq

```bash
# Extract specific fields
newrelic apm application search | jq -r '.[].name'

# Filter results
newrelic entity search | jq '.[] | select(.reporting == true)'

# Transform data
newrelic entity search | jq '{totalEntities: length}'
```

## Profile Management

### Setup Profiles

```bash
# Add production profile
newrelic profile add \
  --profile production \
  --region us \
  --apiKey $PROD_API_KEY \
  --accountId 12345

# Add staging profile
newrelic profile add \
  --profile staging \
  --region us \
  --apiKey $STAGING_API_KEY \
  --accountId 67890

# Set default
newrelic profile default --profile production
```

### Use Profiles

```bash
# Query with specific profile
newrelic nrql query --profile production --query "SELECT count(*) FROM Transaction"

# Deploy to specific environment
newrelic apm deployment create \
  --profile staging \
  --applicationId 789012 \
  --revision $(git rev-parse HEAD)
```

## Event Types

Common data sources for NRQL queries:

- `Transaction` - APM transactions
- `PageView` - Browser page views
- `Mobile` - Mobile monitoring events
- `SystemSample` - Infrastructure host metrics
- `K8sPodSample` - Kubernetes pod data
- `K8sContainerSample` - Kubernetes container metrics
- Custom event types from `events post`

Discover available events:
```bash
newrelic nrql query \
  --accountId 12345 \
  --query "SHOW EVENT TYPES SINCE 1 day ago"
```

## Tips

1. **Use JSON format** for automation and parsing with jq
2. **Tag consistently** - Use standard tags (env, team, service) across entities
3. **Create deployment markers** for every release to correlate performance
4. **Query specific time ranges** to avoid unbounded queries
5. **Store API keys securely** - Use secrets managers, not code
6. **Use profiles** for multi-account/environment management
7. **Add --debug** flag for troubleshooting CLI issues
8. **Use FACET** to group data by attributes
9. **Use TIMESERIES** for time-based charts
10. **Combine with jq/xargs** for bulk operations

## Common Use Cases

### Track Feature Deployment

```bash
# Create marker
newrelic apm deployment create \
  --applicationId 123456 \
  --revision $(git rev-parse HEAD) \
  --description "feat: add user authentication" \
  --deploymentType ROLLING

# Monitor impact
newrelic nrql query \
  --accountId 12345 \
  --query "SELECT average(duration) FROM Transaction TIMESERIES COMPARE WITH 1 hour ago"
```

### Monitor Error Rates

```bash
# Check errors by endpoint
newrelic nrql query \
  --accountId 12345 \
  --query "SELECT count(*) FROM TransactionError FACET request.uri SINCE 1 hour ago"

# Track error trends
newrelic nrql query \
  --accountId 12345 \
  --query "SELECT count(*) FROM TransactionError TIMESERIES"
```

### Analyze Performance

```bash
# Slowest transactions
newrelic nrql query \
  --accountId 12345 \
  --query "SELECT name, average(duration) FROM Transaction FACET name ORDER BY average(duration) DESC LIMIT 10"

# Response time distribution
newrelic nrql query \
  --accountId 12345 \
  --query "SELECT histogram(duration, 100, 20) FROM Transaction"
```

### Custom Business Metrics

```bash
# Track API usage
newrelic events post \
  --accountId 12345 \
  --event '{"eventType":"APICall","endpoint":"/api/users","method":"GET","responseTime":0.123}'

# Query usage patterns
newrelic nrql query \
  --accountId 12345 \
  --query "SELECT count(*) FROM APICall FACET endpoint SINCE 1 day ago"
```

## Configuration

Ensure environment variables are set in `.env`:

```bash
# Required
NEW_RELIC_API_KEY=your-personal-api-key
NEW_RELIC_ACCOUNT_ID=your-account-id

# Optional
NEW_RELIC_REGION=US  # or EU
NEW_RELIC_LICENSE_KEY=your-license-key  # For custom events

# Proxy (if needed, HTTPS only)
HTTPS_PROXY=localhost:8888
```

## Global Flags

All commands support:

- `-a, --accountId` - Override account ID
- `--format json|yaml|text` - Output format (default: json)
- `--profile` - Use specific profile
- `--debug` - Enable debug logging
- `--trace` - Enable trace logging
- `--plain` - Compact text output

## Examples

```bash
# Track deployment in GitHub Actions
newrelic apm deployment create \
  --applicationId ${{ secrets.NR_APP_ID }} \
  --revision ${{ github.sha }} \
  --description "Deploy from ${{ github.ref_name }}" \
  --user ${{ github.actor }}

# Daily performance report
newrelic nrql query \
  --accountId 12345 \
  --query "SELECT count(*), average(duration), percentage(count(*), WHERE error IS true) FROM Transaction SINCE 1 day ago"

# Tag all production apps
newrelic apm application search | \
  jq -r '.[].guid' | \
  xargs -I {} newrelic entity tags create --guid {} --tag env:production

# Monitor infrastructure
newrelic nrql query \
  --accountId 12345 \
  --query "SELECT average(cpuPercent), average(memoryUsedPercent) FROM SystemSample FACET hostname TIMESERIES"

# Query custom events
newrelic nrql query \
  --accountId 12345 \
  --query "SELECT count(*) FROM Deployment WHERE success = true FACET service SINCE 1 week ago"
```
