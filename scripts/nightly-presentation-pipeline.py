#!/usr/bin/env python3
"""
Nightly Presentation Pipeline

Downloads presentations from catalog, runs AI evaluation, stores results in MC.
Phases:
1. Download new presentations from catalog → upload to R2
2. Run AI evaluation (argument + design scoring via GPT-4o-mini)
3. Keep presentations scoring >= 3.5/5, delete the rest
4. Sync kept presentations to Mission Control API
5. Store pipeline results for morning brief

Exit codes:
0 = Success
1 = Partial failures
2 = Critical failure
"""

import argparse
import hashlib
import json
import os
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

# Configuration
CATALOG = Path.home() / "clawd/projects/presentation-examples/sources/catalog.json"
REGISTER = Path.home() / "clawd/projects/presentation-examples/sources/register.json"
MANIFEST = Path.home() / "clawd/projects/presentation-examples/presentation-research-manifest.json"
EVALUATOR = Path.home() / "clawd/projects/presentation-examples/scripts/evaluate-presentations.py"
DOWNLOAD_DIR = Path("/tmp/presentations")
MC_API = "http://localhost:3001/api/v1"
QUALITY_THRESHOLD = 3.5
DISCORD_CHANNEL = "1468015498330308621"  # #inbox-sophie

# R2 config (loaded from env)
R2_ACCOUNT_ID = os.environ.get("R2_ACCOUNT_ID", "d33fc17df32ce7d9d48eb8045f1d340a")
R2_BUCKET = os.environ.get("R2_BUCKET_NAME", "top-presentations-collection-sophie")
R2_ENDPOINT = f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com"


class PipelineStats:
    def __init__(self):
        self.downloaded = 0
        self.uploaded = 0
        self.download_failed = 0
        self.evaluated = 0
        self.kept = 0
        self.deleted = 0
        self.mc_synced = 0
        self.notable_scores = []  # (title, score) tuples
        self.errors = []

    def to_dict(self):
        return {
            "downloaded": self.downloaded,
            "uploaded": self.uploaded,
            "download_failed": self.download_failed,
            "evaluated": self.evaluated,
            "kept": self.kept,
            "deleted": self.deleted,
            "mc_synced": self.mc_synced,
            "notable_scores": self.notable_scores[:5],  # Top 5
            "errors": self.errors[:5],  # First 5 errors
        }


def load_env():
    """Load API keys from .env file."""
    env_file = Path.home() / ".clawdbot/.env"
    if env_file.exists():
        for line in env_file.read_text().splitlines():
            if line.startswith("OPENAI_API_KEY="):
                os.environ["OPENAI_API_KEY"] = line.split("=", 1)[1].strip().strip('"').strip("'")
            if line.startswith("R2_ACCESS_KEY_ID="):
                os.environ["R2_ACCESS_KEY_ID"] = line.split("=", 1)[1].strip()
            if line.startswith("R2_SECRET_ACCESS_KEY="):
                os.environ["R2_SECRET_ACCESS_KEY"] = line.split("=", 1)[1].strip()


def ensure_files():
    """Create register and manifest if they don't exist."""
    if not REGISTER.exists():
        REGISTER.parent.mkdir(parents=True, exist_ok=True)
        REGISTER.write_text('{"processed":{}}')
    
    if not MANIFEST.exists():
        MANIFEST.parent.mkdir(parents=True, exist_ok=True)
        MANIFEST.write_text('{"presentations":[]}')
    
    DOWNLOAD_DIR.mkdir(parents=True, exist_ok=True)


def load_catalog() -> list[dict]:
    """Load catalog into flat list of items."""
    with open(CATALOG) as f:
        data = json.load(f)
    
    items = []
    for group, entries in data.get("presentations", {}).items():
        for e in entries:
            url = e.get("url", "")
            if url and url.startswith("http"):
                items.append({
                    "url": url,
                    "title": e.get("title", "Untitled"),
                    "source": group
                })
    return items


