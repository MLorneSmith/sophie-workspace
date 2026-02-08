# Implementation Report: Bug Fix #1814

## Summary

- Added Payload CMS migration step to E2E sharded workflow
- New step runs after Supabase reset, before JWT key extraction
- Provides required `DATABASE_URI` and `PAYLOAD_SECRET` environment variables
- Fixes "relation payload.users does not exist" errors in E2E Shards 7, 8, 9

## Files Changed

```
.github/workflows/e2e-sharded.yml | 16 +++++++++++++++-
1 file changed, 15 insertions(+), 1 deletion(-)
```

## Commits

```
cd9986438 fix(ci): add Payload CMS migrations to E2E sharded workflow
```

## Validation Results

All validation commands passed successfully:
- YAML syntax validation: PASSED
- TypeScript typecheck: PASSED (40/40 tasks)
- Pre-commit hooks (TruffleHog, yamllint): PASSED

## Implementation Details

Added new workflow step in `.github/workflows/e2e-sharded.yml`:

```yaml
- name: Run Payload CMS migrations
  if: steps.check-skip.outputs.skip != 'true'
  run: |
    echo "Running Payload CMS migrations..."
    pnpm --filter payload payload migrate --forceAcceptWarning
    echo "Payload CMS migrations complete"
  env:
    DATABASE_URI: postgresql://postgres:postgres@localhost:54522/postgres
    PAYLOAD_SECRET: test_payload_secret_for_e2e_testing
```

The step is placed after `supabase db reset --no-seed` and before `Extract Supabase JWT keys` to ensure:
1. The Supabase database is ready with the `payload` schema
2. Payload migrations run and create the necessary tables
3. JWT keys are extracted after all database setup is complete

## Follow-up Items

- Monitor E2E Shards 7, 8, 9 in the next CI run to verify fix works in production
- No technical debt created

---
*Implementation completed by Claude*
