# Integration Debugging Guide

This guide provides systematic approaches for AI coding assistants to debug integration issues between services, APIs, and external systems.

## Integration Debugging Methodology

### 1. Integration Issue Classification

```typescript
interface IntegrationIssue {
  type: 'api' | 'webhook' | 'auth' | 'data_sync' | 'third_party' | 'microservice';
  direction: 'inbound' | 'outbound' | 'bidirectional';
  severity: 'low' | 'medium' | 'high' | 'critical';
  component: string;
  endpoint?: string;
  statusCode?: number;
  errorMessage?: string;
  requestId?: string;
}
```

### 2. Integration Monitoring Setup

```typescript
// Request/Response logging middleware
const integrationLogger = (serviceName: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const requestId = generateRequestId();
    const startTime = Date.now();
    
    // Log request
    logger.info('Integration request', {
      requestId,
      service: serviceName,
      method: req.method,
      url: req.url,
      headers: sanitizeHeaders(req.headers),
      body: sanitizeBody(req.body)
    });
    
    // Capture response
    const originalSend = res.send;
    res.send = function(data) {
      const duration = Date.now() - startTime;
      
      logger.info('Integration response', {
        requestId,
        service: serviceName,
        statusCode: res.statusCode,
        duration,
        responseSize: Buffer.byteLength(data)
      });
      
      return originalSend.call(this, data);
    };
    
    next();
  };
};
```

## Common Integration Issues

### Pattern 1: API Communication Failures

**Symptoms:**

- HTTP timeout errors
- Connection refused errors
- Intermittent API failures
- Malformed response data

**Investigation Steps:**

1. **Check network connectivity**: Verify services can reach each other
2. **Examine request/response logs**: Look for patterns in failures
3. **Validate API contracts**: Ensure request/response formats match
4. **Test with different environments**: Compare staging vs production

**API Debugging Tools:**

```typescript
// Comprehensive API client with debugging
class DebugApiClient {
  private baseURL: string;
  private timeout: number;
  private retryConfig: RetryConfig;
  
  constructor(config: ApiConfig) {
    this.baseURL = config.baseURL;
    this.timeout = config.timeout || 10000;
    this.retryConfig = config.retry || { attempts: 3, delay: 1000 };
  }
  
  async request<T>(endpoint: string, options: RequestOptions): Promise<T> {
    const requestId = generateRequestId();
    const url = `${this.baseURL}${endpoint}`;
    
    logger.debug('API request starting', {
      requestId,
      method: options.method,
      url,
      headers: options.headers,
      timeout: this.timeout
    });
    
    const startTime = performance.now();
    
    try {
      const response = await this.makeRequestWithRetry(url, options, requestId);
      const duration = performance.now() - startTime;
      
      logger.info('API request successful', {
        requestId,
        statusCode: response.status,
        duration: Math.round(duration),
        responseHeaders: Object.fromEntries(response.headers.entries())
      });
      
      return await response.json();
    } catch (error) {
      const duration = performance.now() - startTime;
      
      logger.error('API request failed', {
        requestId,
        error: error.message,
        duration: Math.round(duration),
        stack: error.stack
      });
      
      throw new ApiError(`Request failed: ${error.message}`, {
        requestId,
        endpoint,
        originalError: error
      });
    }
  }
  
  private async makeRequestWithRetry(
    url: string, 
    options: RequestOptions, 
    requestId: string
  ): Promise<Response> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= this.retryConfig.attempts; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        
        const response = await fetch(url, {
          ...options,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new HttpError(response.status, await response.text());
        }
        
        return response;
      } catch (error) {
        lastError = error;
        
        logger.warn('API request attempt failed', {
          requestId,
          attempt,
          error: error.message,
          willRetry: attempt < this.retryConfig.attempts
        });
        
        if (attempt < this.retryConfig.attempts && this.shouldRetry(error)) {
          await this.delay(this.retryConfig.delay * attempt);
          continue;
        }
        
        break;
      }
    }
    
    throw lastError;
  }
  
  private shouldRetry(error: Error): boolean {
    return error.name === 'AbortError' || 
           (error instanceof HttpError && error.status >= 500);
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### Pattern 2: Authentication and Authorization Issues

**Symptoms:**

- 401 Unauthorized errors
- 403 Forbidden responses
- Token expiration issues
- OAuth flow failures

**Investigation Steps:**

1. **Verify credentials**: Check API keys, tokens, and certificates
2. **Examine token lifecycle**: Validate token generation and refresh
3. **Check permissions**: Verify service accounts have required permissions
4. **Test auth flows**: Manually test authentication processes

**Auth Debugging:**

```typescript
// JWT token debugging
const debugJwtToken = (token: string) => {
  try {
    const decoded = jwt.decode(token, { complete: true });
    
    logger.debug('JWT token analysis', {
      header: decoded.header,
      payload: decoded.payload,
      isExpired: decoded.payload.exp < Date.now() / 1000,
      expiresAt: new Date(decoded.payload.exp * 1000),
      issuer: decoded.payload.iss,
      audience: decoded.payload.aud
    });
    
    return decoded;
  } catch (error) {
    logger.error('JWT token parsing failed', { error: error.message });
    throw new AuthError('Invalid JWT token');
  }
};

