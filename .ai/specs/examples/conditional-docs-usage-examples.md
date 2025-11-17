# Conditional Documentation System - Usage Examples

This document provides comprehensive usage examples demonstrating how the intelligent conditional documentation routing system works in practice. Each example shows the input task, routing process, and expected documentation files loaded.

## Purpose

These examples serve as:
1. **Test cases** for validating the routing algorithm
2. **Documentation** showing how the system behaves
3. **Training material** for understanding keyword matching
4. **Regression tests** to ensure consistency after changes

## Example Format

Each example includes:
- **Command:** Which slash command is being run
- **Task:** The task description provided
- **Keywords Extracted:** Meaningful keywords from the task
- **Rules Matched:** Which rules in command-profiles.yaml matched
- **Files Loaded:** Final list of documentation files (3-7 files)
- **Rationale:** Why these files were selected

---

## /implement Examples

### Example 1: OAuth2 Social Login

**Task:** "Add OAuth2 social login with Google and GitHub"

**Keywords Extracted:**
- `oauth2`, `oauth`, `social`, `login`, `google`, `github`, `auth`

**Rules Matched:**
1. Authentication rule (high priority) - keywords: `auth`, `login`, `oauth`
   - Files: `auth-overview.md`, `auth-implementation.md`, `auth-security.md`
2. Server actions rule (high priority) - implied for mutations
   - Files: `server-actions.md`

**Dependencies Resolved:**
- From `auth-overview.md`:
  - `server-actions` → `development/server-actions.md` (already matched)
  - `supabase-client` → not found (external)
  - `team-accounts` → not found

**Files Loaded (5 total):**
1. `development/architecture-overview.md` (default, score: 10.0)
2. `infrastructure/auth-overview.md` (high priority, score: 4.5)
3. `infrastructure/auth-implementation.md` (high priority, score: 4.5)
4. `infrastructure/auth-security.md` (high priority, score: 4.5)
5. `development/server-actions.md` (high priority + dependency, score: 3.0)

**Rationale:**
- OAuth2 is an authentication feature requiring auth documentation
- Implementation will need server actions for signup/login mutations
- Security is critical for authentication features
- Architecture overview provides necessary context

**Token Savings:** ~65% (5 files vs 29 files)

---

### Example 2: Database Schema Migration

**Task:** "Create new database tables with RLS policies for slide templates"

**Keywords Extracted:**
- `database`, `tables`, `rls`, `policies`, `slide`, `templates`, `schema`, `migration`

**Rules Matched:**
1. Database & Migration rule (high priority) - keywords: `database`, `rls`, `schema`, `migration`, `table`
   - Files: `database-patterns.md`, `database-seeding.md`

**Dependencies Resolved:**
- From `database-patterns.md`:
  - None specified

**Files Loaded (3 total):**
1. `development/architecture-overview.md` (default, score: 10.0)
2. `development/database-patterns.md` (high priority, score: 5.0)
3. `infrastructure/database-seeding.md` (high priority, score: 5.0)

**Rationale:**
- Database work requires understanding of patterns and RLS
- RLS policies are critical for multi-tenant architecture
- Seeding may be needed for template data
- Minimum 3 files, maximum 7 - this hits minimum

**Token Savings:** ~75% (3 files vs 29 files)

---

### Example 3: UI Component with Data Fetching

**Task:** "Build project gallery component with infinite scroll using React Query"

**Keywords Extracted:**
- `build`, `project`, `gallery`, `component`, `infinite`, `scroll`, `react query`, `ui`

**Rules Matched:**
1. UI Components rule (medium priority) - keywords: `component`, `ui`
   - Files: `shadcn-ui-components.md`
2. Data fetching rule (medium priority) - keywords: `react query`, `infinite`
   - Files: `react-query-patterns.md`, `react-query-advanced.md`

**Dependencies Resolved:**
- From `react-query-advanced.md`:
  - `react-query-patterns` → `development/react-query-patterns.md` (already matched)
  - `supabase-patterns` → not found

**Files Loaded (4 total):**
1. `development/architecture-overview.md` (default, score: 10.0)
2. `development/shadcn-ui-components.md` (medium priority, score: 2.5)
3. `development/react-query-patterns.md` (medium priority + dependency, score: 2.5)
4. `development/react-query-advanced.md` (medium priority, score: 2.5)

