Implemented enable/disable controls for Mission Control Cron Jobs UI.

Changes:
- Added API routes:
  - app/src/app/api/cron/[id]/enable/route.ts (POST) calls `openclaw cron enable <id> --timeout 30000`.
  - app/src/app/api/cron/[id]/disable/route.ts (POST) calls `openclaw cron disable <id> --timeout 30000`.
- Updated app/src/app/cron/page.tsx:
  - Modal now shows Enable/Disable button next to Run now.
  - Toggle action confirms, calls new API routes, and refreshes job list + selected job state.

Quality:
- Ran pnpm lint (warnings only; no new errors).
- Ran pnpm typecheck (pass).

Commit:
- feat(cron): enable/disable jobs from UI
- Pushed to origin/main.
