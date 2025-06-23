# Database Schema Context

## Database Architecture Overview

SlideHeroes uses a dual-database strategy with Supabase PostgreSQL as the primary database and Payload CMS with its own database for content management.

## Primary Database: Supabase PostgreSQL

### Core Schema Structure

```sql
-- Core user and organization management
accounts              -- User accounts and profiles
account_roles         -- Role assignments within organizations  
memberships          -- Organization membership relationships
invitations          -- Pending organization invitations

-- Authentication and security
mfa                  -- Multi-factor authentication settings
one_time_tokens      -- Temporary tokens for various operations
super_admin          -- Super admin role assignments

-- Billing and subscriptions
billing_customers    -- Stripe customer relationships
subscriptions        -- Active subscriptions and plans
orders              -- Payment transaction history

-- Notification system
notifications       -- User and system notifications

-- Application-specific data
courses             -- Course definitions and metadata
course_lessons      -- Individual lessons within courses
course_quizzes      -- Quiz assignments to courses
quiz_questions      -- Individual quiz questions
surveys             -- Survey definitions
survey_questions    -- Survey question bank
certificates        -- Generated completion certificates

-- Usage tracking
ai_usage_tracking   -- AI service usage and cost tracking
```

### Key Relationships

#### User & Organization Structure
```sql
accounts 1:N memberships N:1 accounts (organizations)
accounts 1:N account_roles
memberships N:1 account_roles
```

#### Course System Structure  
```sql
courses 1:N course_lessons
courses 1:N course_quizzes N:1 quiz_questions
courses 1:N certificates (via completion)
```

#### Billing Structure
```sql
accounts 1:1 billing_customers
billing_customers 1:N subscriptions
billing_customers 1:N orders
```

### Row Level Security (RLS) Policies

#### Multi-Tenant Isolation
All tables implement RLS policies for organization-based data isolation:

```sql
-- Example policy pattern
CREATE POLICY "Users can only access their organization's data" ON courses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM memberships m 
      WHERE m.account_id = auth.uid() 
      AND m.organization_id = courses.organization_id
    )
  );
```

#### Permission-Based Access
- **Admin users**: Full access within their organization
- **Regular users**: Read access to assigned content
- **Super admins**: Cross-organization access for support

### Data Migration Patterns

#### Supabase Migration Files
Located in `apps/web/supabase/migrations/`:
```
20221215192558_web_schema.sql          -- Initial schema
20240319163440_web_roles-seed.sql      -- Role definitions
20241007151024_web_delete-team-account.sql -- Account deletion
20250210190138_web_testimonials.sql    -- Testimonials feature
20250319104724_web_survey_system.sql   -- Survey system
20250319104726_web_course_system.sql   -- Course system
20250407140454_create_certificates_table.sql -- Certificates
20250416140521_web_ai_usage_cost_tracking.sql -- AI usage tracking
```

## Content Management Database: Payload CMS

### Payload Collections Structure

```typescript
// Content collections
Media              -- File uploads and media management
Posts              -- Blog/content posts
Documentation      -- Knowledge base articles

// Course content
Courses            -- Course metadata and structure
CourseLessons      -- Lesson content and media
CourseQuizzes      -- Quiz definitions and questions
QuizQuestions      -- Question bank

// Survey system
Surveys            -- Survey definitions
SurveyQuestions    -- Question bank for surveys

// User management
Users              -- CMS user accounts (admin interface)
Private            -- Private/restricted content
Downloads          -- Downloadable resources
```

### Payload-Supabase Relationship Strategy

#### Dual Storage Pattern
- **Payload**: Authoritative for content structure, admin interface
- **Supabase**: Real-time access, user interactions, billing
- **Sync Mechanism**: Custom hooks and migration scripts

#### Content Flow
```
Content Creation (Payload) → Sync to Supabase → User Access (Web App)
```

### Data Consistency Challenges

#### Quiz Relationship Management
**Problem**: Complex bidirectional relationships between Payload and Supabase
**Current Status**: Known technical debt requiring attention
**Impact**: Quiz assignment and grading complexity

#### Migration Strategy
- **Payload Migrations**: Content structure changes
- **Supabase Migrations**: Schema and RLS policy updates  
- **Sync Scripts**: Maintain data consistency between systems

