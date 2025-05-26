#!/bin/bash
# Verify migration status and schema diff with confirmation and logging
echo "Prompt: Confirm to verify migration status and schema diff."
read -p "Proceed with verification? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
  echo "Verification aborted by user."
  exit 0
fi
echo "Fetching migration list..."
supabase migration list --linked
if [ $? -ne 0 ]; then
  echo "Error: Failed to fetch migration list."
  exit 1
fi
echo "Migration list fetched successfully."

echo "Checking schema differences..."
supabase db diff
if [ $? -ne 0 ]; then
  echo "Error: Schema diff check failed."
  exit 1
fi
echo "Schema diff check completed successfully."