PASS

All checks verified by inspecting the actual source files:

1. Routes call `openclaw cron enable/disable` with timeout — Both routes use `execFile("openclaw", ["cron", "enable"|"disable", id, "--timeout", "30000"])` with a 30s Node-side timeout. Uses `execFile` (not `exec`), preventing shell injection.

2. Follows existing patterns — Both new routes are structurally identical to the pre-existing `run/route.ts` (same `safeExec` helper, same error handling, same response shape, same `force-dynamic` export).

3. UI toggles correctly — `toggleEnabled()` computes `nextEnabled = !currentJob.enabled`, picks the right endpoint (`enable`/`disable`), shows a confirmation dialog, displays loading state ("Enabling…"/"Disabling…"), and the button label/icon flips based on `job.enabled`.

4. Refresh updates selected job — `refresh()` fetches all jobs then calls `setSelectedJob(prev => nextJobs.find(j => j.id === prev.id))`, so the modal reflects the updated enabled/disabled state.

5. Security — `execFile` prevents injection, input validated, React handles XSS escaping, no secrets exposed.

6. Commit present — `4fda505 feat(cron): enable/disable jobs from UI` on main, pushed.

Minor note (non-blocking): `safeExec` is duplicated across three route files — could be extracted to a shared util, but this matches the existing pattern.