**Rationale:**
- UI component needs shadcn patterns
- Infinite scroll is an advanced React Query pattern
- react-query-patterns provides foundation
- Gallery likely needs lists and data fetching patterns

**Token Savings:** ~72% (4 files vs 29 files)

---

### Example 4: Full-Stack Feature

**Task:** "Implement user profile editing with avatar upload, email validation, and server-side updates"

**Keywords Extracted:**
- `user`, `profile`, `editing`, `avatar`, `upload`, `email`, `validation`, `server`, `updates`, `form`

**Rules Matched:**
1. Server Actions rule (high priority) - keywords: `server`, `validation`, `form`
   - Files: `server-actions.md`
2. UI Components rule (medium priority) - keywords: `form`, `ui`
   - Files: `shadcn-ui-components.md`
3. Database rule (low match) - keywords: `updates` (weak)
   - Not scored high enough

**Files Loaded (3 total):**
1. `development/architecture-overview.md` (default, score: 10.0)
2. `development/server-actions.md` (high priority, score: 3.5)
3. `development/shadcn-ui-components.md` (medium priority, score: 2.5)

**Rationale:**
- Profile editing requires form components
- Server actions for mutations and validation
- Avatar upload handled by server actions
- Minimum files met (3), no need for more

**Token Savings:** ~75% (3 files vs 29 files)

---

### Example 5: Docker Container Setup

**Task:** "Configure Docker Compose for local development environment"

**Keywords Extracted:**
- `configure`, `docker`, `compose`, `local`, `development`, `environment`, `container`

**Rules Matched:**
1. Docker & Containers rule (medium priority) - keywords: `docker`, `container`, `compose`
   - Files: `docker-setup.md`, `docker-troubleshooting.md`

**Files Loaded (3 total):**
1. `development/architecture-overview.md` (default, score: 10.0)
2. `infrastructure/docker-setup.md` (medium priority, score: 3.0)
3. `infrastructure/docker-troubleshooting.md` (medium priority, score: 3.0)

**Rationale:**
- Docker setup is infrastructure work
- Troubleshooting guide helps with common issues
- Architecture overview shows how Docker fits

**Token Savings:** ~75% (3 files vs 29 files)

---

## /diagnose Examples

### Example 6: Authentication Error

**Task:** "Users getting 401 unauthorized when accessing team settings page"

**Keywords Extracted:**
- `users`, `401`, `unauthorized`, `accessing`, `team`, `settings`, `page`, `auth`, `error`

**Rules Matched:**
1. Authentication Issues rule (high priority) - keywords: `unauthorized`, `401`, `auth`
   - Files: `auth-overview.md`, `auth-troubleshooting.md`, `auth-security.md`

**Files Loaded (4 total):**
1. `development/architecture-overview.md` (default, score: 10.0)
2. `infrastructure/auth-overview.md` (high priority, score: 4.0)
3. `infrastructure/auth-troubleshooting.md` (high priority, score: 4.0)
4. `infrastructure/auth-security.md` (high priority, score: 4.0)

**Rationale:**
- 401 errors are authentication failures
- Troubleshooting guide has common auth issues
- Security model explains permissions and RLS
- Team settings may involve RBAC checks

**Token Savings:** ~72% (4 files vs 29 files)

---

### Example 7: Database Performance Issue

**Task:** "Database query timeout on projects list page - RLS policy too complex"

**Keywords Extracted:**
- `database`, `query`, `timeout`, `projects`, `list`, `page`, `rls`, `policy`, `complex`, `performance`

**Rules Matched:**
1. Database Issues rule (high priority) - keywords: `database`, `query`, `timeout`, `rls`
   - Files: `database-patterns.md`
2. Performance Issues rule (medium priority) - keywords: `timeout`, `performance`
   - Files: `performance-testing.md`

**Files Loaded (3 total):**
1. `development/architecture-overview.md` (default, score: 10.0)
2. `development/database-patterns.md` (high priority, score: 4.5)
3. `testing+quality/performance-testing.md` (medium priority, score: 2.5)

**Rationale:**
- Database patterns cover RLS optimization
- Performance testing helps diagnose slow queries
- Architecture shows data flow and query patterns

**Token Savings:** ~75% (3 files vs 29 files)

