# Customer Segmentation Framework

**Purpose:** Define segmentation strategy for existing email subscribers and customers to enable targeted re-engagement and migration campaigns.

**Created:** 2026-02-27
**Task:** #181
**Status:** Ready for implementation (requires data access)

---

## 1. Segmentation Philosophy

### Principles
1. **Behavior over demographics** — What they've done matters more than who they are
2. **Recency wins** — Recent activity is the strongest signal of future engagement
3. **Value-tiered** — Segment by economic value, not just activity
4. **Migration-ready** — Segments should map to product migration paths

### Key Questions to Answer
- Who are our most valuable customers?
- Who's at risk of churning?
- Who should get early access to the new SaaS product?
- Who needs re-engagement before launch?

---

## 2. Primary Segmentation Dimensions

### A. Customer Type

| Segment | Definition | Size (Est.) | Migration Priority |
|---------|------------|-------------|-------------------|
| **Course Buyers** | Purchased Seneca course | ~200 | Medium |
| **Corporate Customers** | B2B/training contracts | ~20 | High |
| **Active Subscribers** | Opened email in last 90 days | ~500 | High |
| **Dormant Subscribers** | No opens in 90+ days | ~1,500 | Low |
| **Never Purchased** | Subscribers who never bought | ~1,800 | Medium |

### B. Engagement Level

| Segment | Criteria | Value Signal |
|---------|----------|--------------|
| **Super Engaged** | Opened 5+ emails in last 30 days | High intent |
| **Engaged** | Opened 2-4 emails in last 30 days | Active interest |
| **Moderate** | Opened 1-3 emails in last 90 days | Warm |
| **Low** | 1 open in last 180 days | Cooling |
| **Inactive** | No opens in 180+ days | Cold |

### C. Purchase History

| Segment | Purchase Behavior | LTV Indicator |
|---------|------------------|---------------|
| **Multi-Buyer** | 2+ purchases | High LTV |
| **Single Buyer** | 1 purchase | Medium LTV |
| **High Value** | Purchase > $200 | Premium target |
| **Low Value** | Purchase < $50 | Upsell target |
| **Refund/Chargeback** | Any refund | Risk flag |

### D. Product Interest (Inferred)

| Segment | Inferred From | Product Fit |
|---------|---------------|-------------|
| **Presentation Focused** | Downloaded deck templates | Core product |
| **Training Focused** | Course buyer, webinar attendee | Education add-on |
| **Corporate Decision Maker** | B2B purchase, business email | Team plans |
| **Individual Contributor** | Personal email, single purchase | Solo plan |

---

## 3. Composite Segments (Actionable Cohorts)

### High-Priority Migration Targets

| Cohort | Criteria | Campaign | Priority |
|--------|----------|----------|----------|
| **VIP Early Access** | Multi-buyer + Super Engaged + Corporate | Beta invite | P0 |
| **Warm Corporate** | Corporate + Engaged | Preview offer | P1 |
| **Active Course Alumni** | Course buyer + Engaged | Upgrade path | P1 |
| **Re-Engagement Targets** | Moderate + Single Buyer | Win-back sequence | P2 |

### Re-Engagement Priorities

| Cohort | Criteria | Campaign |
|--------|----------|----------|
| **At Risk** | Was Engaged → No opens 60+ days | "We miss you" email |
| **Dormant Value** | Multi-buyer + Dormant | Personal outreach |
| **Never Activated** | Subscriber + Never opened | Value-first intro |

### Suppression Candidates

| Cohort | Criteria | Action |
|--------|----------|--------|
| **Hard Bounce** | Email bounced | Remove from list |
| **Spam Complaint** | Marked as spam | Suppress permanently |
| **Dead Email** | No activity 365+ days | Archive (GDPR) |

---

## 4. Data Requirements

### From Kit/Drip

| Field | Purpose | Priority |
|-------|---------|----------|
| Email | Primary key | Required |
| First Name | Personalization | Required |
| Signup Date | Tenure calculation | Required |
| Last Email Open | Engagement scoring | Required |
| Last Email Click | Interest signal | High |
| Total Opens (90d) | Engagement tier | High |
| Purchase History | Value segmentation | Required |
| Purchase Amount | LTV calculation | Required |
| Purchase Date | Recency scoring | High |
| Tags | Custom segments | Medium |
| UTM Source | Attribution | Medium |

### From Thinkific (Course Data)

| Field | Purpose |
|-------|---------|
| Enrollment Date | Course start |
| Completion % | Engagement |
| Certificate Issued | Achievement |
| Last Login | Active status |

### From Stripe (Payment Data)

| Field | Purpose |
|-------|---------|
| Customer ID | Cross-reference |
| Total Revenue | LTV |
| Subscription Status | Active/churned |
| Refund History | Risk flag |

---

## 5. Implementation in Loops

### Custom Properties to Create

```javascript
// Contact properties for segmentation
{
  "customerType": "course_buyer|corporate|subscriber",
  "engagementLevel": "super|engaged|moderate|low|inactive",
  "purchaseCount": 0,  // number
  "totalSpent": 0,     // number in cents
  "lastPurchaseDate": "2026-01-15",  // date
  "lastEmailOpen": "2026-02-20",     // date
  "hasCompletedCourse": false,       // boolean
  "isCorporateDomain": false,        // boolean
  "migrationPriority": "p0|p1|p2|p3", // string
  "segment": "vip_early_access|warm_corporate|..." // string
}
```

### Segments to Create in Loops

1. **VIP Early Access**
   - `purchaseCount >= 2` AND `engagementLevel = "super"`
   
2. **Corporate Warm**
   - `isCorporateDomain = true` AND `engagementLevel != "inactive"`
   
