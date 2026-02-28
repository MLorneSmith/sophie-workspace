# BigQuery → Outbound Triggers Spec

**Purpose:** Push qualified segments from BigQuery to outbound tools (Loops, Instantly.ai).

**Created:** 2026-02-27
**Task:** #433
**Status:** Ready for implementation

---

## 1. Overview

This system pushes qualified prospects from BigQuery to outbound tools based on ICP scoring thresholds and activation events.

### Architecture
```
BigQuery (mvl_qualified_leads)
         │
         ▼
    Sync Script (Python)
         │
         ├──► Loops API (nurture sequences)
         │
         └──► Instantly.ai API (cold outreach) [future]
```

---

## 2. Trigger Sources

### BigQuery Views

| View | Purpose | Trigger Frequency |
|------|---------|-------------------|
| `core.mvl_qualified_leads` | MVL-qualified companies | Daily |
| `core.icp_score_changed` | Score threshold crossed | Real-time |
| `core.behavioral_activation` | Engagement milestone | Real-time |

### Qualification Thresholds

| Segment | ICP Score | Additional Criteria |
|---------|-----------|---------------------|
| MVL-Outbound | ≥ 45 | Consulting industry |
| MVL-Sales | ≥ 60 | OR has product engagement |
| Hot Lead | ≥ 75 | + 3+ website visits |
| Nurture | 25-44 | Consulting industry |

---

## 3. Loops Integration

### API Endpoint
```
POST https://app.loops.so/api/v1/events/send
```

### Event Types

| Event Name | Trigger | Purpose |
|------------|---------|---------|
| `mvlQualified` | Company reaches MVL threshold | Add to nurture sequence |
| `icpScoreHigh` | ICP score ≥ 75 | Add to high-priority list |
| `behavioralSignal` | Engagement milestone | Trigger targeted campaign |
| `salesReady` | MVL-Sales qualified | Notify sales team |

### Contact Properties to Sync

```json
{
  "email": "prospect@company.com",
  "firstName": "John",
  "lastName": "Doe",
  "company": "Acme Corp",
  "companyDomain": "acme.com",
  "icpScore": 72,
  "icpGrade": "B",
  "industry": "Management Consulting",
  "companySize": "50-100",
  "estimatedRevenue": "$5M-$10M",
  "mvlStatus": "qualified",
  "qualifiedAt": "2026-02-27",
  "source": "apollo_tam_list",
  "linkedInUrl": "https://linkedin.com/company/acme"
}
```

### Sync Script

```python
#!/usr/bin/env python3
"""
Sync MVL-qualified leads to Loops for nurture sequences.

Runs daily via cron after dbt transforms complete.
"""

import os
import json
import requests
from google.cloud import bigquery
from datetime import datetime, timezone

LOOPS_API_KEY = os.environ.get("LOOPS_API_KEY")
LOOPS_API_URL = "https://app.loops.so/api/v1/events/send"
PROJECT_ID = "slideheroes-data-platform"

def get_qualified_leads():
    """Fetch MVL-qualified leads from BigQuery."""
    client = bigquery.Client(project=PROJECT_ID)
    
    query = """
    SELECT 
        email,
        first_name,
        last_name,
        company_name,
        company_domain,
        icp_score,
        icp_grade,
        industry,
        employee_count,
        estimated_revenue,
        mvl_status,
        qualified_at,
        source,
        linkedin_url
    FROM core.mvl_qualified_leads_for_loops
    WHERE sync_to_loops = TRUE
      AND loops_synced_at IS NULL
    """
    
    results = client.query(query).result()
    return [dict(row) for row in results]

def send_to_loops(lead):
    """Send lead to Loops via event API."""
    payload = {
        "email": lead["email"],
        "eventName": "mvlQualified",
        "firstName": lead.get("first_name"),
        "lastName": lead.get("last_name"),
        "company": lead.get("company_name"),
        "companyDomain": lead.get("company_domain"),
        "icpScore": lead.get("icp_score"),
        "icpGrade": lead.get("icp_grade"),
        "industry": lead.get("industry"),
        "companySize": lead.get("employee_count"),
        "estimatedRevenue": lead.get("estimated_revenue"),
        "mvlStatus": lead.get("mvl_status"),
        "qualifiedAt": lead.get("qualified_at"),
        "source": lead.get("source"),
        "linkedInUrl": lead.get("linkedin_url"),
        "mailingLists": {
            # Add to MVL Nurture list
            "cm06f5v0e45nf0ml5754o9cix": True
        }
    }
    
    # Remove None values
    payload = {k: v for k, v in payload.items() if v is not None}
    
    headers = {
        "Authorization": f"Bearer {LOOPS_API_KEY}",
        "Content-Type": "application/json"
    }
    
    response = requests.post(LOOPS_API_URL, json=payload, headers=headers)
    
    if response.status_code == 200:
        return {"success": True, "email": lead["email"]}
    else:
        return {
            "success": False, 
            "email": lead["email"],
            "error": response.text
        }

def mark_synced(emails):
    """Mark leads as synced in BigQuery."""
    client = bigquery.Client(project=PROJECT_ID)
    
    query = f"""
    UPDATE core.mvl_qualified_leads
    SET loops_synced_at = CURRENT_TIMESTAMP()
    WHERE email IN ({','.join([f"'{e}'" for e in emails])})
    """
    
    client.query(query).result()

def main():
    """Main sync function."""
    print(f"[{datetime.now(timezone.utc).isoformat()}] Starting Loops sync...")
    
    leads = get_qualified_leads()
    print(f"Found {len(leads)} leads to sync")
    
    success_count = 0
    failed_count = 0
    synced_emails = []
    
    for lead in leads:
        result = send_to_loops(lead)
        if result["success"]:
            success_count += 1
            synced_emails.append(lead["email"])
        else:
            failed_count += 1
            print(f"Failed: {result}")
    
    if synced_emails:
        mark_synced(synced_emails)
    
    print(f"Sync complete: {success_count} succeeded, {failed_count} failed")
    
    return {
        "synced": success_count,
        "failed": failed_count,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

if __name__ == "__main__":
    main()
```

