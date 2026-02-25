#!/usr/bin/env python3
"""seo_score.py

SEO quality checks for a markdown blog post.

Checks (thresholds from design doc):
- Word count: ≥ 1000 (blocking)
- H2 count: ≥ 3 (blocking)
- Meta description length: 120-160 chars (blocking)
- Internal links: ≥ 2 (warning)
- External links: ≥ 1 (warning)
- Keyword density for primary keyword: 1-2% (warning)

Usage:
  python seo_score.py path/to/post.md --keyword "primary keyword" --json

Keyword selection:
- If --keyword is omitted, tries front matter seo_keywords[0] or seo_keywords: "..."

Output JSON schema (when --json):
  {"checks": {...}, "warnings": [...], "errors": [...]}
"""

from __future__ import annotations

import argparse
import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any


MIN_WORDS = 1000
MIN_H2 = 3
META_MIN = 120
META_MAX = 160
KD_MIN = 1.0
KD_MAX = 2.0


@dataclass
class FrontMatter:
    data: dict[str, Any]


def parse_front_matter(md: str) -> FrontMatter:
    """Parse a minimal YAML-ish front matter.

We intentionally avoid PyYAML dependency; we support simple key: value,
key: [a, b] and multiline with | is not supported here.
"""
    data: dict[str, Any] = {}
    if not md.startswith("---"):
        return FrontMatter(data)

    # Find closing --- on its own line
    m = re.search(r"^---\s*$", md, flags=re.MULTILINE)
    if not m:
        return FrontMatter(data)

    # First line is ---; find next ---
    lines = md.splitlines()
    if not lines or lines[0].strip() != "---":
        return FrontMatter(data)

    end_idx = None
    for i in range(1, len(lines)):
        if lines[i].strip() == "---":
            end_idx = i
            break
    if end_idx is None:
        return FrontMatter(data)

    fm_lines = lines[1:end_idx]
    for line in fm_lines:
        if not line.strip() or line.strip().startswith("#"):
            continue
        if ":" not in line:
            continue
        key, val = line.split(":", 1)
        key = key.strip()
        val = val.strip()
        # strip quotes
        if (val.startswith('"') and val.endswith('"')) or (val.startswith("'") and val.endswith("'")):
            val = val[1:-1]
        # list: [a, b]
        if val.startswith("[") and val.endswith("]"):
            inner = val[1:-1].strip()
            if not inner:
                data[key] = []
            else:
                items = [x.strip() for x in inner.split(",")]
                items = [x[1:-1] if (x.startswith('"') and x.endswith('"')) or (x.startswith("'") and x.endswith("'")) else x for x in items]
                data[key] = [x for x in items if x]
        else:
            data[key] = val

    return FrontMatter(data)


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


def count_words(text: str) -> int:
    # Rough word count, excluding code blocks
    text = re.sub(r"```[\s\S]*?```", " ", text)
    text = strip_front_matter(text)
    words = re.findall(r"\b[\w']+\b", text)
    return len(words)


def count_h2(md: str) -> int:
    body = strip_front_matter(md)
    h2 = re.findall(r"^\s*##\s+.+$", body, flags=re.MULTILINE)
    return len(h2)


def extract_links(md: str) -> tuple[list[str], list[str]]:
    """Return (internal_links, external_links)."""
    body = strip_front_matter(md)
    # standard markdown links [text](url)
    links = re.findall(r"(?<!!)\[[^\]]*\]\(([^\)]+)\)", body)
    # autolinks <http://...>
    links += re.findall(r"<\s*(https?://[^>\s]+)\s*>", body)

    internal: list[str] = []
    external: list[str] = []
    for url in links:
        url = url.strip()
        # strip title part in (url "title")
        if " " in url and not url.startswith("http"):
            url = url.split(" ", 1)[0]
        if url.startswith("http://") or url.startswith("https://"):
            external.append(url)
        elif url.startswith("mailto:"):
            continue
        elif url.startswith("#") or url == "":
            continue
        else:
            internal.append(url)

    return internal, external


def extract_meta_description(md: str) -> str | None:
    fm = parse_front_matter(md).data
    val = fm.get("meta_description") or fm.get("description")
    if isinstance(val, str) and val.strip():
        return val.strip()
    return None


def pick_primary_keyword(md: str) -> str | None:
    fm = parse_front_matter(md).data
    kw = fm.get("seo_keywords") or fm.get("keywords")
    if isinstance(kw, list) and kw:
        first = kw[0]
        if isinstance(first, str) and first.strip():
            return first.strip()
    if isinstance(kw, str) and kw.strip():
        return kw.strip()
    return None


