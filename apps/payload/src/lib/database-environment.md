# Database Connection Management Environment Configuration

This document outlines the environment variables and configuration options for the enhanced database connection
management system.

## Required Environment Variables

### Core Database Configuration

- `DATABASE_URI` - PostgreSQL connection string (required)
- `PAYLOAD_SECRET` - Payload CMS secret key (required)

### Optional Database Configuration

- `DB_LOG_LEVEL` - Logging level for database operations
  - Values: `debug`, `info`, `warn`, `error`
  - Default: `debug` in development, `info` in production
- `ENABLE_DB_HEALTH_MONITORING` - Enable health monitoring in non-production environments
  - Values: `true`, `false`
  - Default: `false` (only enabled in production by default)
- `DB_HEALTH_CHECK_INTERVAL` - Health check interval in milliseconds
  - Default: `30000` (30 seconds)
- `ENABLE_DB_METRICS_LOGGING` - Enable periodic metrics logging
  - Values: `true`, `false`
  - Default: `false` (only enabled in development by default)

## Environment-Specific Pool Configurations

### Development Environment

```bash
NODE_ENV=development
# Pool settings are optimized for development:
# - max: 8 connections
# - min: 1 connection (kept warm)
# - connectionTimeoutMillis: 15000 (15 seconds for debugging)
# - idleTimeoutMillis: 60000 (1 minute)
# - acquireTimeoutMillis: 10000 (10 seconds)
# - createTimeoutMillis: 15000 (15 seconds)
# - destroyTimeoutMillis: 5000 (5 seconds)
# - reapIntervalMillis: 2000 (2 seconds)
# - createRetryIntervalMillis: 500 (500ms)
```

### Production Environment

```bash
NODE_ENV=production
# Pool settings are optimized for production:
# - max: 15 connections
# - min: 2 connections (kept warm)
# - connectionTimeoutMillis: 10000 (10 seconds)
# - idleTimeoutMillis: 30000 (30 seconds)
# - acquireTimeoutMillis: 5000 (5 seconds)
# - createTimeoutMillis: 10000 (10 seconds)
# - destroyTimeoutMillis: 5000 (5 seconds)
# - reapIntervalMillis: 1000 (1 second)
# - createRetryIntervalMillis: 200 (200ms)
```

### Test/Staging Environment

```bash
NODE_ENV=test
# Pool settings for test environments:
# - max: 5 connections
# - min: 0 connections
# - Standard timeouts optimized for testing
```

## SSL Configuration

### Production SSL (Auto-configured)

When `NODE_ENV=production`, SSL is automatically enabled with:

```javascript
{
  rejectUnauthorized: false,
  sslmode: 'require'
}
```

### Development SSL (Disabled)

SSL is disabled in development for local database connections.

## Storage Configuration

### S3 Storage (Optional)

```bash
S3_BUCKET=your-bucket-name
S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

### Local Storage (Default)

If S3 variables are not set, the system defaults to local file storage.

## Additional Payload Configuration

### Server Configuration

```bash
PAYLOAD_PUBLIC_SERVER_URL=https://your-domain.com
```

### Upload Limits

```bash
MAX_FILE_SIZE=5000000  # 5MB default
```

### Localization (Optional)

```bash
ENABLE_LOCALIZATION=true  # Enable multi-language support
```

### Debug Mode

```bash
PAYLOAD_DEBUG=true  # Enable debug logging
```

### CORS Configuration

```bash
ALLOWED_ORIGINS=https://domain1.com,https://domain2.com
# Or use '*' for all origins (not recommended for production)
```

## Database Schema Information

### Schema Configuration

- **Schema Name**: `payload` (fixed)
- **ID Type**: `uuid` (fixed)
- **Schema Push**: Disabled (prevents unwanted migrations)

### Migration Management

Migrations are managed through Payload's built-in migration system. The enhanced adapter does not interfere with
normal migration processes.

## Monitoring and Health Checks

### Health Check Endpoint

The system provides a health check endpoint at `/health` that returns:

```json
{
  "status": "healthy",
  "timestamp": "2025-05-27T16:58:00.000Z",
  "environment": "production",
  "database": {
    "status": "connected",
    "metrics": {
      "totalConnections": 1,
      "failedConnections": 0,
      "lastHealthCheck": "2025-05-27T16:58:00.000Z",
      "consecutiveFailures": 0
    }
  }
}
```

### Connection Metrics

The system tracks various connection metrics:

- Total connections created
- Active/idle connection counts
- Failed connection attempts
- Health check status
- Consecutive failure count

## Troubleshooting

### Common Issues

1. **Connection Pool Exhaustion**

   - Check `max` pool setting for your environment
   - Monitor connection metrics via health endpoint
   - Verify no connection leaks in application code

2. **Connection Timeouts**

   - Adjust timeout settings for your environment
   - Check network latency to database
   - Verify database server capacity

3. **SSL Certificate Issues**
   - Verify SSL configuration for production
   - Check certificate validity
   - Ensure `rejectUnauthorized: false` if using self-signed certificates

### Debug Logging

Enable debug logging to troubleshoot connection issues:

```bash
DB_LOG_LEVEL=debug
```

This will provide detailed logs of:

- Connection initialization attempts
- Pool configuration details
- Health check results
- Connection metrics
- Error details with full context

## Performance Optimization

### Connection Pool Tuning

- **Development**: Lower connection limits for resource conservation
- **Production**: Higher limits for better concurrency
- **Serverless**: Optimized for quick startup/shutdown cycles

### Retry Logic

- Exponential backoff for failed connections
- Maximum 3 retry attempts with configurable delays
- Automatic recovery from transient failures

### Health Monitoring

- Periodic connection health verification
- Automatic failure detection and logging
- Metrics collection for performance analysis