## Storage Architecture

### Current: Supabase Storage
```sql
-- Storage buckets
storage.buckets
  - 'public'          -- Public assets and images
  - 'private'         -- User uploads and documents
  - 'certificates'    -- Generated PDF certificates
```

### Planned: Cloudflare R2 Migration
**Reason**: Performance, cost optimization, CDN integration
**Timeline**: Medium-term priority
**Impact**: Improved global performance, reduced storage costs

## Performance Considerations

### Query Optimization
- **N+1 Query Prevention**: Use proper joins and eager loading
- **Index Strategy**: Optimized for common query patterns
- **Connection Pooling**: Supabase built-in pooling

### Common Query Patterns
```sql
-- User courses with progress
SELECT c.*, cl.*, progress.*
FROM courses c
JOIN course_lessons cl ON c.id = cl.course_id
LEFT JOIN user_progress progress ON cl.id = progress.lesson_id
WHERE c.organization_id = $1;

-- Quiz questions with answers
SELECT q.*, qq.* 
FROM course_quizzes cq
JOIN quiz_questions qq ON cq.quiz_id = qq.id
WHERE cq.course_id = $1;
```

### Performance Bottlenecks
1. **Complex RLS Policies**: Can slow down queries with multiple joins
2. **Large Dataset Queries**: Course listings with extensive metadata
3. **Real-time Subscriptions**: WebSocket connections for live updates

## Data Types and Validation

### TypeScript Integration
```typescript
// Auto-generated from Supabase
import { Database } from '@/lib/database.types';

type Course = Database['public']['Tables']['courses']['Row'];
type CourseInsert = Database['public']['Tables']['courses']['Insert'];
type CourseUpdate = Database['public']['Tables']['courses']['Update'];
```

### Zod Schema Validation
```typescript
// Runtime validation for all inputs
const CourseSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  organization_id: z.string().uuid(),
  // ... other fields
});
```

## Security Implementation

### Authentication
- **Supabase Auth**: JWT-based authentication
- **MFA Support**: TOTP and SMS-based two-factor
- **Session Management**: Automatic token refresh

### Authorization
- **RLS Policies**: Database-level access control
- **API Layer**: Server actions with permission checks
- **Admin Interface**: Separate authentication for Payload CMS

### Data Protection
- **Encryption**: Database encryption at rest
- **API Keys**: Server-side only, environment variables
- **Audit Logging**: Track sensitive data access

## Backup and Recovery

### Automated Backups
- **Supabase**: Daily automated backups with point-in-time recovery
- **Payload**: Database backup via hosting provider
- **File Storage**: Versioned with retention policies

### Disaster Recovery
- **Database Reset Scripts**: Located in `scripts/database-reset/`
- **Migration Verification**: Automated testing of migration scripts
- **Rollback Procedures**: Documented procedures for data recovery

## Development Database Management

### Local Development
```bash
# Start local Supabase
pnpm supabase:web:start

# Reset local database
pnpm supabase:web:reset

# Generate types
pnpm supabase:web:typegen
```

### Environment Synchronization
- **Schema Sync**: Migrations applied across all environments
- **Seed Data**: Consistent test data for development
- **Type Generation**: Automated TypeScript type updates

## Monitoring and Observability

### Database Monitoring
- **Supabase Dashboard**: Query performance, connection metrics
- **New Relic**: Application-level database monitoring
- **Custom Logging**: Query timing and error tracking

### Query Analysis
- **Slow Query Detection**: Automated alerts for performance issues
- **Index Usage**: Monitor index effectiveness
- **Connection Pool**: Track connection utilization

## Future Database Considerations

### Scaling Strategies
- **Read Replicas**: For improved read performance
- **Connection Pooling**: Enhanced connection management
- **Caching Layer**: Redis for frequently accessed data

### Schema Evolution
- **Version Control**: All schema changes via migrations
- **Backward Compatibility**: Maintain API stability
- **Data Migration**: Safe strategies for large data transformations

### Advanced Features
- **Real-time Subscriptions**: Enhanced WebSocket capabilities
- **Full-text Search**: PostgreSQL search optimization
- **Analytics**: Time-series data for usage analytics