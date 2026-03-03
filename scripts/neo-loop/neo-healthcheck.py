#!/usr/bin/env python3
"""
Neo Loop Healthcheck — Validates the pipeline is operational.
Run daily or on heartbeat. Reports issues to stdout.
"""

import json
import os
import subprocess
from datetime import datetime, timezone, timedelta
from pathlib import Path

STATE_DIR = Path.home() / "clawd" / "state" / "neo-loop"
issues = []


def check(name: str, ok: bool, detail: str = ""):
    status = "✅" if ok else "❌"
    msg = f"{status} {name}"
    if detail:
        msg += f" — {detail}"
    print(msg)
    if not ok:
        issues.append(name)


def main():
    print("=== Neo Loop Healthcheck ===\n")

    # 1. systemd-run --user works
    try:
        r = subprocess.run(
            ["systemd-run", "--user", "--scope", "--", "echo", "ok"],
            capture_output=True, timeout=10,
            env={**os.environ,
                 "DBUS_SESSION_BUS_ADDRESS": f"unix:path=/run/user/{os.getuid()}/bus",
                 "XDG_RUNTIME_DIR": f"/run/user/{os.getuid()}"}
        )
        check("systemd-run --user", r.returncode == 0,
              r.stderr.decode().strip() if r.returncode != 0 else "")
    except Exception as e:
        check("systemd-run --user", False, str(e))

    # 2. Required GitHub labels exist
    try:
        r = subprocess.run(
            ["gh", "label", "list", "--repo", "slideheroes/2025slideheroes",
             "--limit", "200", "--json", "name", "--jq", ".[].name"],
            capture_output=True, timeout=15, text=True
        )
        labels = set(r.stdout.strip().split("\n"))
        for required in ["plan-me", "status:in-progress", "type:feature", "type:spec"]:
            check(f"Label '{required}'", required in labels,
                  "missing from repo" if required not in labels else "")
    except Exception as e:
        check("GitHub labels", False, str(e))

    # 3. Stale locks
    active_runs = STATE_DIR / "active-runs.json"
    if active_runs.exists():
        try:
            with open(active_runs) as f:
                runs = json.load(f)
            cutoff = datetime.now(timezone.utc) - timedelta(minutes=45)
            stale = [k for k, v in runs.items()
                     if datetime.fromisoformat(v.get("started", "2000-01-01T00:00:00+00:00")) < cutoff]
            check("No stale locks", len(stale) == 0,
                  f"{len(stale)} stale: {stale}" if stale else "")
        except Exception as e:
            check("Lock file readable", False, str(e))
    else:
        check("No stale locks", True, "no lock file")

    # 4. Spawn queue not growing
    queue = STATE_DIR / "spawn-queue.jsonl"
    if queue.exists():
        lines = queue.read_text().strip().split("\n")
        lines = [l for l in lines if l.strip()]
        check("Queue not stuck", len(lines) <= 3,
              f"{len(lines)} tasks queued" if lines else "empty")
    else:
        check("Queue not stuck", True, "no queue file")

    # 5. acpx available
    try:
        r = subprocess.run(["npx", "acpx", "--version"], capture_output=True, timeout=30, text=True,
                          env={**os.environ, "PATH": "/usr/local/bin:/home/ubuntu/.npm-global/bin:/usr/bin:/bin:" + os.environ.get("PATH", "")})
        check("acpx available", r.returncode == 0, r.stdout.strip() if r.returncode == 0 else r.stderr.strip()[:100])
    except Exception as e:
        check("acpx available", False, str(e))

    # 6. Active ACP stale check
    active_acp = STATE_DIR / "active-acp.json"
    if active_acp.exists():
        try:
            with open(active_acp) as f:
                acp = json.load(f)
            pid = acp.get("pid")
            if pid:
                try:
                    os.kill(pid, 0)
                    check("Active ACP", True, f"pid {pid} running")
                except OSError:
                    check("Active ACP", False, f"pid {pid} dead but lock exists")
            else:
                check("Active ACP", True, "no active session")
        except Exception:
            check("Active ACP", True, "no active session")
    else:
        check("Active ACP", True, "no active session")

    print(f"\n{'🟢 All clear' if not issues else f'🔴 {len(issues)} issue(s) found'}")
    return 1 if issues else 0


if __name__ == "__main__":
    exit(main())
