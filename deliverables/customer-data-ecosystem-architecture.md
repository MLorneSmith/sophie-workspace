# Customer Data Ecosystem Architecture

**Document Type:** Architecture
**Initiative:** Build the Customer Data Ecosystem (#11)
**Objective:** ⚙️ Build the Business Operating System
**Task:** #105 — Build customer data architecture (BigQuery + ecosystem)
**Created:** 2026-02-12
**Status:** Draft — Awaiting Review

---

## 1. Purpose

This document defines the complete architecture for SlideHeroes' customer data ecosystem — how data flows between all systems, what each system is responsible for, and how they connect. It serves as the blueprint for all data infrastructure decisions, including ELT tool selection.

---

## 2. Design Principles

1. **BigQuery is the hub** — All roads lead to and from BigQuery. It's the single source of truth for analytics, scoring, and cross-system joins.
2. **Separate prospecting from customer management** — Apollo/TAM data stays in BigQuery until qualified. Attio is for active relationships only.
3. **Minimum Viable Lead (MVL) standard** — Records need enriched firmographics, validated contact info, intent signals, and ICP score above threshold before entering Attio.
4. **Closed-loop feedback** — Measure what converts, feed insights back into scoring models.
5. **Managed over custom** — Prefer managed ELT/reverse-ETL tools over custom scripts. Reduce maintenance burden.
6. **Cost-conscious scaling** — Free/low-cost tools now, upgrade paths when volume justifies it.

---

## 3. System Inventory

### 3.1 Data Sources (Ingest into BigQuery)

| System | Role | Data Types | Current State |
|--------|------|-----------|---------------|
| **Supabase** (PostgreSQL) | Product database | Users, workspaces, presentations, feature usage, sessions | Active. Manual sync script running via cron. |
| **Stripe** | Billing & payments | Subscriptions, invoices, payments, refunds, customers | Active. No sync yet. |
| **Attio** | CRM | Contacts, companies, deals, activities, pipeline stages | Active. No sync yet. |
| **Apollo** | ICP/TAM enrichment | Company firmographics, contacts, intent signals, technographics | Not yet connected. |
| **Loops** | Email marketing | Campaign events, opens, clicks, unsubscribes | Not yet connected. |
| **PostHog** | Web & product analytics | Page views, sessions, events, feature usage, funnels, user recordings | Selected for new app/website. |
| **RB2B** | Website visitor identification | Person-level visitor data (US): name, job title, LinkedIn, company. Via tracking pixel. | Not yet connected. Free tier (150 credits/mo). |
| **Instantly.ai** | Outbound + enrichment (future) | SuperSearch waterfall enrichment (450M+ contacts), cold email sequences, warmup | Future addition. $37/mo Growth plan. Combines enrichment + outbound in one tool. |
| **Cal.com** | Scheduling / meetings | Bookings, attendees, meeting types, no-shows, reschedules | Embedded in app. Not yet synced to BigQuery. |
| **Mission Control** | Internal ops | Tasks, initiatives, activity logs | Internal only — no BigQuery sync needed now. |

### 3.2 Data Warehouse

| Component | Tool | Purpose |
|-----------|------|---------|
| **Warehouse** | Google BigQuery | Central analytics hub, TAM universe, ICP scoring |
| **Transformation** | dbt | Data modeling, deduplication, scoring pipelines |
| **Project** | `slideheroes-data-platform` | BigQuery project (already created) |

### 3.3 Operational Destinations (Reverse ETL from BigQuery)

| System | Role | What Gets Pushed |
|--------|------|-----------------|
| **Attio** | CRM | Qualified leads (MVL threshold met), enriched company data, ICP scores |
| **Loops** | Email marketing | Qualified segments for nurture campaigns, behavioral triggers |
| **Instantly.ai** (future) | Cold outbound | Qualified prospects for outbound sequences, enriched via SuperSearch waterfall |
| **Slack/Discord** | Alerts | Threshold alerts (high-value signup, churn risk) |

### 3.4 Reverse ETL Tool

| Tool | Status | Notes |
|------|--------|-------|
| **Census** | Recommended (task #423 done) | Native Attio integration, BigQuery source support, free tier |

---

## 4. Architecture Diagram

```
                            DATA SOURCES
    ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
    │ Supabase │ │  Stripe  │ │  Attio   │ │  Apollo  │ │  Loops   │ │  RB2B    │ │Instantly │ │ Cal.com  │
    │(Product) │ │(Billing) │ │  (CRM)   │ │(ICP/TAM) │ │ (Email)  │ │(Visitor  │ │+Enrich)  │ │(Meetings)│
    │          │ │          │ │          │ │          │ │          │ │  ID, US)  │ │          │ │          │
    └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘
         │            │            │            │            │            │            │            │
         │  ELT       │  ELT      │  ELT      │  ELT      │  ELT      │ Webhook    │ Webhook    │ Webhook
         ▼            ▼            ▼            ▼            ▼            ▼            ▼            ▼
    ┌────────────────────────────────────┐  ┌──────────────────────────────────┐
    │   TIER 1: Airbyte (Self-Hosted)  │  │  TIER 2: GCP Cloud Functions     │
    │   Postgres CDC, Stripe, PostHog  │  │  Attio, Apollo, Cal.com, Loops,  │
    │   Docker on EC2 — free           │  │  RB2B, Instantly — ~$0-5/mo      │
    └───────────────┬──────────────────┘  └───────────────┬────────────────────┘
                    │                                     │
                    └──────────────┬──────────────────────┘
                                 │
                                 ▼
    ┌─────────────────────────────────────────────────────────────────────┐
    │                     GOOGLE BIGQUERY                                 │
    │                                                                     │
    │  ┌─── Raw/Staging ──────────────────────────────────────────────┐  │
    │  │  supabase_raw.*  stripe_raw.*  attio_raw.*  apollo_raw.*     │  │
    │  │  loops_raw.*  rb2b_raw.*  posthog_raw.*  instantly_raw.*  cal_raw.*│  │
    │  └──────────────────────────┬───────────────────────────────────┘  │
    │                             │ dbt                                   │
    │                             ▼                                       │
    │  ┌─── Unified Entities ─────────────────────────────────────────┐  │
    │  │  dim_companies  dim_people  dim_users  dim_workspaces        │  │
    │  │  dim_companies_people (junction)                              │  │
    │  └──────────────────────────┬───────────────────────────────────┘  │
    │                             │ dbt                                   │
    │                             ▼                                       │
    │  ┌─── Enriched/Facts ───────────────────────────────────────────┐  │
    │  │  fct_subscriptions  fct_invoices  fct_usage_events           │  │
    │  │  fct_deals  fct_activities  fct_email_events                 │  │
    │  └──────────────────────────┬───────────────────────────────────┘  │
    │                             │ dbt                                   │
    │                             ▼                                       │
    │  ┌─── Analytics/Scoring ────────────────────────────────────────┐  │
    │  │  icp_scores  lead_qualification  conversion_attribution      │  │
    │  │  churn_risk  activation_metrics  segment_performance         │  │
    │  └──────────────────────────────────────────────────────────────┘  │
    └────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
    ┌─────────────────────────────────────────────────────────────────────┐
    │                     REVERSE ETL (Census)                            │
    │         Push qualified records, scores, segments                    │
    └───────┬──────────────────┬──────────────────┬──────────────────────┘
            │                  │                  │
            ▼                  ▼                  ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │    Attio     │  │    Loops     │  │   Alerts     │
    │  (qualified  │  │  (segments   │  │  (Slack/     │
    │   leads)     │  │   & triggers)│  │   Discord)   │
    └──────────────┘  └──────────────┘  └──────────────┘
```

---

## 5. Data Source Requirements for ELT Tool Selection

Based on this architecture, our ELT tool must support these **connectors**:

| Source | Connector Type | Priority | Sync Mode | Volume Estimate (6 months) |
|--------|---------------|----------|-----------|---------------------------|
| **Supabase (Postgres)** | PostgreSQL CDC | 🔴 Critical | Incremental (CDC preferred) | ~50K MAR |
| **Stripe** | Stripe API | 🔴 Critical | Incremental | ~10K MAR |
| **Attio** | Attio API / REST | 🟡 Important | Incremental | ~5K MAR |
| **Apollo** | Apollo API / REST | 🟡 Important | Full refresh (bulk import) | ~100K MAR (initial), ~10K MAR ongoing |
| **Loops** | Loops API / webhook | 🟢 Nice-to-have | Incremental | ~20K MAR |
| **PostHog** | PostHog API | 🟢 Nice-to-have | Incremental | ~50K MAR |
| **RB2B** | Webhook → Cloud Function | 🟡 Important | Event-driven (webhook) | ~5K MAR |
| **Instantly.ai** | API / Webhook (future) | 🟢 Nice-to-have | Event-driven | ~10K MAR |
| **Cal.com** | Webhook / API | 🟡 Important | Event-driven (on booking) | ~2K MAR |

**Total estimated MAR (6 months): ~262K** — well within most free tiers.

### Connector Availability Matrix

| Tool | Postgres | Stripe | Attio | Apollo | Loops | PostHog | Cost (our scale) |
|------|----------|--------|-------|--------|-------|-----|-------------------|
| **Fivetran** | ✅ CDC | ✅ | ❓ Check | ❓ Check | ❌ Likely not | ✅ | Free (500K MAR) then expensive |
| **Airbyte** (self-hosted) | ✅ CDC | ✅ | ✅ | ✅ | ❓ Community | ✅ | Free (infra only) |
| **Airbyte** (cloud) | ✅ CDC | ✅ | ✅ | ✅ | ❓ | ✅ | ~$2.50/credit |
| **Hevo Data** | ✅ | ✅ | ❓ Check | ❓ Check | ❓ | ✅ | Free (1M events) |
| **dlt** (Python) | ✅ | ✅ | 🔧 Custom | 🔧 Custom | 🔧 Custom | ✅ | Free (code + infra) |

*❓ = needs verification before final selection*

---

## 6. ELT Tool Selection — DECIDED

**Decision: Hybrid approach** — Airbyte Self-Hosted (Tier 1) + GCP Cloud Functions (Tier 2).

**Tools evaluated:** Fivetran, Airbyte, Hevo ($239/mo), Skyvia ($199/mo), Stitch ($100/mo), dlt, Meltano, BigQuery Data Transfer Service.

**Key finding:** No single ELT tool covers all 8 of our sources natively. 5 of 8 sources (Attio, Apollo, Cal.com, Loops, RB2B) have no native connectors on any platform. Building custom connectors in an ELT framework adds complexity without value for simple API sources.

**Tier 1 — Airbyte Self-Hosted (free):**
- Postgres CDC (Supabase), Stripe, PostHog — all have native connectors
- Docker Compose on EC2
- Best connector coverage + CDC support + open source

**Tier 2 — GCP Cloud Functions (~$0-5/mo):**
- Attio, Apollo, Cal.com, Loops, RB2B, Instantly.ai (future)
- Simple Python functions: fetch API / receive webhook → write to BigQuery
- Cloud Scheduler for periodic triggers, Pub/Sub for webhooks

**Eliminated:**
- Fivetran — too expensive post-free-tier
- Hevo — $239/mo, unclear connector coverage for niche sources
- Skyvia — poor connector coverage, no custom connector path
- Stitch — expensive, only ~30 connectors
- Meltano — higher learning curve than Airbyte

**Estimated total cost: ~$15-35/mo** (Airbyte infra + Cloud Functions)

**Full implementation plan:** [ELT Implementation Plan](./elt-implementation-plan.md)

---

## 6b. Enrichment & Outbound Strategy

**Decision:** Skip Clay ($314/mo) for now. Use a phased approach:

**Phase 1 (Now):** Apollo only for enrichment. Test Apollo's built-in outbound sequencing for initial cold outreach. Zero additional cost.

**Phase 2 (When outbound scales):** Add **Instantly.ai** ($37/mo Growth plan). Includes:
- SuperSearch waterfall enrichment (450M+ contacts, multiple providers)
- Unlimited email accounts + warmup
- AI Reply Agent
- Replaces the need for Clay at 1/8th the cost

**Integration path (future):**
```
BigQuery (ICP score crosses threshold)
    → API trigger to Instantly.ai
        → SuperSearch enriches contact data
            → Outbound sequence runs
                → Replies/meetings sync to Attio (via Zapier)
```

**Why not Clay?** At $314/mo (Explorer plan minimum for webhook/API), it's too expensive pre-revenue. Instantly.ai bundles enrichment + outbound for $37/mo. If we outgrow Instantly's enrichment quality, Clay remains an option for the future.

---

## 7. Three-Tier Data Model

| Tier | Location | Description | Lifecycle |
|------|----------|-------------|-----------|
| **TAM / ICP Universe** | BigQuery only | All companies matching ICP criteria from Apollo. Scored but not engaged. | Stays in BigQuery. Never auto-promoted. |
| **Active Prospects** | Attio + BigQuery | Records that met MVL threshold — includes outbound campaign targets, inbound leads, and anyone we're intentionally engaging. | Promoted from BigQuery → Attio via Census. |
| **Customers** | Attio + BigQuery | Paying or trial users. Day-to-day relationship in Attio, analytics in BigQuery. | Bidirectional sync. |

### MVL (Minimum Viable Lead) Threshold
A record must have ALL of:
- ✅ Enriched firmographics (industry, size, revenue)
- ✅ Validated contact info (email verified, title confirmed)
- ✅ At least one intent signal (website visit, content download, or behavioral trigger)
- ✅ ICP score ≥ threshold (defined in scoring model v1, task #422)

---

## 8. Implementation Phases

### Phase 1 — Foundation (Current)
✅ BigQuery project & dataset structure (#420)
✅ Unified entity model (#421)
✅ ICP scoring model v1 (#422)
✅ Reverse ETL tool selection — Census (#423)
✅ Supabase → BigQuery manual sync (#426)
🔲 **This document** — Architecture (#105)

### Phase 2 — Managed ELT
✅ Select ELT tool — Airbyte Self-Hosted (#451)
🔲 Supabase → BigQuery via Airbyte CDC (replace manual script)
🔲 Stripe → BigQuery (#427)

### Phase 3 — Expand Sources
🔲 Attio → BigQuery (#425)
🔲 Apollo → BigQuery (#424)

### Phase 4 — Transformation
🔲 Set up dbt (#428)
🔲 ICP scoring pipeline (#429)
🔲 Deduplication pipeline (#430)
🔲 MVL qualification logic (#431)

### Phase 5 — Reverse ETL & Closed Loop
🔲 BigQuery → Attio promotion (#432)
🔲 BigQuery → email/outbound triggers (#433)
🔲 Data validation & hygiene (#434)
🔲 Conversion attribution dashboard (#435)

### Phase 6 — Behavioral
🔲 Activation moments design (#436)
🔲 Scoring-triggered motions (#437)

---

## 9. Open Questions

1. ~~**ELT tool**~~ — **Decided: Hybrid approach** — Airbyte Self-Hosted + GCP Cloud Functions (see §6 + implementation plan)
2. ~~**Analytics tool**~~ — **Decided: PostHog** for new app/website
2b. ~~**Enrichment tool**~~ — **Decided: Apollo now, Instantly.ai later** (Clay too expensive pre-revenue)
2c. ~~**Cold outbound**~~ — **Decided: Apollo outbound first, Instantly.ai when scaling** ($37/mo)
3. **Loops connector** — May need custom integration regardless of ELT tool choice
4. **Real-time vs batch** — Current need is batch (6h sync). Will we need real-time event streaming later?
5. **Cost projection** — Model ELT costs at 12-month and 24-month scale to avoid surprises

---

## 10. Related Documents

- [Data Ecosystem Initiative Plan](./data-ecosystem-initiative-plan.md)
- [Unified Entity Model](./unified-entity-model.md)
- [ICP Scoring Model](./slideheroes-icp-scoring-model.md)
- [ICP Scoring Research](./icp-scoring-research.md)
- [ELT Tool Research](../memory/2026-02-12.md) — Fivetran alternatives analysis
