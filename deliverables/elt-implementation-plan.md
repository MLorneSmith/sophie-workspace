# ELT Implementation Plan — Hybrid Approach

**Document Type:** Architecture
**Initiative:** Build the Customer Data Ecosystem (#11)
**Task:** #451 — ELT Tool Selection & Setup
**Created:** 2026-02-12
**Status:** Approved

---

## 1. Decision Summary

**Approach:** Hybrid — managed ELT for high-volume/complex sources + lightweight Cloud Functions for API-based sources.

**Why hybrid?** No single ELT tool covers all 8 of our data sources natively. Rather than building custom connectors in an ELT framework, we use the right tool for each job:
- **Managed ELT** for sources that benefit from CDC, schema drift handling, and connector maintenance (Postgres, Stripe, PostHog)
- **Cloud Functions** for sources with simple REST APIs where a managed connector adds no value (Attio, Apollo, Cal.com, Loops, RB2B, Instantly.ai)

---

## 2. Tools Evaluated

| Tool | Verdict | Reason |
|------|---------|--------|
| **Fivetran** | ❌ Eliminated | Too expensive post-free-tier, per-connection pricing unpredictable |
| **Airbyte Self-Hosted** | ✅ **Selected** | Best native coverage (Postgres CDC + Stripe + PostHog), free, open source |
| **Hevo Data** | Runner-up | Good managed option ($239/mo) but unclear connector coverage for our niche sources |
| **Skyvia** | ❌ Eliminated | Poor connector coverage, no custom connector path |
| **Stitch Data** | ❌ Eliminated | Expensive relative to alternatives, only ~30 connectors |
| **dlt (Python)** | Considered | Flexible but high maintenance — better as fallback |
| **Meltano** | ❌ Eliminated | Higher learning curve than Airbyte for similar benefits |
| **BQ Data Transfer** | ❌ Eliminated | Very limited source coverage |

---

## 3. Architecture

### Tier 1 — Managed ELT (Airbyte Self-Hosted)

For high-volume sources that benefit from CDC, incremental sync, and schema management.

| Source | Connector | Sync Mode | Frequency | Notes |
|--------|-----------|-----------|-----------|-------|
| **Supabase (Postgres)** | PostgreSQL CDC (Debezium) | Incremental (CDC) | Every 6h | Replaces current manual Python script |
| **Stripe** | Stripe native connector | Incremental | Every 6h | Subscriptions, invoices, payments, customers |
| **PostHog** | PostHog native connector | Incremental | Every 12h | Events, persons, feature flags |

**Infrastructure:**
- Deploy Airbyte on EC2 (same instance or dedicated small instance)
- Docker Compose deployment (simplest for our scale)
- BigQuery destination configured to `slideheroes-data-platform`
- Raw data lands in `*_raw` schemas

### Tier 2 — Cloud Functions (GCP)

For API-based sources with simple, low-volume sync needs.

| Source | Integration Method | Sync Mode | Frequency | Notes |
|--------|-------------------|-----------|-----------|-------|
| **Attio** | Attio REST API → Cloud Function → BigQuery | Full refresh / incremental | Every 6h | Contacts, companies, deals, activities |
| **Apollo** | Apollo REST API → Cloud Function → BigQuery | Full refresh (bulk) | Daily | TAM universe, enrichment data |
| **Cal.com** | Webhook → Cloud Function → BigQuery | Event-driven | Real-time | Bookings, cancellations, reschedules |
| **Loops** | Loops API → Cloud Function → BigQuery | Incremental | Every 12h | Campaign events, subscriber data |
| **RB2B** | Webhook → Cloud Function → BigQuery | Event-driven | Real-time | Visitor identification events |
| **Instantly.ai** (future) | API → Cloud Function → BigQuery | Incremental | Every 12h | Campaign stats, replies, enrichment data |

**Infrastructure:**
- GCP Cloud Functions (Python)
- Cloud Scheduler for periodic triggers
- Pub/Sub for webhook ingestion
- Each function: ~50-100 lines of Python
- BigQuery raw tables with `_synced_at` timestamp

---

## 4. Data Flow Diagram

```
TIER 1 — MANAGED ELT                    TIER 2 — CLOUD FUNCTIONS
┌──────────┐ ┌──────────┐ ┌──────────┐  ┌──────────┐ ┌──────────┐ ┌──────────┐
│ Supabase │ │  Stripe  │ │ PostHog  │  │  Attio   │ │  Apollo  │ │ Cal.com  │
│(Postgres)│ │  (API)   │ │  (API)   │  │  (API)   │ │  (API)   │ │(Webhook) │
└────┬─────┘ └────┬─────┘ └────┬─────┘  └────┬─────┘ └────┬─────┘ └────┬─────┘
     │            │            │              │            │            │
     ▼            ▼            ▼              ▼            ▼            ▼
┌─────────────────────────────────┐  ┌──────────────────────────────────────┐
│     Airbyte (Self-Hosted)       │  │     GCP Cloud Functions (Python)     │
│     Docker on EC2               │  │     + Cloud Scheduler / Pub/Sub     │
│     CDC + Incremental sync      │  │     Simple API calls + transforms   │
└───────────────┬─────────────────┘  └──────────────────┬───────────────────┘
                │                                       │
                ▼                                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     GOOGLE BIGQUERY                                 │
│            slideheroes-data-platform                                │
│                                                                     │
│  supabase_raw.*  stripe_raw.*  posthog_raw.*  attio_raw.*          │
│  apollo_raw.*  cal_raw.*  loops_raw.*  rb2b_raw.*                  │
│                                                                     │
│                        ↓ dbt transforms                            │
│                                                                     │
│  dim_companies  dim_people  dim_users  fct_subscriptions  etc.     │
└─────────────────────────────────────────────────────────────────────┘

TIER 2 — WEBHOOK SOURCES
┌──────────┐ ┌──────────┐ ┌──────────┐
│   RB2B   │ │  Loops   │ │Instantly │
│(Webhook) │ │  (API)   │ │ (future) │
└────┬─────┘ └────┬─────┘ └────┬─────┘
     │            │            │
     ▼            ▼            ▼
     GCP Cloud Functions → BigQuery
```

---

## 5. Implementation Plan

### Phase 1 — Deploy Airbyte + Migrate Supabase Sync (Week 1)

**Goal:** Replace the manual Python sync script with Airbyte.

1. Deploy Airbyte via Docker Compose on EC2
   - Minimum resources: 2 vCPU, 4GB RAM (can share with existing instance or use a small dedicated one)
   - `docker-compose up -d` from Airbyte repo
2. Configure BigQuery destination
   - Service account with BigQuery Data Editor role
   - Target project: `slideheroes-data-platform`
3. Set up Supabase (Postgres) source
   - Host: Supabase connection pooler
   - CDC mode via Debezium
   - Select all public tables
   - 6h sync frequency
4. Verify first sync — compare row counts with current manual script
5. Run both in parallel for 1 week, then disable manual cron

### Phase 2 — Add Stripe + PostHog (Week 2)

1. Configure Stripe source connector
   - API key from Stripe dashboard
   - Incremental sync on all objects
   - 6h frequency
2. Configure PostHog source connector
   - API key + project ID
   - Events stream (incremental)
   - 12h frequency
3. Verify data in BigQuery

### Phase 3 — Cloud Functions for API Sources (Weeks 3-4)

Build lightweight Python Cloud Functions for each:

1. **Attio → BigQuery** — REST API, full refresh contacts/companies/deals
2. **Apollo → BigQuery** — REST API, daily bulk sync of TAM data
3. **Cal.com → BigQuery** — Webhook receiver for booking events
4. **Loops → BigQuery** — REST API, incremental campaign events
5. **RB2B → BigQuery** — Webhook receiver for visitor ID events

Each function follows the same pattern:
```python
def sync_to_bigquery(request):
    # 1. Fetch data from source API (or parse webhook payload)
    # 2. Transform to BigQuery schema
    # 3. Insert into raw table
    # 4. Return success/error
```

### Phase 4 — Monitoring & Alerting (Week 4)

1. Airbyte: built-in sync monitoring + email alerts on failure
2. Cloud Functions: Cloud Monitoring alerts on function errors
3. Daily data freshness check: BigQuery query checking `_synced_at` across all raw tables
4. Discord alert if any source is >24h stale

---

## 6. Cost Estimate

| Component | Monthly Cost | Notes |
|-----------|-------------|-------|
| **Airbyte Self-Hosted** | $0 | Open source, runs on our infra |
| **EC2 for Airbyte** | ~$15-30 | Shared with existing instance, or t3.medium dedicated |
| **GCP Cloud Functions** | ~$0-5 | Free tier covers our volume easily |
| **GCP Cloud Scheduler** | ~$0 | 3 free jobs, $0.10/job after |
| **BigQuery ingestion** | ~$0 | Batch loading is free |
| **Total** | **~$15-35/mo** | vs $239/mo (Hevo) or $314/mo (Clay+ELT) |

---

## 7. Migration from Current State

| Current | Migrates To | Action |
|---------|-------------|--------|
| Manual Python sync (Supabase → BigQuery) | Airbyte Postgres CDC | Disable cron after parallel verification |
| No Stripe sync | Airbyte Stripe connector | New |
| No PostHog sync | Airbyte PostHog connector | New |
| No Attio/Apollo/Cal.com sync | Cloud Functions | New |
| RB2B (not connected) | Cloud Function webhook | New |

---

## 8. Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Airbyte resource usage on EC2 | Monitor memory/CPU; move to dedicated instance if needed |
| Airbyte version upgrades | Pin to stable releases, upgrade quarterly |
| Cloud Function failures | Cloud Monitoring alerts, retry logic, dead-letter queue |
| API rate limits (Attio, Apollo) | Respect rate limits in code, backoff logic, schedule during off-peak |
| Schema changes in source APIs | Raw tables are append-only; dbt handles schema evolution |

---

## 9. Related

- [Customer Data Ecosystem Architecture](./customer-data-ecosystem-architecture.md)
- [Unified Entity Model](./unified-entity-model.md)
- [Data Ecosystem Initiative Plan](./data-ecosystem-initiative-plan.md)
- Task #451 — ELT Tool Selection & Setup
- Task #426 — Supabase → BigQuery sync (current manual script, to be replaced)