def find_unprocessed(items: list[dict], limit: int) -> list[dict]:
    """Find items not yet processed."""
    with open(REGISTER) as f:
        reg = json.load(f)
    
    with open(MANIFEST) as f:
        manifest = json.load(f)
    
    processed_urls = set(reg.get("processed", {}).keys())
    manifest_urls = {p.get("url", "") for p in manifest.get("presentations", [])}
    skip = processed_urls | manifest_urls
    
    unprocessed = [i for i in items if i["url"] not in skip]
    return unprocessed[:limit]


def download_file(url: str, dest: Path) -> tuple[bool, str]:
    """Download a file from URL."""
    try:
        result = subprocess.run(
            ["curl", "-sS", "-L", "-o", str(dest), "-w", "%{http_code}",
             "--max-time", "60", "--max-filesize", "52428800", url],
            capture_output=True,
            text=True,
            timeout=70
        )
        
        http_code = result.stdout.strip() if result.stdout else "000"
        
        if http_code != "200" or not dest.exists():
            return False, f"HTTP {http_code}"
        
        return True, "OK"
    except subprocess.TimeoutExpired:
        return False, "Timeout"
    except Exception as e:
        return False, str(e)


def upload_to_r2(filepath: Path, r2_key: str) -> tuple[bool, str]:
    """Upload file to R2 storage."""
    try:
        result = subprocess.run(
            ["aws", "s3", "cp", str(filepath), f"s3://{R2_BUCKET}/{r2_key}",
             "--endpoint-url", R2_ENDPOINT, "--no-progress"],
            capture_output=True,
            text=True,
            timeout=60,
            env={
                **os.environ,
                "AWS_ACCESS_KEY_ID": os.environ.get("R2_ACCESS_KEY_ID", ""),
                "AWS_SECRET_ACCESS_KEY": os.environ.get("R2_SECRET_ACCESS_KEY", ""),
            }
        )
        
        if result.returncode != 0:
            return False, result.stderr[:200]
        
        return True, "OK"
    except Exception as e:
        return False, str(e)


def update_register(url: str, status: str, **kwargs):
    """Update the register with processing status."""
    with open(REGISTER) as f:
        reg = json.load(f)
    
    reg.setdefault("processed", {})[url] = {
        "status": status,
        "date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        **kwargs
    }
    
    with open(REGISTER, "w") as f:
        json.dump(reg, f, indent=2)


def add_to_manifest(entry: dict):
    """Add entry to manifest."""
    with open(MANIFEST) as f:
        manifest = json.load(f)
    
    manifest.setdefault("presentations", []).append(entry)
    
    with open(MANIFEST, "w") as f:
        json.dump(manifest, f, indent=2)


def run_evaluation(limit: int, dry_run: bool) -> tuple[int, int]:
    """Run the AI evaluator and return (kept, deleted) counts."""
    cmd = ["python3", str(EVALUATOR), "--limit", str(limit), "--threshold", str(QUALITY_THRESHOLD)]
    if dry_run:
        cmd.append("--dry-run")
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
        print(result.stdout)
        if result.stderr:
            print(result.stderr, file=sys.stderr)
    except subprocess.TimeoutExpired:
        print("ERROR: Evaluation timed out", file=sys.stderr)
        return 0, 0
    except Exception as e:
        print(f"ERROR: Evaluation failed: {e}", file=sys.stderr)
        return 0, 0
    
    # Count results from manifest
    with open(MANIFEST) as f:
        manifest = json.load(f)
    
    kept = sum(1 for p in manifest.get("presentations", []) if p.get("status") == "evaluated_kept")
    deleted = sum(1 for p in manifest.get("presentations", []) if p.get("status") == "evaluated_deleted")
    
    return kept, deleted


