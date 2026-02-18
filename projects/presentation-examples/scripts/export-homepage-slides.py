#!/usr/bin/env python3
"""Export top slide images ranked by design score.

Reads `presentation-research-manifest.json` for decks with `status=evaluated_kept` and an
`evaluation.design_average` score.

For each kept deck:
- downloads the PDF from R2 (S3-compatible)
- renders the first N pages to 16:9 WebP images (~1600x900) suitable for homepage placeholders
- assigns each rendered slide the deck's design_average as its score (until per-slide scoring exists)

Outputs:
- outputs/homepage-slides/images/
- outputs/homepage-slides/report.json
- outputs/homepage-slides/report.md

This follows the same R2 env-var patterns used by evaluate-presentations.py.

Env vars:
- R2_ACCOUNT_ID
- R2_ACCESS_KEY_ID
- R2_SECRET_ACCESS_KEY
- R2_BUCKET_NAME

Optional:
- R2_PREFIX (if your keys are under a prefix)

Requires:
- pdftoppm
- ffmpeg
"""

import argparse
import json
import os
import re
import subprocess
import tempfile
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import boto3
from botocore.config import Config

HERE = Path(__file__).resolve()
ROOT = HERE.parent.parent
MANIFEST_PATH = ROOT / "presentation-research-manifest.json"

R2_ACCOUNT_ID = os.environ.get("R2_ACCOUNT_ID")
R2_ACCESS_KEY_ID = os.environ.get("R2_ACCESS_KEY_ID")
R2_SECRET_ACCESS_KEY = os.environ.get("R2_SECRET_ACCESS_KEY")
R2_BUCKET_NAME = os.environ.get("R2_BUCKET_NAME")


def get_s3_client():
    missing = [
        k
        for k, v in {
            "R2_ACCOUNT_ID": R2_ACCOUNT_ID,
            "R2_ACCESS_KEY_ID": R2_ACCESS_KEY_ID,
            "R2_SECRET_ACCESS_KEY": R2_SECRET_ACCESS_KEY,
            "R2_BUCKET_NAME": R2_BUCKET_NAME,
        }.items()
        if not v
    ]
    if missing:
        raise SystemExit(f"Missing env vars: {', '.join(missing)}")

    return boto3.client(
        "s3",
        endpoint_url=f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET_ACCESS_KEY,
        config=Config(signature_version="s3v4"),
    )


def load_manifest() -> dict[str, Any]:
    if not MANIFEST_PATH.exists():
        raise SystemExit(f"ERROR: {MANIFEST_PATH} not found")
    return json.loads(MANIFEST_PATH.read_text())


def safe_slug(s: str) -> str:
    s = s.strip().lower()
    s = re.sub(r"\s+", "-", s)
    s = re.sub(r"[^a-z0-9._-]+", "-", s)
    s = re.sub(r"-+", "-", s).strip("-")
    return s or "deck"


def run(cmd: list[str]):
    proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    if proc.returncode != 0:
        raise RuntimeError(f"Command failed ({proc.returncode}): {' '.join(cmd)}\n{proc.stdout}")


def render_page_to_png(pdf_path: Path, page: int, out_png: Path):
    out_prefix = out_png.with_suffix("")
    run(
        [
            "pdftoppm",
            "-f",
            str(page),
            "-l",
            str(page),
            "-png",
            "-singlefile",
            str(pdf_path),
            str(out_prefix),
        ]
    )
    produced = out_prefix.with_suffix(".png")
    if not produced.exists():
        raise RuntimeError(f"pdftoppm did not produce expected file: {produced}")
    if produced != out_png:
        produced.replace(out_png)


def normalize_to_16x9_webp(in_png: Path, out_webp: Path):
    # 16:9, ~1600px wide => 1600x900. Letterbox with white background.
    run(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(in_png),
            "-vf",
            "scale=1600:900:force_original_aspect_ratio=decrease,"
            "pad=1600:900:(ow-iw)/2:(oh-ih)/2:color=white",
            "-q:v",
            "80",
            str(out_webp),
        ]
    )


@dataclass
class SlideRow:
    deck_id: str
    title: str
    firm: str
    r2_key: str
    page: int
    design_score: float
    image_file: str


