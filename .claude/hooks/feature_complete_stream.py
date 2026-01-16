#!/usr/bin/env python3
"""
Streaming wrapper for feature_complete.py hook.

Calls the original feature_complete.py for file-based progress tracking,
then streams the event to the orchestrator event server via event_reporter.py.

This provides both:
1. File-based progress (reliable fallback)
2. Real-time event streaming (sub-second delivery)

Input (JSON from stdin): Same as feature_complete.py (Stop hook payload)
Output: None (exit 0 for success)
"""

import json
import os
import subprocess
import sys
from pathlib import Path

HOOKS_DIR = Path(__file__).parent
FEATURE_COMPLETE_SCRIPT = HOOKS_DIR / "feature_complete.py"
EVENT_REPORTER_SCRIPT = HOOKS_DIR / "event_reporter.py"


def main():
    """Run both hooks: file-based and streaming."""
    # Read stdin once and store it
    try:
        stdin_data = sys.stdin.read()
        input_data = json.loads(stdin_data) if stdin_data else {}
    except Exception:
        stdin_data = ""
        input_data = {}

    # 1. Call original feature_complete.py for file-based tracking
    try:
        subprocess.run(
            [sys.executable, str(FEATURE_COMPLETE_SCRIPT)],
            input=stdin_data,
            capture_output=True,
            text=True,
            timeout=5,
        )
    except Exception as e:
        print(f"feature_complete.py error: {e}", file=sys.stderr)

    # 2. Stream event to event server (only if ORCHESTRATOR_URL is set)
    orchestrator_url = os.environ.get("ORCHESTRATOR_URL")
    if orchestrator_url:
        try:
            # Set event type for the reporter
            env = os.environ.copy()
            env["HOOK_EVENT_TYPE"] = "session_stop"

            subprocess.run(
                [sys.executable, str(EVENT_REPORTER_SCRIPT)],
                input=stdin_data,
                capture_output=True,
                text=True,
                timeout=3,
                env=env,
            )
        except Exception as e:
            print(f"event_reporter.py error: {e}", file=sys.stderr)

    sys.exit(0)


if __name__ == "__main__":
    main()
