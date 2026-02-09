#!/bin/bash
# Generate signed feedback URLs for Morning Brief articles
# Usage: ./generate-feedback-urls.sh <itemId>
#
# Requires FEEDBACK_SECRET env var to be set
# Output: JSON with upvoteUrl and downvoteUrl

set -e

ITEM_ID="$1"
FEEDBACK_BASE_URL="${FEEDBACK_BASE_URL:-https://feedback.slideheroes.com}"

if [ -z "$ITEM_ID" ]; then
  echo "Usage: $0 <itemId>" >&2
  exit 1
fi

if [ -z "$FEEDBACK_SECRET" ]; then
  echo "Error: FEEDBACK_SECRET environment variable not set" >&2
  exit 1
fi

# Generate HMAC-SHA256 signature (base64url encoded)
generate_sig() {
  local payload="$1"
  echo -n "$payload" | openssl dgst -sha256 -hmac "$FEEDBACK_SECRET" -binary | base64 | tr '+/' '-_' | tr -d '='
}

UP_SIG=$(generate_sig "${ITEM_ID}:1")
DOWN_SIG=$(generate_sig "${ITEM_ID}:-1")

# URL encode the item ID
ENCODED_ITEM=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$ITEM_ID'))")

cat << EOF
{
  "itemId": "$ITEM_ID",
  "upvoteUrl": "${FEEDBACK_BASE_URL}/rate?item=${ENCODED_ITEM}&r=1&sig=${UP_SIG}",
  "downvoteUrl": "${FEEDBACK_BASE_URL}/rate?item=${ENCODED_ITEM}&r=-1&sig=${DOWN_SIG}"
}
EOF
