#!/usr/bin/env python3
"""
Weekly Catalog Expansion

Expands the presentation catalog by:
1. Discovering new presentation sources (LLM-assisted)
2. Verifying URLs are valid (deterministic)
3. Adding entries to catalog.json

This script handles the deterministic parts. The LLM discovery is done
via a separate call or can be integrated if needed.

Exit codes:
0 = Success
1 = Errors occurred
"""

import json
import re
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path

# Configuration
CATALOG_PATH = Path.home() / "clawd/projects/presentation-examples/sources/catalog.json"
REGISTER_PATH = Path.home() / "clawd/projects/presentation-examples/sources/register.json"
DISCORD_CHANNEL = "1468015498330308621"  # #inbox-sophie

# Known presentation sources (curated list for deterministic expansion)
KNOWN_SOURCES = {
    "mckinsey": {
        "base_url": "https://www.mckinsey.com",
        "patterns": [r"/insights/.*", r"/featured-insights/.*"],
        "type": "consulting"
    },
    "bcg": {
        "base_url": "https://www.bcg.com",
        "patterns": [r"/publications/.*", r"/insights/.*"],
        "type": "consulting"
    },
    "bain": {
        "base_url": "https://www.bain.com",
        "patterns": [r"/insights/.*", r"/publications/.*"],
        "type": "consulting"
    },
    "deloitte": {
        "base_url": "https://www2.deloitte.com",
        "patterns": [r"/insights/.*", r"/content/.*"],
        "type": "consulting"
    },
    "accenture": {
        "base_url": "https://www.accenture.com",
        "patterns": [r"/insights/.*"],
        "type": "consulting"
    },
    "slideshare": {
        "base_url": "https://www.slideshare.net",
        "patterns": [r"/[^/]+/[^/]+"],
        "type": "platform"
    },
    "speakerdeck": {
        "base_url": "https://speakerdeck.com",
        "patterns": [r"/[^/]+/[^/]+"],
        "type": "platform"
    }
}


def load_catalog() -> dict:
    """Load the catalog file."""
    if not CATALOG_PATH.exists():
        CATALOG_PATH.parent.mkdir(parents=True, exist_ok=True)
        return {"presentations": {}}
    
    with open(CATALOG_PATH) as f:
        return json.load(f)


def save_catalog(catalog: dict):
    """Save the catalog file."""
    CATALOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(CATALOG_PATH, "w") as f:
        json.dump(catalog, f, indent=2, sort_keys=True)


def verify_url(url: str, timeout: int = 10) -> tuple[bool, str]:
    """Verify a URL is accessible."""
    try:
        result = subprocess.run(
            ["curl", "-sf", "-I", "--connect-timeout", str(timeout),
             "--max-time", str(timeout * 2), "-L", url],
            capture_output=True,
            text=True,
            timeout=timeout * 3
        )
        
        if result.returncode != 0:
            return False, "HTTP request failed"
        
        # Check for 200 OK in headers
        if "200 OK" in result.stdout or "HTTP/2 200" in result.stdout:
            return True, "OK"
        
        # Check for redirect
        if "301" in result.stdout or "302" in result.stdout:
            return True, "OK (redirect)"
        
        return False, f"Non-200 status: {result.stdout.split()[1] if result.stdout else 'unknown'}"
    except subprocess.TimeoutExpired:
        return False, "Timeout"
    except Exception as e:
        return False, str(e)


def get_content_type(url: str) -> str:
    """Get the content type of a URL."""
    try:
        result = subprocess.run(
            ["curl", "-sf", "-I", "--connect-timeout", "5", "-L", url],
            capture_output=True,
            text=True,
            timeout=15
        )
        
        for line in result.stdout.split("\n"):
            if line.lower().startswith("content-type:"):
                return line.split(":", 1)[1].strip()
        
        return "unknown"
    except Exception:
        return "unknown"


def url_exists_in_catalog(url: str, catalog: dict) -> bool:
    """Check if URL already exists in catalog."""
    for group, entries in catalog.get("presentations", {}).items():
        for entry in entries:
            if entry.get("url") == url:
                return True
    return False


