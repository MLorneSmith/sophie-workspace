#!/bin/bash
# get-ec2-daily-cost.sh - Fetch yesterday's EC2 cost from AWS Cost Explorer
# Requires: aws configure with ce:GetCostAndUsage permission

set -euo pipefail

# Get yesterday's date range
END_DATE=$(date -u +%Y-%m-%d)
START_DATE=$(date -u -d "yesterday" +%Y-%m-%d)

# Query Cost Explorer for EC2 costs
RESULT=$(aws ce get-cost-and-usage \
  --time-period Start=$START_DATE,End=$END_DATE \
  --granularity DAILY \
  --metrics "UnblendedCost" \
  --filter '{
    "Dimensions": {
      "Key": "SERVICE",
      "Values": ["Amazon Elastic Compute Cloud - Compute"]
    }
  }' \
  --output json 2>/dev/null)

if [ $? -eq 0 ]; then
  COST=$(echo "$RESULT" | jq -r '.ResultsByTime[0].Total.UnblendedCost.Amount // "0"')
  UNIT=$(echo "$RESULT" | jq -r '.ResultsByTime[0].Total.UnblendedCost.Unit // "USD"')
  
  # Format to 2 decimal places
  COST_FORMATTED=$(printf "%.2f" "$COST")
  
  echo "{\"date\": \"$START_DATE\", \"cost\": $COST_FORMATTED, \"currency\": \"$UNIT\"}"
else
  echo "{\"error\": \"Failed to fetch cost data. Check AWS credentials.\"}"
  exit 1
fi
