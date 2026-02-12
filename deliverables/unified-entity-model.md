# Unified Entity Model for SlideHeroes Data Warehouse

**Version:** 1.0
**Created:** 2026-02-10
**Status:** Ready for Implementation

---

## Executive Summary

This document defines the unified entity model for SlideHeroes' BigQuery data warehouse. The model resolves entities across four source systems (Apollo, Attio, Supabase, Stripe) into canonical Company and Person entities, with comprehensive source tracking, deduplication, and ICP scoring capabilities.

**Key Principles:**
1. **Canonical entities** — Single source of truth for companies and people across all systems
2. **Source-agnostic** — Model works regardless of which systems feed it
3. **Bidirectional sync ready** — Supports both ETL (sources → BigQuery) and reverse ETL (BigQuery → Attio)
4. **Analytics-first** — Optimized for BigQuery analytics and ICP scoring
5. **Audit trail** — Full lineage tracking for every record

---

## Data Flow Diagram

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Apollo    │      │    Attio    │      │  Supabase   │      │   Stripe    │
│  (ICP/TAM)  │      │    (CRM)    │      │  (Product)  │      │  (Billing)  │
└──────┬──────┘      └──────┬──────┘      └──────┬──────┘      └──────┬──────┘
       │                    │                    │                    │
       │ ETL                │ ETL                │ ETL                │ ETL
       ▼                    ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        BigQuery Data Warehouse                             │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                    Raw / Staging Layer                             │  │
│  │  apollo_raw_* | attio_raw_* | supabase_raw_* | stripe_raw_*        │  │
│  └───────────────────────────┬─────────────────────────────────────────┘  │
│                              │                                             │
│                              │ dbt Transformations                         │
│                              ▼                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                    Unified Entities (Core)                         │  │
│  │                                                                     │  │
│  │  dim_companies   dim_people   dim_companies_people                  │  │
│  │  dim_users       dim_workspaces                                     │  │
│  └───────────────────────────┬─────────────────────────────────────────┘  │
│                              │                                             │
│                              │ Joins & Scoring                             │
│                              ▼                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                    Enriched Layer                                    │  │
│  │                                                                     │  │
│  │  fct_deals    fct_subscriptions   fct_usage_events                   │  │
│  │  fct_activities   fct_invoices    fct_payments                      │  │
│  └───────────────────────────┬─────────────────────────────────────────┘  │
│                              │                                             │
│                              │ ICP Scoring & Qualification                 │
│                              ▼                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                    Intelligence Layer                               │  │
│  │                                                                     │  │
│  │  icp_scores   lifecycle_stages   qualified_leads                     │  │
│  │  conversion_funnel   segment_analysis                                │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       │ Reverse ETL (Census/Hightouch)
                                       ▼
                              ┌────────────────┐
                              │     Attio      │
                              │  (Qualified    │
                              │   Pipeline)    │
                              └────────────────┘
```

---

## BigQuery Dataset Structure

```
slideheroes_dw/
├── 01_raw/           # Raw data from sources (staging)
├── 02_staging/       # Cleaned, typed staging tables
├── 03_core/          # Unified entities (dim_* tables)
├── 04_facts/         # Transactional/event data (fct_* tables)
├── 05_intelligence/  # ICP scores, segments, ML models
├── 06_analytics/     # Martials, aggregates, dashboards
└── 07_archive/       # Historical snapshots, GDPR archive
```

**Naming Conventions:**
- `dim_*` = Dimensions (entities: companies, people, users, etc.)
- `fct_*` = Facts (events, transactions: deals, subscriptions, usage)
- `raw_*` = Raw staging tables (untransformed source data)
- `*_latest` = Current state snapshot (for reverse ETL)
- `*_history` = SCD Type 2 history (full audit trail)

---

## Core Entity Definitions

### Canonical ID Strategy

Each entity has a **canonical ID** (`entity_id`) that is system-independent. Source system IDs are tracked separately for mapping and lookups.

**Canonical ID Format:**
- Companies: `cph_<uuid>` (e.g., `cph_01a2b3c4-5d6e-7f8g-9h0i-1j2k3l4m5n6o`)
- People: `pph_<uuid>` (e.g., `pph_01a2b3c4-5d6e-7f8g-9h0i-1j2k3l4m5n6o`)
- Users: `usr_<supabase_user_id>` (Preserve Supabase UUID for app use)

**ID Resolution Flow:**
1. Ingest all source records with source IDs
2. Run matching rules to find duplicates across sources
3. Create canonical IDs for unique entities
4. Build `entity_mappings` table linking canonical IDs to source IDs
5. Update mappings as new sources are added

---

## Table 1: dim_companies

Canonical company entity. Represents a unique business organization across all sources.

```sql
CREATE TABLE `slideheroes_dw.03_core.dim_companies`
(
  -- Canonical ID
  company_id STRING NOT NULL,  -- Format: cph_<uuid>
  
  -- Core identifiers
  company_name STRING,
  domain STRING,               -- Primary: website domain for matching
  
  -- Firmographics
  industry STRING,
  industry_category STRING,    -- Normalized: tech, finance, healthcare, etc.
  employee_count INT64,
  employee_range STRING,       -- 1-10, 11-50, 51-200, 201-500, 501-1000, 1000+
  annual_revenue_usd INT64,
  revenue_range STRING,        -- <$1M, $1-10M, $10-50M, $50-100M, $100-500M, $500M+
  headquarters_country STRING,
  headquarters_state STRING,
  headquarters_city STRING,
  founded_year INT64,
  
  -- Description & tags
  description STRING,
  tags ARRAY<STRING>,          -- Normalized tags (from sources)
  tech_stack ARRAY<STRING>,    -- Detected technologies
  
  -- Company identifiers (external)
  linkedin_company_url STRING,
  crunchbase_url STRING,
  apollo_company_id STRING,     -- Source: Apollo
  attio_company_id STRING,     -- Source: Attio
  
  -- Product data linkage
  account_id STRING,           -- Links to Supabase accounts (if customer)
  
  -- Tier & lifecycle
  record_tier STRING,          -- tam_universe | active_prospect | customer
  lifecycle_stage STRING,      -- tam | mql | sql | opportunity | customer | churned
  
  -- Source tracking
  sources ARRAY<STRING>,       -- ['apollo', 'attio', 'supabase']
  primary_source STRING,       -- First or highest-confidence source
  
  -- Timestamps
  first_seen_at TIMESTAMP,     -- Earliest record across all sources
  last_updated_at TIMESTAMP,   -- Most recent update from any source
  synced_at TIMESTAMP,         -- Last time this row was refreshed
  
  -- Quality flags
  is_enriched BOOLEAN,         -- Has enriched firmographics beyond basics
  has_website BOOLEAN,         -- Valid domain with active website
  email_pattern_validated BOOLEAN,  -- Email pattern matches domain
  
  -- System fields
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP,
  _etl_batch_id STRING,
  _etl_run_at TIMESTAMP
)
PARTITION BY RANGE_BUCKET(TRUNC(last_updated_at, DAY), 
  GENERATE_TIMESTAMP_ARRAY(TIMESTAMP('2024-01-01'), 
                           TIMESTAMP('2027-01-01'), 
                           INTERVAL 1 DAY))
