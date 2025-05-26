#!/bin/bash
# Apply Supabase migrations with confirmation and logging
echo "Prompt: Confirm to start applying Supabase migrations."
read -p "Proceed with Supabase migrations? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
  echo "Migration aborted by user."
  exit 0
fi
echo "Applying Supabase migrations..."
supabase db push --linked
if [ $? -ne 0 ]; then
  echo "Error: Supabase migration failed."
  exit 1
fi
echo "Supabase migrations completed successfully."