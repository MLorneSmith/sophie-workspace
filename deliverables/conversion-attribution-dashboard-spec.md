# Conversion Attribution Dashboard Spec

**Purpose:** Design for closed-loop reporting that tracks which ICP segments, Apollo lists, and qualification signals actually convert to paying customers.

**Created:** 2026-02-27
**Task:** #435
**Status:** Ready for implementation

---

## 1. Business Questions to Answer

### Primary Questions
1. **Which ICP segments convert best?** — Grade A vs B vs C conversion rates
2. **Which Apollo lists produce customers?** — TAM list performance by segment
3. **What signals predict conversion?** — Engagement, firmographics, behavioral patterns
4. **How long is the sales cycle?** — Time from first touch to conversion by segment
5. **What's the revenue attribution?** — Revenue by source, segment, and channel

### Secondary Questions
6. **Which outreach sequences work?** — Email open/click rates by segment
7. **What's the cost per acquisition?** — By channel and segment
8. **Where do prospects drop off?** — Funnel leakage analysis

---

## 2. Data Model

### Attribution Events Table

```sql
-- core.attribution_events
CREATE OR REPLACE TABLE core.attribution_events (
    event_id STRING,
    event_timestamp TIMESTAMP,
    event_type STRING,  -- 'first_touch', 'email_sent', 'email_opened', 'demo_booked', 'trial_started', 'converted'
    
    -- Customer identifiers
    email STRING,
    user_id STRING,
    company_domain STRING,
    
    -- Attribution data
    source STRING,           -- 'organic', 'apollo_list', 'referral', 'paid'
    source_detail STRING,    -- Apollo list name, campaign ID, etc.
    icp_grade STRING,        -- A, B, C, F
    icp_score INT64,
    
    -- Segment data
    segment STRING,          -- 'primary', 'secondary_mid', 'secondary_solo', etc.
    industry STRING,
    company_size STRING,
    geography STRING,
    
    -- Conversion data
    conversion_value FLOAT,  -- Revenue if converted
    conversion_type STRING,  -- 'trial', 'subscription', 'enterprise'
    
    -- Metadata
    campaign_id STRING,
    outreach_sequence STRING
)
CLUSTER BY event_timestamp, company_domain;
```

### Customer Journey Table

```sql
-- core.customer_journeys
CREATE OR REPLACE TABLE core.customer_journeys (
    journey_id STRING,
    company_domain STRING,
    
    -- Journey timeline
    first_touch TIMESTAMP,
    last_touch TIMESTAMP,
    conversion_date TIMESTAMP,
    
    -- Attribution
    primary_source STRING,
    touchpoint_count INT64,
    
    -- Outcome
    status STRING,  -- 'prospect', 'trial', 'converted', 'churned'
    lifetime_value FLOAT,
    
    -- ICP at conversion
    icp_grade_at_conversion STRING,
    icp_score_at_conversion INT64
)
CLUSTER BY company_domain;
```

### Attribution Summary View

```sql
-- core.attribution_summary
CREATE OR REPLACE VIEW core.attribution_summary AS
WITH conversions AS (
    SELECT 
        source,
        source_detail,
        icp_grade,
        segment,
        COUNT(DISTINCT company_domain) as converted_companies,
        SUM(conversion_value) as total_revenue,
        AVG(DATE_DIFF(conversion_date, first_touch, DAY)) as avg_days_to_convert
    FROM core.customer_journeys j
    JOIN core.attribution_events e USING (company_domain)
    WHERE e.event_type = 'converted'
    GROUP BY 1, 2, 3, 4
),
touches AS (
    SELECT 
        source,
        icp_grade,
        COUNT(DISTINCT company_domain) as touched_companies
    FROM core.attribution_events
    WHERE event_type = 'first_touch'
    GROUP BY 1, 2
)
SELECT 
    c.source,
    c.source_detail,
    c.icp_grade,
    c.segment,
    t.touched_companies as prospects,
    c.converted_companies,
    SAFE_DIVIDE(c.converted_companies, t.touched_companies) as conversion_rate,
    c.total_revenue,
    c.avg_days_to_convert
FROM conversions c
JOIN touches t USING (source, icp_grade)
```

---

## 3. Dashboard Layout

