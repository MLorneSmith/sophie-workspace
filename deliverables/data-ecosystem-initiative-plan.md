# Build the Data Ecosystem — Initiative Plan

**Initiative:** #105 — Customer Data Ecosystem
**Objective:** Obj 7 — Build the Business Operating System
**Created:** 2026-02-10
**Status:** Planning

---

## Architecture Overview

BigQuery is the backbone for the entire TAM/ICP universe and analytics. Attio stays lean as the CRM for active pipeline and customers only. Apollo feeds BigQuery, not Attio directly.

```
Apollo (ICP data source)
       ↓ EL/ETL
BigQuery (TAM universe + analytics hub)
       ↓ Reverse ETL (qualified records only)
Attio (active pipeline + customers)
       ↓ ETL
BigQuery (closed-loop reporting)
```

### Key Principles (from research)

1. **Separate prospecting from customer management** — They're fundamentally different motions. Don't conflate them in one system.
2. **BigQuery = system of record for who exists in your market** — TAM, ICP scoring, enrichment, analytics all live here.
3. **Attio = system of record for who you're actively engaging** — Only qualified, enriched records get promoted to CRM.
4. **"Minimum Viable Lead" standard** — A record needs enriched firmographics, validated contact info, intent signals, and ICP score above threshold before CRM entry.
5. **One reverse ETL tool** — Census recommended (native Attio integration, BigQuery support). Don't stitch together Zapier zaps.
6. **Closed-loop reporting** — Measure which ICP segments and signals actually convert, feed back into scoring.

### Three Tiers of Records

| Tier | Where | What |
|------|-------|------|
| ICP Universe / TAM | BigQuery only | Tens of thousands of companies matching ICP, no relationship yet. Apollo data, enrichment, scoring. |
| Active Prospects / Pipeline | Attio (+ BigQuery) | Qualified records being actively worked. Met MVL threshold. |
| Customers | Attio + BigQuery | Day-to-day relationship in Attio, analytics/joins in BigQuery. |

### Why NOT put Apollo records in Attio

- **Cost:** Attio pricing is records-based. 50k Apollo contacts would inflate the bill for contacts nobody is working.
- **Data quality:** Unvetted third-party data contaminates reporting and overwhelms reps.
- **Analytics:** BigQuery can run ICP scoring models, join with product usage, billing, web analytics — Attio can't.

---

## Tooling Decisions

| Layer | Tool | Status |
|-------|------|--------|
| Data Warehouse | BigQuery | Selected |
| ICP Data Source | Apollo | Selected |
| CRM | Attio | Selected, initial setup done |
| Reverse ETL | Census (recommended) | To evaluate — native Attio integration |
| Transformation | dbt on BigQuery | To set up |
| Apollo → BigQuery | Portable or Apollo API | To evaluate |
| Product DB → BigQuery | Supabase sync | To set up |
| Billing → BigQuery | Stripe sync | To set up |

---

## Implementation Phases

### Phase 1 — Foundation
Establish the data warehouse and core data models.

1. **Set up BigQuery project & dataset structure** — Create SlideHeroes data warehouse with schemas for TAM, customers, product analytics
2. **Define unified entity model** — Companies + people schema that resolves across all sources (Apollo, Attio, product DB)
3. **Define ICP scoring model v1** — Firmographic + behavioral criteria, scoring thresholds for CRM promotion
4. **Select & configure reverse ETL tool** — Evaluate Census vs Hightouch (Census has native Attio integration)

### Phase 2 — Inbound Pipelines (ETL)
Connect data sources into BigQuery.

5. **Apollo → BigQuery sync** — Bulk import ICP/TAM universe via Portable or Apollo API
6. **Attio → BigQuery sync** — Deal stages, activity logs, customer records for closed-loop reporting
7. **Supabase → BigQuery sync** — Product usage data (signups, sessions, feature usage)
8. **Stripe → BigQuery sync** — Billing, subscriptions, revenue data

### Phase 3 — Transformation
Model, score, and qualify data in the warehouse.

9. **Set up dbt on BigQuery** — Transformation layer for modeling, dedup, joins
10. **Build ICP scoring pipeline** — SQL/dbt models that score TAM records against ICP criteria
11. **Build deduplication pipeline** — Resolve entities across Apollo, Attio, product data
12. **Build MVL qualification logic** — Enriched firmographics, validated contact, intent signals, ICP score threshold

### Phase 4 — Outbound (Reverse ETL)
Push qualified data out to operational tools.

13. **BigQuery → Attio promotion pipeline** — Push qualified leads via Census/Hightouch
14. **BigQuery → email/outbound triggers** — Feed qualified segments to outreach tools
15. **Data validation & hygiene schedule** — Monthly CRM audit, quarterly warehouse audit

### Phase 5 — Closed Loop
Measure what works, feed back into scoring.

16. **Conversion attribution dashboard** — Which ICP segments, Apollo lists, and signals actually convert? Feed back into scoring.

---

## Prioritization

**Near-term (pre-beta):** Tasks 1, 2, 7, 8 — BigQuery setup + product/billing pipelines. This data matters now for understanding user behavior and revenue.

**Post-beta:** Tasks 3-6, 9-16 — Apollo/TAM pipeline, ICP scoring, reverse ETL, closed loop. These matter when there's a sales motion to feed.

---

## Related Tasks
- #105 — Parent initiative
- #202, #268, #178 — Existing related tasks

## Source
Architecture based on research conversation (2026-02-03) covering best practices from Cargo (PRM methodology), Hightouch, Census, and practices at Stripe, Gorgias, and Spendesk.
