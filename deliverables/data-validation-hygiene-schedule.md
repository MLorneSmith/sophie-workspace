# Data Validation & Hygiene Schedule (CRM + Warehouse)

**Task:** MC #434 — Data validation & hygiene schedule  
**Owner:** Sophie (draft) → Mike review/approval  
**Date:** 2026-02-14 (UTC)

## Objective
Keep revenue-critical data accurate enough to:
- segment reliably (ICP, lifecycle stage)
- trigger outbound workflows correctly (Loops/Instantly)
- prevent CRM/warehouse drift (bad joins, duplicates, missing identifiers)

Scope emphasis: **contact info**, **lead scoring fields**, **account info**, and **identity keys** that power syncing.

## Systems in Scope
- **CRM:** Attio
- **Warehouse:** BigQuery (datasets: `staging`, `core`)
- **Sources:** Product DB/Supabase, Loops (future), RB2B (future), website forms

## Key Data Concepts (what must be right)
### 1) Identity keys
- `email` (contacts)
- `attio_contact_id`, `attio_company_id` (if present)
- `user_id` / `account_id` (product)

### 2) Contact fields (revenue-critical)
- first/last name
- email validity & deliverability flags
- role/title (optional)
- timezone (optional)

### 3) Account/company fields (revenue-critical)
- company name normalization
- domain (critical for dedupe)
- size band (1, 2–20, 21–200, 200+)
- industry (optional)

### 4) Scoring + segmentation
- ICP score components
- lifecycle stage (lead → trial → active → churned)
- last activity date

## Cadence Overview
- **Weekly (automated):** lightweight anomaly checks (warehouse)
- **Monthly (manual):** CRM audit + dedupe/merge pass
- **Quarterly (manual+automated):** warehouse audit + schema + pipeline validation

---

## Weekly (Automated) — Warehouse Anomaly Checks
**Goal:** catch breaks early (missing IDs, null spikes, duplicate spikes).

**Checks (examples):**
1. New rows with null/blank email
2. Duplicate emails within contacts table
3. Sudden drop to 0 in daily events (ingestion break)
4. % of records missing `account_id` / `user_id`

**Outputs:**
- A short report (counts + deltas vs last week)
- If thresholds exceeded → create MC task “Data hygiene: investigate <issue>”

**Suggested thresholds:**
- null email > 0.5% of new contacts/week
- duplicates > 0.2% of contact table
- events drop > 80% day-over-day (non-weekend adjusted)

## Monthly (Manual) — CRM Audit (Attio)
**Timebox:** 60–90 minutes.

**Checklist:**
1. **Duplicates:**
   - identify top duplicate clusters by domain + company name similarity
   - merge duplicates (company + contacts)
2. **Contactability:**
   - bounce/undeliverable cleanup
   - missing names for high-value leads
3. **Field hygiene:**
   - ensure required fields filled for “SQL” (or equivalent)
   - spot-check scoring fields
4. **Sample spot-check:**
   - 20 recently created contacts
   - 10 recently updated companies

**Deliverable:**
- Short note in MC activity: what changed + any follow-ups

## Quarterly (Manual + Automated) — Warehouse Audit
**Timebox:** 2–3 hours.

**Checklist:**
1. **Schema drift:**
   - compare source schemas to staging
   - confirm no silent type coercions
2. **Primary key integrity:**
   - uniqueness checks on key tables
3. **Join integrity:**
   - ensure join rates remain stable (e.g., % events matched to user)
4. **Backfill sanity:**
   - last 90 days: look for missing partitions, outliers
5. **Cost/partitioning review:**
   - large tables partitioned & clustered appropriately

**Deliverable:**
- “Quarterly warehouse audit” doc + list of fixes / tickets

---

## Ownership & Where This Lives
- This is a **draft operating schedule**.
- If Mike agrees, we should promote it to an SOP in `~/clawd/sops/` and optionally wire the weekly checks into a cron job.

## Next Implementation Steps (optional)
1. Add a BigQuery check script (SQL + thresholds) and store weekly reports.
2. Add a cron job for the weekly check (Mon 9am ET).
3. Create an Attio monthly reminder (1st weekday of month).
