#!/usr/bin/env python3
"""
OpenClaw Health Check Suite

Runs health checks on the OpenClaw system and reports failures.
No LLM calls - just deterministic checks.

Checks:
1. OpenClaw gateway running
2. ccproxy running (if enabled)
3. Disk space adequate
4. Memory adequate
5. Mission Control API responsive
6. No stuck cron jobs

Exit codes:
0 = All checks passed
1 = One or more checks failed
"""

import json
import os
import subprocess
import sys
import time
from pathlib import Path

DISCORD_CHANNEL = "1468015498330308621"  # #inbox-sophie
GATEWAY_URL = "http://127.0.0.1:18789"
MC_API = "http://localhost:3001/api/v1"

# Thresholds
MIN_DISK_GB = 5
MIN_MEM_PERCENT = 10


class HealthCheck:
    def __init__(self):
        self.results = []
        self.failures = []
    
    def add_result(self, name: str, passed: bool, details: str = ""):
        self.results.append({
            "name": name,
            "passed": passed,
            "details": details
        })
        if not passed:
            self.failures.append({"name": name, "details": details})
    
    def check_gateway(self) -> bool:
        """Check if OpenClaw gateway is running."""
        try:
            result = subprocess.run(
                ["curl", "-sf", "--connect-timeout", "5", f"{GATEWAY_URL}/"],
                capture_output=True,
                timeout=10
            )
            passed = result.returncode == 0
            details = "Gateway responding" if passed else "Gateway not responding"
            self.add_result("OpenClaw Gateway", passed, details)
            return passed
        except (subprocess.TimeoutExpired, subprocess.SubprocessError) as e:
            self.add_result("OpenClaw Gateway", False, str(e))
            return False
    
    def check_ccproxy(self) -> bool:
        """Check if ccproxy is running."""
        try:
            result = subprocess.run(
                ["curl", "-sf", "--connect-timeout", "5", "http://127.0.0.1:8787/health"],
                capture_output=True,
                timeout=10
            )
            # ccproxy may not be enabled, so only fail if it's supposed to be running
            if result.returncode == 0:
                self.add_result("ccproxy", True, "ccproxy responding")
                return True
            else:
                # Check if systemd service exists
                svc_result = subprocess.run(
                    ["systemctl", "is-active", "ccproxy"],
                    capture_output=True,
                    text=True
                )
                if svc_result.returncode == 0:
                    self.add_result("ccproxy", False, "ccproxy service active but not responding")
                    return False
                else:
                    # Service not active, skip this check
                    self.add_result("ccproxy", True, "ccproxy not enabled (skipped)")
                    return True
        except (subprocess.TimeoutExpired, subprocess.SubprocessError) as e:
            self.add_result("ccproxy", False, str(e))
            return False
    
    def check_disk_space(self) -> bool:
        """Check if disk space is adequate."""
        try:
            result = subprocess.run(
                ["df", "-BG", "/"],
                capture_output=True,
                text=True,
                timeout=10
            )
            
            # Parse output: Filesystem, Size, Used, Avail, Use%, Mounted on
            lines = result.stdout.strip().split("\n")
            if len(lines) >= 2:
                parts = lines[1].split()
                avail_gb = int(parts[3].replace("G", ""))
                use_percent = int(parts[4].replace("%", ""))
                
                passed = avail_gb >= MIN_DISK_GB
                details = f"{avail_gb}GB available ({use_percent}% used)"
                self.add_result("Disk Space", passed, details)
                return passed
            else:
                self.add_result("Disk Space", False, "Could not parse df output")
                return False
        except (subprocess.SubprocessError, ValueError) as e:
            self.add_result("Disk Space", False, str(e))
            return False
    
    def check_memory(self) -> bool:
        """Check if memory is adequate."""
        try:
            with open("/proc/meminfo") as f:
                meminfo = f.read()
            
            # Parse MemAvailable and MemTotal
            mem_total = 0
            mem_available = 0
            
            for line in meminfo.split("\n"):
                if line.startswith("MemTotal:"):
                    mem_total = int(line.split()[1])
                elif line.startswith("MemAvailable:"):
                    mem_available = int(line.split()[1])
            
            if mem_total > 0:
                avail_percent = (mem_available / mem_total) * 100
                passed = avail_percent >= MIN_MEM_PERCENT
                details = f"{avail_percent:.1f}% available ({mem_available // 1024}MB)"
                self.add_result("Memory", passed, details)
                return passed
            else:
                self.add_result("Memory", False, "Could not parse /proc/meminfo")
                return False
        except (IOError, ValueError) as e:
            self.add_result("Memory", False, str(e))
            return False
    
    def check_mission_control(self) -> bool:
        """Check if Mission Control API is responsive."""
        try:
            result = subprocess.run(
                ["curl", "-sf", "--connect-timeout", "5", f"{MC_API}/tasks?limit=1"],
                capture_output=True,
                timeout=10
            )
            passed = result.returncode == 0
            details = "MC API responding" if passed else "MC API not responding"
            self.add_result("Mission Control API", passed, details)
            return passed
        except (subprocess.TimeoutExpired, subprocess.SubprocessError) as e:
            self.add_result("Mission Control API", False, str(e))
            return False
    
    def check_cron_jobs(self) -> bool:
        """Check for stuck or failing cron jobs."""
        try:
            # Get cron job status from OpenClaw
            result = subprocess.run(
                ["curl", "-sf", "--connect-timeout", "5", 
                 "-H", "Authorization: Bearer $(cat ~/.openclaw/openclaw.json | jq -r '.gateway.auth.token')",
                 f"{GATEWAY_URL}/api/cron/jobs"],
                capture_output=True,
                text=True,
                timeout=10,
                shell=True
            )
            
            if result.returncode != 0:
                self.add_result("Cron Jobs", True, "Could not check cron status (skipped)")
                return True
            
            jobs = json.loads(result.stdout)
            failing = []
            
            for job in jobs.get("jobs", []):
                if job.get("state", {}).get("consecutiveErrors", 0) > 3:
                    failing.append(job.get("name", "unknown"))
            
            if failing:
                details = f"Failing jobs: {', '.join(failing)}"
                self.add_result("Cron Jobs", False, details)
                return False
            else:
                self.add_result("Cron Jobs", True, "All jobs healthy")
                return True
        except (json.JSONDecodeError, subprocess.SubprocessError) as e:
            self.add_result("Cron Jobs", True, f"Could not check cron status: {e}")
            return True
    
    def run_all(self) -> bool:
        """Run all health checks."""
        self.check_gateway()
        self.check_ccproxy()
        self.check_disk_space()
        self.check_memory()
        self.check_mission_control()
        self.check_cron_jobs()
        
        return len(self.failures) == 0
    
    def to_json(self) -> dict:
        """Return results as JSON."""
        return {
            "passed": len(self.failures) == 0,
            "total": len(self.results),
            "passed_count": len(self.results) - len(self.failures),
            "failed_count": len(self.failures),
            "results": self.results,
            "failures": self.failures
        }
    
    def report(self) -> str:
        """Generate human-readable report."""
        lines = []
        lines.append(f"Health Check: {len(self.results) - len(self.failures)}/{len(self.results)} passed")
        lines.append("")
        
        for result in self.results:
            status = "✅" if result["passed"] else "❌"
            lines.append(f"{status} {result['name']}: {result['details']}")
        
        return "\n".join(lines)


