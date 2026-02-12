#!/usr/bin/env python3
"""
Expand the presentation catalog using web search for investor/earnings PDFs.

Instead of scraping EDGAR (which mostly has HTML exhibits), this searches
the open web for actual PDF presentations from public companies and
consulting firms.

Usage: python3 edgar-catalog-builder.py [--limit N] [--dry-run]
"""

import json
import sys
import subprocess
import re
from pathlib import Path
from datetime import datetime

CATALOG_PATH = Path.home() / "clawd/projects/presentation-examples/sources/catalog.json"

# Search queries targeting actual PDFs hosted on company/IR sites
SEARCH_QUERIES = [
    # Large cap investor presentations (these companies have great decks)
    'site:investor.apple.com filetype:pdf presentation',
    'site:ir.aboutamazon.com filetype:pdf presentation',
    'site:investor.google.com filetype:pdf presentation',
    'site:microsoft.com filetype:pdf investor presentation',
    'site:investor.fb.com filetype:pdf earnings presentation',
    'site:nvidia.com filetype:pdf investor presentation',
    'site:jpmorgan.com filetype:pdf investor presentation',
    'site:goldmansachs.com filetype:pdf investor presentation',
    'site:morganstanley.com filetype:pdf investor presentation',
    'site:blackrock.com filetype:pdf investor presentation',
    
    # Consulting firms (beyond what we have)
    'site:accenture.com filetype:pdf strategy presentation',
    'site:oliverwyman.com filetype:pdf insights presentation',
    'site:kearney.com filetype:pdf presentation',
    'site:rolandberger.com filetype:pdf study presentation',
    
    # Industry reports as presentations
    'filetype:pdf "investor presentation" "fiscal year" 2025',
    'filetype:pdf "investor day" presentation slides 2025',
    'filetype:pdf "earnings presentation" Q4 2024',
    'filetype:pdf "annual general meeting" presentation slides',
    'filetype:pdf "capital markets day" presentation 2025',
    
    # High-quality corporate presentations
    'site:mckinsey.com filetype:pdf presentation 2024 2025',
    'site:weforum.org filetype:pdf presentation 2025',
    'site:worldbank.org filetype:pdf presentation strategy',
]


def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=10, help="Queries to run")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    with open(CATALOG_PATH) as f:
        catalog = json.load(f)

    existing_urls = set()
    for group, entries in catalog["presentations"].items():
        for e in entries:
            if e.get("url"):
                existing_urls.add(e["url"])

    print(f"Existing catalog: {len(existing_urls)} URLs", flush=True)
    print(f"Running {min(args.limit, len(SEARCH_QUERIES))} queries...", flush=True)

    new_entries = []
    queries = SEARCH_QUERIES[:args.limit]

    for i, query in enumerate(queries):
        print(f"\n[{i+1}/{len(queries)}] {query}", flush=True)

        # Use web_search via the Brave API (same as the tool)
        # Since we're a script, we'll use the web_search endpoint if available,
        # or fall back to a simple approach
        try:
            # For now, just print the query — this script is meant to be run
            # by a sub-agent that has access to web_search
            print(f"  → Query ready for web_search", flush=True)
        except Exception as e:
            print(f"  ERROR: {e}", flush=True)

    print(f"\nThis script should be run by a sub-agent with web_search access.", flush=True)
    print(f"Queries prepared: {len(queries)}", flush=True)


if __name__ == "__main__":
    main()
