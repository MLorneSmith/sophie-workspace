#!/bin/bash
# Apply Payload CMS migrations with confirmation and logging
echo "Prompt: Confirm to start applying Payload CMS migrations."
read -p "Proceed with Payload CMS migrations? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
  echo "Migration aborted by user."
  exit 0
fi
echo "Applying Payload CMS migrations..."
npm run payload migrate
if [ $? -ne 0 ]; then
  echo "Error: Payload CMS migration failed."
  exit 1
fi
echo "Payload CMS migrations completed successfully."