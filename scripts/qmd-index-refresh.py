#!/usr/bin/env python3
"""
qmd Index Refresh

Runs the nightly qmd update + embed to keep markdown search index fresh.
No LLM calls - just executes commands and reports.

Exit codes:
0 = Success
1 = Errors occurred
2 = Critical failure
"""

import os
import re
import subprocess
import sys
import time
from pathlib import Path

DISCORD_CHANNEL = "1466532593754312899"  # #general (optional notifications)
QMD_TIMEOUT = 900  # 15 minutes


def run_cmd(cmd: list[str], timeout: int = 60, check: bool = False) -> tuple[int, str]:
    """Run a command and return (exit_code, output)."""
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout
        )
        output = result.stdout + result.stderr
        if check and result.returncode != 0:
            print(f"Command failed: {' '.join(cmd)}", file=sys.stderr)
            print(output, file=sys.stderr)
        return result.returncode, output
    except subprocess.TimeoutExpired:
        return 1, f"Timeout after {timeout}s"
    except subprocess.SubprocessError as e:
        return 1, str(e)


def ensure_swap() -> bool:
    """Ensure swap is active."""
    print("Ensuring swap is active...")
    code, output = run_cmd(["sudo", "swapon", "/swapfile"], timeout=10)
    # Ignore errors - swap might already be active
    return True


def kill_stale_qmd() -> None:
    """Kill any stale qmd processes."""
    print("Killing stale qmd processes...")
    run_cmd(["pkill", "-f", "qmd.*embed"], timeout=10)
    time.sleep(2)


def qmd_update() -> tuple[bool, str]:
    """Run qmd update."""
    print("Running qmd update...")
    env = os.environ.copy()
    env["PATH"] = f"{Path.home() / '.bun' / 'bin'}:{env.get('PATH', '')}"
    
    try:
        result = subprocess.run(
            ["qmd", "update"],
            capture_output=True,
            text=True,
            timeout=120,
            env=env
        )
        output = result.stdout + result.stderr
        print(output)
        return result.returncode == 0, output
    except subprocess.TimeoutExpired:
        return False, "qmd update timed out"
    except subprocess.SubprocessError as e:
        return False, str(e)


def qmd_embed() -> tuple[bool, str]:
    """Run qmd embed with retry logic."""
    print("Running qmd embed (this takes 4-8 min)...")
    env = os.environ.copy()
    env["PATH"] = f"{Path.home() / '.bun' / 'bin'}:{env.get('PATH', '')}"
    
    def run_embed() -> tuple[bool, str]:
        try:
            result = subprocess.run(
                ["qmd", "embed"],
                capture_output=True,
                text=True,
                timeout=QMD_TIMEOUT,
                env=env
            )
            output = result.stdout + result.stderr
            return result.returncode == 0, output
        except subprocess.TimeoutExpired:
            return False, "qmd embed timed out"
        except subprocess.SubprocessError as e:
            return False, str(e)
    
    # First attempt
    success, output = run_embed()
    print(output)
    
    if success:
        return True, output
    
    # Check for crash (segfault/SIGKILL)
    if "Segmentation fault" in output or "SIGKILL" in output or "killed" in output.lower():
        print("qmd embed crashed, retrying once...")
        
        # Kill stale processes
        kill_stale_qmd()
        
        # Check memory
        code, mem_output = run_cmd(["free", "-h"], timeout=10)
        print(f"Memory status:\n{mem_output}")
        
        # Retry once
        success, output = run_embed()
        print(output)
        
        if success:
            return True, output
    
    return success, output


def qmd_status() -> tuple[bool, str]:
    """Run qmd status."""
    print("Running qmd status...")
    env = os.environ.copy()
    env["PATH"] = f"{Path.home() / '.bun' / 'bin'}:{env.get('PATH', '')}"
    
    try:
        result = subprocess.run(
            ["qmd", "status"],
            capture_output=True,
            text=True,
            timeout=30,
            env=env
        )
        output = result.stdout + result.stderr
        print(output)
        return result.returncode == 0, output
    except subprocess.SubprocessError as e:
        return False, str(e)


def parse_results(update_output: str, embed_output: str, status_output: str) -> dict:
    """Parse results from qmd outputs."""
    results = {
        "files_updated": 0,
        "chunks_embedded": 0,
        "errors": []
    }
    
    # Parse files updated from update output
    files_match = re.search(r"(\d+)\s+files?\s*(updated|changed|modified)", update_output, re.IGNORECASE)
    if files_match:
        results["files_updated"] = int(files_match.group(1))
    
    # Parse chunks embedded from embed output
    chunks_match = re.search(r"(\d+)\s+chunks?", embed_output, re.IGNORECASE)
    if chunks_match:
        results["chunks_embedded"] = int(chunks_match.group(1))
    
    # Check for errors
    for output in [update_output, embed_output, status_output]:
        if "error" in output.lower() or "failed" in output.lower():
            # Extract error lines
            for line in output.split("\n"):
                if "error" in line.lower() or "failed" in line.lower():
                    results["errors"].append(line.strip())
    
    return results


def main():
    print("=== qmd Index Refresh ===")
    print(f"Started at: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    errors = []
    
    # Step 1: Ensure swap
    ensure_swap()
    
    # Step 2: Kill stale processes
    kill_stale_qmd()
    
    # Step 3: Run qmd update
    update_ok, update_output = qmd_update()
    if not update_ok:
        errors.append("qmd update failed")
    
    # Step 4: Run qmd embed
    embed_ok, embed_output = qmd_embed()
    if not embed_ok:
        errors.append("qmd embed failed")
    
    # Step 5: Run qmd status
    status_ok, status_output = qmd_status()
    if not status_ok:
        errors.append("qmd status failed")
    
    # Parse and report
    results = parse_results(update_output, embed_output, status_output)
    
    print()
    print("=== Summary ===")
    print(f"Files updated: {results['files_updated']}")
    print(f"Chunks embedded: {results['chunks_embedded']}")
    
    if errors or results["errors"]:
        print(f"Errors: {len(errors) + len(results['errors'])}")
        for e in errors:
            print(f"  - {e}")
        for e in results["errors"]:
            print(f"  - {e}")
        sys.exit(1)
    
    print("Done!")
    sys.exit(0)


if __name__ == "__main__":
    main()
