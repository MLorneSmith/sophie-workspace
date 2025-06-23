# Database Debugging Guide

This guide provides systematic approaches for AI coding assistants to debug database-related issues in applications using PostgreSQL and Supabase.

## Database Debugging Methodology

### 1. Issue Classification

```typescript
interface DatabaseIssue {
  type:
    | 'performance'
    | 'connectivity'
    | 'data_integrity'
    | 'permissions'
    | 'migration';
  severity: 'low' | 'medium' | 'high' | 'critical';
  component: 'query' | 'schema' | 'rls' | 'connection' | 'index';
  affectedTables: string[];
  errorMessage?: string;
  queryText?: string;
}
```

### 2. Diagnostic Information Collection

```sql
-- Essential diagnostic queries
-- Check active connections
SELECT count(*) as active_connections FROM pg_stat_activity;

-- Check slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Check table sizes
SELECT schemaname, tablename,
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;
```

## Common Database Issues

### Pattern 1: Slow Query Performance

**Symptoms:**

- API timeouts
- High database CPU usage
- Slow page loads

**Investigation Steps:**

1. **Identify slow queries**: Use `pg_stat_statements` or query logs
2. **Analyze execution plans**: Use `EXPLAIN ANALYZE`
3. **Check missing indexes**: Review query patterns
4. **Examine table statistics**: Ensure statistics are up to date

**Diagnostic Queries:**

```sql
-- Find slow queries
SELECT query,
       mean_exec_time,
       calls,
       total_exec_time,
       rows,
       100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements
WHERE mean_exec_time > 100  -- queries taking more than 100ms
ORDER BY mean_exec_time DESC;

-- Analyze specific query
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT u.*, p.name as profile_name
FROM users u
LEFT JOIN profiles p ON u.id = p.user_id
WHERE u.email = 'user@example.com';

-- Check for missing indexes
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE schemaname = 'public'
  AND n_distinct > 100  -- High cardinality columns that might need indexes
  AND correlation < 0.1; -- Low correlation might benefit from indexes
```

**Common Solutions:**

```sql
-- Add missing indexes
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY idx_profiles_user_id ON profiles(user_id);

-- Composite indexes for complex queries
CREATE INDEX CONCURRENTLY idx_orders_user_status
ON orders(user_id, status)
WHERE status IN ('pending', 'processing');

-- Partial indexes for filtered queries
CREATE INDEX CONCURRENTLY idx_active_users
ON users(created_at)
WHERE active = true;

-- Update table statistics
ANALYZE users;
ANALYZE profiles;
```

### Pattern 2: Row Level Security (RLS) Issues

**Symptoms:**

- Users seeing data they shouldn't
- Users unable to access their own data
- Unexpected permission denied errors

**Investigation Steps:**

1. **Review RLS policies**: Check policy definitions and logic
2. **Test with different users**: Verify policies work for all user types
3. **Check policy performance**: Ensure policies don't cause slow queries
4. **Validate JWT claims**: Verify authentication tokens contain correct data

**RLS Debugging:**

```sql
-- Check current RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public';

-- Test RLS policy as specific user
SET ROLE authenticated;
SET request.jwt.claims TO '{"sub": "user-123", "role": "authenticated"}';

-- Test query with RLS
SELECT * FROM sensitive_table WHERE user_id = current_setting('request.jwt.claims')::json->>'sub';

-- Reset role
RESET ROLE;

-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity, forcerowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

**Common RLS Patterns:**

```sql
-- User can only access their own data
CREATE POLICY user_own_data ON user_profiles
FOR ALL USING (user_id = auth.uid());

-- Admin can access all data
CREATE POLICY admin_all_access ON user_profiles
FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Public read, authenticated write
CREATE POLICY public_read ON posts
FOR SELECT USING (true);

CREATE POLICY authenticated_write ON posts
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Time-based access
CREATE POLICY active_subscriptions ON premium_content
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM subscriptions
    WHERE user_id = auth.uid()
      AND expires_at > now()
      AND status = 'active'
  )
);
```

### Pattern 3: Connection and Transaction Issues

**Symptoms:**

- Connection pool exhaustion
- Deadlocks
- Transaction timeout errors
- Inconsistent data states

**Investigation Steps:**

1. **Monitor connection usage**: Check active connections and pool status
2. **Identify long-running transactions**: Find blocking queries
3. **Check for deadlocks**: Review deadlock logs
4. **Examine transaction isolation**: Verify appropriate isolation levels

**Connection Debugging:**

```sql
-- Check active connections
SELECT pid, usename, application_name, client_addr, state,
       query_start, state_change, query
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY query_start;

-- Find blocking queries
SELECT blocked_locks.pid AS blocked_pid,
       blocked_activity.usename AS blocked_user,
       blocking_locks.pid AS blocking_pid,
       blocking_activity.usename AS blocking_user,
       blocked_activity.query AS blocked_statement,
       blocking_activity.query AS current_statement_in_blocking_process
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;

