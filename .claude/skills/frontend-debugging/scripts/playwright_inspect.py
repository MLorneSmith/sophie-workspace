#!/usr/bin/env python3
"""
Playwright Page Inspector - Debug front-end issues via CLI

Captures screenshots, DOM structure, console logs, and network requests
from any URL using Playwright's bundled Chromium browser.

Usage:
    playwright_inspect.py <url> [options]

Options:
    --screenshot <path>     Save full-page screenshot to path
    --dump-html <path>      Save page HTML to path
    --selector <css>        Target specific element for HTML dump
    --console-logs          Capture and output console logs as JSON
    --network               Capture and output network requests as JSON
    --wait <ms>             Wait time after load (default: 2000ms)
    --viewport <WxH>        Set viewport size (default: 1920x1080)
    --output <path>         Save all debug data as JSON to path
    --headed                Run with visible browser (for debugging)
    --storage-state <path>  Load authentication state from JSON file
    --auth <role>           Use project auth state: test, owner, admin, payload-admin

Examples:
    # Take a screenshot
    playwright_inspect.py http://localhost:3000 --screenshot /tmp/page.png

    # Capture console errors
    playwright_inspect.py http://localhost:3000 --console-logs

    # Full debug capture
    playwright_inspect.py http://localhost:3000 --screenshot /tmp/page.png --console-logs --network --output /tmp/debug.json

    # Inspect specific component
    playwright_inspect.py http://localhost:3000 --selector ".dashboard-card" --dump-html /tmp/card.html

    # Debug authenticated Payload admin page
    playwright_inspect.py http://localhost:3021/admin --auth payload-admin --screenshot /tmp/payload-admin.png

    # Debug with custom storage state
    playwright_inspect.py http://localhost:3001/admin --storage-state /path/to/auth.json --screenshot /tmp/page.png

Requirements:
    pip install playwright
    playwright install chromium
"""

import argparse
import json
import os
import subprocess
import sys
from datetime import datetime
from pathlib import Path

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    print("Error: Playwright not installed. Run: pip install playwright && playwright install chromium")
    sys.exit(1)


# Auth state mappings: role -> filename in apps/e2e/.auth/
AUTH_STATE_FILES = {
    "test": "test1@slideheroes.com.json",
    "owner": "test2@slideheroes.com.json",
    "admin": "michael@slideheroes.com.json",
    "payload-admin": "payload-admin.json",
}


def get_project_root() -> Path:
    """Find the project root by looking for package.json or .git."""
    current = Path(__file__).resolve()
    for parent in current.parents:
        if (parent / "package.json").exists() or (parent / ".git").exists():
            return parent
    return Path.cwd()


def resolve_auth_state(role: str) -> Path | None:
    """Resolve auth state file path for the given role."""
    if role not in AUTH_STATE_FILES:
        print(f"Error: Unknown auth role '{role}'. Valid roles: {', '.join(AUTH_STATE_FILES.keys())}")
        sys.exit(1)

    project_root = get_project_root()
    auth_file = project_root / "apps" / "e2e" / ".auth" / AUTH_STATE_FILES[role]

    if not auth_file.exists():
        print(f"Warning: Auth state file not found: {auth_file}")
        print(f"Run the following to generate auth states:")
        print(f"  cd {project_root} && pnpm --filter web-e2e playwright test --project=setup")
        print("")
        print("Or manually run the global setup:")
        print(f"  cd {project_root}/apps/e2e && npx playwright test --config=playwright.config.ts --project=setup")
        return None

    return auth_file


def check_auth_states_exist() -> dict[str, bool]:
    """Check which auth states exist."""
    project_root = get_project_root()
    auth_dir = project_root / "apps" / "e2e" / ".auth"

    result = {}
    for role, filename in AUTH_STATE_FILES.items():
        result[role] = (auth_dir / filename).exists()
    return result