---

## 4. Loops Automation Setup

### MVL Nurture Sequence

Create in Loops dashboard:

1. **Trigger:** Event `mvlQualified`
2. **Entry Criteria:** `icpScore >= 45` AND `industry = "Management Consulting"`
3. **Emails:**
   - Day 0: Introduction to SlideHeroes
   - Day 3: Case study - Consultant presentation transformation
   - Day 7: Value proposition - AI-powered deck creation
   - Day 14: Social proof - Testimonial highlights
   - Day 21: Soft ask - Free trial invitation
   - Day 28: Final nurture - Resource roundup

### High-Priority Sequence

1. **Trigger:** Event `icpScoreHigh` (score ≥ 75)
2. **Entry Criteria:** `icpScore >= 75`
3. **Emails:**
   - Day 0: Personalized outreach (uses company name, industry)
   - Day 2: Relevant case study
   - Day 5: Demo offer
   - Day 10: Follow-up

---

## 5. Instantly.ai Integration (Future)

### When to Use
- Post-product-launch
- For cold outbound to MVL-Outbound segment
- Requires Instantly.ai subscription

### API Integration

```python
# Future implementation
INSTANTLY_API_URL = "https://api.instantly.ai/api/v1/lead/add"

def add_to_instantly(lead):
    """Add lead to Instantly.ai cold outreach sequence."""
    payload = {
        "api_key": INSTANTLY_API_KEY,
        "campaign_id": CAMPAIGN_ID,
        "lead": {
            "email": lead["email"],
            "first_name": lead.get("first_name"),
            "last_name": lead.get("last_name"),
            "company_name": lead.get("company_name"),
            "personalization": f"Saw you're in {lead.get('industry', 'consulting')}",
        }
    }
    
    response = requests.post(INSTANTLY_API_URL, json=payload)
    return response.json()
```

---

## 6. BigQuery Views

### mvl_qualified_leads_for_loops

```sql
CREATE OR REPLACE VIEW core.mvl_qualified_leads_for_loops AS
SELECT 
    p.email,
    p.first_name,
    p.last_name,
    c.name as company_name,
    c.domain as company_domain,
    s.icp_score,
    s.icp_grade,
    c.industry,
    c.employee_count,
    c.estimated_revenue,
    'MVL-Outbound' as mvl_status,
    s.qualified_at,
    'apollo_tam_list' as source,
    c.linkedin_url,
    
    -- Sync flags
    TRUE as sync_to_loops,
    NULL as loops_synced_at
FROM core.mvl_qualified_leads m
JOIN core.dim_companies c ON m.company_id = c.id
JOIN core.company_person_map cpm ON c.id = cpm.company_id
JOIN core.dim_customers_deduped p ON cpm.person_id = p.id
JOIN core.icp_scores s ON c.id = s.company_id
WHERE m.qualification_tier = 'MVL-Outbound'
  AND p.email IS NOT NULL
  AND p.is_internal = FALSE
  AND p.is_test = FALSE
```

### icp_score_changed (Real-time trigger)

```sql
CREATE OR REPLACE VIEW core.icp_score_changed AS
SELECT 
    c.id as company_id,
    c.name as company_name,
    c.domain,
    s.icp_score,
    s.icp_grade,
    s.previous_score,
    s.previous_grade,
    s.score_changed_at
FROM core.icp_scores s
JOIN core.dim_companies c ON s.company_id = c.id
WHERE s.score_changed_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 24 HOUR)
  AND (
    (s.icp_score >= 75 AND s.previous_score < 75)  -- Entered high-priority
    OR (s.icp_score >= 60 AND s.previous_score < 60)  -- Entered MVL-Sales
    OR (s.icp_score >= 45 AND s.previous_score < 45)  -- Entered MVL-Outbound
  )
```

---

## 7. Cron Schedule

Add to OpenClaw cron:

```bash
# Sync MVL leads to Loops (daily at 7:15 AM ET, after dbt)
openclaw cron add \
  --name "Sync MVL to Loops" \
  --schedule "15 7 * * *" \
  --timezone "America/New_York" \
  --command "python3 ~/clawd/scripts/sync-mvl-to-loops.py"
```

---

## 8. Environment Variables

Add to `~/.clawdbot/.env`:

```bash
LOOPS_API_KEY=your_loops_api_key_here
INSTANTLY_API_KEY=your_instantly_api_key_here  # Future
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

---

## 9. Monitoring & Alerts

### Metrics to Track
- Daily sync count (new leads to Loops)
- Loops API error rate
- Time since last sync
- Unsynced leads backlog

### Alert Conditions
- No sync in 24+ hours
- Error rate > 5%
- Backlog > 100 leads

---

## 10. Implementation Checklist

- [ ] Create BigQuery view `mvl_qualified_leads_for_loops`
- [ ] Create sync script `sync-mvl-to-loops.py`
- [ ] Add LOOPS_API_KEY to environment
- [ ] Create MVL Nurture sequence in Loops
- [ ] Create High-Priority sequence in Loops
- [ ] Add cron job for daily sync
- [ ] Test end-to-end with sample lead
- [ ] Set up monitoring

---

## 11. Privacy Considerations

- Only business emails synced (no personal emails)
- Contacts can unsubscribe via Loops
- Privacy policy must disclose email outreach (see #586)
- Honor unsubscribe requests within 10 business days