CLUSTER BY domain, record_tier, lifecycle_stage
OPTIONS (
  partition_expiration_days = 730,
  require_partition_filter = FALSE
);

-- Primary key and indexes
ALTER TABLE `slideheroes_dw.03_core.dim_companies`
  ADD PRIMARY KEY (company_id) NOT ENFORCED;
```

**Source Mapping:**

| Field | Apollo | Attio | Supabase | Stripe |
|-------|--------|-------|----------|--------|
| company_name | ✓ company.name | ✓ name | - | ✓ company_name |
| domain | ✓ website | ✓ domain | - | - |
| industry | ✓ industry | ✓ industry | - | - |
| employee_count | ✓ employee_count | ✓ headcount | - | - |
| founded_year | ✓ founded_year | ✓ founded | - | - |
| headquarters_* | ✓ location fields | ✓ hq location | - | ✓ address |
| apollo_company_id | ✓ id | - | - | - |
| attio_company_id | - | ✓ id | - | - |
| linkedin_company_url | ✓ linkedin_url | ✓ linkedin_url | - | - |
| tags | ✓ tags | ✓ labels | - | - |

---

## Table 2: dim_people

Canonical person entity. Represents a unique individual across all sources.

```sql
CREATE TABLE `slideheroes_dw.03_core.dim_people`
(
  -- Canonical ID
  person_id STRING NOT NULL,   -- Format: pph_<uuid>
  
  -- Core identifiers
  first_name STRING,
  last_name STRING,
  full_name STRING,            -- Computed: first_name + last_name
  
  -- Contact info
  email STRING,                -- Primary: for matching and reverse ETL
  email_normalized STRING,     -- Lowercase, trimmed for matching
  work_email STRING,           -- Explicitly work email
  personal_email STRING,       -- Explicitly personal email
  
  -- Social profiles
  linkedin_url STRING,
  linkedin_handle STRING,      -- Extracted from URL
  twitter_url STRING,
  twitter_handle STRING,
  
  -- Job details
  title STRING,
  title_normalized STRING,     -- Normalized (e.g., "Senior Engineer" → "Senior Software Engineer")
  seniority STRING,            -- c_level | vp | director | manager | individual_contributor | intern
  department STRING,           -- engineering | sales | marketing | product | finance | operations | executive
  
  -- Company relationship
  company_id STRING,           -- FK to dim_companies
  company_name STRING,         -- Denormalized for queries
  is_current_company BOOLEAN DEFAULT TRUE,
  
  -- Location
  city STRING,
  state STRING,
  country STRING,
  timezone STRING,
  
  -- Contact validation
  email_status STRING,         -- valid | invalid | catch_all | unknown
  phone STRING,
  phone_status STRING,         -- valid | invalid | unverified
  
  -- Source tracking
  sources ARRAY<STRING>,       -- ['apollo', 'attio', 'supabase']
  primary_source STRING,
  
  -- Product linkage
  user_id STRING,              -- FK to dim_users (if they're a user)
  
  -- Timestamps
  first_seen_at TIMESTAMP,
  last_updated_at TIMESTAMP,
  synced_at TIMESTAMP,
  
  -- Quality flags
  is_enriched BOOLEAN,         -- Has enriched profile (LinkedIn, Apollo, etc.)
  has_valid_email BOOLEAN,
  has_valid_phone BOOLEAN,
  
  -- Engagement signals (for scoring)
  last_engaged_at TIMESTAMP,   -- Last email open, reply, or website visit
  engagement_score INT64,      -- Computed engagement score 0-100
  
  -- System fields
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP,
  _etl_batch_id STRING,
  _etl_run_at TIMESTAMP
)
PARTITION BY RANGE_BUCKET(TRUNC(last_updated_at, DAY),
  GENERATE_TIMESTAMP_ARRAY(TIMESTAMP('2024-01-01'),
                           TIMESTAMP('2027-01-01'),
                           INTERVAL 1 DAY))
CLUSTER BY email_normalized, company_id, seniority
OPTIONS (
  partition_expiration_days = 730,
  require_partition_filter = FALSE
);

ALTER TABLE `slideheroes_dw.03_core.dim_people`
  ADD PRIMARY KEY (person_id) NOT ENFORCED;
```

**Source Mapping:**

| Field | Apollo | Attio | Supabase | Stripe |
|-------|--------|-------|----------|--------|
| first_name, last_name | ✓ name | ✓ name | ✓ | ✓ |
| email | ✓ email | ✓ email | ✓ email | ✓ email |
| linkedin_url | ✓ linkedin_url | ✓ linkedin | - | - |
| title | ✓ title | ✓ title | - | - |
| seniority | ✓ seniority | ✓ derived from title | - | - |
| department | ✓ department | ✓ derived | - | - |
| company_id | ✓ organization_id | ✓ company_id | - | - |
| phone | ✓ phone | ✓ phone | - | ✓ |

---

## Table 3: dim_companies_people

Relationship table linking companies and people. Handles multiple people per company and people changing companies.

```sql
CREATE TABLE `slideheroes_dw.03_core.dim_companies_people`
(
  -- Composite key
  relationship_id STRING NOT NULL,  -- Format: rph_<uuid>
  
  -- Entity references
  company_id STRING NOT NULL,
  person_id STRING NOT NULL,
  
  -- Relationship details
  title STRING,
  title_normalized STRING,
  seniority STRING,
  department STRING,
  is_primary BOOLEAN DEFAULT FALSE,    -- Primary contact for company
  
  -- Temporal validity (SCD Type 2 for history)
  is_current BOOLEAN DEFAULT TRUE,
  started_at TIMESTAMP,                -- When they joined this company
  ended_at TIMESTAMP,                  -- When they left (if not current)
  
  -- Source tracking
  source STRING,                       -- 'apollo', 'attio', 'manual'
  source_record_id STRING,             -- Source system relationship ID
  
  -- Timestamps
  first_seen_at TIMESTAMP,
  last_updated_at TIMESTAMP,
  synced_at TIMESTAMP,
  
  -- System fields
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP,
  _etl_batch_id STRING,
  _etl_run_at TIMESTAMP
)
PARTITION BY RANGE_BUCKET(TRUNC(last_updated_at, DAY),
  GENERATE_TIMESTAMP_ARRAY(TIMESTAMP('2024-01-01'),
                           TIMESTAMP('2027-01-01'),
                           INTERVAL 1 DAY))
CLUSTER BY company_id, person_id, is_current
OPTIONS (
  partition_expiration_days = 730
);

ALTER TABLE `slideheroes_dw.03_core.dim_companies_people`
  ADD PRIMARY KEY (relationship_id) NOT ENFORCED;
```

---

## Table 4: entity_mappings

Tracks canonical IDs and their source system IDs for all entities. Critical for reverse ETL.

```sql
CREATE TABLE `slideheroes_dw.03_core.entity_mappings`
(
  -- Entity reference
  entity_type STRING NOT NULL,         -- 'company', 'person', 'user'
  canonical_id STRING NOT NULL,        -- e.g., 'cph_01a2b3c4-...', 'pph_01a2b3c4-...'
  
  -- Source system mapping
  source_system STRING NOT NULL,       -- 'apollo', 'attio', 'supabase', 'stripe'
  source_id STRING NOT NULL,           -- ID in source system
  source_url STRING,                   -- URL to record in source system (if available)
  
  -- Mapping quality
  confidence_score FLOAT64,            -- 0.0-1.0, confidence this mapping is correct
  match_method STRING,                 -- 'domain_match', 'email_match', 'name_fuzzy', 'manual'
  
  -- Temporal tracking
  first_mapped_at TIMESTAMP,
  last_verified_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,      -- If FALSE, mapping is superseded
  
  -- System fields
  _etl_batch_id STRING,
  _etl_run_at TIMESTAMP
)
PARTITION BY entity_type
CLUSTER BY source_system, canonical_id
OPTIONS (
  partition_expiration_days = 730
);

-- Index for lookups
CREATE INDEX idx_entity_mappings_source_lookup
  ON `slideheroes_dw.03_core.entity_mappings` (source_system, source_id, is_active);

CREATE INDEX idx_entity_mappings_canonical_lookup
  ON `slideheroes_dw.03_core.entity_mappings` (canonical_id, source_system, is_active);
```

---

## Table 5: dim_users

Product users from Supabase. Separate from "people" (prospects) because users are authenticated.

```sql
CREATE TABLE `slideheroes_dw.03_core.dim_users`
(
  -- Canonical ID (preserve Supabase UUID for app compatibility)
  user_id STRING NOT NULL,            -- Format: usr_<supabase_uuid>
  
  -- Core identifiers
  email STRING,
  email_normalized STRING,
  display_name STRING,
  avatar_url STRING,
  
  -- Supabase linkage
  supabase_user_id STRING,           -- Original Supabase UUID
  supabase_created_at TIMESTAMP,
  
  -- Person linkage (if matched to CRM/prospect data)
  person_id STRING,                   -- FK to dim_people
  
  -- Account context
  account_id STRING,                 -- Primary account (FK to dim_companies via account_id)
  is_account_admin BOOLEAN DEFAULT FALSE,
  
  -- User status
  user_status STRING,                 -- 'invited', 'active', 'inactive', 'churned'
  last_login_at TIMESTAMP,
  signup_source STRING,               -- 'direct', 'referral', 'invite', 'oauth_google', etc.
  
  -- Subscription context
  is_paying_user BOOLEAN DEFAULT FALSE,
  subscription_tier STRING,          -- 'free', 'starter', 'pro', 'enterprise'
  
  -- Timestamps
  first_seen_at TIMESTAMP,
  last_updated_at TIMESTAMP,
  synced_at TIMESTAMP,
  
  -- System fields
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP,
  _etl_batch_id STRING,
  _etl_run_at TIMESTAMP
)
PARTITION BY RANGE_BUCKET(TRUNC(last_updated_at, DAY),
  GENERATE_TIMESTAMP_ARRAY(TIMESTAMP('2024-01-01'),
                           TIMESTAMP('2027-01-01'),
                           INTERVAL 1 DAY))
CLUSTER BY email_normalized, user_status, subscription_tier
OPTIONS (
  partition_expiration_days = 730
);

ALTER TABLE `slideheroes_dw.03_core.dim_users`
  ADD PRIMARY KEY (user_id) NOT ENFORCED;
```

---

## Table 6: dim_workspaces

Workspaces (teams) within SlideHeroes. Users belong to workspaces.

```sql
CREATE TABLE `slideheroes_dw.03_core.dim_workspaces`
(
  workspace_id STRING NOT NULL,
  account_id STRING NOT NULL,         -- Links to dim_companies (if customer)
  
  -- Workspace details
  name STRING,
  slug STRING,                       -- URL-friendly identifier
  
  -- Workspace metadata
  created_at TIMESTAMP,
  created_by_user_id STRING,          -- FK to dim_users
  
  -- Plan & billing
  plan_tier STRING,                  -- 'free', 'starter', 'pro', 'enterprise'
  plan_seats INT64,                  -- Allocated seats
  seats_used INT64,                  -- Active seats
  
  -- Status
  status STRING,                     -- 'active', 'archived', 'deleted'
  status_changed_at TIMESTAMP,
  
  -- Timestamps
  first_seen_at TIMESTAMP,
  last_updated_at TIMESTAMP,
  synced_at TIMESTAMP,
  
  -- System fields
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP,
  _etl_batch_id STRING,
  _etl_run_at TIMESTAMP
)
PARTITION BY RANGE_BUCKET(TRUNC(last_updated_at, DAY),
  GENERATE_TIMESTAMP_ARRAY(TIMESTAMP('2024-01-01'),
                           TIMESTAMP('2027-01-01'),
                           INTERVAL 1 DAY))
CLUSTER BY account_id, plan_tier, status
OPTIONS (
  partition_expiration_days = 730
);

ALTER TABLE `slideheroes_dw.03_core.dim_workspaces`
  ADD PRIMARY KEY (workspace_id) NOT ENFORCED;
```

---

## ICP Scoring Table

```sql
CREATE TABLE `slideheroes_dw.05_intelligence.icp_scores`
(
  -- Entity reference
  entity_type STRING NOT NULL,         -- 'company' or 'person'
  entity_id STRING NOT NULL,           -- Canonical ID
  
  -- Score components
  firmographic_score INT64,            -- 0-100: Based on company size, industry, etc.
  behavioral_score INT64,              -- 0-100: Based on engagement, usage, intent
  intent_signal_score INT64,           -- 0-100: Based on web visits, content consumption
  composite_score INT64,               -- 0-100: Weighted composite
  
  -- Qualification tier
  qualification_tier STRING,           -- 'high', 'medium', 'low', 'unqualified'
  
  -- Firmographic fit details
  industry_fit BOOLEAN,                -- Matches target industries
  size_fit BOOLEAN,                    -- Matches target company size
  revenue_fit BOOLEAN,                 -- Matches target revenue
  
  -- Behavioral signals
  visited_website_recently BOOLEAN,    -- Website visit in last 30 days
  engaged_with_outreach BOOLEAN,       -- Replied to email or meeting
  used_free_tier BOOLEAN,             -- Has active free account
  
  -- Intent signals
  viewed_pricing_page BOOLEAN,
  requested_demo BOOLEAN,
  attended_webinar BOOLEAN,
  engaged_with_competitor BOOLEAN,     -- Using competitor products
  
  -- Scoring model metadata
  model_version STRING,                -- e.g., 'v1.0'
  scored_at TIMESTAMP,
  
  -- Promotion status
  is_qualified_for_crm BOOLEAN,        -- Meets MVL threshold
  promoted_to_crm_at TIMESTAMP,        -- When pushed to Attio
  attio_record_id STRING,              -- Attio record ID (if promoted)
  
  -- Timestamps
  first_scored_at TIMESTAMP,
  last_updated_at TIMESTAMP,
  
  -- System fields
  _etl_batch_id STRING,
  _etl_run_at TIMESTAMP
)
PARTITION BY RANGE_BUCKET(TRUNC(scored_at, DAY),
  GENERATE_TIMESTAMP_ARRAY(TIMESTAMP('2024-01-01'),
                           TIMESTAMP('2027-01-01'),
                           INTERVAL 1 DAY))
CLUSTER BY entity_type, qualification_tier, composite_score
OPTIONS (
  partition_expiration_days = 730
);

CREATE INDEX idx_icp_scores_qualified
  ON `slideheroes_dw.05_intelligence.icp_scores` (is_qualified_for_crm, qualification_tier, scored_at);
```

---

## Lifecycle Stage Tracking

```sql
CREATE TABLE `slideheroes_dw.05_intelligence.lifecycle_stages`
(
  -- Entity reference
  entity_type STRING NOT NULL,         -- 'company' or 'person'
  entity_id STRING NOT NULL,
  
  -- Stage tracking
  current_stage STRING,                -- tam | mql | sql | opportunity | customer | churned
  current_stage_since TIMESTAMP,       -- When they entered current stage
  
  -- Stage history (SCD Type 2)
  stage STRING NOT NULL,               -- Historical stage
  entered_at TIMESTAMP NOT NULL,       -- When entered this stage
  exited_at TIMESTAMP,                 -- When left this stage (NULL if current)
  
  -- Stage transition details
  transition_from STRING,              -- Previous stage
  transition_reason STRING,            -- 'outreach', 'demo_scheduled', 'deal_closed_won', etc.
  transition_source STRING,            -- 'manual', 'automated_scoring', 'crm_sync', etc.
  
  -- Associated deal (if opportunity → customer transition)
  deal_id STRING,                      -- FK to fct_deals
  
  -- System fields
  is_current BOOLEAN DEFAULT TRUE,     -- Most recent row is current
  _etl_batch_id STRING,
  _etl_run_at TIMESTAMP
)
PARTITION BY RANGE_BUCKET(TRUNC(entered_at, DAY),
  GENERATE_TIMESTAMP_ARRAY(TIMESTAMP('2024-01-01'),
                           TIMESTAMP('2027-01-01'),
                           INTERVAL 1 DAY))
CLUSTER BY entity_type, entity_id, is_current
OPTIONS (
  partition_expiration_days = 1095);   -- 3 years history
```

---

## Deduplication Strategy

### Matching Rules

**Company Matching (in order of confidence):**

1. **Exact domain match** (highest confidence)
   - Same normalized domain = same company
   - Confidence: 0.99
   - Example: `stripe.com` = `stripe.com`

2. **Exact name match** (high confidence, requires verification)
   - Same normalized company name + same HQ country
   - Confidence: 0.85
   - Example: "Stripe, Inc" + US = same

3. **Fuzzy name match** (medium confidence, manual review)
   - Levenshtein distance < 3 on normalized name + HQ match
   - Confidence: 0.60
   - Example: "Stripe Inc" ≈ "Stripe, Inc."

**Person Matching (in order of confidence):**

1. **Exact email match** (highest confidence)
   - Same normalized email = same person
   - Confidence: 0.99
   - Example: `john.doe@example.com` = `john.doe@example.com`

2. **Exact name + domain match** (high confidence)
   - Same normalized first_name + last_name + company domain
   - Confidence: 0.90
   - Example: John Doe + stripe.com = John Doe + stripe.com

3. **Fuzzy name + email domain match** (medium confidence)
   - Similar first_name + last_name (typo tolerance) + same company
   - Confidence: 0.70
   - Example: "Jon Doe" + stripe.com ≈ "John Doe" + stripe.com

4. **LinkedIn URL match** (high confidence)
   - Same LinkedIn URL = same person
   - Confidence: 0.95

### Merge Logic

When duplicate entities are found:

1. **Canonical ID selection:** Use the canonical ID from the longest-standing record
2. **Source consolidation:** Combine `sources` arrays, remove duplicates
3. **Field merging strategy:**
   - **Take latest** for timestamps (`last_updated_at`, `last_engaged_at`, etc.)
   - **Take non-null** for contact info (prefer validated emails)
   - **Concatenate** for tags/arrays (deduplicated)
   - **Take longest** for descriptions
   - **Prefer CRM (Attio)** for deal-related fields
   - **Prefer Apollo** for enriched firmographics
   - **Prefer Supabase** for product status

### Deduplication Pipeline (dbt Model)

```sql
-- models/dedup/dedup_companies.sql
WITH normalized AS (
  SELECT
    -- Normalize for matching
    LOWER(TRIM(domain)) AS domain_normalized,
    LOWER(TRIM(company_name)) AS company_name_normalized,
    LOWER(headquarters_country) AS country_normalized,
    *,
    ROW_NUMBER() OVER (PARTITION BY domain_normalized ORDER BY first_seen_at ASC) AS domain_rank,
    ROW_NUMBER() OVER (
      PARTITION BY company_name_normalized, country_normalized
      ORDER BY first_seen_at ASC
    ) AS name_rank
  FROM `slideheroes_dw.02_staging.companies_staging`
  WHERE domain_normalized IS NOT NULL
),

-- Find domain-based duplicates
domain_groups AS (
  SELECT
    domain_normalized,
    ARRAY_AGG(company_id ORDER BY first_seen_at ASC) AS company_ids,
    MIN(company_id) AS canonical_company_id
  FROM normalized
  WHERE domain_normalized IS NOT NULL
  GROUP BY 1
  HAVING COUNT(*) > 1
),

-- Find name-based duplicates (for records without domain)
name_groups AS (
  SELECT
    company_name_normalized,
    country_normalized,
    ARRAY_AGG(company_id ORDER BY first_seen_at ASC) AS company_ids,
    MIN(company_id) AS canonical_company_id
  FROM normalized
  WHERE domain_normalized IS NULL
  GROUP BY 1, 2
  HAVING COUNT(*) > 1
),

-- Build mapping
company_dedup_map AS (
  SELECT
    unnest(company_ids) AS source_id,
    canonical_company_id,
    'domain_match' AS match_method,
    0.99 AS confidence
  FROM domain_groups
  
  UNION ALL
  
  SELECT
    unnest(company_ids) AS source_id,
    canonical_company_id,
    'name_match' AS match_method,
    0.85 AS confidence
  FROM name_groups
)

-- Output deduped companies
SELECT
  CASE
    WHEN d.source_id IS NOT NULL THEN d.canonical_company_id
    ELSE c.company_id
  END AS company_id,
  COALESCE(
    c.company_name,
    (SELECT company_name FROM normalized WHERE company_id = d.canonical_company_id LIMIT 1)
  ) AS company_name,
  -- Merge all fields using latest/longest rules
  MAX(c.last_updated_at) AS last_updated_at,
  ARRAY_AGG(DISTINCT source IGNORE NULLS) AS sources,
  -- ... rest of merged fields
FROM normalized c
LEFT JOIN company_dedup_map d ON c.company_id = d.source_id
GROUP BY 1, 2;
```

---

## Source Tracking Pattern

Every record tracks its lineage:

```sql
-- Example: Source tracking fields pattern
sources ARRAY<STRING>,              -- ['apollo', 'attio']
source_systems STRUCT<
  apollo STRUCT<
    id STRING,
    synced_at TIMESTAMP,
    record_exists BOOLEAN
  >,
  attio STRUCT<
    id STRING,
    synced_at TIMESTAMP,
    record_exists BOOLEAN
  >,
  supabase STRUCT<
    id STRING,
    synced_at TIMESTAMP,
    record_exists BOOLEAN
  >,
  stripe STRUCT<
    id STRING,
    synced_at TIMESTAMP,
    record_exists BOOLEAN
  >
>
```

**Update Pattern (on sync):**
```sql
UPDATE `slideheroes_dw.03_core.dim_companies`
SET
  last_updated_at = GREATEST(last_updated_at, SOURCE.last_updated_at),
  source_systems.apollo = STRUCT(
    id AS id,
    CURRENT_TIMESTAMP() AS synced_at,
    TRUE AS record_exists
  )
FROM (
  SELECT company_id, last_updated_at FROM apollo_staging
) AS SOURCE
WHERE dim_companies.apollo_company_id = SOURCE.company_id;
```

---

## Minimum Viable Lead (MVL) Qualification

Before a record is promoted from BigQuery → Attio via reverse ETL, it must meet MVL criteria:

```sql
CREATE TABLE `slideheroes_dw.05_intelligence.qualified_leads`
(
  -- Entity reference
  company_id STRING NOT NULL,
  person_id STRING,
  
  -- MVL criteria checklist
  has_enriched_firmographics BOOLEAN,      -- Company size, industry, revenue populated
  has_validated_contact BOOLEAN,           -- Email validated, phone if available
  has_intent_signals BOOLEAN,              -- Website visit, pricing page view, etc.
  meets_icp_threshold BOOLEAN,             -- composite_score >= 70
  
  -- ICP score details
  composite_score INT64,
  qualification_tier STRING,
  
  -- Promotion status
  is_promoted_to_crm BOOLEAN,
  promoted_at TIMESTAMP,
  attio_company_id STRING,
  attio_person_id STRING,
  
  -- Rejection tracking
  rejection_reason STRING,                 -- 'low_score', 'bad_email', 'out_of_tier', etc.
  rejected_at TIMESTAMP,
  
  -- Timestamps
  qualified_at TIMESTAMP,
  last_evaluated_at TIMESTAMP,
  
  -- System fields
  _etl_batch_id STRING,
  _etl_run_at TIMESTAMP
)
PARTITION BY RANGE_BUCKET(TRUNC(qualified_at, DAY),
  GENERATE_TIMESTAMP_ARRAY(TIMESTAMP('2024-01-01'),
                           TIMESTAMP('2027-01-01'),
                           INTERVAL 1 DAY))
CLUSTER BY is_promoted_to_crm, qualification_tier, composite_score;

-- Reverse ETL query: Feed qualified leads to Census/Hightouch
CREATE OR REPLACE VIEW `slideheroes_dw.06_analytics.vw_leads_for_attio`
AS
SELECT
  c.company_id,
  c.company_name,
  c.domain,
  c.industry,
  c.employee_count,
  c.apollo_company_id,
  p.person_id,
  p.first_name,
  p.last_name,
  p.email,
  p.title,
  p.seniority,
  s.composite_score,
  s.qualification_tier
FROM `slideheroes_dw.03_core.dim_companies` c
JOIN `slideheroes_dw.05_intelligence.icp_scores` s ON c.company_id = s.entity_id
LEFT JOIN `slideheroes_dw.03_core.dim_people` p ON p.company_id = c.company_id
WHERE
  s.entity_type = 'company'
  AND s.is_qualified_for_crm = TRUE
  AND s.attio_record_id IS NULL  -- Not yet promoted
  AND c.is_deleted = FALSE
  AND c.record_tier IN ('tam_universe', 'active_prospect');
```

---

## Fact Tables (Transaction Data)

### fct_deals (CRM Deals)

```sql
CREATE TABLE `slideheroes_dw.04_facts.fct_deals`
(
  deal_id STRING NOT NULL,
  
  -- Entity references
  company_id STRING,                    -- FK to dim_companies
  person_id STRING,                     -- FK to dim_people (primary contact)
  
  -- Deal details
  deal_name STRING,
  deal_stage STRING,                    -- 'prospecting', 'discovery', 'demo', 'proposal', 'negotiation', 'closed_won', 'closed_lost'
  deal_stage_changed_at TIMESTAMP,
  
  -- Financials
  deal_amount_usd FLOAT64,
  deal_currency STRING DEFAULT 'USD',
  deal_probability INT64,              -- 0-100
  expected_close_date DATE,
  
  -- Source
  deal_source STRING,                   -- 'inbound', 'outbound', 'referral', 'partner'
  lead_source STRING,                   -- 'apollo', 'website', 'referral', etc.
  
  -- CRM linkage
  attio_deal_id STRING,
  
  -- Timestamps
  created_at TIMESTAMP,
  won_at TIMESTAMP,
  lost_at TIMESTAMP,
  archived_at TIMESTAMP,
  
  -- System fields
  is_deleted BOOLEAN DEFAULT FALSE,
  _etl_batch_id STRING,
  _etl_run_at TIMESTAMP
)
PARTITION BY RANGE_BUCKET(TRUNC(created_at, DAY),
  GENERATE_TIMESTAMP_ARRAY(TIMESTAMP('2024-01-01'),
                           TIMESTAMP('2027-01-01'),
                           INTERVAL 1 DAY))
CLUSTER BY company_id, deal_stage, created_at;

ALTER TABLE `slideheroes_dw.04_facts.fct_deals`
  ADD PRIMARY KEY (deal_id) NOT ENFORCED;
```

### fct_subscriptions (Stripe)

```sql
CREATE TABLE `slideheroes_dw.04_facts.fct_subscriptions`
(
  subscription_id STRING NOT NULL,
  
  -- Entity references
  stripe_customer_id STRING,
  account_id STRING,                    -- Links to dim_companies
  user_id STRING,                       -- Primary user
  
  -- Subscription details
  plan_tier STRING,                    -- 'free', 'starter', 'pro', 'enterprise'
  plan_interval STRING,                 -- 'monthly', 'yearly'
  
  -- Status
  status STRING,                       -- 'active', 'past_due', 'canceled', 'trialing', 'incomplete'
  status_changed_at TIMESTAMP,
  
  -- Financials
  amount_usd INT64,                    -- Recurring amount in cents
  currency STRING DEFAULT 'usd',
  
  -- Dates
  started_at TIMESTAMP,
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  canceled_at TIMESTAMP,
  ended_at TIMESTAMP,
  trial_start TIMESTAMP,
  trial_end TIMESTAMP,
  
  -- Stripe linkage
  stripe_subscription_id STRING,
  stripe_customer_id STRING,
  
  -- System fields
  _etl_batch_id STRING,
  _etl_run_at TIMESTAMP
)
PARTITION BY RANGE_BUCKET(TRUNC(started_at, DAY),
  GENERATE_TIMESTAMP_ARRAY(TIMESTAMP('2024-01-01'),
                           TIMESTAMP('2027-01-01'),
                           INTERVAL 1 DAY))
CLUSTER BY account_id, status, plan_tier;

ALTER TABLE `slideheroes_dw.04_facts.fct_subscriptions`
  ADD PRIMARY KEY (subscription_id) NOT ENFORCED;
```

### fct_usage_events (Product Analytics)

```sql
CREATE TABLE `slideheroes_dw.04_facts.fct_usage_events`
(
  event_id STRING NOT NULL,
  
  -- Entity references
  user_id STRING,                      -- FK to dim_users
  workspace_id STRING,                 -- FK to dim_workspaces
  account_id STRING,                   -- Links to dim_companies
  
  -- Event details
  event_name STRING,                   -- 'presentation_created', 'slide_added', etc.
  event_category STRING,               -- 'editor', 'export', 'sharing', 'billing'
  event_properties JSON,               -- Flexible event-specific properties
  
  -- Context
  platform STRING,                     -- 'web', 'desktop', 'api'
  device_type STRING,
  browser STRING,
  
  -- Timestamps
  occurred_at TIMESTAMP NOT NULL,
  
  -- System fields
  _etl_batch_id STRING,
  _etl_run_at TIMESTAMP
)
PARTITION BY RANGE_BUCKET(TRUNC(occurred_at, DAY),
  GENERATE_TIMESTAMP_ARRAY(TIMESTAMP('2024-01-01'),
                           TIMESTAMP('2027-01-01'),
                           INTERVAL 1 DAY))
CLUSTER BY user_id, workspace_id, event_name, occurred_at
OPTIONS (
  partition_expiration_days = 365);    -- Keep 1 year of events

ALTER TABLE `slideheroes_dw.04_facts.fct_usage_events`
  ADD PRIMARY KEY (event_id) NOT ENFORCED;
```

---

## BigQuery-Specific Recommendations

### Partitioning Strategy

| Table | Partition Field | Partition Type | Reason |
|-------|-----------------|----------------|--------|
| dim_companies | last_updated_at | Day | Most queries filter by recency |
| dim_people | last_updated_at | Day | Most queries filter by recency |
| dim_users | last_updated_at | Day | Active user reporting |
| icp_scores | scored_at | Day | Re-score runs daily |
| fct_deals | created_at | Day | Time-based analytics |
| fct_subscriptions | started_at | Day | Revenue reporting |
| fct_usage_events | occurred_at | Day | Event analytics |

### Clustering Strategy

| Table | Cluster Fields | Reason |
|-------|----------------|--------|
| dim_companies | domain, record_tier, lifecycle_stage | Match by domain, filter by stage |
| dim_people | email_normalized, company_id, seniority | Email lookups, company reports |
| entity_mappings | source_system, canonical_id | Reverse ETL lookups |
| icp_scores | qualification_tier, composite_score | Lead prioritization |
| lifecycle_stages | entity_type, is_current | Current state queries |
| fct_deals | company_id, deal_stage | Pipeline reporting |
| fct_usage_events | user_id, workspace_id, event_name | Usage analytics |

### Cost Optimization

1. **Query with partition filters** when possible:
   ```sql
   WHERE last_updated_at >= TIMESTAMP('2025-01-01')
   ```

2. **Use `_PARTITIONTIME` for raw staging**:
   ```sql
   WHERE _PARTITIONTIME >= TIMESTAMP('2025-01-01')
   ```

3. **Materialize frequently accessed views**:
   - `mv_qualified_leads_daily` - Fresh qualified leads
   - `mv_pipeline_snapshot` - Current deal pipeline
   - `mv_mrr_daily` - Daily MRR

4. **Schedule query job priorities**:
   - Analytics queries: `INTERACTIVE`
   - ETL jobs: `BATCH`

### Naming Conventions

| Pattern | Meaning | Example |
|---------|---------|---------|
| `dim_*` | Dimension table (entity) | `dim_companies` |
| `fct_*` | Fact table (transaction/event) | `fct_deals` |
| `raw_*` | Raw staging table | `raw_apollo_companies` |
| `*_staging` | Cleaned staging table | `companies_staging` |
| `*_latest` | Current state snapshot | `deals_latest` |
| `*_history` | SCD Type 2 history | `companies_history` |
| `vw_*` | View | `vw_qualified_leads` |
| `mv_*` | Materialized view | `mv_pipeline_snapshot` |
| `*_v{version}` | Versioned model (dbt) | `icp_scores_v1` |

---

## Implementation Checklist

### Phase 1: BigQuery Setup
- [ ] Create BigQuery project `slideheroes-dw`
- [ ] Create datasets: `01_raw`, `02_staging`, `03_core`, `04_facts`, `05_intelligence`, `06_analytics`, `07_archive`
- [ ] Set up IAM roles for dbt service account
- [ ] Configure partitioning and clustering
- [ ] Set up scheduled queries for data freshness checks

### Phase 2: Core Tables
- [ ] Create `dim_companies` table
- [ ] Create `dim_people` table
- [ ] Create `dim_companies_people` table
- [ ] Create `entity_mappings` table
- [ ] Create `dim_users` table
- [ ] Create `dim_workspaces` table

### Phase 3: Fact Tables
- [ ] Create `fct_deals` table
- [ ] Create `fct_subscriptions` table
- [ ] Create `fct_usage_events` table

### Phase 4: Intelligence Tables
- [ ] Create `icp_scores` table
- [ ] Create `lifecycle_stages` table
- [ ] Create `qualified_leads` table

### Phase 5: dbt Models
- [ ] Set up dbt project
- [ ] Create staging models for each source
- [ ] Create deduplication models (`dedup_companies`, `dedup_people`)
- [ ] Create ICP scoring model
- [ ] Create lifecycle stage model
- [ ] Create reverse ETL views for Census/Hightouch

### Phase 6: ETL Pipelines
- [ ] Configure Apollo → BigQuery sync (Portable or API)
- [ ] Configure Attio → BigQuery sync
- [ ] Configure Supabase → BigQuery sync
- [ ] Configure Stripe → BigQuery sync

### Phase 7: Reverse ETL
- [ ] Set up Census or Hightouch
- [ ] Configure `vw_leads_for_attio` sync
- [ ] Configure deal updates sync (Attio → BigQuery)
- [ ] Test round-trip data flow

---

## Appendix: Key Queries

### Find companies eligible for CRM promotion
```sql
SELECT
  c.company_name,
  c.domain,
  c.industry,
  c.employee_count,
  s.composite_score,
  s.qualification_tier,
  ARRAY_AGG(DISTINCT p.email IGNORE NULLS) AS contact_emails
FROM `slideheroes_dw.03_core.dim_companies` c
JOIN `slideheroes_dw.05_intelligence.icp_scores` s
  ON c.company_id = s.entity_id AND s.entity_type = 'company'
LEFT JOIN `slideheroes_dw.03_core.dim_people` p
  ON p.company_id = c.company_id
WHERE
  s.is_qualified_for_crm = TRUE
  AND s.attio_record_id IS NULL
  AND c.record_tier = 'tam_universe'
GROUP BY 1, 2, 3, 4, 5, 6
ORDER BY s.composite_score DESC;
```

### Track company lifecycle stage transitions
```sql
SELECT
  c.company_name,
  ls.stage AS from_stage,
  LEAD(ls.stage) OVER (PARTITION BY ls.entity_id ORDER BY ls.entered_at) AS to_stage,
  ls.entered_at,
  ls.transition_reason
FROM `slideheroes_dw.05_intelligence.lifecycle_stages` ls
JOIN `slideheroes_dw.03_core.dim_companies` c
  ON ls.entity_id = c.company_id
WHERE ls.entity_type = 'company'
ORDER BY ls.entered_at DESC;
```

### Build funnel from TAM to Customer
```sql
WITH stage_counts AS (
  SELECT
    lifecycle_stage,
    COUNT(DISTINCT company_id) AS company_count
  FROM `slideheroes_dw.03_core.dim_companies`
  WHERE lifecycle_stage IS NOT NULL
  GROUP BY 1
)
SELECT
  lifecycle_stage,
  company_count,
  LAG(company_count) OVER (ORDER BY 
    CASE lifecycle_stage
      WHEN 'tam' THEN 1
      WHEN 'mql' THEN 2
      WHEN 'sql' THEN 3
      WHEN 'opportunity' THEN 4
      WHEN 'customer' THEN 5
      WHEN 'churned' THEN 6
    END
  ) AS previous_stage_count,
  ROUND(
    100.0 * company_count / NULLIF(
      FIRST_VALUE(company_count) OVER (ORDER BY 
        CASE lifecycle_stage
          WHEN 'tam' THEN 1
          WHEN 'mql' THEN 2
          WHEN 'sql' THEN 3
          WHEN 'opportunity' THEN 4
          WHEN 'customer' THEN 5
          WHEN 'churned' THEN 6
        END
      ),
    0
  ), 2
) AS conversion_rate
FROM stage_counts
ORDER BY
  CASE lifecycle_stage
    WHEN 'tam' THEN 1
    WHEN 'mql' THEN 2
    WHEN 'sql' THEN 3
    WHEN 'opportunity' THEN 4
    WHEN 'customer' THEN 5
    WHEN 'churned' THEN 6
  END;
```

---

**Document End**