-- Check for long-running transactions
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';
```

**Connection Management:**

```typescript
// Proper connection pooling with Supabase
const supabase = createClient(url, key, {
  db: {
    schema: 'public',
  },
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Transaction handling
const performTransaction = async () => {
  const { data, error } = await supabase.rpc('perform_complex_operation', {
    param1: 'value1',
    param2: 'value2',
  });

  if (error) {
    console.error('Transaction failed:', error);
    throw error;
  }

  return data;
};

// Proper error handling for connection issues
const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries = 3,
): Promise<T> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) throw error;

      // Check if it's a connection error
      if (
        error.message.includes('connection') ||
        error.message.includes('timeout')
      ) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        continue;
      }

      throw error; // Non-retryable error
    }
  }
  throw new Error('Max retries exceeded');
};
```

### Pattern 4: Data Integrity Issues

**Symptoms:**

- Orphaned records
- Constraint violations
- Inconsistent data relationships
- Missing required data

**Investigation Steps:**

1. **Check foreign key constraints**: Verify referential integrity
2. **Validate data consistency**: Look for orphaned or inconsistent records
3. **Review constraint definitions**: Ensure constraints match business rules
4. **Examine migration history**: Check for incomplete migrations

**Data Integrity Checks:**

```sql
-- Find orphaned records
SELECT p.id, p.user_id
FROM profiles p
LEFT JOIN users u ON p.user_id = u.id
WHERE u.id IS NULL;

-- Check constraint violations
SELECT conname, conrelid::regclass, confrelid::regclass
FROM pg_constraint
WHERE contype = 'f'  -- Foreign key constraints
  AND NOT convalidated;

-- Validate data consistency
SELECT
  COUNT(*) as total_orders,
  COUNT(CASE WHEN user_id IS NULL THEN 1 END) as orders_without_user,
  COUNT(CASE WHEN total_amount < 0 THEN 1 END) as negative_amounts
FROM orders;

-- Check for duplicate data
SELECT email, COUNT(*)
FROM users
GROUP BY email
HAVING COUNT(*) > 1;
```

**Data Integrity Solutions:**

```sql
-- Add missing constraints
ALTER TABLE profiles
ADD CONSTRAINT fk_profiles_user_id
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Add check constraints
ALTER TABLE orders
ADD CONSTRAINT check_positive_amount
CHECK (total_amount >= 0);

-- Create unique constraints
ALTER TABLE users
ADD CONSTRAINT unique_email
UNIQUE (email);

-- Clean up orphaned data
DELETE FROM profiles
WHERE user_id NOT IN (SELECT id FROM users);
```

## Database Performance Optimization

### 1. Query Optimization

```sql
-- Use appropriate joins
-- Good: Use EXISTS for existence checks
SELECT u.* FROM users u
WHERE EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id);

-- Avoid: Using IN with subqueries for large datasets
SELECT u.* FROM users u
WHERE u.id IN (SELECT user_id FROM orders);

-- Use LIMIT for pagination
SELECT * FROM posts
ORDER BY created_at DESC
LIMIT 20 OFFSET 40;

-- Better: Use cursor-based pagination
SELECT * FROM posts
WHERE created_at < '2023-01-01 12:00:00'
ORDER BY created_at DESC
LIMIT 20;
```

### 2. Index Strategy

```sql
-- Covering indexes for common queries
CREATE INDEX idx_orders_user_status_amount
ON orders(user_id, status)
INCLUDE (total_amount, created_at);

-- Expression indexes for computed values
CREATE INDEX idx_users_lower_email
ON users(lower(email));

-- GIN indexes for JSON queries
CREATE INDEX idx_metadata_gin
ON products USING gin(metadata);

-- Partial indexes for filtered queries
CREATE INDEX idx_active_sessions
ON user_sessions(user_id, last_activity)
WHERE active = true;
```

### 3. Monitoring and Alerting

```typescript
// Database monitoring
const monitorDatabase = async () => {
  const { data: slowQueries } = await supabase.rpc('get_slow_queries', {
    threshold_ms: 1000,
  });

  const { data: connectionCount } = await supabase.rpc('get_connection_count');

  const { data: tableStats } = await supabase.rpc('get_table_statistics');

  // Alert on high connection usage
  if (connectionCount > 80) {
    await sendAlert('High database connection usage', {
      current: connectionCount,
      threshold: 80,
    });
  }

  // Alert on slow queries
  if (slowQueries.length > 0) {
    await sendAlert('Slow queries detected', {
      count: slowQueries.length,
      queries: slowQueries.slice(0, 5),
    });
  }
};
```

## Best Practices for AI Assistants

### 1. Systematic Database Debugging

- Always start with query execution plans
- Check indexes before adding new ones
- Monitor query performance over time
- Test RLS policies with different user contexts

### 2. Performance Considerations

- Use connection pooling appropriately
- Implement proper pagination
- Add indexes based on query patterns, not assumptions
- Monitor and alert on key database metrics

### 3. Data Safety

- Always test migrations on staging first
- Use transactions for multi-step operations
- Implement proper backup and recovery procedures
- Validate data integrity after major changes

### 4. Security Best Practices

- Implement RLS for multi-tenant applications
- Use parameterized queries to prevent SQL injection
- Regularly audit database permissions
- Monitor for suspicious query patterns