// OAuth flow debugging
class OAuthDebugger {
  async debugAuthorizationCode(code: string, state: string) {
    logger.info('OAuth authorization code received', {
      codeLength: code.length,
      state,
      timestamp: new Date().toISOString()
    });
    
    try {
      const tokenResponse = await this.exchangeCodeForToken(code);
      
      logger.info('Token exchange successful', {
        tokenType: tokenResponse.token_type,
        expiresIn: tokenResponse.expires_in,
        scope: tokenResponse.scope
      });
      
      return tokenResponse;
    } catch (error) {
      logger.error('Token exchange failed', {
        error: error.message,
        code: code.substring(0, 10) + '...',
        state
      });
      throw error;
    }
  }
  
  async validateApiKey(apiKey: string, service: string) {
    const maskedKey = apiKey.substring(0, 8) + '...';
    
    try {
      const response = await fetch(`${service}/validate`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      
      if (!response.ok) {
        logger.error('API key validation failed', {
          service,
          apiKey: maskedKey,
          status: response.status,
          statusText: response.statusText
        });
        return false;
      }
      
      logger.info('API key validation successful', {
        service,
        apiKey: maskedKey
      });
      return true;
    } catch (error) {
      logger.error('API key validation error', {
        service,
        apiKey: maskedKey,
        error: error.message
      });
      return false;
    }
  }
}
```

### Pattern 3: Webhook and Event Processing Issues

**Symptoms:**

- Missing webhook deliveries
- Duplicate event processing
- Webhook signature validation failures
- Event ordering issues

**Investigation Steps:**

1. **Check webhook configuration**: Verify endpoints and event types
2. **Examine delivery logs**: Look for failed deliveries and retries
3. **Validate signatures**: Ensure webhook signatures are correct
4. **Test idempotency**: Verify duplicate event handling

**Webhook Debugging:**

```typescript
// Webhook signature validation
const validateWebhookSignature = (
  payload: string,
  signature: string,
  secret: string
): boolean => {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  const providedSignature = signature.replace('sha256=', '');
  
  const isValid = crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'hex'),
    Buffer.from(providedSignature, 'hex')
  );
  
  logger.debug('Webhook signature validation', {
    isValid,
    providedSignature: providedSignature.substring(0, 10) + '...',
    expectedSignature: expectedSignature.substring(0, 10) + '...'
  });
  
  return isValid;
};

// Idempotent webhook processing
class WebhookProcessor {
  private processedEvents = new Set<string>();
  
  async processWebhook(event: WebhookEvent): Promise<void> {
    const eventId = event.id || this.generateEventId(event);
    
    // Check for duplicate processing
    if (this.processedEvents.has(eventId)) {
      logger.warn('Duplicate webhook event detected', {
        eventId,
        type: event.type,
        timestamp: event.timestamp
      });
      return;
    }
    
    logger.info('Processing webhook event', {
      eventId,
      type: event.type,
      timestamp: event.timestamp
    });
    
    try {
      await this.handleEvent(event);
      this.processedEvents.add(eventId);
      
      logger.info('Webhook event processed successfully', {
        eventId,
        type: event.type
      });
    } catch (error) {
      logger.error('Webhook event processing failed', {
        eventId,
        type: event.type,
        error: error.message
      });
      throw error;
    }
  }
  
