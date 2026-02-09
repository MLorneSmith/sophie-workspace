#!/usr/bin/env python3
"""
Two-stage presentation evaluator for SlideHeroes.

Stage 1: Extract all slide headlines → analyze argument structure (text LLM)
Stage 2: Sample slide images → evaluate visual design (vision LLM)

Reads from presentation-research-manifest.json (status=uploaded), updates manifest after each evaluation.
Based on McKinsey methodology: slide titles should tell a complete story.
"""

import json
import os
import sys
import tempfile
import base64
import re
from pathlib import Path
from datetime import datetime, timezone

import boto3
import fitz  # PyMuPDF
import requests
from botocore.config import Config

# R2 configuration
R2_ACCOUNT_ID = os.environ.get("R2_ACCOUNT_ID")
R2_ACCESS_KEY_ID = os.environ.get("R2_ACCESS_KEY_ID")
R2_SECRET_ACCESS_KEY = os.environ.get("R2_SECRET_ACCESS_KEY")
R2_BUCKET_NAME = os.environ.get("R2_BUCKET_NAME")

# OpenAI for evaluation
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")

# Paths
MANIFEST_PATH = Path(__file__).parent.parent / "presentation-research-manifest.json"

# Thresholds
DEFAULT_THRESHOLD = 3.5
MAX_SLIDES_TO_SAMPLE = 6
SLIDE_RESOLUTION = 150

# ============================================================================
# STAGE 1: Argument Structure Analysis (Text-based)
# ============================================================================

ARGUMENT_PROMPT = """You are evaluating a business presentation's ARGUMENT STRUCTURE for SlideHeroes.

SlideHeroes teaches McKinsey-style presentation skills. A core principle is the "headline test":
- Slide titles alone should tell a complete, logical story
- Reading just the headlines should convey the full argument
- Titles should be action-oriented statements, not labels

NOTE: Many consulting presentations use a two-level structure:
- Label headline (e.g., "Market Analysis")
- Action sub-headline (e.g., "Digital adoption is accelerating 3x faster than expected")

Below are slide headlines with sub-headlines (shown as "headline — sub-headline"). The ACTION may be in the sub-headline, which is acceptable.

If SUMMARY PAGES are included (Executive Summary, Key Findings, etc.), these are especially important - they should tell the complete story in one place. Weight them heavily in your evaluation.

Evaluate:

1. **LOGICAL FLOW** (1-5): Do the headlines build a coherent argument? Is there a clear progression from problem → analysis → solution → recommendation?

2. **MECE STRUCTURE** (1-5): Are ideas grouped properly? Mutually exclusive (no overlap), collectively exhaustive (nothing missing)? Groups of 4-5 or fewer items?

3. **HEADLINE QUALITY** (1-5): Are headlines action statements ("Sales declined 15%") rather than labels ("Sales Overview")? Do they convey insight?

4. **COMPLETENESS** (1-5): Is there a clear introduction (context/situation), body (analysis/findings), and conclusion (recommendations/next steps)?

5. **STORYLINE** (1-5): Can you understand the "so what" just from headlines? Is there a clear takeaway?

SLIDE HEADLINES:
{headlines}

Return JSON only:
{{
  "argument_scores": {{
    "logical_flow": N,
    "mece_structure": N,
    "headline_quality": N,
    "completeness": N,
    "storyline": N
  }},
  "argument_average": N.N,
  "storyline_summary": "What story do these headlines tell? (2-3 sentences)",
  "argument_strengths": ["strength 1", "strength 2"],
  "argument_weaknesses": ["weakness 1", "weakness 2"]
}}"""

# ============================================================================
# STAGE 2: Visual Design Evaluation (Vision-based)
# ============================================================================

DESIGN_PROMPT = """You are evaluating a business presentation's VISUAL DESIGN for SlideHeroes.

This is a "sit-down" McKinsey-style presentation (detail-oriented, for discussion), NOT a TED talk.

Evaluate these sample slides on:

1. **LAYOUT CLARITY** (1-5): Clean layouts? Clear visual hierarchy? Appropriate whitespace? Easy to scan?

2. **DATA VISUALIZATION** (1-5): Are charts effective? Do they illuminate insights (not just decorate)? Appropriate chart types? Clear labels?

3. **TEXT DENSITY** (1-5): Appropriate amount of text? Not walls of bullets? Key points highlighted? (Note: sit-down decks can have more text than keynotes)

4. **VISUAL CONSISTENCY** (1-5): Consistent styling throughout? Professional appearance? Cohesive color scheme?

5. **INFORMATION DESIGN** (1-5): Information organized logically on each slide? Good use of visual elements to support understanding?

Return JSON only:
{{
  "design_scores": {{
    "layout_clarity": N,
    "data_visualization": N,
    "text_density": N,
    "visual_consistency": N,
    "information_design": N
  }},
  "design_average": N.N,
  "design_strengths": ["strength 1", "strength 2"],
  "design_weaknesses": ["weakness 1", "weakness 2"]
}}"""


