Implemented Apollo CSV → BigQuery import tool in slideheroes-internal-tools.

Changes:
- Added API route: app/src/app/api/apollo/import/route.ts
  - Accepts multipart/form-data: file, dataset, table, skipLeadingRows, optional project
  - Validates dataset/table IDs, checks file size (<=50MB)
  - Writes uploaded file to /tmp and executes /home/ubuntu/clawd/scripts/import-apollo-csv-to-bigquery.sh
  - Returns JSON { ok, stdout, stderr, exitCode } with appropriate HTTP status
- Added UI page: app/src/app/apollo-import/page.tsx
  - Simple form for CSV upload + params
  - Shows stdout/stderr on completion
- Added link from /setup page to /apollo-import

Verification:
- npm run lint (warnings only)
- npm run typecheck (pass)
- Committed and pushed: feat: add Apollo CSV import UI (commit 0d8f78c)
