#!/usr/bin/env bash
# nightly-presentation-pipeline.sh
# Two-phase nightly pipeline:
#   Phase 1: Download new presentations from catalog → upload to R2 (to-be-evaluated/)
#   Phase 2: Run AI evaluation on uploaded presentations (argument + design scoring)
#
# Uses the existing evaluate-presentations.py for sophisticated 2-stage scoring:
#   Stage 1: Extract headlines → evaluate argument structure (GPT-4o-mini)
#   Stage 2: Sample slide images → evaluate visual design (GPT-4o-mini vision)
#   Combined score: 60% argument + 40% design. Threshold: 3.5/5
#
# Usage: ./nightly-presentation-pipeline.sh [--limit N] [--dry-run] [--skip-download] [--skip-evaluate]

set -uo pipefail

CATALOG="$HOME/clawd/projects/presentation-examples/sources/catalog.json"
REGISTER="$HOME/clawd/projects/presentation-examples/sources/register.json"
MANIFEST="$HOME/clawd/projects/presentation-examples/presentation-research-manifest.json"
EVALUATOR="$HOME/clawd/projects/presentation-examples/scripts/evaluate-presentations.py"
MC_API="http://localhost:3001/api"
DOWNLOAD_DIR="/tmp/presentations"
LIMIT=10
DRY_RUN=false
SKIP_DOWNLOAD=false
SKIP_EVALUATE=false
QUALITY_THRESHOLD=3.5  # 1-5 scale (used by evaluator)

# R2 config
R2_ACCOUNT_ID="d33fc17df32ce7d9d48eb8045f1d340a"
R2_ACCESS_KEY_ID="4565d55ca7354817b55754b365c4df9a"
R2_SECRET_ACCESS_KEY="8a74658111523a0f8c0580025cdad17cb0e12d066fba2d5316dde120c98a25f9"
R2_BUCKET="top-presentations-collection-sophie"
R2_ENDPOINT="https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com"

# Load API keys
if [[ -f "$HOME/.clawdbot/.env" ]]; then
  export OPENAI_API_KEY="$(grep OPENAI_API_KEY "$HOME/.clawdbot/.env" | cut -d= -f2 | tr -d '\r\n')"
fi
export R2_ACCOUNT_ID R2_ACCESS_KEY_ID R2_SECRET_ACCESS_KEY
export R2_BUCKET_NAME="$R2_BUCKET"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --limit) LIMIT="$2"; shift 2 ;;
    --dry-run) DRY_RUN=true; shift ;;
    --skip-download) SKIP_DOWNLOAD=true; shift ;;
    --skip-evaluate) SKIP_EVALUATE=true; shift ;;
    *) echo "Unknown arg: $1"; exit 1 ;;
  esac
done

mkdir -p "$DOWNLOAD_DIR"

# Initialize register if missing
if [[ ! -f "$REGISTER" ]]; then
  echo '{"processed":{}}' > "$REGISTER"
fi

log() { echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] $*"; }

log "=== Nightly Presentation Pipeline ==="
log "Limit: $LIMIT | Dry run: $DRY_RUN | Threshold: $QUALITY_THRESHOLD/5"

# ============================================================================
# PHASE 1: Download new presentations from catalog
# ============================================================================

DOWNLOADED=0
UPLOADED=0
DOWNLOAD_FAILED=0

