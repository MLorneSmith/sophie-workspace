# Load Testing Guide

## Overview

SlideHeroes uses [k6](https://k6.io/) for load testing to ensure our application can handle expected user traffic and identify performance bottlenecks before they impact users.

## Architecture

```text
load-tests/
├── k6.config.js          # Shared configuration
├── scenarios/            # Test scenarios
│   ├── login-flow.js     # Login and authentication flow
│   ├── dashboard-load.js # Dashboard performance
│   └── user-journey.js   # Complete user workflows
├── utils/                # Shared utilities
│   ├── auth.js          # Authentication helpers
│   └── newrelic.js      # New Relic integration
├── reports/             # Test results (gitignored)
└── run-tests.sh         # Test runner script
```

## Running Load Tests

### Local Development

1. **Install k6** (if not already installed):

   ```bash
   # The project includes k6 in .bin/k6
   # Or install globally:
   brew install k6  # macOS
   # or
   curl https://github.com/grafana/k6/releases/download/v0.55.0/k6-v0.55.0-linux-amd64.tar.gz -L | tar xvz
   sudo mv k6-v0.55.0-linux-amd64/k6 /usr/local/bin/
   ```

2. **Run all tests**:

   ```bash
   pnpm run load-test
   ```

3. **Run specific test**:

   ```bash
   pnpm run load-test:login      # Login flow only
   pnpm run load-test:dashboard   # Dashboard performance
   pnpm run load-test:journey     # User journey test
   ```

4. **Configure target URL**:

   ```bash
   K6_API_URL=http://localhost:3000 pnpm run load-test
   ```

### CI/CD Pipeline

Load tests automatically run on staging deployments:

1. After successful deployment to staging
2. Uses staging environment URL
3. Results posted to PR comments
4. Metrics sent to New Relic

## Test Scenarios

### 1. Login Flow (`login-flow.js`)

Tests the authentication flow under load:

- Homepage visit
- Login page load
- Authentication request
- Dashboard access

**Key Metrics**:

- Login success rate
- Authentication response time
- Session creation time

**Thresholds**:

- 95% of requests < 1s
- Error rate < 10%
- Login error rate < 10%

### 2. Dashboard Load (`dashboard-load.js`)

Tests dashboard performance with concurrent users:

- Initial dashboard load
- Parallel API calls (profile, projects, analytics, notifications)
- Project operations
- Real-time update polling

**Key Metrics**:

- API call duration
- Dashboard error count
- Response time percentiles

**Thresholds**:

- 95% of requests < 2s
- 99% of requests < 3s
- Error rate < 5%

### 3. User Journey (`user-journey.js`)

Simulates realistic user workflows:

- Random action selection based on weights
- Multiple operations per session
- Think time between actions

**Actions**:

- View dashboard (30% weight)
- Create project (10% weight)
- Edit project (15% weight)
- View analytics (20% weight)
- Manage team (10% weight)
- Update profile (15% weight)

**Thresholds**:

- Journey completion rate > 90%
- 95% of actions < 3s

## Performance Thresholds

Default thresholds are configured in `k6.config.js`:

```javascript
thresholds: {
  http_req_duration: ['p(95)<500', 'p(99)<1000'], // Response times
  http_req_failed: ['rate<0.05'],                 // Error rate < 5%
  http_reqs: ['rate>10'],                          // Min 10 req/s
}
```

## Load Patterns

### Ramping VUs (Virtual Users)

```javascript
stages: [
  { duration: '30s', target: 20 }, // Ramp up
  { duration: '1m', target: 20 }, // Sustain
  { duration: '30s', target: 0 }, // Ramp down
];
```

### Constant Load

```javascript
executor: 'constant-vus',
vus: 50,
duration: '5m',
```

### Ramping Arrival Rate

```javascript
executor: 'ramping-arrival-rate',
startRate: 10,
stages: [
  { duration: '2m', target: 30 },
  { duration: '5m', target: 30 },
  { duration: '2m', target: 50 }, // Peak
]
```

## New Relic Integration

Load test metrics are automatically sent to New Relic when `NEW_RELIC_LICENSE_KEY` is set:

### Metrics Exported

- `k6.http_req_duration.p95` - 95th percentile response time
- `k6.http_req_duration.p99` - 99th percentile response time
- `k6.http_reqs.rate` - Requests per second
- `k6.http_req_failed.rate` - Error rate
- `k6.vus` - Active virtual users

### Creating Dashboards

Use this NRQL query to visualize k6 metrics:

```sql
FROM Metric
SELECT
  average(k6.http_req_duration.p95) as 'Response Time p95',
  average(k6.http_req_duration.p99) as 'Response Time p99',
  average(k6.http_reqs.rate) as 'Requests/sec',
  average(k6.http_req_failed.rate) as 'Error Rate',
  average(k6.vus) as 'Virtual Users'
WHERE service.name = 'slideheroes-load-test'
FACET test.name
TIMESERIES AUTO
```

## Reports

Test results are saved in multiple formats:

1. **JSON Output**: Raw k6 metrics data
2. **Summary JSON**: Aggregated results
3. **HTML Report**: Visual representation

Reports are stored in `load-tests/reports/` with timestamps.

## Best Practices

### 1. Test Data

- Use dedicated test accounts
- Clean up created data after tests
- Don't use production data

### 2. Load Patterns

- Start with small loads
- Gradually increase to find limits
- Include think time between actions

### 3. Monitoring

- Watch application metrics during tests
- Monitor database performance
- Check error logs

### 4. Thresholds

- Set realistic performance goals
- Consider user experience metrics
- Account for geographic distribution

## Troubleshooting

### Common Issues

1. **Authentication Failures**

   - Verify test user credentials
   - Check CORS settings
   - Ensure cookies are handled correctly

2. **High Error Rates**

   - Check rate limiting configuration
   - Verify server capacity
   - Look for database connection limits

3. **Timeouts**
   - Increase timeout values
   - Check network latency
   - Verify server health

### Debug Mode

Enable debug logging:

```bash
K6_LOG_LEVEL=debug k6 run scenarios/login-flow.js
```

## GitHub Actions Secrets

Required secrets for CI/CD:

- `K6_TEST_USER_EMAIL` - Test user email
- `K6_TEST_USER_PASSWORD` - Test user password
- `NEW_RELIC_LICENSE_KEY` - For metrics export

## Future Improvements

1. **Geographic Distribution**: Run tests from multiple regions
2. **Browser-based Tests**: Add k6 browser module for frontend testing
3. **API Contract Testing**: Validate response schemas
4. **Chaos Engineering**: Introduce failures during load tests
5. **Automated Scaling**: Test auto-scaling policies

## References

- [k6 Documentation](https://k6.io/docs/)
- [k6 JavaScript API](https://k6.io/docs/javascript-api/)
- [k6 Thresholds](https://k6.io/docs/using-k6/thresholds/)
- [New Relic Metric API](https://docs.newrelic.com/docs/data-apis/ingest-apis/metric-api/)
