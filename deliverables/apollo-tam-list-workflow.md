# Apollo TAM List Workflow (Manual Export → BigQuery)

## Goal
Build a **targeted TAM (Total Addressable Market) list** for SlideHeroes using Apollo’s UI (free plan friendly) and load it into BigQuery for:
- ICP scoring experiments
- list building + enrichment
- future reverse-ETL (BigQuery → Attio / outbound tools)

This doc assumes **manual export** because Apollo API access is typically restricted to higher plans.

---

## 1) Define the ICP Filters in Apollo
Create and save 1–3 searches (so exports can be spread across months if needed).

Recommended baseline filters:
- **Industry**: management consulting, strategy consulting/advisory, business consulting
- **Company size (employees)**: 5–50 (primary), 50–200 (secondary)
- **Geography**: US, UK, Canada, Australia
- **Revenue (if available)**: $1M–$20M (sweet spot)

Suggested approach:
- Save a search named like: `TAM v1 — Consulting 5-50 — US/UK/CA/AU`
- If Apollo UI allows it, add a second saved search for 50–200 employee companies.

---

## 2) Choose Export Strategy (Free Plan Constraints)
Apollo free plan exports are limited. To still make progress:

**Option A — Company-first export** (preferred)
1. Export **companies** matching filters.
2. Later, for a subset, export **people** (Founders/Partners/Managing Directors).

**Option B — People-first export**
Export people with titles like:
- Partner, Managing Partner, Founder
- Principal, Director
- Head of Strategy, VP Strategy

---

## 3) Normalize Export Columns (Recommended)
Apollo exports can vary; aim to include at least:

### Company fields
- company_name
- company_domain
- company_website
- company_linkedin_url
- company_industry
- company_employee_count
- company_revenue_range (if present)
- company_country / company_location

### Person fields (if exporting people)
- first_name
- last_name
- title
- email
- linkedin_url
- company_domain (join key)

---

## 4) Load the CSV into BigQuery (staging)
Use the helper script below to load into a staging table.

### Naming convention
- Dataset: `staging`
- Table: `apollo_tam_raw`
- Optional (recommended): suffix by export date
  - `apollo_tam_raw_2026_02_15`

### Load script
See: `scripts/import-apollo-csv-to-bigquery.sh`

---

## 5) Dedupe + Build a Canonical Table
After raw loads, build a canonical table/view:
- normalize domains (lowercase, strip `www.`)
- dedupe by (domain) for companies, and (email or linkedin_url) for people
- keep `source_exported_at` + `source_search_name`

Canonical targets (suggested):
- `core.apollo_companies`
- `core.apollo_people`

---

## 6) Next Steps (when ready)
- Enrich with additional firmographics (Clearbit, People Data Labs, etc.)
- Join with website/RB2B data (once installed)
- Start a simple ICP scoring v0 in BigQuery and push qualified leads into Attio
