# Bug Diagnosis: Supabase Port Configuration Drift After Hyper-V Fix

**ID**: ISSUE-706
**Created**: 2025-11-26T15:30:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

After resolving Issue #668 (Windows Hyper-V port reservation conflicts), the Supabase ports were changed from 54321/54322 to 54521/54522 in the main config file. However, this change was **not propagated** to all dependent configuration files, causing database connection failures across development, testing, and CI environments. Multiple services (Payload CMS, E2E tests, Docker test containers, CI workflows) are attempting to connect to non-existent ports.

## Environment

- **Application Version**: dev branch (commit 1fb16ffd1)
- **Environment**: development, test, CI
- **Node Version**: 22.16.0
- **Database**: PostgreSQL 17 (via Supabase local)
- **Supabase CLI**: v2.62.5
- **Last Working**: Before Issue #668 port migration

## Reproduction Steps

1. Start Supabase with `pnpm supabase:web:start` (runs on 54521/54522)
2. Run `pnpm dev` to start web and payload servers
3. Payload crashes with `ECONNREFUSED 127.0.0.1:54322` (wrong port)
4. Navigate to `/home/course` - page fails to load
5. Run E2E tests - tests fail to connect to database
6. Check `docker-compose.test.yml` - still references old ports

## Expected Behavior

All services should connect to Supabase on the new ports:
- API Gateway: 54521
- PostgreSQL: 54522
- Studio: 54523

## Actual Behavior

Multiple configuration files still reference old ports (54321/54322), causing:
- Payload CMS connection failures
- E2E test database connection failures
- Docker test container connection failures
- CI workflow connection failures

## Diagnostic Data

### Configuration Audit Results

| File | Variable | Expected | Actual | Status |
|------|----------|----------|--------|--------|
| `apps/web/supabase/config.toml` | `[api] port` | 54521 | 54521 | ✅ |
| `apps/web/supabase/config.toml` | `[db] port` | 54522 | 54522 | ✅ |
| `apps/web/.env.development` | `NEXT_PUBLIC_SUPABASE_URL` | 54521 | 54521 | ✅ |
| `apps/payload/.env.development` | `DATABASE_URI` | 54522 | **54322** | ❌ |
| `apps/e2e/.env.test.locked` | `E2E_DATABASE_URL` | 54522 | **54322** | ❌ |
| `apps/e2e/.env.test.locked` | `DATABASE_URL` | 54522 | **54322** | ❌ |
| `apps/e2e/.env.example` | `E2E_DATABASE_URL` | 54522 | **54322** | ❌ |
| `docker-compose.test.yml` | `NEXT_PUBLIC_SUPABASE_URL` | 54521 | **54321** | ❌ |
| `docker-compose.test.yml` | `DATABASE_URL` | 54522 | **54322** | ❌ |
| `docker-compose.test.yml` | `DATABASE_URI` | 54522 | **54322** | ❌ |
| `.github/workflows/e2e-sharded.yml` | `SUPABASE_URL` | 54521 | **54321** | ❌ |
| `.github/workflows/e2e-sharded.yml` | `DATABASE_URL` | 54522 | **54322** | ❌ |
| `docs/cicd/local-development.md` | Multiple | 54521/54522 | **54321/54322** | ❌ |

### Console Output

```
payload:dev: [10:05:04] ERROR: Error: cannot connect to Postgres. Details: connect ECONNREFUSED 127.0.0.1:54322
payload:dev:     err: {
payload:dev:       "code": "ECONNREFUSED",
payload:dev:       "address": "127.0.0.1",
payload:dev:       "port": 54322
payload:dev:     }
```

### Running Infrastructure

```bash
$ docker ps --format "table {{.Names}}\t{{.Ports}}" | grep supabase
supabase_db_2025slideheroes-db      0.0.0.0:54522->5432/tcp   # Correct port
supabase_kong_2025slideheroes-db    0.0.0.0:54521->8000/tcp   # Correct port
```

### Network Analysis

```
Payload attempting: postgresql://postgres:postgres@localhost:54322/postgres
Actual database:    postgresql://postgres:postgres@localhost:54522/postgres
                                                            ^^^^^^
                                                            Port mismatch!
```

## Error Stack Traces

```
Error: connect ECONNREFUSED 127.0.0.1:54322
    at pg-pool/index.js:45:11
    at connectWithReconnect (@payloadcms/db-postgres/dist/connect.js:7:18)
    at Object.connect (@payloadcms/db-postgres/dist/connect.js:46:13)
    at BasePayload.init (payload/dist/index.js:360:13)
```

## Related Code

- **Affected Files**:
  - `apps/payload/.env.development:7` - DATABASE_URI wrong port
  - `apps/e2e/.env.test.locked:10,16` - DATABASE_URL wrong port
  - `apps/e2e/.env.example:11` - E2E_DATABASE_URL wrong port
  - `docker-compose.test.yml:28,33,92,97,99,100` - Multiple wrong ports
  - `.github/workflows/e2e-sharded.yml:111,116,117` - CI wrong ports
  - `docs/cicd/local-development.md` - Documentation wrong ports

- **Recent Changes**:
  - Issue #668: Hyper-V port conflict fix changed `apps/web/supabase/config.toml`
  - Commit `98ba57b66`: Removed duplicate E2E Supabase infrastructure

