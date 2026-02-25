#!/usr/bin/env python3
"""readability.py

Flesch-Kincaid grade scoring for a markdown post.

Usage:
  python readability.py path/to/post.md
  python readability.py path/to/post.md --json

Requires:
  pip install textstat

Output JSON schema (when --json):
  {"passed": bool, "value": float, "threshold": "≤8", "errors": []}
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path


GRADE_THRESHOLD = 8.0


def _strip_front_matter(md: str) -> str:
    # Remove YAML front matter if present
    if md.startswith("---"):
        parts = md.split("\n---", 1)
        if len(parts) == 2:
            # drop first --- ... --- block (keep remainder after closing marker)
            after = parts[1]
            # remove the leading newline after closing marker
            return after.lstrip("\n")
    return md


def _strip_markdown(md: str) -> str:
    """Best-effort markdown → plain text."""
    md = _strip_front_matter(md)

    # Remove code blocks (```...```)
    md = re.sub(r"```[\s\S]*?```", " ", md)
    # Remove inline code
    md = re.sub(r"`[^`]+`", " ", md)

    # Replace images with their alt text
    md = re.sub(r"!\[([^\]]*)\]\([^\)]+\)", r" \1 ", md)

    # Replace links with link text
    md = re.sub(r"\[([^\]]+)\]\(([^\)]+)\)", r" \1 ", md)
    # Autolinks <http://...>
    md = re.sub(r"<https?://[^>]+>", " ", md)

    # Headings / blockquotes / list markers
    md = re.sub(r"^\s{0,3}#{1,6}\s+", "", md, flags=re.MULTILINE)
    md = re.sub(r"^\s*>\s?", "", md, flags=re.MULTILINE)
    md = re.sub(r"^\s*[-*+]\s+", "", md, flags=re.MULTILINE)
    md = re.sub(r"^\s*\d+\.\s+", "", md, flags=re.MULTILINE)

    # Emphasis markers
    md = md.replace("**", " ").replace("*", " ").replace("_", " ")

    # Collapse whitespace
    md = re.sub(r"\s+", " ", md)
    return md.strip()


def score_readability(text: str) -> float:
    try:
        import textstat  # type: ignore
    except Exception as e:
        raise RuntimeError(
            "Missing dependency 'textstat'. Install with: pip install textstat"
        ) from e

    # textstat returns float (grade level)
    return float(textstat.flesch_kincaid_grade(text))


def check_readability(markdown: str, threshold: float = GRADE_THRESHOLD) -> dict:
    errors: list[str] = []
    try:
        plain = _strip_markdown(markdown)
        value = score_readability(plain)
        passed = value <= threshold
        return {
            "passed": passed,
            "value": round(value, 2),
            "threshold": f"≤{int(threshold) if threshold.is_integer() else threshold}",
            "errors": errors,
        }
    except Exception as e:
        errors.append(str(e))
        return {
            "passed": False,
            "value": None,
            "threshold": f"≤{int(threshold) if threshold.is_integer() else threshold}",
            "errors": errors,
        }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("post", help="Path to markdown file")
    ap.add_argument("--json", action="store_true", help="Output JSON")
    args = ap.parse_args()

    path = Path(args.post)
    markdown = path.read_text(encoding="utf-8")
    result = check_readability(markdown)

    if args.json:
        print(json.dumps(result, indent=2))
    else:
        print(f"Flesch-Kincaid grade: {result['value']} (threshold {result['threshold']})")
        print("PASS" if result["passed"] else "FAIL")
        if result.get("errors"):
            for err in result["errors"]:
                print(f"ERROR: {err}", file=sys.stderr)

    return 0 if result["passed"] else 2


if __name__ == "__main__":
    raise SystemExit(main())