### Section 1: Executive Summary
```
┌─────────────────────────────────────────────────────────────┐
│  CONVERSION ATTRIBUTION DASHBOARD                           │
│  Last 30 Days | All Time                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ Prospects│ │ Trials   │ │ Converted│ │ Revenue  │       │
│  │   847    │ │   124    │ │    42    │ │  $84K    │       │
│  │  +12%    │ │  +8%     │ │  +15%    │ │  +22%    │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                                                             │
│  Overall Conversion Rate: 4.96%                             │
│  Avg Days to Convert: 23                                    │
└─────────────────────────────────────────────────────────────┘
```

### Section 2: ICP Segment Performance
```
┌─────────────────────────────────────────────────────────────┐
│  CONVERSION BY ICP GRADE                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Grade A (75+)  ████████████████████  12.3%  (15/122)      │
│  Grade B (50-74)████████████  5.8%  (18/310)               │
│  Grade C (25-49)████  2.1%  (8/380)                        │
│  Grade F (<25)  █  0.3%  (1/335)                           │
│                                                             │
│  Insight: Grade A converts 4x better than average          │
└─────────────────────────────────────────────────────────────┘
```

### Section 3: Source Attribution
```
┌─────────────────────────────────────────────────────────────┐
│  CONVERSION BY SOURCE                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Source          │ Prospects │ Conv │ Rate │ Revenue       │
│  ─────────────────────────────────────────────────────────  │
│  Organic         │    312    │  18  │ 5.8% │  $36K         │
│  Apollo - TAM    │    245    │  12  │ 4.9% │  $24K         │
│  Referral        │     89    │   8  │ 9.0% │  $16K         │
│  Paid Ads        │    201    │   4  │ 2.0% │   $8K         │
│                                                             │
│  Best ROI: Referral (9% conversion, high LTV)              │
└─────────────────────────────────────────────────────────────┘
```

### Section 4: Apollo List Performance
```
┌─────────────────────────────────────────────────────────────┐
│  APOLLO LIST PERFORMANCE                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  List Name                │ Contacts │ Conv │ Rate │ CAC   │
│  ─────────────────────────────────────────────────────────  │
│  Management Consulting    │   8.2K   │  12  │ 0.15%│ $42   │
│  Professional Services    │   6.1K   │   8  │ 0.13%│ $38   │
│  Tech Startups 10-50      │   4.5K   │   5  │ 0.11%│ $45   │
│  Enterprise Training      │   2.8K   │   2  │ 0.07%│ $62   │
│                                                             │
│  Recommendation: Focus on Management Consulting list       │
└─────────────────────────────────────────────────────────────┘
```

### Section 5: Funnel Analysis
```
┌─────────────────────────────────────────────────────────────┐
│  CONVERSION FUNNEL                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Identified Visitors     ████████████████████████  847     │
│  Email Sent              ████████████████        524       │
│  Email Opened            ████████                262       │
│  Email Clicked           ████                    131       │
│  Demo/Signup             ██                       65       │
│  Trial Started           █                        42       │
│  Converted               █                        42       │
│                                                             │
│  Biggest Drop: Email Sent → Opened (50% loss)              │
│  Opportunity: Improve subject lines for Grade A/B          │
└─────────────────────────────────────────────────────────────┘
```

### Section 6: Signal Correlation
```
┌─────────────────────────────────────────────────────────────┐
│  SIGNALS THAT PREDICT CONVERSION                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Signal                    │ Correlation │ Conv Rate       │
│  ─────────────────────────────────────────────────────────  │
│  3+ website visits         │    0.72     │   8.2%          │
│  Downloaded resource       │    0.68     │   7.1%          │
│  Opened 2+ emails          │    0.61     │   6.4%          │
│  Consulting industry       │    0.55     │   5.8%          │
│  $1M-$10M revenue          │    0.48     │   5.2%          │
│  5-50 employees            │    0.42     │   4.7%          │
│  US/Canada based           │    0.38     │   4.3%          │
│                                                             │
│  Top 3 signals should weight ICP scoring higher            │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Feedback Loop to ICP Scoring

### Automated Score Adjustment

```python
# Pseudo-code for score adjustment based on attribution
def adjust_icp_weights(attribution_data):
    """Adjust ICP scoring weights based on what actually converts."""
    
    # Calculate signal correlation with conversion
    signal_weights = {}
    for signal in ALL_SIGNALS:
        correlation = calculate_correlation(
            attribution_data[signal],
            attribution_data['converted']
        )
        signal_weights[signal] = correlation
    
    # Normalize weights
    total = sum(signal_weights.values())
    for signal in signal_weights:
        signal_weights[signal] = signal_weights[signal] / total
    
    return signal_weights