def notify_discord(message: str) -> bool:
    """Send notification to Discord."""
    try:
        result = subprocess.run(
            ["openclaw", "message", "send",
             "--channel", "discord",
             "--target", DISCORD_CHANNEL,
             "--message", message],
            capture_output=True,
            text=True,
            timeout=30
        )
        return result.returncode == 0
    except subprocess.SubprocessError:
        return False


def post_to_mission_control(data: dict) -> bool:
    """Post health check results to Mission Control API."""
    import urllib.request
    import urllib.error
    
    try:
        req = urllib.request.Request(
            "http://localhost:3001/api/v1/system-health",
            data=json.dumps(data).encode(),
            method="POST",
            headers={"Content-Type": "application/json"}
        )
        
        with urllib.request.urlopen(req, timeout=10) as response:
            return response.status == 201
    except (urllib.error.URLError, urllib.error.HTTPError) as e:
        print(f"Failed to post to MC: {e}", file=sys.stderr)
        return False


def main():
    # Parse args
    json_output = "--json" in sys.argv
    
    # Run checks
    checker = HealthCheck()
    all_passed = checker.run_all()
    
    # Output
    if json_output:
        result = checker.to_json()
        print(json.dumps(result, indent=2))
    else:
        print(checker.report())
    
    # Post to Mission Control
    mc_data = checker.to_json()
    mc_data["source"] = "cron"
    if post_to_mission_control(mc_data):
        print("Posted to Mission Control")
    else:
        print("Failed to post to Mission Control", file=sys.stderr)
    
    # Notify on failures
    if not all_passed:
        message = f"⚠️ **Health Check Alert** — {len(checker.failures)} test(s) failed:\n\n"
        for f in checker.failures:
            message += f"• **{f['name']}**: {f['details']}\n"
        
        notify_discord(message)
        print(f"\nNotified Discord of {len(checker.failures)} failure(s)")
    
    # Exit code
    sys.exit(0 if all_passed else 1)


if __name__ == "__main__":
    main()