if ! $SKIP_DOWNLOAD; then
  log ""
  log "== PHASE 1: Download & Upload to R2 =="

  # Load catalog into flat list
  FLAT_LIST=$(python3 -c "
import json, sys
with open('$CATALOG') as f:
    data = json.load(f)
items = []
for group, entries in data.get('presentations', {}).items():
    for e in entries:
        url = e.get('url', '')
        if url and url.startswith('http'):
            items.append({'url': url, 'title': e.get('title','Untitled'), 'source': group})
json.dump(items, sys.stdout)
")

  # Find unprocessed items (not in register AND not in manifest)
  UNPROCESSED=$(python3 -c "
import json, sys
items = json.loads(sys.stdin.read())
with open('$REGISTER') as f:
    reg = json.load(f)
with open('$MANIFEST') as f:
    manifest = json.load(f)
processed_urls = set(reg.get('processed', {}).keys())
manifest_urls = set(p.get('url', '') for p in manifest.get('presentations', []))
skip = processed_urls | manifest_urls
unprocessed = [i for i in items if i['url'] not in skip]
json.dump(unprocessed[:$LIMIT], sys.stdout)
" <<< "$FLAT_LIST")

  TO_PROCESS=$(echo "$UNPROCESSED" | jq 'length')
  log "Unprocessed: $TO_PROCESS selected for download"

  if [[ "$TO_PROCESS" -eq 0 ]]; then
    log "No new presentations to download."
  else
    for i in $(seq 0 $((TO_PROCESS - 1))); do
      ITEM=$(echo "$UNPROCESSED" | jq ".[$i]")
      URL=$(echo "$ITEM" | jq -r '.url')
      TITLE=$(echo "$ITEM" | jq -r '.title')
      SOURCE=$(echo "$ITEM" | jq -r '.source')

      log ""
      log "--- [$((i+1))/$TO_PROCESS] $TITLE ---"
      log "    Source: $SOURCE | URL: $URL"

      # Determine file extension
      EXT="pdf"
      if echo "$URL" | grep -qi '\.pptx'; then EXT="pptx"; fi
      if echo "$URL" | grep -qi '\.ppt$'; then EXT="ppt"; fi

      FILENAME="$(echo "$SOURCE-$TITLE" | tr ' /' '-_' | tr -cd '[:alnum:]_-' | head -c 100).${EXT}"
      FILEPATH="$DOWNLOAD_DIR/$FILENAME"

      # Download
      log "    Downloading..."
      HTTP_CODE=$(curl -sS -L -o "$FILEPATH" -w "%{http_code}" --max-time 60 --max-filesize 52428800 "$URL" 2>/dev/null || echo "000")

      if [[ "$HTTP_CODE" != "200" ]] || [[ ! -f "$FILEPATH" ]]; then
        log "    FAILED: HTTP $HTTP_CODE"
        python3 -c "
import json
with open('$REGISTER') as f: reg = json.load(f)
reg['processed']['''$URL'''] = {'status':'failed','reason':'http_$HTTP_CODE','date':'$(date -u +%Y-%m-%d)'}
with open('$REGISTER','w') as f: json.dump(reg, f, indent=2)
"
        DOWNLOAD_FAILED=$((DOWNLOAD_FAILED + 1))
        continue
      fi

      DOWNLOADED=$((DOWNLOADED + 1))
      FILE_SIZE=$(stat -c%s "$FILEPATH" 2>/dev/null || echo "0")

      # Check if it's actually a PDF
      FILE_TYPE=$(file -b --mime-type "$FILEPATH" 2>/dev/null || echo "unknown")
      if [[ "$FILE_TYPE" != "application/pdf" && "$EXT" == "pdf" ]]; then
        log "    Not a PDF (got $FILE_TYPE) — skipping"
        python3 -c "
import json
with open('$REGISTER') as f: reg = json.load(f)
reg['processed']['''$URL'''] = {'status':'not_pdf','type':'$FILE_TYPE','date':'$(date -u +%Y-%m-%d)'}
with open('$REGISTER','w') as f: json.dump(reg, f, indent=2)
"
        rm -f "$FILEPATH"
        continue
      fi

      log "    Downloaded: $(( FILE_SIZE / 1024 )) KB ($FILE_TYPE)"

      # Upload to R2 (to-be-evaluated folder)
      R2_KEY="to-be-evaluated/${SOURCE}/${FILENAME}"

      if ! $DRY_RUN; then
        log "    Uploading to R2: $R2_KEY"
        UPLOAD_RESULT=$(AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID" \
          AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY" \
          aws s3 cp "$FILEPATH" "s3://${R2_BUCKET}/${R2_KEY}" \
          --endpoint-url "$R2_ENDPOINT" \
          --no-progress 2>&1) || {
          log "    ERROR uploading to R2: $UPLOAD_RESULT"
          DOWNLOAD_FAILED=$((DOWNLOAD_FAILED + 1))
          rm -f "$FILEPATH"
          continue
        }
        UPLOADED=$((UPLOADED + 1))

        # Add to manifest for evaluation
        ENTRY_ID=$(python3 -c "import hashlib; print(hashlib.md5('''$URL'''.encode()).hexdigest()[:12])")
        python3 -c "
import json
with open('$MANIFEST') as f: manifest = json.load(f)
manifest['presentations'].append({
    'id': '$ENTRY_ID',
    'firm': '$SOURCE',
    'title': '''$TITLE''',
    'url': '''$URL''',
    'status': 'uploaded',
    'r2_key': '$R2_KEY'
})
with open('$MANIFEST', 'w') as f: json.dump(manifest, f, indent=2)
"

        # Update register
        python3 -c "
import json
with open('$REGISTER') as f: reg = json.load(f)
reg['processed']['''$URL'''] = {'status':'uploaded','r2Key':'$R2_KEY','date':'$(date -u +%Y-%m-%d)'}
with open('$REGISTER','w') as f: json.dump(reg, f, indent=2)
"
        log "    UPLOADED: $R2_KEY"
      else
        log "    DRY-RUN: Would upload to $R2_KEY"
        UPLOADED=$((UPLOADED + 1))
      fi

      rm -f "$FILEPATH"
    done
  fi

  log ""
  log "Phase 1 complete: Downloaded=$DOWNLOADED Uploaded=$UPLOADED Failed=$DOWNLOAD_FAILED"
fi

# ============================================================================
# PHASE 2: Evaluate uploaded presentations using AI scoring
# ============================================================================

EVALUATED=0
KEPT=0
DELETED=0

if ! $SKIP_EVALUATE; then
  log ""
  log "== PHASE 2: AI Evaluation =="

  # Count available for evaluation
  AVAILABLE=$(python3 -c "
import json
with open('$MANIFEST') as f: m = json.load(f)
print(sum(1 for p in m['presentations'] if p['status'] == 'uploaded' and p.get('r2_key')))
")
  log "Available for evaluation: $AVAILABLE"

  if [[ "$AVAILABLE" -eq 0 ]]; then
    log "Nothing to evaluate."
  else
    EVAL_LIMIT=$((LIMIT < AVAILABLE ? LIMIT : AVAILABLE))
    log "Evaluating $EVAL_LIMIT presentations (threshold: $QUALITY_THRESHOLD/5)"

    DRY_FLAG=""
    if $DRY_RUN; then DRY_FLAG="--dry-run"; fi

    # Run the evaluator
    python3 "$EVALUATOR" --limit "$EVAL_LIMIT" --threshold "$QUALITY_THRESHOLD" $DRY_FLAG 2>&1

    # Count results
    KEPT=$(python3 -c "
import json
with open('$MANIFEST') as f: m = json.load(f)
print(sum(1 for p in m['presentations'] if p['status'] == 'evaluated_kept'))
")
    DELETED=$(python3 -c "
import json
with open('$MANIFEST') as f: m = json.load(f)
print(sum(1 for p in m['presentations'] if p['status'] == 'evaluated_deleted'))
")
    log "Total kept: $KEPT | Total deleted: $DELETED"

    # Sync kept presentations to MC API
    log ""
    log "Syncing kept presentations to Mission Control..."
    python3 -c "
import json, subprocess

with open('$MANIFEST') as f:
    manifest = json.load(f)

# Find kept presentations not yet in MC
for p in manifest['presentations']:
    if p['status'] != 'evaluated_kept' or not p.get('r2_key'):
        continue
    if p.get('mc_synced'):
        continue

    ev = p.get('evaluation', {})
    payload = json.dumps({
        'title': p['title'],
        'originalUrl': p.get('url'),
        'fileType': 'pdf',
        'r2Key': p['r2_key'],
        'company': p.get('firm'),
        'qualityScore': ev.get('combined_score'),
        'qualityNotes': f\"Argument: {ev.get('argument_average', 0):.1f}/5 | Design: {ev.get('design_average', 0):.1f}/5 | {ev.get('storyline_summary', '')[:200]}\",
        'pageCount': ev.get('slide_count'),
        'status': 'stored'
    })

    result = subprocess.run(
        ['curl', '-s', '-X', 'POST', '$MC_API/presentations', '-H', 'Content-Type: application/json', '-d', payload],
        capture_output=True, text=True
    )

    try:
        resp = json.loads(result.stdout)
        if resp.get('id'):
            p['mc_synced'] = True
            p['mc_id'] = resp['id']
            print(f'  Synced to MC: {p[\"title\"]} → {resp[\"id\"]}')
    except:
        print(f'  Failed to sync: {p[\"title\"]}')

with open('$MANIFEST', 'w') as f:
    json.dump(manifest, f, indent=2)
"
  fi
fi

log ""
log "=== Pipeline Complete ==="
log "Phase 1: Downloaded=$DOWNLOADED Uploaded=$UPLOADED Failed=$DOWNLOAD_FAILED"
log "Phase 2: Total Kept=$KEPT Total Deleted=$DELETED"
log "Register: $(jq '.processed | length' "$REGISTER") URLs tracked"
log "Manifest: $(jq '.presentations | length' "$MANIFEST") presentations total"
