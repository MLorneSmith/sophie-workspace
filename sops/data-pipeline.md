# SOP: Customer Data Pipeline

**Purpose:** Document the nightly ELT pipeline that syncs external data sources → BigQuery staging → dbt transforms → analytics-ready tables (including ICP scoring and entity resolution).

**Owner:** Sophie (automated nightly) + Mike (monitoring)
**Last Updated:** 2026-02-14

---

## 1. Pipeline Overview

```
6:00 AM ET   Supabase → BigQuery staging (30 tables)
6:15 AM ET   Stripe → BigQuery staging (7 objects)
6:30 AM ET   PostHog → BigQuery staging (4 objects)
6:45 AM ET   Cal.com → BigQuery staging (2 objects)
6:50 AM ET   Attio → BigQuery staging (3 objects)
6:55 AM ET   Loops → BigQuery staging (3 objects)
7:00 AM ET   dbt run (staging → core transforms, ICP scoring, dedup)
7:10 AM ET   Morning briefing (consumes pipeline output)
```

All sync scripts run as OpenClaw cron jobs (isolated sessions). dbt runs as a separate cron job after all syncs complete.

---

## 2. Data Sources

| Source | Script | Cron ID | Env Vars | What It Syncs |
|--------|--------|---------|----------|---------------|
| Supabase | `sync-supabase-bigquery.py` | `72cf0587` | `SUPABASE_DB_DIRECT_URL` | 30 app database tables (accounts, memberships, billing, etc.) |
| Stripe | `sync-stripe-bigquery.py` | `fbbcf960` | `STRIPE_SECRET_KEY` | customers, products, prices, subscriptions, invoices, payment_intents, charges |
| PostHog | `sync-posthog-bigquery.py` | `30430f69` | `POSTHOG_API_KEY`, `POSTHOG_PROJECT_ID` (118229) | events, persons, event_definitions, property_definitions |
| Cal.com | `sync-calcom-bigquery.py` | `d6558a3d` | `CAL_API_KEY` | event_types, bookings |
| Attio | `sync-attio-bigquery.py` | `2577ffe2` | `ATTIO_API_KEY` | companies, people, deals |
| Loops | `sync-loops-bigquery.py` | `a6d5202c` | `LOOPS_API_KEY` | contact_properties, mailing_lists, transactional_emails |
| Apollo | `sync-apollo-bigquery.py` | *(pending)* | `APOLLO_API_KEY` | organizations (ICP-filtered). Currently credit-limited on free plan. |

**Scripts location:** `~/clawd/scripts/sync-*-bigquery.py`
**All scripts follow the same pattern:** Read env vars → paginate API → flatten/sanitize fields → MERGE or full-replace into BigQuery `staging` dataset.

---

## 3. dbt Transform Layer

**Project:** `~/clawd/dbt/`
**Profiles:** `~/clawd/dbt/profiles.yml`
**Virtual env:** `~/clawd/.venv-dbt/`

### Staging Models (views — thin wrappers)
Clean up raw data: normalize emails, cast types, parse JSON fields.

| Model | Source Table | Key Transforms |
|-------|-------------|----------------|
| `stg_accounts` | `staging.accounts` | Lowercase email |
| `stg_stripe_customers` | `staging.stripe_customers` | Lowercase email, parse created timestamp |
| `stg_stripe_subscriptions` | `staging.stripe_subscriptions` | Type casting |
| `stg_attio_companies` | `staging.attio_companies` | Parse timestamps |
| `stg_attio_people` | `staging.attio_people` | Lowercase email, parse timestamps |
| `stg_apollo_organizations` | `staging.apollo_organizations` | Normalize domain, cast growth rates, parse SIC codes + languages |
| `stg_posthog_events` | `staging.posthog_events` | Event normalization |
| `stg_posthog_persons` | `staging.posthog_persons` | Extract email from properties |
| `stg_calcom_bookings` | `staging.calcom_event_types` | Type casting |
| `stg_orders` | `staging.orders` | Type casting |
| `stg_subscriptions` | `staging.subscriptions` | Type casting |

### Core Models (tables — business logic)