  private generateEventId(event: WebhookEvent): string {
    const content = JSON.stringify({
      type: event.type,
      timestamp: event.timestamp,
      data: event.data
    });
    return crypto.createHash('sha256').update(content).digest('hex');
  }
}
```

### Pattern 4: Data Synchronization Issues

**Symptoms:**

- Inconsistent data between services
- Sync delays or failures
- Conflict resolution problems
- Data transformation errors

**Investigation Steps:**

1. **Compare data states**: Check data consistency across services
2. **Examine sync logs**: Look for sync failures and conflicts
3. **Validate transformations**: Ensure data mapping is correct
4. **Test conflict resolution**: Verify conflict handling logic

**Data Sync Debugging:**

```typescript
// Data consistency checker
class DataConsistencyChecker {
  async checkUserDataConsistency(userId: string): Promise<ConsistencyReport> {
    const sources = await Promise.allSettled([
      this.getUserFromPrimary(userId),
      this.getUserFromCache(userId),
      this.getUserFromAnalytics(userId)
    ]);
    
    const report: ConsistencyReport = {
      userId,
      timestamp: new Date(),
      sources: {},
      inconsistencies: []
    };
    
    sources.forEach((result, index) => {
      const sourceName = ['primary', 'cache', 'analytics'][index];
      
      if (result.status === 'fulfilled') {
        report.sources[sourceName] = result.value;
      } else {
        report.sources[sourceName] = { error: result.reason.message };
      }
    });
    
    // Check for inconsistencies
    const primaryData = report.sources.primary;
    if (primaryData && !primaryData.error) {
      Object.keys(report.sources).forEach(source => {
        if (source !== 'primary') {
          const sourceData = report.sources[source];
          if (sourceData && !sourceData.error) {
            const differences = this.findDifferences(primaryData, sourceData);
            if (differences.length > 0) {
              report.inconsistencies.push({
                source,
                differences
              });
            }
          }
        }
      });
    }
    
    logger.info('Data consistency check completed', {
      userId,
      inconsistencyCount: report.inconsistencies.length,
      sources: Object.keys(report.sources)
    });
    
    return report;
  }
  
  private findDifferences(obj1: any, obj2: any, path = ''): string[] {
    const differences: string[] = [];
    
    Object.keys(obj1).forEach(key => {
      const currentPath = path ? `${path}.${key}` : key;
      
      if (!(key in obj2)) {
        differences.push(`Missing key: ${currentPath}`);
      } else if (obj1[key] !== obj2[key]) {
        if (typeof obj1[key] === 'object' && typeof obj2[key] === 'object') {
          differences.push(...this.findDifferences(obj1[key], obj2[key], currentPath));
        } else {
          differences.push(`Value mismatch at ${currentPath}: ${obj1[key]} vs ${obj2[key]}`);
        }
      }
    });
    
    return differences;
  }
}
```

## Integration Testing and Monitoring

### 1. Health Checks

```typescript
// Service health monitoring
class IntegrationHealthChecker {
  async checkServiceHealth(service: ServiceConfig): Promise<HealthStatus> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${service.baseUrl}/health`, {
        timeout: 5000
      });
      
      const responseTime = Date.now() - startTime;
      const isHealthy = response.ok;
      
      const status: HealthStatus = {
        service: service.name,
        healthy: isHealthy,
        responseTime,
        statusCode: response.status,
        timestamp: new Date()
      };
      
      if (!isHealthy) {
        status.error = await response.text();
      }
      
      logger.info('Service health check', status);
      return status;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      const status: HealthStatus = {
        service: service.name,
        healthy: false,
        responseTime,
        error: error.message,
        timestamp: new Date()
      };
      
      logger.error('Service health check failed', status);
      return status;
    }
  }
}
```

### 2. Circuit Breaker Pattern

```typescript
// Circuit breaker for external services
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  constructor(
    private threshold: number = 5,
    private timeout: number = 60000
  ) {}
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN';
        logger.info('Circuit breaker transitioning to HALF_OPEN');
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess(): void {
    this.failures = 0;
    this.state = 'CLOSED';
    logger.debug('Circuit breaker reset to CLOSED');
  }
  
  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
      logger.warn('Circuit breaker opened', {
        failures: this.failures,
        threshold: this.threshold
      });
    }
  }
}
```

## Best Practices for AI Assistants

### 1. Systematic Integration Debugging

- Always check both sides of the integration
- Use correlation IDs to trace requests across services
- Implement comprehensive logging for all integration points
- Test integrations in isolation when possible

### 2. Monitoring and Alerting

- Monitor key integration metrics (latency, error rates, throughput)
- Set up alerts for integration failures
- Implement health checks for all external dependencies
- Use circuit breakers for resilience

### 3. Error Handling and Recovery

- Implement proper retry logic with exponential backoff
- Handle partial failures gracefully
- Provide meaningful error messages for debugging
- Design for eventual consistency in distributed systems

### 4. Security and Compliance

- Validate all external inputs
- Use secure communication channels (HTTPS, TLS)
- Implement proper authentication and authorization
- Log security-relevant events for audit trails