def add_to_catalog(catalog: dict, source: str, url: str, title: str, **kwargs):
    """Add a new entry to the catalog."""
    catalog.setdefault("presentations", {}).setdefault(source, [])
    
    entry = {
        "url": url,
        "title": title,
        "added": datetime.now().strftime("%Y-%m-%d"),
        **kwargs
    }
    
    catalog["presentations"][source].append(entry)
    return entry


def verify_existing_urls(catalog: dict) -> dict:
    """Verify all existing URLs in the catalog."""
    stats = {
        "total": 0,
        "valid": 0,
        "invalid": 0,
        "invalid_urls": []
    }
    
    for group, entries in catalog.get("presentations", {}).items():
        for entry in entries:
            url = entry.get("url", "")
            if not url:
                continue
            
            stats["total"] += 1
            
            # Skip non-http URLs
            if not url.startswith("http"):
                continue
            
            valid, msg = verify_url(url)
            if valid:
                stats["valid"] += 1
            else:
                stats["invalid"] += 1
                stats["invalid_urls"].append({
                    "url": url,
                    "title": entry.get("title", "Untitled"),
                    "reason": msg
                })
    
    return stats


def expand_from_known_sources(catalog: dict, max_per_source: int = 2) -> list:
    """
    Expand catalog from known sources.
    This is a deterministic fallback when LLM discovery isn't available.
    """
    added = []
    
    # This would need actual implementation based on how sources are discovered
    # For now, it's a placeholder that shows the structure
    
    # Example: Add from a pending queue or discovered URLs file
    pending_path = CATALOG_PATH.parent / "pending-urls.json"
    if pending_path.exists():
        with open(pending_path) as f:
            pending = json.load(f)
        
        for item in pending.get("urls", [])[:max_per_source * len(KNOWN_SOURCES)]:
            url = item.get("url", "")
            if not url or url_exists_in_catalog(url, catalog):
                continue
            
            # Verify URL
            valid, msg = verify_url(url)
            if not valid:
                print(f"  Skipping invalid URL: {url} ({msg})")
                continue
            
            # Add to catalog
            source = item.get("source", "unknown")
            title = item.get("title", "Untitled Presentation")
            
            entry = add_to_catalog(catalog, source, url, title)
            added.append(entry)
            print(f"  Added: {title}")
    
    return added


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


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="Weekly Catalog Expansion")
    parser.add_argument("--verify", action="store_true", help="Verify existing URLs")
    parser.add_argument("--expand", action="store_true", help="Expand from known sources")
    parser.add_argument("--add", nargs=3, metavar=("SOURCE", "URL", "TITLE"),
                       help="Add a single entry")
    parser.add_argument("--max", type=int, default=10, help="Max entries to add")
    args = parser.parse_args()
    
    print("=== Weekly Catalog Expansion ===")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    catalog = load_catalog()
    changes = False
    
    # Verify existing URLs
    if args.verify:
        print("Verifying existing URLs...")
        stats = verify_existing_urls(catalog)
        print(f"  Total: {stats['total']}")
        print(f"  Valid: {stats['valid']}")
        print(f"  Invalid: {stats['invalid']}")
        
        if stats["invalid_urls"]:
            print("\n  Invalid URLs:")
            for item in stats["invalid_urls"][:10]:
                print(f"    - {item['title']}: {item['reason']}")
    
    # Add single entry
    if args.add:
        source, url, title = args.add
        print(f"\nAdding entry: {title}")
        
        if url_exists_in_catalog(url, catalog):
            print("  URL already exists in catalog")
        else:
            valid, msg = verify_url(url)
            if valid:
                add_to_catalog(catalog, source, url, title)
                changes = True
                print(f"  Added successfully")
            else:
                print(f"  URL verification failed: {msg}")
    
    # Expand from known sources
    if args.expand:
        print(f"\nExpanding from known sources (max {args.max})...")
        added = expand_from_known_sources(catalog, max_per_source=args.max // len(KNOWN_SOURCES))
        if added:
            changes = True
            print(f"  Added {len(added)} entries")
        else:
            print("  No new entries added")
    
    # Save if changes made
    if changes:
        save_catalog(catalog)
        print("\nCatalog saved")
        
        # Notify
        msg = f"📚 **Catalog Expanded**\n\nAdded {len(added) if args.expand else 1} new presentation source(s)"
        notify_discord(msg)
    
    print("\nDone!")
    sys.exit(0)


if __name__ == "__main__":
    main()
