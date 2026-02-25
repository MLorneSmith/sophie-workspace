#!/usr/bin/env python3
"""link_checker.py

Extract and validate links from a markdown blog post.

- Extracts markdown links [text](url) excluding images
- Extracts autolinks <https://...>
- Validates internal links exist (relative filesystem paths)
- Optionally checks external links are live with --check-external

Usage:
  python link_checker.py path/to/post.md --json
  python link_checker.py path/to/post.md --check-external --json

Notes on internal link checking:
- Relative links like "../other.md" are checked relative to the post directory
- Links starting with "#" are ignored
- Links starting with "/" are treated as internal site links but cannot be
  checked reliably on the filesystem; they are reported as "unverified".
"""

from __future__ import annotations

import argparse
import json
import re
import time
from pathlib import Path
from urllib.parse import urlparse


def strip_front_matter(md: str) -> str:
    if not md.startswith("---"):
        return md
    lines = md.splitlines()
    if not lines or lines[0].strip() != "---":
        return md
    for i in range(1, len(lines)):
        if lines[i].strip() == "---":
            return "\n".join(lines[i + 1 :]).lstrip("\n")
    return md


def extract_links(md: str) -> list[str]:
    body = strip_front_matter(md)
    links = re.findall(r"(?<!!)\[[^\]]*\]\(([^\)]+)\)", body)
    links += re.findall(r"<\s*(https?://[^>\s]+)\s*>", body)
    out: list[str] = []
    for raw in links:
        raw = raw.strip()
        # Remove title: (url "title")
        if raw.startswith("http"):
            url = raw.split()[0]
        else:
            url = raw.split()[0]
        # strip surrounding <> in some md
        url = url.strip("<>")
        if url:
            out.append(url)
    # de-dupe, keep stable order
    seen = set()
    deduped: list[str] = []
    for u in out:
        if u not in seen:
            seen.add(u)
            deduped.append(u)
    return deduped


def classify_link(url: str) -> str:
    if url.startswith("mailto:"):
        return "ignore"
    if url.startswith("#"):
        return "anchor"
    if url.startswith("http://") or url.startswith("https://"):
        return "external"
    return "internal"


def check_internal_link(url: str, post_path: Path) -> dict:
    # Split anchor
    path_part = url.split("#", 1)[0]
    if not path_part or path_part == ".":
        return {"url": url, "passed": True, "kind": "internal", "detail": "anchor-only"}

    if path_part.startswith("/"):
        return {
            "url": url,
            "passed": True,
            "kind": "internal",
            "detail": "site-absolute (unverified)",
        }

    target = (post_path.parent / path_part).resolve()
    exists = target.exists()
    return {
        "url": url,
        "passed": bool(exists),
        "kind": "internal",
        "detail": str(target),
    }


def check_external_link(url: str, timeout: float = 6.0) -> dict:
    # Lazy import: allow running without requests if --check-external isn't used
    try:
        import requests  # type: ignore
    except Exception as e:
        return {
            "url": url,
            "passed": False,
            "kind": "external",
            "detail": "Missing dependency 'requests' (pip install requests)",
            "error": str(e),
        }

    headers = {
        "User-Agent": "ClawdbotLinkChecker/1.0 (+https://slideheroes.com)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    }

    try:
        # Some servers block HEAD; try HEAD then GET
        r = requests.head(url, allow_redirects=True, timeout=timeout, headers=headers)
        status = r.status_code
        if status >= 400 or status == 0:
            r = requests.get(url, allow_redirects=True, timeout=timeout, headers=headers)
            status = r.status_code
        return {
            "url": url,
            "passed": status < 400,
            "kind": "external",
            "detail": f"HTTP {status}",
        }
    except Exception as e:
        return {
            "url": url,
            "passed": False,
            "kind": "external",
            "detail": "request-failed",
            "error": str(e),
        }


def check_links(md: str, post_path: Path, check_external: bool = False, max_external: int = 50) -> dict:
    links = extract_links(md)

    internal_results: list[dict] = []
    external_results: list[dict] = []
    ignored: list[str] = []

    external_checked = 0

    for url in links:
        kind = classify_link(url)
        if kind in ("ignore", "anchor"):
            ignored.append(url)
            continue
        if kind == "internal":
            internal_results.append(check_internal_link(url, post_path))
            continue
        if kind == "external":
            if not check_external:
                external_results.append({"url": url, "passed": True, "kind": "external", "detail": "unchecked"})
            else:
                if external_checked >= max_external:
                    external_results.append({"url": url, "passed": True, "kind": "external", "detail": "skipped (limit)"})
                else:
                    external_results.append(check_external_link(url))
                    external_checked += 1
                    time.sleep(0.1)  # be polite

    internal_failed = [r for r in internal_results if not r.get("passed")]
    external_failed = [r for r in external_results if not r.get("passed")]

    passed = (len(internal_failed) == 0) and (len(external_failed) == 0)

    return {
        "passed": passed,
        "summary": {
            "total": len(links),
            "internal": len(internal_results),
            "external": len(external_results),
            "ignored": len(ignored),
            "internal_failed": len(internal_failed),
            "external_failed": len(external_failed),
        },
        "internal": internal_results,
        "external": external_results,
        "ignored": ignored,
        "errors": [],
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("post", help="Path to markdown file")
    ap.add_argument("--check-external", action="store_true", help="Verify external URLs are live")
    ap.add_argument("--json", action="store_true", help="Output JSON")
    args = ap.parse_args()

    post_path = Path(args.post)
    md = post_path.read_text(encoding="utf-8")

    result = check_links(md, post_path=post_path, check_external=args.check_external)

    if args.json:
        print(json.dumps(result, indent=2))
    else:
        print(json.dumps(result["summary"], indent=2))

    return 0 if result["passed"] else 2


if __name__ == "__main__":
    raise SystemExit(main())
