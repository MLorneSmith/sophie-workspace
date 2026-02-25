#!/bin/bash
# Insert Loops webhook event into BigQuery staging.loops_events
# Usage: echo '{"eventName":"..."}' | ./insert-loops-event-to-bigquery.sh

set -euo pipefail

# Load environment (quietly)
source ~/.clawdbot/.env 2>/dev/null || true

PROJECT="${GCP_PROJECT_ID:-slideheroes-data-platform}"
DATASET="${BQ_STAGING_DATASET:-staging}"
TABLE="loops_events"

# Read JSON from stdin
RAW_JSON=$(cat)

# Extract fields using jq
EVENT_NAME=$(echo "$RAW_JSON" | jq -r '.eventName // empty')
EVENT_TIME_RAW=$(echo "$RAW_JSON" | jq -r '.eventTime // empty')
WEBHOOK_SCHEMA_VERSION=$(echo "$RAW_JSON" | jq -r '.webhookSchemaVersion // empty')

# Convert Unix timestamp to ISO format for BigQuery
EVENT_TIME=""
if [[ -n "$EVENT_TIME_RAW" && "$EVENT_TIME_RAW" != "null" ]]; then
  EVENT_TIME=$(date -u -d "@$EVENT_TIME_RAW" +"%Y-%m-%dT%H:%M:%S.%3NZ" 2>/dev/null || echo "")
fi

# Generate received timestamp
RECEIVED_AT=$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")

# Extract nested fields
CONTACT_ID=$(echo "$RAW_JSON" | jq -r '.contactIdentity.id // .contact.id // empty')
CONTACT_EMAIL=$(echo "$RAW_JSON" | jq -r '.contactIdentity.email // .contact.email // empty')
CONTACT_USER_ID=$(echo "$RAW_JSON" | jq -r '.contactIdentity.userId // .contact.userId // empty')
EMAIL_ID=$(echo "$RAW_JSON" | jq -r '.email.id // empty')
EMAIL_SUBJECT=$(echo "$RAW_JSON" | jq -r '.email.subject // empty' | head -c 500)
SOURCE_TYPE=$(echo "$RAW_JSON" | jq -r '.sourceType // empty')
CAMPAIGN_ID=$(echo "$RAW_JSON" | jq -r '.campaignId // empty')
LOOP_ID=$(echo "$RAW_JSON" | jq -r '.loopId // empty')
TRANSACTIONAL_ID=$(echo "$RAW_JSON" | jq -r '.transactionalId // empty')

# Generate event UUID
EVENT_ID=$(uuidgen | tr '[:upper:]' '[:lower:]')

# Escape raw JSON as a single line
RAW_JSON_ESCAPED=$(echo "$RAW_JSON" | jq -c '.')

# Create the insert row matching table schema using jq
INSERT_JSON=$(jq -n \
  --arg event_id "$EVENT_ID" \
  --arg event_name "$EVENT_NAME" \
  --arg event_time "$EVENT_TIME" \
  --arg webhook_schema_version "$WEBHOOK_SCHEMA_VERSION" \
  --arg received_at "$RECEIVED_AT" \
  --arg raw_json "$RAW_JSON_ESCAPED" \
  --arg contact_id "$CONTACT_ID" \
  --arg contact_email "$CONTACT_EMAIL" \
  --arg contact_user_id "$CONTACT_USER_ID" \
  --arg email_id "$EMAIL_ID" \
  --arg email_subject "$EMAIL_SUBJECT" \
  --arg source_type "$SOURCE_TYPE" \
  --arg campaign_id "$CAMPAIGN_ID" \
  --arg loop_id "$LOOP_ID" \
  --arg transactional_id "$TRANSACTIONAL_ID" \
  '{
    event_id: $event_id,
    event_name: (if $event_name != "" then $event_name else null end),
    event_time: (if $event_time != "" then $event_time else null end),
    webhook_schema_version: (if $webhook_schema_version != "" then $webhook_schema_version else null end),
    received_at: $received_at,
    raw_json: (if $raw_json != "" then $raw_json else null end),
    contact_id: (if $contact_id != "" then $contact_id else null end),
    contact_email: (if $contact_email != "" then $contact_email else null end),
    contact_user_id: (if $contact_user_id != "" then $contact_user_id else null end),
    email_id: (if $email_id != "" then $email_id else null end),
    email_subject: (if $email_subject != "" then $email_subject else null end),
    source_type: (if $source_type != "" then $source_type else null end),
    campaign_id: (if $campaign_id != "" then $campaign_id else null end),
    loop_id: (if $loop_id != "" then $loop_id else null end),
    transactional_id: (if $transactional_id != "" then $transactional_id else null end)
  }')

# Insert using bq insert with JSON
echo "$INSERT_JSON" | bq insert --project_id="$PROJECT" "${DATASET}.${TABLE}" 2>&1

exit $?
