#!/usr/bin/env python3
"""
Migrate existing BestPractices + Resources into the Captures system.

Each Resource becomes a Capture, with its linked BestPractices
packed into the extraction field.

One-time migration script.
"""

import json
import os
import subprocess
import sys
from datetime import datetime

MC_BASE_URL = "https://internal.slideheroes.com/api/v1"
CF_CLIENT_ID = os.environ.get("CF_ACCESS_CLIENT_ID", "")
CF_CLIENT_SECRET = os.environ.get("CF_ACCESS_CLIENT_SECRET", "")


def mc_get(path: str):
    result = subprocess.run(
        ["curl", "-s", f"{MC_BASE_URL}{path}",
         "-H", f"CF-Access-Client-Id: {CF_CLIENT_ID}",
         "-H", f"CF-Access-Client-Secret: {CF_CLIENT_SECRET}"],
        capture_output=True, text=True, timeout=15,
    )
    return json.loads(result.stdout) if result.returncode == 0 else None


def mc_post(path: str, data: dict):
    result = subprocess.run(
        ["curl", "-s", "-X", "POST", f"{MC_BASE_URL}{path}",
         "-H", "Content-Type: application/json",
         "-H", f"CF-Access-Client-Id: {CF_CLIENT_ID}",
         "-H", f"CF-Access-Client-Secret: {CF_CLIENT_SECRET}",
         "-d", json.dumps(data)],
        capture_output=True, text=True, timeout=15,
    )
    return json.loads(result.stdout) if result.returncode == 0 else None


def main():
    print("=== Migrate Practices → Captures ===")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")

    # Get all practices (they include embedded resource)
    practices = mc_get("/practices?limit=100")
    if not practices:
        print("No practices found")
        sys.exit(0)

    print(f"Found {len(practices)} practices")

    # Check existing captures to avoid duplicates
    existing_captures = mc_get("/captures?limit=500&status=all") or []
    existing_urls = {c.get("url", "") for c in existing_captures}
    print(f"Existing captures: {len(existing_captures)}")

    # Group practices by resource
    resources = {}
    for p in practices:
        resource = p.get("resource", {})
        if not resource:
            continue
        rid = resource.get("id", "")
        if rid not in resources:
            resources[rid] = {
                "url": resource.get("url", ""),
                "title": resource.get("title", ""),
                "author": resource.get("author"),
                "sourceType": resource.get("sourceType", "article"),
                "note": resource.get("note"),
                "practices": [],
            }
        resources[rid]["practices"].append({
            "practice": p.get("practice", ""),
            "domain": p.get("domain", ""),
            "context": p.get("context", ""),
            "implementation": p.get("implementation", ""),
        })

    print(f"Grouped into {len(resources)} resources\n")

    migrated = 0
    skipped = 0

    for rid, res in resources.items():
        url = res["url"]

        if url in existing_urls:
            print(f"  ⏭️  Skip (already exists): {url[:80]}")
            skipped += 1
            continue

        # Build extraction from practices
        extraction = {
            "practices": res["practices"],
            "practice_count": len(res["practices"]),
            "domains": list(set(p["domain"] for p in res["practices"] if p["domain"])),
        }

        # Build topic tags from domains
        domain_to_tag = {
            "Sales": "sales",
            "Marketing": "marketing",
            "Product": "product",
            "Operations": "operations",
            "Technical": "technical",
            "Leadership": "leadership",
            "Personal": "personal-development",
        }
        topic_tags = [domain_to_tag.get(d, d.lower()) for d in extraction["domains"]]
        topic_tags.append("best-practice")

        capture_data = {
            "url": url,
            "title": res["title"],
            "author": res["author"],
            "sourceType": res["sourceType"],
            "note": res["note"] or f"Migrated from practices DB ({len(res['practices'])} practices)",
            "intents": json.dumps(["best-practice"]),
            "topicTags": json.dumps(topic_tags),
            "extraction": json.dumps(extraction),
            "captureSource": "migration",
            "status": "processed",  # Already extracted
        }

        result = mc_post("/captures", capture_data)
        if result and "id" in result:
            print(f"  ✅ Migrated: {res['title'][:60]} ({len(res['practices'])} practices) → MC #{result['id']}")
            migrated += 1
        else:
            print(f"  ❌ Failed: {res['title'][:60]}")

    print(f"\n=== Done: {migrated} migrated, {skipped} skipped ===")


if __name__ == "__main__":
    main()
