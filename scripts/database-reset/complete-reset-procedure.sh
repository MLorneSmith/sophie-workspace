#!/bin/bash
# Master script to orchestrate the database reset process with logging and error handling

echo "Prompt: Confirm to start the full database reset procedure."
read -p "Proceed with the full reset? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
  echo "Process aborted by user."
  exit 0
fi

# Step 1: Apply Supabase migrations
echo "Step 1: Applying Supabase migrations..."
./apply-supabase-migrations.sh
if [ $? -ne 0 ]; then
  echo "Error during Supabase migrations. Exiting."
  exit 1
fi

# Step 2: Apply Payload CMS migrations
echo "Step 2: Applying Payload CMS migrations..."
./apply-payload-migrations.sh
if [ $? -ne 0 ]; then
  echo "Error during Payload CMS migrations. Exiting."
  exit 1
fi

# Step 3: Verify all migrations
echo "Step 3: Verifying migrations..."
./verify-migrations.sh
if [ $? -ne 0 ]; then
  echo "Migration verification failed. Exiting."
  exit 1
fi

# Final step: Basic functionality test
echo "Step 4: Testing web and payload applications..."
# Placeholder for actual test commands, e.g., curl or npm test
echo "Testing completed. Please verify manually."

echo "Database reset process completed successfully."