---

### Example 8: Container Health Check Failure

**Task:** "Docker container for web app is unhealthy - health check failing"

**Keywords Extracted:**
- `docker`, `container`, `web`, `app`, `unhealthy`, `health`, `check`, `failing`

**Rules Matched:**
1. Container Issues rule (high priority) - keywords: `docker`, `container`, `unhealthy`
   - Files: `docker-troubleshooting.md`, `docker-setup.md`

**Files Loaded (3 total):**
1. `development/architecture-overview.md` (default, score: 10.0)
2. `infrastructure/docker-troubleshooting.md` (high priority, score: 3.5)
3. `infrastructure/docker-setup.md` (high priority, score: 3.5)

**Rationale:**
- Docker troubleshooting has health check diagnostics
- Setup doc shows proper health check configuration
- Architecture shows container dependencies

**Token Savings:** ~75% (3 files vs 29 files)

---

## /feature Examples

### Example 9: Real-Time Collaboration

**Task:** "Add real-time collaboration features with presence indicators and cursor tracking"

**Keywords Extracted:**
- `real-time`, `realtime`, `collaboration`, `presence`, `indicators`, `cursor`, `tracking`, `ui`, `component`

**Rules Matched:**
1. Data Features rule (medium priority) - keywords: `realtime`
   - Files: `react-query-patterns.md`, `react-query-advanced.md`
2. UI Features rule (high priority) - keywords: `ui`, `component`, `indicators`
   - Files: `shadcn-ui-components.md`, `react-query-patterns.md`

**Dependencies Resolved:**
- From `react-query-advanced.md`:
  - `react-query-patterns` → already matched

**Files Loaded (5 total):**
1. `development/architecture-overview.md` (default, score: 10.0)
2. `development/prime-framework.md` (default, score: 10.0)
3. `development/shadcn-ui-components.md` (high priority, score: 3.0)
4. `development/react-query-advanced.md` (medium priority, score: 2.5)
5. `development/react-query-patterns.md` (medium + dependency, score: 2.5)

**Rationale:**
- Real-time features need advanced React Query (subscriptions)
- UI components for presence indicators
- PRIME framework helps plan complex features
- Architecture shows how to integrate real-time

**Token Savings:** ~66% (5 files vs 29 files)

---

### Example 10: Multi-Factor Authentication

**Task:** "Implement multi-factor authentication with TOTP and SMS backup"

**Keywords Extracted:**
- `multi-factor`, `mfa`, `authentication`, `totp`, `sms`, `backup`, `auth`, `security`

**Rules Matched:**
1. Authentication Features rule (high priority) - keywords: `mfa`, `authentication`, `auth`
   - Files: `auth-overview.md`, `auth-implementation.md`, `auth-security.md`, `auth-configuration.md`

**Files Loaded (6 total):**
1. `development/architecture-overview.md` (default, score: 10.0)
2. `development/prime-framework.md` (default, score: 10.0)
3. `infrastructure/auth-overview.md` (high priority, score: 4.0)
4. `infrastructure/auth-implementation.md` (high priority, score: 4.0)
5. `infrastructure/auth-security.md` (high priority, score: 4.0)
6. `infrastructure/auth-configuration.md` (high priority, score: 4.0)

**Rationale:**
- MFA is a security-critical auth feature
- All auth docs needed (overview, implementation, security, config)
- PRIME framework helps plan security features
- Configuration shows environment setup

**Token Savings:** ~62% (6 files vs 29 files)

---

## /chore Examples

### Example 11: Dependency Updates

**Task:** "Update MakerKit to latest upstream version and merge changes"

**Keywords Extracted:**
- `update`, `makerkit`, `latest`, `upstream`, `version`, `merge`, `changes`

**Rules Matched:**
1. MakerKit Updates rule (high priority) - keywords: `makerkit`, `upstream`, `merge`
   - Files: `makerkit-integration.md`

**Files Loaded (2 total → bumped to min 3):**
1. `development/architecture-overview.md` (default, score: 10.0)
2. `development/makerkit-integration.md` (high priority, score: 3.5)

**Fallback Applied:** Need minimum 3 files, only 2 matched
- Add category: `tooling` files
- Result: Same 2 files (no additional tooling category files)