| Model | What It Does | Key Joins |
|-------|-------------|-----------|
| `dim_customers` | Unified person record across Supabase, Stripe, Attio | Full outer join on normalized email |
| `dim_companies` | Unified company record from Attio + Apollo | Full outer join on domain |
| `icp_scores` | Scores every company 0-100 on ICP fit | Joins dim_companies → dim_customers → PostHog events + Stripe subs |
| `fct_events` | Clean PostHog events | From stg_posthog_events |
| `fct_subscriptions` | Subscription facts | From stg_subscriptions |
| `fct_bookings` | Cal.com booking facts | From stg_calcom_bookings |
| `fct_orders` | Order facts | From stg_orders |
| `dim_customers_deduped` | Deduplicated people with customer_type, is_internal, is_test flags | From dim_customers + Stripe subs |
| `company_person_map` | Links people ↔ companies via Attio ID + email domain | From dim_customers_deduped + dim_companies |
| `entity_resolution_audit` | Data quality diagnostics (single-row view) | From dim_customers_deduped + company_person_map |
| `mvl_qualified_leads` | Companies meeting MVL threshold for outreach/sales | From icp_scores + dim_companies + company_person_map |
| `mvl_summary` | Qualification diagnostics view | From mvl_qualified_leads |

---

## 4. ICP Scoring Model

**Model:** `core.icp_scores`
**Output:** Every company gets a composite 0-100 score + letter grade.

### Scoring Dimensions

| Dimension | Points | Source | Logic |
|-----------|--------|--------|-------|
| Firm Size | 0-10 | Apollo revenue (proxy) or headcount | $1M-$10M rev = 10 (maps to 5-50 employees) |
| Industry | 0-10 | Apollo SIC codes | SIC 7389/7392/8742/8748/6282 = consulting = 10 |
| Revenue | 0-10 | Apollo `organization_revenue` | $1M-$20M sweet spot = 10 |
| Geography | 0-10 | Attio location + Apollo languages | English-speaking market = 8-10 |
| Engagement | 0-15 | PostHog events per company | 20+ events = 15 |
| Payment | 0-15 | Stripe subscriptions | Active sub = 15 |
| Growth | 0-15 | Apollo 12m headcount growth | >10% growth = 15 |
| Recency | 0-15 | Supabase account creation date | <30 days = 15 |

### Grades & Segments
- **A (75+):** High-fit, active prospect — prioritize
- **B (50-74):** Strong fit — nurture
- **C (25-49):** Partial fit — monitor
- **F (<25):** Poor fit — deprioritize

**Segments:** Primary (consulting, right size, grade B+), Secondary Mid-size, Secondary Solo, Secondary Other Consulting, Other.

**ICP criteria source:** `~/clawd/strategy/slideheroes-icp.md`

---

## 5. Entity Resolution / Deduplication

### The Problem
Data arrives from 6+ sources with different identifiers. The same person/company may appear in multiple systems with different IDs.

### How It Works
**People (dim_customers):**
- **Join key:** Normalized email (lowercase)
- **Sources:** Supabase accounts, Stripe customers, Attio people
- **Dedup:** Full outer join on email; COALESCE priority: Supabase > Stripe > Attio
- **Test/internal filtering:** SlideHeroes test accounts flagged with `is_internal` boolean
- **Classification:** Each person gets a `customer_type`: product_user, paying_customer, past_customer, prospect, unknown

**Companies (dim_companies):**
- **Join key:** Normalized domain (lowercase, www stripped)
- **Sources:** Attio companies, Apollo organizations
- **Dedup:** Full outer join on domain; Attio IDs preserved, Apollo-only companies get synthetic ID (`apollo:<id>`)
- **No duplicates found** in current data (domains are unique within each source)

