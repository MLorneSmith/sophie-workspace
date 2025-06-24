# Auto-Rollback Documentation

## Overview

The auto-rollback system automatically reverts deployments when critical failures are detected, ensuring system stability and minimal downtime.

## Architecture

### Components

1. **Vercel Deployment Protection** - Health checks and error thresholds
2. **Auto-Rollback Workflow** - GitHub Actions workflow for rollback logic
3. **Smoke Tests** - Critical path validation
4. **Error Rate Monitoring** - Real-time failure detection

### Workflow Integration

The auto-rollback system is integrated into:

- Production deployments (`production-deploy.yml`)
- Staging deployments (`staging-deploy.yml`)

## Configuration

### Vercel Settings (`vercel.json`)

```json
{
  "deploymentProtection": {
    "checks": [
      {
        "name": "Health Check",
        "path": "/healthcheck",
        "method": "GET"
      }
    ],
    "timeout": 30000,
    "errorThreshold": 0.05
  }
}
```

### Health Check Endpoint

- **Endpoint**: `/healthcheck`
- **Expected Response**: HTTP 200 with database status
- **Timeout**: 30 seconds

### Error Threshold

- **Threshold**: 5% error rate
- **Monitoring Duration**: 5 minutes post-deployment
- **Sample Interval**: 10 seconds

## Rollback Triggers

The system triggers rollback when any of these conditions occur:

### 1. Health Check Failure

- Health endpoint returns non-200 status
- Health endpoint times out (>30s)
- Database connectivity issues

### 2. Smoke Test Failure

- Critical pages fail to load
- Authentication flows broken
- API endpoints unavailable
- Missing security headers

### 3. Error Rate Threshold Exceeded

- > 5% of requests fail within 5-minute window
- Sustained error patterns detected
- Performance degradation

## Rollback Process

### Automatic Steps

1. **Detection**: Monitor deployment for failures
2. **Validation**: Confirm failure conditions
3. **Identification**: Get current and previous deployment IDs
4. **Promotion**: Promote previous stable deployment
5. **Notification**: Alert team of rollback action

### Manual Override

Emergency rollback can be triggered manually:

```bash
# Using Vercel CLI
vercel rollback --token=$VERCEL_TOKEN

# Using GitHub Actions
gh workflow run auto-rollback.yml \
  -f environment=production \
  -f deployment_url=https://slideheroes.com
```

## Monitoring and Alerts

### Success Indicators

- ✅ Health check passes
- ✅ Smoke tests complete
- ✅ Error rate < 5%

### Failure Indicators

- ❌ Health check fails
- ❌ Smoke tests fail
- ❌ Error rate > 5%

### Notification Channels

- GitHub Issues (automatic creation)
- Workflow run annotations
- Console logs with detailed status

## Testing

### Local Testing

Use the provided test script to validate rollback logic:

```bash
# Test against localhost (app must be running)
./scripts/test-rollback.sh

# Test against specific URL
./scripts/test-rollback.sh https://staging.slideheroes.com
```

### Smoke Test Suite

Run smoke tests independently:

```bash
cd apps/e2e
pnpm test:smoke
```

### Integration Testing

The rollback system is tested as part of:

- Staging deployments (every push to `staging`)
- Production deployments (every push to `main`)

## Troubleshooting

### Common Issues

#### False Positive Rollbacks

- **Cause**: Temporary network issues, cold starts
- **Solution**: Increase timeout values, improve health check logic

#### Failed Rollback

- **Cause**: No previous deployment available
- **Solution**: Manual intervention required, check Vercel dashboard

#### Smoke Test Failures

- **Cause**: Test environment issues, dependency problems
- **Solution**: Check test logs, verify environment configuration

### Recovery Procedures

#### After Automatic Rollback

1. Check rollback GitHub issue for details
2. Investigate root cause of failure
3. Fix issues in development
4. Test changes thoroughly
5. Redeploy with confidence

#### If Rollback Fails

1. Access Vercel dashboard
2. Manually promote previous deployment
3. Update DNS if necessary
4. Investigate rollback failure
5. Update rollback workflow as needed

## Maintenance

### Regular Tasks

#### Weekly

- Review rollback logs and metrics
- Update smoke test coverage
- Validate health check accuracy

#### Monthly

- Review error thresholds
- Update rollback documentation
- Test manual rollback procedures

#### Quarterly

- Full rollback workflow audit
- Performance optimization review
- Security assessment

### Configuration Updates

When updating rollback configuration:

1. Test changes in staging first
2. Update documentation
3. Notify team of changes
4. Monitor first production deployment closely

## Security Considerations

### Secrets Management

- Vercel tokens stored in GitHub Secrets
- Organization and project IDs secured
- No secrets in rollback logs

### Access Control

- Rollback workflows require appropriate permissions
- Manual rollback limited to authorized users
- Audit logs for all rollback actions

## Performance Impact

### Deployment Time

- Additional 5-10 minutes for monitoring
- Parallel execution minimizes delay
- Early failure detection prevents prolonged issues

### Resource Usage

- Minimal additional compute resources
- Efficient monitoring algorithms
- Cached dependencies for faster rollback

## Future Enhancements

### Planned Improvements

- Integration with APM tools (New Relic)
- Slack/Teams notifications
- Advanced rollback strategies (canary, blue-green)
- Machine learning for anomaly detection

### Configuration Options

- Environment-specific thresholds
- Custom rollback strategies
- Integration with feature flags

## Related Documentation

- [CI/CD Pipeline Overview](./README.md)
- [Deployment Workflows](./workflows.md)
- [Monitoring and Observability](./monitoring.md)
- [Incident Response](./incident-response.md)