def sync_to_mission_control(stats: PipelineStats):
    """Sync kept presentations to Mission Control API."""
    with open(MANIFEST) as f:
        manifest = json.load(f)
    
    for p in manifest.get("presentations", []):
        if p.get("status") != "evaluated_kept":
            continue
        if p.get("mc_synced"):
            continue
        
        ev = p.get("evaluation", {})
        payload = {
            "title": p.get("title"),
            "originalUrl": p.get("url"),
            "fileType": "pdf",
            "r2Key": p.get("r2_key"),
            "company": p.get("firm"),
            "qualityScore": ev.get("combined_score"),
            "qualityNotes": f"Argument: {ev.get('argument_average', 0):.1f}/5 | Design: {ev.get('design_average', 0):.1f}/5",
            "pageCount": ev.get("slide_count"),
            "status": "stored"
        }
        
        try:
            result = subprocess.run(
                ["curl", "-s", "-X", "POST", f"{MC_API}/presentations",
                 "-H", "Content-Type: application/json",
                 "-d", json.dumps(payload)],
                capture_output=True,
                text=True,
                timeout=10
            )
            
            resp = json.loads(result.stdout)
            if resp.get("id"):
                p["mc_synced"] = True
                p["mc_id"] = resp["id"]
                stats.mc_synced += 1
                print(f"  Synced to MC: {p['title']} → {resp['id']}")
                
                # Track notable scores
                score = ev.get("combined_score", 0)
                if score >= 4.0:
                    stats.notable_scores.append((p["title"], score))
        except Exception as e:
            print(f"  Failed to sync: {p['title']} - {e}", file=sys.stderr)
    
    with open(MANIFEST, "w") as f:
        json.dump(manifest, f, indent=2)