def keyword_density(md: str, keyword: str) -> float:
    body = strip_front_matter(md)
    # remove code blocks
    body = re.sub(r"```[\s\S]*?```", " ", body)
    # remove URLs to avoid inflating
    body = re.sub(r"https?://\S+", " ", body)
    # plain-ish tokens
    tokens = re.findall(r"\b[\w']+\b", body.lower())
    if not tokens:
        return 0.0

    # match keyword as a phrase over normalized whitespace
    phrase = re.sub(r"\s+", " ", keyword.strip().lower())
    hay = re.sub(r"\s+", " ", body.lower())

    # count whole-phrase occurrences using word boundaries on ends
    # e.g. phrase='presentation structure' should match that phrase
    pattern = r"\b" + re.escape(phrase) + r"\b"
    occurrences = len(re.findall(pattern, hay))

    # Approximate: density = (occurrences * words_in_phrase) / total_words
    phrase_words = max(1, len(phrase.split()))
    density = (occurrences * phrase_words) / len(tokens) * 100.0
    return density


def check_seo(md: str, primary_keyword: str | None = None) -> dict:
    errors: list[str] = []
    warnings: list[str] = []
    checks: dict[str, dict] = {}

    wc = count_words(md)
    checks["word_count"] = {
        "passed": wc >= MIN_WORDS,
        "value": wc,
        "threshold": f"≥{MIN_WORDS}",
        "blocking": True,
    }

    h2c = count_h2(md)
    checks["h2_count"] = {
        "passed": h2c >= MIN_H2,
        "value": h2c,
        "threshold": f"≥{MIN_H2}",
        "blocking": True,
    }

    meta = extract_meta_description(md)
    meta_len = len(meta) if meta else 0
    meta_passed = meta is not None and META_MIN <= meta_len <= META_MAX
    checks["meta_description"] = {
        "passed": meta_passed,
        "value": meta_len,
        "threshold": f"{META_MIN}-{META_MAX} chars",
        "blocking": True,
    }
    if meta is None:
        errors.append("Missing meta_description in front matter")

    internal, external = extract_links(md)
    checks["internal_links"] = {
        "passed": len(internal) >= 2,
        "value": len(internal),
        "threshold": "≥2",
        "blocking": False,
    }
    if len(internal) < 2:
        warnings.append(f"Only {len(internal)} internal link(s) found")

    checks["external_links"] = {
        "passed": len(external) >= 1,
        "value": len(external),
        "threshold": "≥1",
        "blocking": False,
    }
    if len(external) < 1:
        warnings.append("No external links found")

    if primary_keyword:
        kd = keyword_density(md, primary_keyword)
        kd_pass = KD_MIN <= kd <= KD_MAX
        checks["keyword_density"] = {
            "passed": kd_pass,
            "value": round(kd, 2),
            "threshold": f"{KD_MIN}-{KD_MAX}%",
            "blocking": False,
            "keyword": primary_keyword,
        }
        if not kd_pass:
            warnings.append(
                f"Keyword density for '{primary_keyword}' is {kd:.2f}% (target {KD_MIN}-{KD_MAX}%)"
            )
    else:
        checks["keyword_density"] = {
            "passed": True,
            "value": None,
            "threshold": f"{KD_MIN}-{KD_MAX}%",
            "blocking": False,
            "keyword": None,
        }
        warnings.append("Primary keyword not provided (skipping keyword density check)")

    return {"checks": checks, "warnings": warnings, "errors": errors}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("post", help="Path to markdown file")
    ap.add_argument("--keyword", help="Primary keyword/phrase")
    ap.add_argument("--json", action="store_true", help="Output JSON")
    args = ap.parse_args()

    md = Path(args.post).read_text(encoding="utf-8")
    kw = args.keyword or pick_primary_keyword(md)
    result = check_seo(md, primary_keyword=kw)

    if args.json:
        print(json.dumps(result, indent=2))
    else:
        for k, v in result["checks"].items():
            status = "PASS" if v["passed"] else "FAIL"
            print(f"{k}: {status} (value={v['value']}, threshold={v['threshold']})")
        if result["warnings"]:
            print("Warnings:")
            for w in result["warnings"]:
                print(f"- {w}")
        if result["errors"]:
            print("Errors:")
            for e in result["errors"]:
                print(f"- {e}")

    # exit code: 0 if all blocking checks pass, else 2
    blocking_failed = any(v.get("blocking") and not v.get("passed") for v in result["checks"].values())
    return 0 if not blocking_failed else 2


if __name__ == "__main__":
    raise SystemExit(main())
