#!/usr/bin/env python3
"""validate_post.py

Master validator for blog post quality gates.

Runs:
- readability (blocking)
- SEO checks (word count, h2 count, meta description length) (blocking)
- link counts + keyword density (warnings)
- optional link validation (internal files; external with --check-external)

Usage:
  python validate_post.py path/to/post.md
  python validate_post.py path/to/post.md --keyword "primary keyword" --check-external

Output:
  JSON report to stdout.

Exit codes:
  0 = passed (all blocking checks passed)
  2 = failed (one or more blocking checks failed)
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path


def compute_score(checks: dict, warnings: list[str], errors: list[str]) -> int:
    """Simple 0-100 scoring.

- Start 100
- -25 per failed blocking check
- -10 per warning item
- -10 per error item
"""
    score = 100
    for _, v in checks.items():
        if v.get("blocking") and not v.get("passed"):
            score -= 25
    score -= 10 * len(warnings)
    score -= 10 * len(errors)
    return max(0, min(100, score))


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("post", help="Path to markdown file")
    ap.add_argument("--keyword", help="Primary keyword/phrase (for keyword density)")
    ap.add_argument(
        "--check-external",
        action="store_true",
        help="Verify external links are live (requires requests)",
    )
    args = ap.parse_args()

    post_path = Path(args.post)
    md = post_path.read_text(encoding="utf-8")

    # Local imports (allow running from any CWD)
    import sys
    script_dir = str(Path(__file__).resolve().parent)
    if script_dir not in sys.path:
        sys.path.insert(0, script_dir)

    from readability import check_readability
    from seo_score import check_seo, pick_primary_keyword
    from link_checker import check_links

    warnings: list[str] = []
    errors: list[str] = []
    checks: dict[str, dict] = {}

    # Readability (blocking)
    r = check_readability(md)
    checks["readability"] = {
        "passed": r["passed"],
        "value": r["value"],
        "threshold": r["threshold"],
        "blocking": True,
    }
    errors.extend(r.get("errors") or [])

    # SEO checks (mix of blocking & warnings)
    kw = args.keyword or pick_primary_keyword(md)
    seo = check_seo(md, primary_keyword=kw)
    for name, data in seo["checks"].items():
        checks[name] = data
    warnings.extend(seo.get("warnings") or [])
    errors.extend(seo.get("errors") or [])

    # Link validation (doesn't affect pass/fail by default; errors become warnings)
    link_report = check_links(md, post_path=post_path, check_external=args.check_external)
    if not link_report.get("passed"):
        # Convert failures to warnings (non-blocking) but keep details
        warnings.append(
            f"Link validation found {link_report['summary']['internal_failed']} broken internal and {link_report['summary']['external_failed']} broken external link(s)"
        )

    blocking_failed = any(v.get("blocking") and not v.get("passed") for v in checks.values())
    passed = not blocking_failed

    report = {
        "passed": passed,
        "score": compute_score(checks, warnings, errors),
        "checks": checks,
        "warnings": warnings,
        "errors": errors,
        "details": {
            "links": link_report,
        },
    }

    print(json.dumps(report, indent=2))
    return 0 if passed else 2


if __name__ == "__main__":
    raise SystemExit(main())