# Run monthly
# Store adjusted weights in config table
# dbt model applies adjusted weights to daily scoring
```

### Weight Adjustment Schedule
- **Weekly:** Calculate signal correlations
- **Monthly:** Adjust ICP scoring weights
- **Quarterly:** Full model review and recalibration

---

## 5. Data Sources & Integration

### Input Sources
| Source | Data | Frequency |
|--------|------|-----------|
| BigQuery `core.icp_scores` | ICP grades, scores | Daily |
| BigQuery `staging.posthog_events` | Behavioral signals | Daily |
| BigQuery `staging.stripe_*` | Conversion events | Daily |
| Loops webhooks | Email engagement | Real-time |
| Attio API | Sales stage changes | Daily |

### Output Destinations
| Destination | Purpose | Frequency |
|-------------|---------|-----------|
| Internal Tools Dashboard | Visualization | Real-time |
| `core.attribution_summary` | Reporting | Daily refresh |
| ICP scoring model | Weight adjustments | Monthly |
| Morning Brief | Key metrics | Daily |

---

## 6. Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Create `core.attribution_events` table
- [ ] Create `core.customer_journeys` table
- [ ] Build dbt models for attribution
- [ ] Set up event ingestion from existing sources

### Phase 2: Dashboard (Week 2)
- [ ] Build Internal Tools dashboard page
- [ ] Add ICP segment performance charts
- [ ] Add source attribution table
- [ ] Add funnel visualization

### Phase 3: Feedback Loop (Week 3)
- [ ] Implement signal correlation calculation
- [ ] Build weight adjustment job
- [ ] Connect to ICP scoring model
- [ ] Add to monthly review process

### Phase 4: Automation (Week 4)
- [ ] Automated insights generation
- [ ] Anomaly detection on conversion rates
- [ ] Alert on significant changes
- [ ] Integration with morning brief

---

## 7. Success Metrics

### Dashboard Health
- Data freshness: < 24 hours
- Query latency: < 5 seconds
- Uptime: 99.9%

### Business Impact
- Improved ICP targeting (measured by conversion rate lift)
- Reduced CAC through better channel allocation
- Shorter sales cycle through signal-based prioritization

---

## 8. Dependencies

- **Task #432:** BigQuery → Attio promotion pipeline (for sales stage data)
- **Task #433:** BigQuery → Loops outbound triggers (for email engagement)
- **Task #584:** Loops → BigQuery webhook (for email engagement)
- **SOP:** `sops/data-pipeline.md` (existing pipeline infrastructure)

---

## Appendix: Sample Queries

### Conversion rate by ICP grade
```sql
SELECT 
    icp_grade,
    COUNT(DISTINCT CASE WHEN status = 'converted' THEN company_domain END) as converted,
    COUNT(DISTINCT company_domain) as total,
    SAFE_DIVIDE(
        COUNT(DISTINCT CASE WHEN status = 'converted' THEN company_domain END),
        COUNT(DISTINCT company_domain)
    ) as conversion_rate
FROM core.customer_journeys
GROUP BY icp_grade
ORDER BY icp_grade
```

### Time to convert by segment
```sql
SELECT 
    segment,
    AVG(DATE_DIFF(conversion_date, first_touch, DAY)) as avg_days,
    PERCENTILE(DATE_DIFF(conversion_date, first_touch, DAY), 50) as median_days
FROM core.customer_journeys
WHERE status = 'converted'
GROUP BY segment
```

### Top converting Apollo lists
```sql
SELECT 
    source_detail as apollo_list,
    COUNT(DISTINCT CASE WHEN event_type = 'first_touch' THEN company_domain END) as prospects,
    COUNT(DISTINCT CASE WHEN event_type = 'converted' THEN company_domain END) as converted,
FROM core.attribution_events
WHERE source = 'apollo_list'
GROUP BY source_detail
ORDER BY converted DESC
```