**Files Loaded (2 total):**
1. `development/architecture-overview.md` (default, score: 10.0)
2. `development/makerkit-integration.md` (high priority, score: 3.5)

**Note:** This is below minimum (3), but acceptable for very specific chore tasks

**Rationale:**
- MakerKit integration doc has merge procedures
- Architecture shows what might be affected
- Very specific task doesn't need more context

**Token Savings:** ~80% (2 files vs 29 files)

---

### Example 12: Infrastructure Maintenance

**Task:** "Update Docker Compose configuration and upgrade to latest Postgres version"

**Keywords Extracted:**
- `update`, `docker`, `compose`, `configuration`, `upgrade`, `postgres`, `version`, `database`

**Rules Matched:**
1. Infrastructure Maintenance rule (high priority) - keywords: `docker`, `infrastructure`
   - Files: `docker-setup.md`, `docker-troubleshooting.md`
2. Database Maintenance rule (medium match) - keywords: `postgres`, `database`
   - Files: `database-patterns.md`

**Files Loaded (4 total):**
1. `development/architecture-overview.md` (default, score: 10.0)
2. `infrastructure/docker-setup.md` (high priority, score: 3.0)
3. `infrastructure/docker-troubleshooting.md` (high priority, score: 3.0)
4. `development/database-patterns.md` (medium priority, score: 2.0)

**Rationale:**
- Docker setup shows configuration structure
- Troubleshooting helps with upgrade issues
- Database patterns relevant for Postgres upgrade
- Architecture shows how services connect

**Token Savings:** ~72% (4 files vs 29 files)

---

## /bug-plan Examples

### Example 13: Session Expiration Bug

**Task:** "Users being logged out unexpectedly - session expiring too early"

**Keywords Extracted:**
- `users`, `logged`, `out`, `unexpectedly`, `session`, `expiring`, `early`, `auth`

**Rules Matched:**
1. Authentication Bugs rule (high priority) - keywords: `session`, `auth`
   - Files: `auth-overview.md`, `auth-troubleshooting.md`, `auth-implementation.md`, `auth-security.md`

**Files Loaded (5 total):**
1. `development/architecture-overview.md` (default, score: 10.0)
2. `infrastructure/auth-overview.md` (high priority, score: 3.5)
3. `infrastructure/auth-troubleshooting.md` (high priority, score: 3.5)
4. `infrastructure/auth-security.md` (high priority, score: 3.5)
5. `infrastructure/auth-implementation.md` (high priority, score: 3.5)

**Rationale:**
- Session management is in auth-overview
- Troubleshooting has session debugging steps
- Security explains token expiration
- Implementation shows session handling code

**Token Savings:** ~66% (5 files vs 29 files)

---

### Example 14: React Query Cache Bug

**Task:** "Stale data displayed after mutation - cache not invalidating properly"

**Keywords Extracted:**
- `stale`, `data`, `displayed`, `mutation`, `cache`, `invalidating`, `query`, `react`

**Rules Matched:**
1. Data Fetching Bugs rule (medium priority) - keywords: `cache`, `stale`, `query`, `mutation`
   - Files: `react-query-patterns.md`, `react-query-advanced.md`

**Files Loaded (4 total):**
1. `development/architecture-overview.md` (default, score: 10.0)
2. `development/react-query-patterns.md` (medium priority, score: 3.5)
3. `development/react-query-advanced.md` (medium priority, score: 3.5)
4. `development/server-actions.md` (dependency from query patterns, score: 2.5)

**Dependencies Resolved:**
- From `react-query-patterns.md`:
  - `server-actions` → `development/server-actions.md`

**Rationale:**
- React Query patterns cover cache invalidation
- Advanced patterns for complex scenarios
- Server actions show mutation patterns
- Architecture explains data flow

**Token Savings:** ~72% (4 files vs 29 files)

---

## Edge Case Examples

### Example 15: No Keyword Matches

**Task:** "Fix the issue"

**Keywords Extracted:**
- `fix`, `issue` (both too generic)

**Rules Matched:**
- None (no meaningful keywords)

**Files Loaded (1 total → fallback):**
1. `development/architecture-overview.md` (default, score: 10.0)

**Fallback Applied:**
- "No specific keyword matches found"
- Load defaults only
- Suggest user provide more details

**Rationale:**
- Task too vague to route intelligently
- Architecture provides baseline context
- User should clarify task for better routing

