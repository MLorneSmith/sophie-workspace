#!/usr/bin/env python3
"""Show current status of the presentation examples pipeline from manifest."""

import json
from collections import Counter
from pathlib import Path

MANIFEST_PATH = Path(__file__).parent.parent / "presentation-research-manifest.json"

def main():
    manifest = json.loads(MANIFEST_PATH.read_text())
    presentations = manifest["presentations"]

    # Overall counts
    status_counts = Counter(p["status"] for p in presentations)
    firm_counts = Counter(p["firm"] for p in presentations)

    print(f"{'='*60}")
    print(f"PRESENTATION EXAMPLES PIPELINE STATUS")
    print(f"{'='*60}")
    print(f"\nTotal presentations in manifest: {len(presentations)}")
    print(f"\nBy status:")
    for status in ["new", "uploaded", "evaluated_kept", "evaluated_deleted", "failed", "skipped"]:
        count = status_counts.get(status, 0)
        if count:
            print(f"  {status:25s} {count:4d}")

    print(f"\nBy firm:")
    for firm, count in sorted(firm_counts.items()):
        firm_statuses = Counter(p["status"] for p in presentations if p["firm"] == firm)
        kept = firm_statuses.get("evaluated_kept", 0)
        deleted = firm_statuses.get("evaluated_deleted", 0)
        uploaded = firm_statuses.get("uploaded", 0)
        new = firm_statuses.get("new", 0)
        print(f"  {firm:20s} {count:3d} total | {kept:2d} kept | {deleted:2d} deleted | {uploaded:2d} uploaded | {new:2d} new")

    # Show kept presentations
    kept = [p for p in presentations if p["status"] == "evaluated_kept"]
    if kept:
        print(f"\n{'='*60}")
        print(f"BEST PRACTICE EXAMPLES ({len(kept)} presentations)")
        print(f"{'='*60}")
        for p in sorted(kept, key=lambda x: x.get("evaluation", {}).get("combined_score", 0), reverse=True):
            score = p.get("evaluation", {}).get("combined_score", "?")
            print(f"  [{score}] {p['firm']:12s} {p['title'][:60]}")

    # Show what's waiting
    uploaded = [p for p in presentations if p["status"] == "uploaded"]
    if uploaded:
        print(f"\n{'='*60}")
        print(f"AWAITING EVALUATION ({len(uploaded)} presentations)")
        print(f"{'='*60}")
        for p in uploaded[:10]:
            print(f"  {p['firm']:12s} {p['title'][:60]}")
        if len(uploaded) > 10:
            print(f"  ... and {len(uploaded)-10} more")


if __name__ == "__main__":
    main()