def main():
    ap = argparse.ArgumentParser(description="Export top homepage slides from kept decks")
    ap.add_argument("--out", default=str(ROOT / "outputs" / "homepage-slides"))
    ap.add_argument("--slides-per-deck", type=int, default=3)
    ap.add_argument("--top", type=int, default=20)
    ap.add_argument("--max-decks", type=int, default=400)
    ap.add_argument("--force", action="store_true", help="re-download and re-render images")
    args = ap.parse_args()

    out_dir = Path(args.out).resolve()
    images_dir = out_dir / "images"
    pdf_dir = out_dir / "pdfs"
    tmp_dir = out_dir / "tmp"
    out_dir.mkdir(parents=True, exist_ok=True)
    images_dir.mkdir(parents=True, exist_ok=True)
    pdf_dir.mkdir(parents=True, exist_ok=True)
    tmp_dir.mkdir(parents=True, exist_ok=True)

    manifest = load_manifest()
    pres = manifest.get("presentations", [])

    kept = []
    for p in pres:
        if p.get("status") != "evaluated_kept":
            continue
        key = p.get("r2_key")
        if not key:
            continue
        ev = p.get("evaluation") or {}
        design_avg = ev.get("design_average")
        if design_avg is None:
            continue
        try:
            design_avg = float(design_avg)
        except Exception:
            continue
        kept.append((p, design_avg))

    kept.sort(key=lambda x: x[1], reverse=True)
    kept = kept[: args.max_decks]

    if not kept:
        raise SystemExit("No kept presentations with design_average found.")

    s3 = get_s3_client()

    slides: list[SlideRow] = []

    for p, design_avg in kept:
        deck_id = str(p.get("id") or safe_slug(p.get("title") or "deck"))
        title = str(p.get("title") or "")
        firm = str(p.get("firm") or "")
        r2_key = str(p.get("r2_key") or "")

        pdf_name = safe_slug(f"{firm}-{title}")[:120] or deck_id
        local_pdf = pdf_dir / f"{pdf_name}.pdf"

        if args.force or not local_pdf.exists():
            print(f"Downloading {r2_key} -> {local_pdf}")
            s3.download_file(R2_BUCKET_NAME, r2_key, str(local_pdf))

        for page in range(1, args.slides_per_deck + 1):
            image_file = f"{pdf_name}__p{page}.webp"
            out_webp = images_dir / image_file

            if args.force or not out_webp.exists():
                with tempfile.TemporaryDirectory(dir=str(tmp_dir)) as td:
                    tmp_png = Path(td) / f"{pdf_name}__p{page}.png"
                    try:
                        render_page_to_png(local_pdf, page, tmp_png)
                        normalize_to_16x9_webp(tmp_png, out_webp)
                    except Exception as e:
                        print(f"WARN: failed render {pdf_name} page {page}: {e}")
                        continue

            slides.append(
                SlideRow(
                    deck_id=deck_id,
                    title=title,
                    firm=firm,
                    r2_key=r2_key,
                    page=page,
                    design_score=design_avg,
                    image_file=image_file,
                )
            )

    slides.sort(key=lambda s: s.design_score, reverse=True)
    top = slides[: args.top]

    report_json = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "options": {
            "slides_per_deck": args.slides_per_deck,
            "top": args.top,
            "max_decks": args.max_decks,
            "force": args.force,
        },
        "count": {"slides": len(slides), "top": len(top)},
        "top": [asdict(s) for s in top],
        "ranked": [asdict(s) for s in slides],
    }
    (out_dir / "report.json").write_text(json.dumps(report_json, indent=2) + "\n")

    md = []
    md.append("# Homepage slides (kept decks) — ranked by design score\n")
    md.append(f"Generated at: {report_json['generated_at']}\n")
    md.append(
        "Note: slide score currently uses deck-level `design_average` from the evaluation manifest.\n"
    )

    for s in top:
        md.append(f"## {s.firm} — {s.title} — page {s.page} — design {s.design_score:.2f}/5")
        md.append(f"R2: `{s.r2_key}`")
        md.append("")
        md.append(f"![{s.title} p{s.page}](images/{s.image_file})")
        md.append("")

    (out_dir / "report.md").write_text("\n".join(md) + "\n")

    print(json.dumps({"ok": True, "out_dir": str(out_dir), "top": len(top)}, indent=2))


if __name__ == "__main__":
    main()