- **Suspected Functions**: N/A - pure configuration issue

## Related Issues & Context

### Direct Predecessors

- #668 (CLOSED): "Bug Diagnosis: Docker Port 54322 Reserved by Windows Hyper-V" - Root cause that led to port migration
- #705 (OPEN): "Bug Diagnosis: Payload CMS Database Port Mismatch" - Symptom of this drift

### Related Infrastructure Issues

- #665 (CLOSED): "Bug Diagnosis: Supabase Docker Port Binding Failure in WSL2" - Earlier port issues
- #666 (CLOSED): "Bug Fix: Supabase Docker Port Binding Failure in WSL2" - Port binding verifier

### Historical Context

The port migration from 54321/54322 to 54521/54522 was implemented to avoid Windows Hyper-V dynamic port reservation conflicts (ports 54265-54364 are reserved). The migration updated the source of truth (`apps/web/supabase/config.toml`) but failed to update all dependent configuration files.

## Root Cause Analysis

### Identified Root Cause

**Summary**: Incomplete propagation of Supabase port changes from config.toml to dependent environment files after Issue #668 fix.

**Detailed Explanation**:

When Issue #668 was resolved by changing Supabase ports from 54321/54322 to 54521/54522, only the primary configuration file (`apps/web/supabase/config.toml`) was updated. The following files were NOT updated:

1. **Payload CMS development config** (`apps/payload/.env.development`)
2. **E2E test locked config** (`apps/e2e/.env.test.locked`)
3. **E2E test example config** (`apps/e2e/.env.example`)
4. **Docker test compose file** (`docker-compose.test.yml`)
5. **GitHub Actions CI workflow** (`.github/workflows/e2e-sharded.yml`)
6. **Developer documentation** (`docs/cicd/local-development.md`)

**Supporting Evidence**:

1. `apps/web/supabase/config.toml:21`: `port = 54522` (updated)
2. `apps/payload/.env.development:7`: `DATABASE_URI=...54322...` (not updated)
3. `docker-compose.test.yml:33`: `DATABASE_URL=...54322...` (not updated)
4. `.github/workflows/e2e-sharded.yml:116`: `DATABASE_URL=...54322...` (not updated)
5. `npx supabase status` shows DB running on 54522, but apps trying 54322

### How This Causes the Observed Behavior

1. User runs `pnpm supabase:web:start` → Supabase starts on ports 54521/54522
2. User runs `pnpm dev` → Payload reads `.env.development` with port 54322
3. Payload's PostgreSQL adapter tries to connect to 54322 → ECONNREFUSED
4. Payload crashes → Web app can't fetch from Payload API
5. `/home/course` page shows error
6. E2E tests fail for the same reason
7. CI workflows fail for the same reason

### Confidence Level

**Confidence**: High

**Reasoning**:
- Direct evidence from configuration file comparison
- Error message explicitly shows wrong port (54322 vs 54522)
- `supabase status` confirms correct port (54522)
- Multiple services affected with same pattern

## Fix Approach (High-Level)

Update all configuration files to use the new Supabase ports:

1. **Development configs**: Update `DATABASE_URI` and `DATABASE_URL` from 54322 to 54522
2. **Test configs**: Update all Supabase URL references from 54321 to 54521 and DB ports from 54322 to 54522
3. **Docker configs**: Update `docker-compose.test.yml` environment variables
4. **CI configs**: Update `.github/workflows/e2e-sharded.yml` environment variables
5. **Documentation**: Update `docs/cicd/local-development.md` with correct ports
6. **Consider**: Add a port configuration validation script to prevent future drift

## Diagnosis Determination

This is a **configuration drift bug** caused by incomplete change propagation. When infrastructure changes are made to the source of truth (`config.toml`), all dependent configuration files must also be updated. A systematic audit of all files referencing Supabase ports is required.

**Impacted Environments**:
- Local development (Payload CMS)
- Local E2E testing
- Docker-based testing
- GitHub Actions CI
- Developer documentation

**Files requiring updates (8 total)**:
1. `apps/payload/.env.development`
2. `apps/e2e/.env.test.locked`
3. `apps/e2e/.env.example`
4. `docker-compose.test.yml` (4 occurrences)
5. `.github/workflows/e2e-sharded.yml` (3 occurrences)
6. `docs/cicd/local-development.md` (multiple occurrences)

## Additional Context

### Port Mapping Reference

| Service | Old Port | New Port | Reason |
|---------|----------|----------|--------|
| API Gateway (Kong) | 54321 | 54521 | Avoid Hyper-V reservation |
| PostgreSQL | 54322 | 54522 | Avoid Hyper-V reservation |
| Studio | 54323 | 54523 | Consistency |
| Inbucket (SMTP) | 54324 | 54524 | Consistency |
| Inbucket (HTTP) | 54325 | 54525 | Consistency |
| Inbucket (POP3) | 54326 | 54526 | Consistency |

### Prevention Recommendation

Consider implementing:
1. A port configuration validation script that runs during build/startup
2. A single source of truth for port configuration that all files reference
3. Environment variable templating to avoid hardcoded ports

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Grep, Bash (docker ps, supabase status, gh issue view), TodoWrite*