def get_s3_client():
    if not all([R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME]):
        raise ValueError("Missing R2 environment variables")
    return boto3.client(
        "s3",
        endpoint_url=f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET_ACCESS_KEY,
        config=Config(signature_version="s3v4"),
    )


def load_manifest():
    if not MANIFEST_PATH.exists():
        print(f"ERROR: {MANIFEST_PATH} not found")
        sys.exit(1)
    return json.loads(MANIFEST_PATH.read_text())


def save_manifest(manifest):
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2))


def extract_summary_pages(pdf_path: Path) -> list[dict]:
    doc = fitz.open(pdf_path)
    summary_pages = []
    summary_keywords = [
        'executive summary', 'key findings', 'key takeaways',
        'summary', 'recommendations', 'conclusions', 'key insights',
        'overview', 'highlights', 'at a glance', 'in brief',
        'the bottom line', 'what we found', 'our recommendations'
    ]
    for page_num, page in enumerate(doc, 1):
        text = page.get_text()
        text_lower = text.lower()
        for keyword in summary_keywords:
            if keyword in text_lower[:500]:
                clean_text = re.sub(r'\s+', ' ', text).strip()[:2000]
                summary_pages.append({"page": page_num, "type": keyword, "content": clean_text})
                break
    doc.close()
    return summary_pages


def extract_headlines(pdf_path: Path) -> list[dict]:
    doc = fitz.open(pdf_path)
    headlines = []
    for page_num, page in enumerate(doc, 1):
        blocks = page.get_text("dict")["blocks"]
        top_texts = []
        for block in blocks:
            if block.get("type") != 0:
                continue
            for line in block.get("lines", []):
                line_text = ""
                line_font_size = 0
                line_y = 999
                is_bold = False
                for span in line.get("spans", []):
                    text = span.get("text", "").strip()
                    if text:
                        line_text += text + " "
                        line_font_size = max(line_font_size, span.get("size", 12))
                        line_y = min(line_y, span.get("origin", [0, 999])[1])
                        if "bold" in span.get("font", "").lower():
                            is_bold = True
                line_text = line_text.strip()
                if len(line_text) < 3:
                    continue
                page_height = page.rect.height
                if line_y > page_height * 0.40:
                    continue
                top_texts.append({
                    "text": line_text, "font_size": line_font_size,
                    "y_pos": line_y, "is_bold": is_bold
                })
        top_texts.sort(key=lambda x: (x["y_pos"], -x["font_size"]))

        def clean_text(t):
            t = re.sub(r'^\d+\s*[|/\-–—]\s*', '', t)
            t = re.sub(r'\s*[|]\s*\d+\s*$', '', t)
            t = re.sub(r'^(Page|Slide)\s*\d+\s*$', '', t, flags=re.IGNORECASE)
            return t.strip()

        cleaned = []
        for item in top_texts:
            text = clean_text(item["text"])
            if len(text) > 5 and not re.match(r'^[\d\s\.\,]+$', text):
                if text.lower() not in ('contents', 'agenda', 'confidential', 'draft'):
                    cleaned.append({**item, "text": text})

        if cleaned:
            main_headline = cleaned[0]["text"][:150]
            sub_headline = ""
            if len(cleaned) > 1:
                for candidate in cleaned[1:3]:
                    if abs(candidate["font_size"] - cleaned[0]["font_size"]) > 1:
                        sub_headline = candidate["text"][:200]
                        break
                    elif candidate["y_pos"] - cleaned[0]["y_pos"] > 20:
                        sub_headline = candidate["text"][:200]
                        break
            combined = f"{main_headline} — {sub_headline}" if sub_headline else main_headline
            headlines.append({"page": page_num, "headline": main_headline,
                            "sub_headline": sub_headline, "combined": combined})
        else:
            headlines.append({"page": page_num, "headline": "(No clear headline detected)",
                            "sub_headline": "", "combined": "(No clear headline detected)"})
    doc.close()
    return headlines


