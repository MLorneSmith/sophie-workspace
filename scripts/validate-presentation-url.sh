#!/usr/bin/env bash
# validate-presentation-url.sh — Validate a URL is a real, substantial PDF presentation
#
# Usage: ./validate-presentation-url.sh <url>
# Exit codes: 0 = valid, 1 = invalid
# Output: JSON with validation results
#
# Checks:
#   1. HEAD request: Content-Type is application/pdf
#   2. Download to /tmp
#   3. File type verification (magic bytes)
#   4. Page count >= 10
#   5. File size >= 100KB
#   6. Not password-protected or corrupted

set -uo pipefail

URL="${1:-}"
if [[ -z "$URL" ]]; then
  echo '{"valid":false,"reason":"No URL provided"}' 
  exit 1
fi

TMPDIR="/tmp/presentation-validate"
mkdir -p "$TMPDIR"
TMPFILE="$TMPDIR/$(echo "$URL" | md5sum | cut -c1-16).pdf"

cleanup() { rm -f "$TMPFILE"; }
trap cleanup EXIT

result() {
  local valid="$1" reason="$2" pages="${3:-0}" size="${4:-0}"
  echo "{\"valid\":$valid,\"reason\":\"$reason\",\"pages\":$pages,\"sizeKB\":$((size/1024))}"
  if [[ "$valid" == "true" ]]; then exit 0; else exit 1; fi
}

# Step 1: HEAD request to check Content-Type
HEAD_CT=$(curl -sI -L --max-time 15 -H "User-Agent: Mozilla/5.0 SlideHeroes/1.0" "$URL" 2>/dev/null \
  | grep -i "^content-type:" | tail -1 | tr -d '\r' | awk '{print $2}' | cut -d';' -f1)

if [[ -n "$HEAD_CT" && "$HEAD_CT" != "application/pdf" && "$HEAD_CT" != "application/octet-stream" ]]; then
  # Some servers don't set correct content-type for PDFs, so only reject obvious non-PDFs
  if echo "$HEAD_CT" | grep -qiE "text/html|text/plain|image/"; then
    result "false" "Content-Type is $HEAD_CT, not PDF"
  fi
fi

# Step 2: Download
HTTP_CODE=$(curl -sS -L -o "$TMPFILE" -w "%{http_code}" --max-time 60 --max-filesize 52428800 \
  -H "User-Agent: Mozilla/5.0 SlideHeroes/1.0" "$URL" 2>/dev/null || echo "000")

if [[ "$HTTP_CODE" != "200" ]] || [[ ! -f "$TMPFILE" ]]; then
  result "false" "Download failed (HTTP $HTTP_CODE)"
fi

# Step 3: File type verification
FILE_TYPE=$(file -b --mime-type "$TMPFILE" 2>/dev/null || echo "unknown")
if [[ "$FILE_TYPE" != "application/pdf" ]]; then
  result "false" "Not a PDF ($FILE_TYPE)"
fi

# Step 4: File size check
FILE_SIZE=$(stat -c%s "$TMPFILE" 2>/dev/null || echo "0")
if [[ "$FILE_SIZE" -lt 102400 ]]; then  # < 100KB
  result "false" "Too small ($(( FILE_SIZE / 1024 ))KB < 100KB minimum)" "0" "$FILE_SIZE"
fi

# Step 5: Page count
PAGE_COUNT=0
if command -v pdfinfo &>/dev/null; then
  PAGE_COUNT=$(pdfinfo "$TMPFILE" 2>/dev/null | grep "^Pages:" | awk '{print $2}' || echo "0")
  
  # Check for encryption (only check the Encrypted field, not stderr noise)
  ENCRYPTED=$(pdfinfo "$TMPFILE" 2>/dev/null | grep "^Encrypted:" | awk '{print $2}')
  if [[ "$ENCRYPTED" == "yes" ]]; then
    result "false" "PDF is encrypted" "$PAGE_COUNT" "$FILE_SIZE"
  fi
else
  # Fallback: estimate from PDF internals
  PAGE_COUNT=$(strings "$TMPFILE" 2>/dev/null | grep -c "/Type /Page" || echo "0")
fi

if [[ "$PAGE_COUNT" -lt 10 ]]; then
  result "false" "Too few pages ($PAGE_COUNT < 10 minimum)" "$PAGE_COUNT" "$FILE_SIZE"
fi

# All checks passed
result "true" "Valid PDF presentation" "$PAGE_COUNT" "$FILE_SIZE"
