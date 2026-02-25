Builder output (initiative #529)

Implemented a new script to export homepage-ready slide images from the 10 `evaluated_kept` decks in `projects/presentation-examples/presentation-research-manifest.json`.

Changes:
- Added `projects/presentation-examples/scripts/export-homepage-slides.py`
  - Downloads kept-deck PDFs from R2 using existing env var pattern (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME)
  - Renders first N pages per deck to PNG via `pdftoppm` and converts to 16:9 ~1600x900 WebP via `ffmpeg` (letterboxed white)
  - Builds `outputs/homepage-slides/report.md` (thumbnail gallery) + `report.json` (ranked list)
  - Ranks slides using deck-level `evaluation.design_average` (per-slide vision scoring not implemented yet)
- Updated `projects/presentation-examples/README.md` with usage instructions.

Git:
- Branch: feature/export-top-homepage-slides
- Commit: f97ff39 Add script to export top homepage slide images from kept decks
- Pushed to origin.

How to run:
cd ~/clawd/projects/presentation-examples
python3 scripts/export-homepage-slides.py --slides-per-deck 3 --top 20

Output:
- ./outputs/homepage-slides/images/
- ./outputs/homepage-slides/report.md
- ./outputs/homepage-slides/report.json
