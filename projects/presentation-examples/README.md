# Presentation Examples Discovery System

Building a library of high-quality consulting presentation examples for SlideHeroes.

## How It Works

1. **Catalog** — URLs of consulting presentations collected from public sources
2. **Download** — PDFs downloaded and uploaded to Cloudflare R2 (`to-be-evaluated/`)
3. **Evaluate** — Two-stage scoring: argument structure (60%) + visual design (40%)
4. **Keep/Delete** — Score ≥ 3.5/5 → moved to `best-practice-examples/`. Below → deleted.

## Single Source of Truth

**`presentation-research-manifest.json`** tracks every presentation and its lifecycle status:
- `new` → In catalog, not yet downloaded
- `uploaded` → In R2 `to-be-evaluated/`, awaiting scoring
- `evaluated_kept` → Passed quality bar, in `best-practice-examples/`
- `evaluated_deleted` → Below threshold, deleted from R2
- `failed` → Download or upload error
- `skipped` → Not processable (e.g. SlideShare link)

All scripts read from and write to `presentation-research-manifest.json`. No other state files needed.

## Scripts

```bash
# Check current status
python3 scripts/status.py

# Download new presentations (status=new → uploaded)
python3 scripts/download-and-upload-batch.py --limit 20
python3 scripts/download-and-upload-batch.py --dry-run

# Evaluate uploaded presentations (status=uploaded → evaluated_kept/deleted)
python3 scripts/evaluate-presentations.py --limit 10
python3 scripts/evaluate-presentations.py --threshold 3.0 --dry-run
```

## Sources

- Analyst Academy (600+ consulting presentations)
- Slideworks.io (curated MBB collections)
- Plus AI (Bain collection)
- SEC EDGAR (investor presentations)

## Structure

```
presentation-examples/
├── presentation-research-manifest.json              # Single source of truth
├── sources/
│   └── catalog.json           # Legacy: original URL catalog
├── evaluated.json             # Legacy: old evaluation audit trail
├── scripts/
│   ├── status.py              # Show pipeline status
│   ├── download-and-upload-batch.py  # Download → R2
│   ├── evaluate-presentations.py     # Score → keep/delete
│   ├── extract-analyst-academy.py    # Source scraper
│   ├── add-mckinsey.py               # Source scraper
│   ├── add-bain.py                   # Source scraper
│   └── add-deloitte.py              # Source scraper
└── README.md
```

## Related Tasks

- Mission Control #29: Build Presentation Examples Discovery System
- Mission Control #61: Discuss criteria + R2 storage with Mike