3. **Course Alumni Active**
   - `customerType = "course_buyer"` AND `lastEmailOpen >= 30 days ago`
   
4. **Re-engagement Needed**
   - `lastEmailOpen >= 60 days ago` AND `lastEmailOpen <= 180 days ago`
   
5. **Dormant Value**
   - `purchaseCount >= 1` AND `lastEmailOpen >= 90 days ago`

---

## 6. Migration Campaign Mapping

### By Segment

| Segment | Pre-Launch | Launch | Post-Launch |
|---------|------------|--------|-------------|
| VIP Early Access | Beta invite | Founder offer | Priority support |
| Corporate Warm | Preview email | Team plan pitch | Success check-in |
| Course Alumni | Value teaser | Upgrade discount | Case study share |
| Active Subscriber | Product preview | Launch announcement | Feature education |
| Dormant | Re-engagement | Launch (if reactivated) | Nurture |

---

## 7. Segmentation Script (Python)

```python
#!/usr/bin/env python3
"""
Segment customers based on engagement and purchase history.
Run after exporting data from Kit/Drip + Thinkific + Stripe.
"""

import pandas as pd
from datetime import datetime, timedelta

def calculate_engagement_tier(row):
    """Determine engagement level based on email activity."""
    last_open = row.get('last_email_open')
    opens_90d = row.get('opens_90d', 0)
    
    if pd.isna(last_open):
        return 'inactive'
    
    days_since_open = (datetime.now() - pd.to_datetime(last_open)).days
    
    if days_since_open <= 30 and opens_90d >= 5:
        return 'super'
    elif days_since_open <= 30 and opens_90d >= 2:
        return 'engaged'
    elif days_since_open <= 90:
        return 'moderate'
    elif days_since_open <= 180:
        return 'low'
    else:
        return 'inactive'

def calculate_customer_type(row):
    """Determine customer type based on purchase history."""
    has_course = row.get('has_course_purchase', False)
    has_corporate = row.get('has_corporate_purchase', False)
    purchase_count = row.get('purchase_count', 0)
    
    if has_corporate:
        return 'corporate'
    elif has_course:
        return 'course_buyer'
    elif purchase_count > 0:
        return 'customer'
    else:
        return 'subscriber'

def calculate_migration_priority(row):
    """Determine migration campaign priority."""
    customer_type = row.get('customer_type')
    engagement = row.get('engagement_level')
    purchase_count = row.get('purchase_count', 0)
    
    if customer_type == 'corporate' and engagement in ['super', 'engaged']:
        return 'p0'
    elif purchase_count >= 2 and engagement in ['super', 'engaged']:
        return 'p0'
    elif customer_type == 'course_buyer' and engagement != 'inactive':
        return 'p1'
    elif engagement in ['engaged', 'moderate']:
        return 'p2'
    else:
        return 'p3'

def segment_customers(df):
    """Apply segmentation to customer dataframe."""
    
    # Calculate derived fields
    df['engagement_level'] = df.apply(calculate_engagement_tier, axis=1)
    df['customer_type'] = df.apply(calculate_customer_type, axis=1)
    df['migration_priority'] = df.apply(calculate_migration_priority, axis=1)
    
    # Composite segments
    df['segment'] = 'general'
    
    # VIP Early Access
    df.loc[
        (df['purchase_count'] >= 2) & 
        (df['engagement_level'] == 'super'),
        'segment'
    ] = 'vip_early_access'
    
    # Corporate Warm
    df.loc[
        (df['customer_type'] == 'corporate') & 
        (df['engagement_level'].isin(['super', 'engaged', 'moderate'])),
        'segment'
    ] = 'corporate_warm'
    
    # Course Alumni Active
    df.loc[
        (df['customer_type'] == 'course_buyer') & 
        (df['engagement_level'].isin(['super', 'engaged'])),
        'segment'
    ] = 'course_alumni_active'
    
    # Re-engagement
    df.loc[
        (df['engagement_level'].isin(['low', 'moderate'])) &
        (df['purchase_count'] >= 1),
        'segment'
    ] = 'reengagement_target'
    
    return df

# Usage:
# df = pd.read_csv('customer_export.csv')
# segmented = segment_customers(df)
# segmented.to_csv('segmented_customers.csv', index=False)
# print(segmented['segment'].value_counts())
```

---

## 8. Next Steps

### Phase 1: Data Collection (Requires Access)
- [ ] Export subscriber list from Kit/Drip
- [ ] Export customer list from Thinkific
- [ ] Export payment history from Stripe
- [ ] Merge into unified customer view

### Phase 2: Segmentation
- [ ] Run segmentation script
- [ ] Validate segment sizes
- [ ] Review edge cases

### Phase 3: Import to Loops
- [ ] Create custom properties
- [ ] Import segmented data
- [ ] Create segment filters

### Phase 4: Campaign Setup
- [ ] Create segment-specific campaigns
- [ ] Test with sample contacts
- [ ] Schedule launch sequence

---

## 9. Expected Segment Sizes (Estimates)

Based on typical SaaS conversion rates:

| Segment | Est. Count | % of Total |
|---------|------------|------------|
| VIP Early Access | 20-30 | 1% |
| Corporate Warm | 15-25 | 1% |
| Course Alumni Active | 80-120 | 5% |
| Active Subscriber | 400-600 | 20% |
| Re-engagement Target | 200-300 | 10% |
| General/Dormant | 1,500-2,000 | 63% |

---

## 10. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Segment coverage | 100% of contacts | All contacts assigned segment |
| VIP activation rate | 50%+ | VIPs who try new product |
| Re-engagement rate | 10%+ | Dormant who open re-engagement email |
| Corporate conversion | 25%+ | Corporate who upgrade to team plan |