def store_pipeline_results(stats: PipelineStats):
    """Store pipeline results in Mission Control for morning brief."""
    try:
        payload = {
            "type": "presentation_pipeline",
            "date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
            "stats": stats.to_dict()
        }
        
        result = subprocess.run(
            ["curl", "-s", "-X", "POST", f"{MC_API}/pipeline-results",
             "-H", "Content-Type: application/json",
             "-d", json.dumps(payload)],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        if result.returncode == 0:
            print("Stored pipeline results in Mission Control")
    except Exception as e:
        print(f"Failed to store results: {e}", file=sys.stderr)


def notify_discord(stats: PipelineStats):
    """Send summary to Discord."""
    lines = ["📊 **Nightly Presentation Pipeline**\n"]
    lines.append(f"**Downloaded:** {stats.downloaded} | **Uploaded:** {stats.uploaded}")
    lines.append(f"**Evaluated:** {stats.evaluated} | **Kept:** {stats.kept} | **Deleted:** {stats.deleted}")
    
    if stats.notable_scores:
        lines.append("\n**Notable Scores:**")
        for title, score in stats.notable_scores[:5]:
            lines.append(f"  • {title}: {score:.1f}/5")
    
    if stats.errors:
        lines.append(f"\n⚠️ **Errors:** {len(stats.errors)}")
    
    try:
        subprocess.run(
            ["openclaw", "message", "send",
             "--channel", "discord",
             "--target", DISCORD_CHANNEL,
             "--message", "\n".join(lines)],
            capture_output=True,
            timeout=30
        )
    except Exception:
        pass


def main():
    parser = argparse.ArgumentParser(description="Nightly Presentation Pipeline")
    parser.add_argument("--limit", type=int, default=10, help="Max presentations to process")
    parser.add_argument("--dry-run", action="store_true", help="Don't make changes")
    parser.add_argument("--skip-download", action="store_true", help="Skip download phase")
    parser.add_argument("--skip-evaluate", action="store_true", help="Skip evaluation phase")
    args = parser.parse_args()
    
    print("=== Nightly Presentation Pipeline ===")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Limit: {args.limit} | Threshold: {QUALITY_THRESHOLD}/5")
    print()
    
    load_env()
    ensure_files()
    
    stats = PipelineStats()
    
    # Phase 1: Download
    if not args.skip_download:
        print("== PHASE 1: Download & Upload to R2 ==")
        
        items = load_catalog()
        to_process = find_unprocessed(items, args.limit)
        
        print(f"Unprocessed: {len(to_process)} selected for download")
        
        for i, item in enumerate(to_process):
            url = item["url"]
            title = item["title"]
            source = item["source"]
            
            print(f"\n--- [{i+1}/{len(to_process)}] {title} ---")
            print(f"    Source: {source}")
            
            # Determine extension
            ext = "pdf"
            if ".pptx" in url.lower():
                ext = "pptx"
            elif ".ppt" in url.lower():
                ext = "ppt"
            
            # Clean filename
            safe_title = "".join(c if c.isalnum() or c in " -_" else "_" for c in title)[:80]
            filename = f"{source}-{safe_title}.{ext}"
            filepath = DOWNLOAD_DIR / filename
            
            # Download
            print(f"    Downloading...")
            success, msg = download_file(url, filepath)
            
            if not success:
                print(f"    FAILED: {msg}")
                update_register(url, "failed", reason=msg)
                stats.download_failed += 1
                stats.errors.append(f"Download failed: {title} - {msg}")
                continue
            
            stats.downloaded += 1
            
            # Verify file type
            file_type = subprocess.run(
                ["file", "-b", "--mime-type", str(filepath)],
                capture_output=True, text=True
            ).stdout.strip()
            
            if ext == "pdf" and "pdf" not in file_type:
                print(f"    Not a PDF (got {file_type}) — skipping")
                update_register(url, "not_pdf", type=file_type)
                filepath.unlink(missing_ok=True)
                continue
            
            file_size = filepath.stat().st_size
            print(f"    Downloaded: {file_size // 1024} KB ({file_type})")
            
            # Upload to R2
            r2_key = f"to-be-evaluated/{source}/{filename}"
            
            if not args.dry_run:
                print(f"    Uploading to R2: {r2_key}")
                success, msg = upload_to_r2(filepath, r2_key)
                
                if not success:
                    print(f"    ERROR uploading: {msg}")
                    stats.download_failed += 1
                    stats.errors.append(f"Upload failed: {title} - {msg}")
                    filepath.unlink(missing_ok=True)
                    continue
                
                stats.uploaded += 1
                
                # Add to manifest
                entry_id = hashlib.md5(url.encode()).hexdigest()[:12]
                add_to_manifest({
                    "id": entry_id,
                    "firm": source,
                    "title": title,
                    "url": url,
                    "status": "uploaded",
                    "r2_key": r2_key
                })
                
                update_register(url, "uploaded", r2Key=r2_key)
                print(f"    UPLOADED: {r2_key}")
            else:
                print(f"    DRY-RUN: Would upload to {r2_key}")
                stats.uploaded += 1
            
            filepath.unlink(missing_ok=True)
        
        print(f"\nPhase 1 complete: Downloaded={stats.downloaded} Uploaded={stats.uploaded} Failed={stats.download_failed}")
    
    # Phase 2: Evaluate
    if not args.skip_evaluate:
        print("\n== PHASE 2: AI Evaluation ==")
        
        # Count available
        with open(MANIFEST) as f:
            manifest = json.load(f)
        
        available = sum(1 for p in manifest.get("presentations", [])
                       if p.get("status") == "uploaded" and p.get("r2_key"))
        
        print(f"Available for evaluation: {available}")
        
        if available > 0:
            eval_limit = min(args.limit, available)
            print(f"Evaluating {eval_limit} presentations (threshold: {QUALITY_THRESHOLD}/5)")
            
            kept, deleted = run_evaluation(eval_limit, args.dry_run)
            stats.kept = kept
            stats.deleted = deleted
            stats.evaluated = kept + deleted
            
            print(f"\nTotal kept: {stats.kept} | Total deleted: {stats.deleted}")
            
            # Sync to MC
            if stats.kept > 0:
                print("\nSyncing kept presentations to Mission Control...")
                sync_to_mission_control(stats)
    
    # Store results
    if not args.dry_run:
        store_pipeline_results(stats)
    
    # Notify
    notify_discord(stats)
    
    # Summary
    print("\n=== Pipeline Complete ===")
    print(f"Downloaded={stats.downloaded} Uploaded={stats.uploaded} Failed={stats.download_failed}")
    print(f"Evaluated={stats.evaluated} Kept={stats.kept} Deleted={stats.deleted} MC Synced={stats.mc_synced}")
    
    sys.exit(0 if not stats.errors else 1)


if __name__ == "__main__":
    main()
