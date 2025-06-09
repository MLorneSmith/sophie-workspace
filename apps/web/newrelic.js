

/**
 * Array of application names.
 */
exports.config = {
  /**
   * Your New Relic license key.
   */
  license_key: process.env.NEW_RELIC_LICENSE_KEY,
  
  app_name: [process.env.NEW_RELIC_APP_NAME || 'SlideHeroes Web - Local'],
  
  /**
   * This setting controls distributed tracing.
   * Distributed tracing lets you see the path that a request takes through your
   * distributed system. Enabling distributed tracing changes the behavior of some
   * New Relic features, so carefully consult the transition guide before you enable
   * this feature: https://docs.newrelic.com/docs/transition-guide-distributed-tracing
   */
  distributed_tracing: {
    enabled: true
  },
  
  /**
   * Logging settings for local development
   */
  logging: {
    level: process.env.NODE_ENV === 'development' ? 'info' : 'warn',
    filepath: 'stdout'
  },
  
  /**
   * Rules for naming or ignoring transactions.
   */
  rules: {
    name: [
      // Ignore health check endpoints
      { pattern: '/api/health*', ignore: true },
      { pattern: '/healthcheck*', ignore: true },
      // Name API routes properly
      { pattern: '/api/*', name: 'API/*' }
    ]
  },
  
  /**
   * Browser monitoring configuration for local development
   */
  browser_monitoring: {
    enable: process.env.NODE_ENV === 'development'
  },
  
  /**
   * Application performance monitoring and error collection
   */
  application_logging: {
    enabled: true,
    forwarding: {
      enabled: true,
      max_samples_stored: 10000
    },
    metrics: {
      enabled: true
    },
    local_decorating: {
      enabled: true
    }
  },
  
  /**
   * Allow all domains for local development CORS
   */
  allow_all_headers: true,
  
  /**
   * Attributes configuration for enhanced debugging
   */
  attributes: {
    enabled: true,
    exclude: [
      'request.headers.cookie',
      'request.headers.authorization',
      'request.headers.proxyAuthorization',
      'request.headers.setCookie*',
      'request.headers.x*',
      'response.headers.cookie',
      'response.headers.authorization',
      'response.headers.proxyAuthorization',
      'response.headers.setCookie*',
      'response.headers.x*'
    ]
  },
  
  /**
   * Error collection for debugging
   */
  error_collector: {
    enabled: true,
    ignore_status_codes: [404]
  },
  
  /**
   * Transaction tracing for performance analysis
   */
  transaction_tracer: {
    enabled: true,
    transaction_threshold: 'apdex_f',
    record_sql: 'raw',
    explain_threshold: 500
  },
  
  /**
   * Custom insights events for local development
   */
  custom_insights_events: {
    enabled: true,
    max_samples_stored: 1000
  }
}