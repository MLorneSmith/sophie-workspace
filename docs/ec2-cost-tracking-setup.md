# EC2 Daily Cost Tracking Setup

## Overview
Track daily EC2 costs and include them in the Morning Brief.

## Setup Steps (Mike)

### 1. Create IAM User in AWS Console

1. Go to **IAM → Users → Create user**
2. User name: `sophie-cost-reader`
3. **Attach policy directly** → Create inline policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ce:GetCostAndUsage",
        "ce:GetCostForecast"
      ],
      "Resource": "*"
    }
  ]
}
```

4. Name the policy: `CostExplorerReadOnly`
5. **Create access key** → Select "Command Line Interface (CLI)"
6. Copy the **Access Key ID** and **Secret Access Key**

### 2. Configure AWS CLI on EC2

SSH into the EC2 instance and run:

```bash
aws configure
```

Enter:
- **AWS Access Key ID:** (from step 1)
- **AWS Secret Access Key:** (from step 1)
- **Default region:** `us-east-1` (required for Cost Explorer)
- **Default output format:** `json`

### 3. Test the Script

```bash
~/clawd/scripts/get-ec2-daily-cost.sh
```

Expected output:
```json
{"date": "2026-02-02", "cost": 1.23, "currency": "USD"}
```

## How It Works

- Script: `~/clawd/scripts/get-ec2-daily-cost.sh`
- Queries AWS Cost Explorer for previous day's EC2 costs
- Returns JSON with date, cost, and currency
- Morning Brief cron will call this and format the result

## Morning Brief Integration

Once configured, Sophie will add to Morning Brief:
```
💰 **EC2 Cost (yesterday):** $X.XX
```

## Notes

- Cost Explorer has ~24h delay, so we show yesterday's cost
- Cost Explorer API itself costs $0.01 per request
- ~30 requests/month = ~$0.30/month for this feature