def extract_sample_slides(pdf_path: Path, max_slides: int = MAX_SLIDES_TO_SAMPLE) -> list[bytes]:
    doc = fitz.open(pdf_path)
    total_pages = len(doc)
    if total_pages <= max_slides:
        page_indices = list(range(total_pages))
    else:
        page_indices = [0]
        step = (total_pages - 1) / (max_slides - 1)
        for i in range(1, max_slides - 1):
            page_indices.append(int(i * step))
        page_indices.append(total_pages - 1)
    images = []
    for idx in page_indices:
        page = doc[idx]
        mat = fitz.Matrix(SLIDE_RESOLUTION / 72, SLIDE_RESOLUTION / 72)
        pix = page.get_pixmap(matrix=mat)
        images.append(pix.tobytes("png"))
    doc.close()
    return images


def call_openai_text(prompt: str) -> dict:
    response = requests.post(
        "https://api.openai.com/v1/chat/completions",
        headers={"Authorization": f"Bearer {OPENAI_API_KEY}", "Content-Type": "application/json"},
        json={
            "model": "gpt-4o-mini",
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 1000,
            "response_format": {"type": "json_object"}
        },
        timeout=60
    )
    response.raise_for_status()
    return json.loads(response.json()['choices'][0]['message']['content'])


def call_openai_vision(images: list[bytes], prompt: str) -> dict:
    content = [{"type": "text", "text": prompt}]
    for img_bytes in images:
        b64 = base64.b64encode(img_bytes).decode('utf-8')
        content.append({
            "type": "image_url",
            "image_url": {"url": f"data:image/png;base64,{b64}", "detail": "low"}
        })
    response = requests.post(
        "https://api.openai.com/v1/chat/completions",
        headers={"Authorization": f"Bearer {OPENAI_API_KEY}", "Content-Type": "application/json"},
        json={
            "model": "gpt-4o-mini",
            "messages": [{"role": "user", "content": content}],
            "max_tokens": 1000,
            "response_format": {"type": "json_object"}
        },
        timeout=90
    )
    response.raise_for_status()
    return json.loads(response.json()['choices'][0]['message']['content'])


def move_to_best_practices(s3_client, key: str):
    new_key = key.replace("to-be-evaluated/", "best-practice-examples/")
    s3_client.copy_object(Bucket=R2_BUCKET_NAME, CopySource={"Bucket": R2_BUCKET_NAME, "Key": key}, Key=new_key)
    s3_client.delete_object(Bucket=R2_BUCKET_NAME, Key=key)
    return new_key


def delete_presentation(s3_client, key: str):
    s3_client.delete_object(Bucket=R2_BUCKET_NAME, Key=key)


