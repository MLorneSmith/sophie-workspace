#!/usr/bin/env python3
"""
Feed Monitor Refresh

Fetches new articles from all configured RSS feeds.
No LLM calls - just API call and reporting.

Exit codes:
0 = Success
1 = Errors occurred
"""

import json
import sys
import urllib.request
import urllib.error

FEED_MONITOR_API = "http://localhost:3001/api/feed-monitor/fetch"


def refresh_feeds() -> tuple[bool, dict]:
    """Call the feed monitor fetch endpoint."""
    try:
        req = urllib.request.Request(
            FEED_MONITOR_API,
            method="POST",
            headers={"Content-Type": "application/json"}
        )
        
        with urllib.request.urlopen(req, timeout=60) as response:
            data = json.loads(response.read().decode())
            return True, data
    except urllib.error.URLError as e:
        return False, {"error": str(e)}
    except json.JSONDecodeError as e:
        return False, {"error": f"Invalid JSON response: {e}"}


def main():
    print("Refreshing Feed Monitor RSS feeds...")
    
    success, data = refresh_feeds()
    
    if not success:
        print(f"ERROR: {data.get('error', 'Unknown error')}", file=sys.stderr)
        sys.exit(1)
    
    # Parse results
    feeds_fetched = data.get("feedsFetched", data.get("feeds_fetched", 0))
    new_items = data.get("newItems", data.get("new_items", 0))
    errors = data.get("errors", [])
    
    # Report
    print(f"Feeds fetched: {feeds_fetched}")
    print(f"New items added: {new_items}")
    
    if errors:
        print(f"Errors: {len(errors)}")
        for e in errors:
            print(f"  - {e}")
        sys.exit(1)
    
    print("Done!")
    sys.exit(0)


if __name__ == "__main__":
    main()
