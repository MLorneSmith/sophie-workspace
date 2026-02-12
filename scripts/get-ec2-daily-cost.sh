#!/bin/bash
# get-ec2-daily-cost.sh - Fetch yesterday's full AWS cost from Cost Explorer
# Requires: aws configure with ce:GetCostAndUsage permission

set -euo pipefail

END_DATE=$(date -u +%Y-%m-%d)
START_DATE=$(date -u -d "yesterday" +%Y-%m-%d)

# Get total cost (all services)
TOTAL=$(aws ce get-cost-and-usage \
  --time-period Start=$START_DATE,End=$END_DATE \
  --granularity DAILY \
  --metrics "UnblendedCost" \
  --output json 2>/dev/null)

# Get cost by service
BY_SERVICE=$(aws ce get-cost-and-usage \
  --time-period Start=$START_DATE,End=$END_DATE \
  --granularity DAILY \
  --metrics "UnblendedCost" \
  --group-by Type=DIMENSION,Key=SERVICE \
  --output json 2>/dev/null)

if [ $? -eq 0 ]; then
  TOTAL_COST=$(echo "$TOTAL" | jq -r '.ResultsByTime[0].Total.UnblendedCost.Amount // "0"')
  TOTAL_FORMATTED=$(printf "%.2f" "$TOTAL_COST")

  # Build service breakdown (only services > $0.01)
  SERVICES=$(echo "$BY_SERVICE" | jq -r '[.ResultsByTime[0].Groups[] | {service: .Keys[0], cost: (.Metrics.UnblendedCost.Amount | tonumber)} | select(.cost > 0.01)] | sort_by(-.cost)')

  echo "{\"date\": \"$START_DATE\", \"total\": $TOTAL_FORMATTED, \"currency\": \"USD\", \"services\": $SERVICES}"
else
  echo "{\"error\": \"Failed to fetch cost data. Check AWS credentials.\"}"
  exit 1
fi