def evaluate_one(s3_client, entry: dict, threshold: float, dry_run: bool = False, verbose: bool = False) -> dict:
    """Evaluate a single presentation. Returns evaluation dict to store in manifest."""
    key = entry["r2_key"]
    print(f"\n{'='*60}")
    print(f"Evaluating: {entry['title']}")
    print(f"  R2 key: {key}")
    print('='*60)

    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp_path = Path(tmp.name)
        s3_client.download_file(R2_BUCKET_NAME, key, str(tmp_path))

    try:
        # STAGE 1: Argument Analysis
        print(f"\n  STAGE 1: Argument Analysis")
        headlines = extract_headlines(tmp_path)
        summary_pages = extract_summary_pages(tmp_path)
        print(f"  Extracted {len(headlines)} slide headlines")
        if summary_pages:
            print(f"  Found {len(summary_pages)} summary page(s)")

        headlines_text = "\n".join([f"Slide {h['page']}: {h.get('combined', h['headline'])}" for h in headlines])
        if summary_pages:
            summary_text = "\n\n--- SUMMARY PAGES FOUND ---\n"
            for sp in summary_pages:
                summary_text += f"\n[{sp['type'].upper()} - Slide {sp['page']}]:\n{sp['content'][:1000]}\n"
            headlines_text += summary_text

        argument_eval = call_openai_text(ARGUMENT_PROMPT.format(headlines=headlines_text))
        arg_scores = argument_eval.get('argument_scores', {})
        if 'argument_average' not in argument_eval:
            argument_eval['argument_average'] = round(sum(arg_scores.values()) / len(arg_scores), 2) if arg_scores else 3.0

        print(f"  Argument Average: {argument_eval['argument_average']:.2f}/5")

        # STAGE 2: Design Analysis
        print(f"\n  STAGE 2: Design Analysis")
        images = extract_sample_slides(tmp_path)
        design_eval = call_openai_vision(images, DESIGN_PROMPT)
        design_scores = design_eval.get('design_scores', {})
        if 'design_average' not in design_eval:
            design_eval['design_average'] = round(sum(design_scores.values()) / len(design_scores), 2) if design_scores else 3.0

        print(f"  Design Average: {design_eval['design_average']:.2f}/5")

        # Combined score: 60% argument, 40% design
        combined_score = round(argument_eval['argument_average'] * 0.60 + design_eval['design_average'] * 0.40, 2)
        recommendation = 'keep' if combined_score >= threshold else 'discard'

        print(f"\n  COMBINED: {combined_score:.2f}/5 → {recommendation.upper()}")

        evaluation = {
            "combined_score": combined_score,
            "argument_average": argument_eval['argument_average'],
            "design_average": design_eval['design_average'],
            "argument_scores": arg_scores,
            "design_scores": design_scores,
            "storyline_summary": argument_eval.get('storyline_summary', ''),
            "argument_strengths": argument_eval.get('argument_strengths', []),
            "argument_weaknesses": argument_eval.get('argument_weaknesses', []),
            "design_strengths": design_eval.get('design_strengths', []),
            "design_weaknesses": design_eval.get('design_weaknesses', []),
            "slide_count": len(headlines),
            "threshold": threshold,
            "evaluated_at": datetime.now(timezone.utc).isoformat(),
        }

        # Take action
        if dry_run:
            print(f"  [DRY RUN] Would {'KEEP' if recommendation == 'keep' else 'DELETE'}")
        elif recommendation == 'keep':
            new_key = move_to_best_practices(s3_client, key)
            entry["r2_key"] = new_key
            entry["status"] = "evaluated_kept"
            print(f"  ✓ KEPT → {new_key}")
        else:
            delete_presentation(s3_client, key)
            entry["r2_key"] = None
            entry["status"] = "evaluated_deleted"
            print(f"  ✗ DELETED")

        entry["evaluation"] = evaluation
        return evaluation

    finally:
        tmp_path.unlink(missing_ok=True)


def main():
    import argparse
    parser = argparse.ArgumentParser(description="Evaluate uploaded presentations")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--limit", type=int, default=5)
    parser.add_argument("--threshold", type=float, default=DEFAULT_THRESHOLD)
    parser.add_argument("--verbose", "-v", action="store_true")
    args = parser.parse_args()

    if not OPENAI_API_KEY:
        print("ERROR: OPENAI_API_KEY not set")
        sys.exit(1)

    manifest = load_manifest()
    candidates = [p for p in manifest["presentations"] if p["status"] == "uploaded" and p.get("r2_key")]

    print(f"Manifest: {len(manifest['presentations'])} total, {len(candidates)} ready to evaluate")

    if not candidates:
        print("Nothing to evaluate!")
        return

    print("Connecting to R2...")
    s3_client = get_s3_client()

    batch = candidates[:args.limit]
    print(f"Evaluating {len(batch)} presentations (threshold: {args.threshold}/5)")

    results = []
    for entry in batch:
        try:
            result = evaluate_one(s3_client, entry, args.threshold, dry_run=args.dry_run, verbose=args.verbose)
            results.append(result)
            save_manifest(manifest)  # Save after each evaluation
        except Exception as e:
            print(f"\n  ✗ ERROR: {e}")
            import traceback
            traceback.print_exc()
            entry["status"] = "failed"
            entry["evaluation"] = {"error": str(e), "evaluated_at": datetime.now(timezone.utc).isoformat()}
            save_manifest(manifest)

    # Summary
    print(f"\n{'='*60}")
    print("SUMMARY")
    print('='*60)
    kept = sum(1 for r in results if r.get('combined_score', 0) >= args.threshold)
    deleted = len(results) - kept
    print(f"Kept: {kept}")
    print(f"Deleted: {deleted}")
    if results:
        scores = [r['combined_score'] for r in results if 'combined_score' in r]
        if scores:
            print(f"Score range: {min(scores):.2f} - {max(scores):.2f}")
            print(f"Average: {sum(scores)/len(scores):.2f}")

    # Show overall manifest status
    from collections import Counter
    status_counts = Counter(p["status"] for p in manifest["presentations"])
    print(f"\nManifest status:")
    for status, count in sorted(status_counts.items()):
        print(f"  {status}: {count}")


if __name__ == "__main__":
    main()