def parse_viewport(viewport_str: str) -> tuple[int, int]:
    """Parse viewport string like '1920x1080' into (width, height)."""
    try:
        w, h = viewport_str.lower().split('x')
        return int(w), int(h)
    except ValueError:
        print(f"Invalid viewport format: {viewport_str}. Use WxH (e.g., 1920x1080)")
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(
        description="Playwright Page Inspector - Debug front-end issues via CLI",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s http://localhost:3000 --screenshot /tmp/page.png
  %(prog)s http://localhost:3000 --console-logs --network
  %(prog)s http://localhost:3000 --selector ".card" --dump-html /tmp/card.html
        """
    )
    parser.add_argument('url', help='URL to inspect')
    parser.add_argument('--screenshot', metavar='PATH', help='Save full-page screenshot')
    parser.add_argument('--dump-html', metavar='PATH', help='Save page HTML')
    parser.add_argument('--selector', metavar='CSS', help='CSS selector for targeted HTML dump')
    parser.add_argument('--console-logs', action='store_true', help='Capture console logs')
    parser.add_argument('--network', action='store_true', help='Capture network requests')
    parser.add_argument('--wait', type=int, default=2000, metavar='MS', help='Wait after load (ms)')
    parser.add_argument('--viewport', default='1920x1080', metavar='WxH', help='Viewport size')
    parser.add_argument('--output', metavar='PATH', help='Save all data as JSON')
    parser.add_argument('--headed', action='store_true', help='Run with visible browser')
    parser.add_argument('--storage-state', metavar='PATH', help='Load auth state from JSON file')
    parser.add_argument('--auth', metavar='ROLE', choices=['test', 'owner', 'admin', 'payload-admin'],
                        help='Use project auth state (test, owner, admin, payload-admin)')
    parser.add_argument('--list-auth', action='store_true', help='List available auth states and exit')

    args = parser.parse_args()

    # Handle --list-auth
    if args.list_auth:
        print("Available authentication states:")
        print("=" * 50)
        auth_states = check_auth_states_exist()
        for role, exists in auth_states.items():
            status = "✓ Available" if exists else "✗ Not found"
            print(f"  {role:15} {status}")
        print("")
        if not all(auth_states.values()):
            project_root = get_project_root()
            print("To generate missing auth states:")
            print(f"  cd {project_root} && pnpm --filter web-e2e playwright test --project=setup")
        sys.exit(0)

    # Resolve storage state
    storage_state_path = None
    if args.auth:
        storage_state_path = resolve_auth_state(args.auth)
        if storage_state_path:
            print(f"Using auth state: {args.auth} ({storage_state_path})")
    elif args.storage_state:
        storage_state_path = Path(args.storage_state)
        if not storage_state_path.exists():
            print(f"Error: Storage state file not found: {storage_state_path}")
            sys.exit(1)
        print(f"Using storage state: {storage_state_path}")

    # Parse viewport
    width, height = parse_viewport(args.viewport)

    # Data collectors
    console_logs = []
    page_errors = []
    network_requests = []

    debug_data = {
        "url": args.url,
        "timestamp": datetime.now().isoformat(),
        "viewport": {"width": width, "height": height},
    }

    with sync_playwright() as p:
        # Launch browser
        browser = p.chromium.launch(headless=not args.headed)

        # Create context with optional storage state for authentication
        context_options = {"viewport": {"width": width, "height": height}}
        if storage_state_path:
            context_options["storage_state"] = str(storage_state_path)
            debug_data["auth"] = {
                "role": args.auth if args.auth else "custom",
                "storage_state": str(storage_state_path),
            }

        context = browser.new_context(**context_options)
        page = context.new_page()

        # Set up console log capture
        if args.console_logs or args.output:
            def handle_console(msg):
                console_logs.append({
                    "type": msg.type,
                    "text": msg.text,
                    "location": {
                        "url": msg.location.get("url", ""),
                        "line": msg.location.get("lineNumber", 0),
                        "column": msg.location.get("columnNumber", 0),
                    } if msg.location else None
                })
            page.on("console", handle_console)

            def handle_page_error(error):
                page_errors.append({
                    "message": str(error),
                    "name": type(error).__name__
                })
            page.on("pageerror", handle_page_error)

        # Set up network capture
        if args.network or args.output:
            def handle_response(response):
                request = response.request
                network_requests.append({
                    "url": request.url,
                    "method": request.method,
                    "status": response.status,
                    "statusText": response.status_text,
                    "resourceType": request.resource_type,
                    "contentType": response.headers.get("content-type", ""),
                    "timing": {
                        "responseEnd": response.request.timing.get("responseEnd", 0)
                    } if hasattr(response.request, "timing") else None
                })
            page.on("response", handle_response)

        # Navigate to URL
        try:
            page.goto(args.url, wait_until="networkidle", timeout=60000)
        except Exception as e:
            print(f"Error loading page: {e}", file=sys.stderr)
            debug_data["error"] = str(e)

        # Additional wait if specified
        if args.wait > 0:
            page.wait_for_timeout(args.wait)

        # Take screenshot
        if args.screenshot:
            screenshot_path = Path(args.screenshot)
            screenshot_path.parent.mkdir(parents=True, exist_ok=True)
            page.screenshot(path=str(screenshot_path), full_page=True)
            print(f"Screenshot saved: {screenshot_path}")
            debug_data["screenshot"] = str(screenshot_path)

        # Dump HTML
        if args.dump_html:
            html_path = Path(args.dump_html)
            html_path.parent.mkdir(parents=True, exist_ok=True)

            if args.selector:
                # Get HTML of specific element
                element = page.locator(args.selector).first
                if element:
                    html_content = element.inner_html()
                    debug_data["selector"] = args.selector
                else:
                    html_content = f"<!-- Element not found: {args.selector} -->"
                    print(f"Warning: Element not found: {args.selector}", file=sys.stderr)
            else:
                # Get full page HTML
                html_content = page.content()

            html_path.write_text(html_content)
            print(f"HTML saved: {html_path}")
            debug_data["html_dump"] = str(html_path)

        # Close browser
        browser.close()

    # Add collected data
    if args.console_logs or args.output:
        debug_data["console"] = console_logs
        debug_data["pageErrors"] = page_errors

    if args.network or args.output:
        debug_data["network"] = network_requests

    # Output console logs
    if args.console_logs:
        print("\n=== Console Logs ===")
        for log in console_logs:
            print(f"[{log['type']}] {log['text']}")

        if page_errors:
            print("\n=== Page Errors ===")
            for error in page_errors:
                print(f"[{error['name']}] {error['message']}")

    # Output network requests
    if args.network:
        print("\n=== Network Requests ===")
        for req in network_requests:
            status_emoji = "✓" if 200 <= req['status'] < 400 else "✗"
            print(f"{status_emoji} {req['status']} {req['method']} {req['url'][:80]}")

    # Save full debug data
    if args.output:
        output_path = Path(args.output)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(json.dumps(debug_data, indent=2))
        print(f"\nDebug data saved: {output_path}")

    # Summary
    if args.console_logs or args.network:
        print(f"\nSummary:")
        print(f"  Console messages: {len(console_logs)}")
        print(f"  Page errors: {len(page_errors)}")
        print(f"  Network requests: {len(network_requests)}")

        # Count error types
        errors = [r for r in network_requests if r['status'] >= 400]
        if errors:
            print(f"  Failed requests: {len(errors)}")
            for e in errors[:5]:  # Show first 5
                print(f"    - {e['status']} {e['url'][:60]}")


if __name__ == "__main__":
    main()
