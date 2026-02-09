#!/usr/bin/env python3
"""
Download presentations from manifest and upload to R2.
Only processes entries with status='new'. Updates manifest after each action.

Usage:
  python3 download-and-upload-batch.py --limit 20
  python3 download-and-upload-batch.py --limit 5 --firms bcg mckinsey
  python3 download-and-upload-batch.py --dry-run
"""

import json
import os
import sys
import tempfile
import re
import time
from pathlib import Path
from urllib.parse import urlparse

import boto3
import requests
from botocore.config import Config

# R2 configuration
R2_ACCOUNT_ID = os.environ.get("R2_ACCOUNT_ID")
R2_ACCESS_KEY_ID = os.environ.get("R2_ACCESS_KEY_ID")
R2_SECRET_ACCESS_KEY = os.environ.get("R2_SECRET_ACCESS_KEY")
R2_BUCKET_NAME = os.environ.get("R2_BUCKET_NAME")

MANIFEST_PATH = Path(__file__).parent.parent / "presentation-research-manifest.json"


def get_s3_client():
    return boto3.client(
        "s3",
        endpoint_url=f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET_ACCESS_KEY,
        config=Config(signature_version="s3v4"),
    )


def load_manifest():
    if not MANIFEST_PATH.exists():
        print(f"ERROR: {MANIFEST_PATH} not found. Run build-manifest first.")
        sys.exit(1)
    return json.loads(MANIFEST_PATH.read_text())


def save_manifest(manifest):
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2))


def sanitize_filename(title):
    name = re.sub(r'[^\w\s\-\(\)]', '', title)
    name = re.sub(r'\s+', ' ', name).strip()
    return name[:80]


def download_pdf(url, title):
    """Download a PDF from URL, return path or None"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
        resp = requests.get(url, headers=headers, timeout=30, allow_redirects=True)
        resp.raise_for_status()

        content_type = resp.headers.get('content-type', '').lower()
        is_pdf = (
            'application/pdf' in content_type
            or resp.content[:5] == b'%PDF-'
            or url.lower().endswith('.pdf')
        )

        if not is_pdf:
            print(f"    ⚠ Not a PDF (content-type: {content_type})")
            return None

        filename = sanitize_filename(title) + '.pdf'
        tmp_path = Path(tempfile.mkdtemp()) / filename
        tmp_path.write_bytes(resp.content)

        size_mb = tmp_path.stat().st_size / (1024 * 1024)
        if size_mb < 0.01:
            print(f"    ⚠ Too small ({size_mb:.2f}MB)")
            tmp_path.unlink()
            return None
        if size_mb > 100:
            print(f"    ⚠ Too large ({size_mb:.1f}MB)")
            tmp_path.unlink()
            return None

        print(f"    ✓ Downloaded ({size_mb:.1f}MB)")
        return tmp_path

    except requests.exceptions.RequestException as e:
        print(f"    ✗ Download failed: {e}")
        return None


def upload_to_r2(s3_client, local_path, firm, title):
    """Upload PDF to R2 to-be-evaluated folder, return R2 key"""
    filename = sanitize_filename(title) + '.pdf'
    key = f"to-be-evaluated/{firm}/{filename}"

    s3_client.upload_file(
        str(local_path),
        R2_BUCKET_NAME,
        key,
        ExtraArgs={'ContentType': 'application/pdf'}
    )

    print(f"    ✓ Uploaded to R2: {key}")
    return key


def main():
    import argparse
    parser = argparse.ArgumentParser(description="Download new presentations and upload to R2")
    parser.add_argument("--limit", type=int, default=20, help="Max presentations to download")
    parser.add_argument("--firms", nargs="+", help="Only process specific firms")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be downloaded")
    args = parser.parse_args()

    manifest = load_manifest()
    presentations = manifest["presentations"]

    # Filter to status=new only
    candidates = [p for p in presentations if p["status"] == "new"]
    if args.firms:
        candidates = [p for p in candidates if p["firm"] in args.firms]

    print(f"Manifest: {len(presentations)} total, {len(candidates)} with status=new")

    if not candidates:
        print("Nothing to download!")
        return

    if not args.dry_run:
        print("Connecting to R2...")
        s3_client = get_s3_client()

    downloaded = 0
    failed = 0
    skipped = 0

    for entry in candidates:
        if downloaded >= args.limit:
            print(f"\nReached limit ({args.limit})")
            break

        title = entry["title"]
        url = entry["url"]
        firm = entry["firm"]

        # Skip non-PDF URLs
        if not url.lower().endswith('.pdf') and 'slideshare' in url.lower():
            print(f"  → Skipping (SlideShare): {title[:50]}")
            entry["status"] = "skipped"
            save_manifest(manifest)
            skipped += 1
            continue

        print(f"\n  [{downloaded+1}/{args.limit}] {title[:60]}")
        print(f"    URL: {url[:80]}")

        if args.dry_run:
            print(f"    [DRY RUN] Would download and upload")
            downloaded += 1
            continue

        # Download
        local_path = download_pdf(url, title)
        if not local_path:
            entry["status"] = "failed"
            save_manifest(manifest)
            failed += 1
            continue

        try:
            key = upload_to_r2(s3_client, local_path, firm, title)
            entry["status"] = "uploaded"
            entry["r2_key"] = key
            save_manifest(manifest)  # Save after each success
            downloaded += 1
            time.sleep(0.5)
        except Exception as e:
            print(f"    ✗ Upload failed: {e}")
            entry["status"] = "failed"
            save_manifest(manifest)
            failed += 1
        finally:
            local_path.unlink(missing_ok=True)

    print(f"\n{'='*50}")
    print(f"SUMMARY")
    print(f"{'='*50}")
    print(f"Downloaded & uploaded: {downloaded}")
    print(f"Skipped: {skipped}")
    print(f"Failed: {failed}")
    print(f"Remaining new: {sum(1 for p in presentations if p['status'] == 'new')}")


if __name__ == "__main__":
    main()