**Company↔Person linking:**
- Via Attio CRM link (JSON `target_record_id` in person's company field)
- Via email domain matching (person's `@domain.com` → company's domain)

### What to Watch For
- **New sources added:** When adding a new data source, add it to the dim_customers join and update source_systems tracking
- **Email format changes:** If a source stops normalizing emails, the joins will silently fail (no errors, just unmatched records)
- **Apollo data refresh:** Currently blocked by free plan credit limits. Once credits reset or plan upgrades, the filtered search will pull ~28K consulting firms

---

## 5b. MVL (Minimum Viable Lead) Qualification

**Model:** `core.mvl_qualified_leads`
**Summary view:** `core.mvl_summary`

MVL defines the bar a prospect must clear before being worth pursuing. Built on top of ICP scores + entity resolution.

### Two Qualification Tiers

| Tier | Threshold | Purpose | When to Use |
|------|-----------|---------|-------------|
| **MVL-Outbound** | ICP score ≥ 45 + consulting industry | Cold outreach candidates | Post-product-launch only |
| **MVL-Sales** | ICP score ≥ 60 OR has product engagement | Active sales follow-up | When leads show intent |

### Qualification Rules (both tiers)
- Industry must be Management Consulting or Professional Services
- Not a test/internal record
- Company has a name

### Additional Fields
- `already_in_attio` — boolean; if true, company is already in Attio CRM (don't re-import)
- `has_product_engagement` — boolean; any linked person is a product_user or paying_customer
- `contact_count` — number of people linked to the company
- `linkedin_url`, `website_url` — for outreach research
- `qualified_at` — timestamp of when qualification was computed

### Pre-Launch vs Post-Launch
- **Pre-launch (now):** MVL-Outbound list builds up but is NOT acted on. No cold outreach before product launch.
- **Post-launch:** MVL-Outbound activates for cold outreach. MVL-Sales triggers as users sign up and show engagement.
- **Behavioral scores unlock post-launch:** Engagement (0-15) + Payment (0-15) + Recency (0-15) = 45 additional points that are currently all zero. This means MVL-Sales (≥60) will mostly trigger from product engagement, not just firmographics.

### Downstream Pipeline (future)
1. MVL-qualified companies → promoted to Attio CRM (Task #432)
2. Attio → outbound sequences via Loops/Instantly (Task #433)
3. Attribution tracking closes the loop (Task #435)

---

## 6. Maintenance

### Daily (automated)
- All sync scripts + dbt run nightly via cron. No manual intervention needed.
- If a script fails, it logs errors but doesn't block other scripts.

### Weekly (Sophie)
- Check BigQuery row counts for unexpected drops (sync script might fail silently)
- Review `entity_resolution_audit` view for data quality trends

### Monthly
- Review ICP score distribution — are grades shifting?
- Check Apollo credit status — can we run the filtered TAM search?
- Review any new PostHog events/persons for behavioral scoring improvements

### When Adding a New Data Source
1. Write sync script following existing pattern (`sync-{source}-bigquery.py`)
2. Add cron job staggered before 7:00 AM ET
3. Create staging model in dbt (`stg_{source}_{object}.sql`)
4. Update dim_customers or dim_companies joins if the source has people/company data
5. Update this SOP

---

## 7. Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Script returns 0 rows | API key expired/revoked | Check env var, test API manually |
| BigQuery "field not found" | Source API changed schema | Update script's field flattening |
| dbt run fails | Upstream staging table missing columns | Check if sync script ran; re-run manually |
| ICP scores all F | No behavioral data (pre-launch normal) | Expected until product has real users |
| Apollo 422 "insufficient credits" | Free plan credits exhausted | Wait for monthly reset or upgrade plan |
| PostHog events not linking to companies | Persons missing email in properties | Check PostHog identify() calls in app |

### Manual Re-run Commands
```bash
# Re-run a single sync
source ~/.openclaw/.secrets.env
export GOOGLE_APPLICATION_CREDENTIALS=/home/ubuntu/.openclaw/gcp-service-account.json
python3 ~/clawd/scripts/sync-stripe-bigquery.py

# Re-run dbt
cd ~/clawd/dbt
source ~/clawd/.venv-dbt/bin/activate
export GOOGLE_APPLICATION_CREDENTIALS=/home/ubuntu/.openclaw/gcp-service-account.json
dbt run

# Run a specific model
dbt run --select icp_scores

# Check a model's output
dbt run --select dim_customers && bq query --use_legacy_sql=false 'SELECT COUNT(*) FROM core.dim_customers'
```

---

## 8. Architecture Reference

**Full architecture doc:** `~/clawd/deliverables/customer-data-ecosystem-architecture.md`
**ICP definition:** `~/clawd/strategy/slideheroes-icp.md`
**ICP scoring research:** `~/clawd/deliverables/icp-scoring-research.md`

### BigQuery Layout
```
slideheroes-data-platform
├── staging          # Raw data from sync scripts (49 tables)
│   ├── accounts, stripe_*, posthog_*, attio_*, calcom_*, loops_*, apollo_*
│   └── (+ Supabase app tables)
└── core             # dbt-transformed analytics tables
    ├── dim_customers       # Unified people
    ├── dim_companies       # Unified companies (Attio + Apollo)
    ├── icp_scores          # Company ICP fit scoring
    ├── fct_events          # PostHog events
    ├── fct_subscriptions   # Subscription facts
    ├── fct_bookings        # Cal.com bookings
    └── fct_orders          # Order facts
```

---

## 9. Cost

| Component | Monthly Cost |
|-----------|-------------|
| BigQuery (staging + core) | ~$0 (under free tier at current volume) |
| Sync scripts (cron) | $0 (runs on existing EC2) |
| dbt | $0 (open source, runs locally) |
| Apollo | $0 (free plan, credit-limited) |
| PostHog | $0 (free tier) |
| Attio | $0 (free plan) |
| **Total** | **~$0/mo** |