**Token Savings:** ~90% (1 file vs 29 files, but may need more context)

---

### Example 16: Multiple Category Matches

**Task:** "Build admin dashboard with user management, role permissions, real-time analytics, and Docker deployment pipeline"

**Keywords Extracted:**
- `build`, `admin`, `dashboard`, `user`, `management`, `role`, `permissions`, `realtime`, `analytics`, `docker`, `deployment`, `pipeline`

**Rules Matched:**
1. Authentication rule (high) - keywords: `role`, `permissions`, `user`
2. Data features rule (medium) - keywords: `realtime`, `analytics`
3. UI features rule (high) - keywords: `dashboard`, `admin`
4. Infrastructure rule (medium) - keywords: `docker`, `deployment`, `pipeline`

**Scoring:**
- `auth-overview.md`: 4.5 (high + multiple matches)
- `shadcn-ui-components.md`: 3.5 (high)
- `react-query-advanced.md`: 2.5 (medium)
- `docker-setup.md`: 2.5 (medium)
- `vercel-deployment.md`: 2.0 (medium)
- And more...

**Files Loaded (7 total - at maximum):**
1. `development/architecture-overview.md` (default, score: 10.0)
2. `development/prime-framework.md` (default, score: 10.0)
3. `infrastructure/auth-overview.md` (high priority, score: 4.5)
4. `development/shadcn-ui-components.md` (high priority, score: 3.5)
5. `infrastructure/auth-implementation.md` (high priority, score: 4.0)
6. `development/react-query-advanced.md` (medium priority, score: 2.5)
7. `infrastructure/docker-setup.md` (medium priority, score: 2.5)

**Rationale:**
- Complex multi-domain task hits maximum files
- Prioritized by score (auth > UI > data > infrastructure)
- Maximum 7 files prevents token bloat
- Covers all major aspects of the task

**Token Savings:** ~52% (7 files vs 29 files, but complex task needs more context)

---

## Validation Test Suite

These examples should be used to validate the routing algorithm:

| Test # | Command | Task Type | Expected Files | Min | Max |
|--------|---------|-----------|---------------|-----|-----|
| 1 | implement | Auth | 5 | ✓ | ✓ |
| 2 | implement | Database | 3 | ✓ | ✓ |
| 3 | implement | UI + Data | 4 | ✓ | ✓ |
| 4 | implement | Full-stack | 3 | ✓ | ✓ |
| 5 | implement | Docker | 3 | ✓ | ✓ |
| 6 | diagnose | Auth error | 4 | ✓ | ✓ |
| 7 | diagnose | DB perf | 3 | ✓ | ✓ |
| 8 | diagnose | Docker | 3 | ✓ | ✓ |
| 9 | feature | Real-time | 5 | ✓ | ✓ |
| 10 | feature | Auth | 6 | ✓ | ✓ |
| 11 | chore | MakerKit | 2 | × | ✓ |
| 12 | chore | Infrastructure | 4 | ✓ | ✓ |
| 13 | bug-plan | Auth | 5 | ✓ | ✓ |
| 14 | bug-plan | Cache | 4 | ✓ | ✓ |
| 15 | any | Edge: vague | 1 | × | ✓ |
| 16 | feature | Edge: complex | 7 | ✓ | ✓ |

**Pass Criteria:**
- ✓ = Within min/max bounds (3-7 files)
- × = Below minimum (acceptable for very specific tasks like #11, #15)

**Success Rate:** 14/16 = 87.5% within bounds

## Performance Metrics

Based on these examples:

- **Average files loaded:** 3.8 files
- **Average token savings:** 70% (range: 52-90%)
- **Routing accuracy:** High (qualitative assessment)
- **Edge case handling:** Good (graceful degradation)

## Maintenance Notes

When updating command profiles:

1. **Run all examples through router** to ensure consistency
2. **Measure token counts** before/after changes
3. **Verify success rates** remain above 80%
4. **Add new examples** for new command types or edge cases
5. **Update expected results** if intentionally changing behavior

## Related Documentation

- **Command Profiles:** `.claude/config/README.md`
- **Router Implementation:** `.claude/commands/conditional_docs.md`
- **Context Documentation:** `.ai/ai_docs/context-docs/README.md`
