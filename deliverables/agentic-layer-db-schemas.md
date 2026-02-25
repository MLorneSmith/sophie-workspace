# Agentic Layer — Product DB Schemas (Draft)

Goal: define **product-owned** tables (not Mastra internals) to support audience context, agent/workflow execution tracking, and suggestions.

Assumptions:
- **Postgres / Supabase**
- Multi-tenant via `account_id`
- `presentations` and `accounts` tables already exist.
- Use `gen_random_uuid()` (pgcrypto) and `timestamptz`.

---

## 0) Shared conventions

### IDs / timestamps
- Primary keys are UUID.
- Standard columns on most tables:
  - `created_at timestamptz not null default now()`
  - `updated_at timestamptz not null default now()`

### JSON payloads
- Use `jsonb` for flexible, versioned payloads.
- When storing LLM inputs/outputs, store **structured** JSON with versioning keys (e.g., `{ schema_version: 1, ... }`).

### Status enums
Prefer Postgres enums for small stable sets (status, type). Prefer text + check constraint if you expect frequent changes.

---

## 1) `audience_profiles`

Stores an **AudienceBrief** (product concept) scoped to an account. Can be attached to presentations.

### Table
```sql
create table if not exists public.audience_profiles (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,

  -- human-friendly
  name text not null,
  description text,

  -- the structured brief the agent uses
  audience_brief jsonb not null,
  schema_version int not null default 1,

  -- lifecycle
  is_default boolean not null default false,
  archived_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One default per account (partial unique index)
create unique index if not exists audience_profiles_one_default_per_account
  on public.audience_profiles(account_id)
  where is_default = true and archived_at is null;

create index if not exists audience_profiles_account_id_idx
  on public.audience_profiles(account_id);

create index if not exists audience_profiles_name_trgm_idx
  on public.audience_profiles using gin (name gin_trgm_ops);
```

### Notes
- `audience_brief` should include fields like: persona(s), pains, jobs-to-be-done, buying triggers, objections, language/terms, vertical, seniority, etc.
- If you want “immutable snapshots” of a profile over time, add `version int` and keep rows append-only; otherwise this is the current profile.

---

## 2) `agent_runs`

Tracks a single agent execution (e.g., “Slide Critic”, “Storyboard Builder”, “Rewrite Slide Copy”).

### Enums
```sql
do $$ begin
  create type public.agent_run_status as enum (
    'queued',
    'running',
    'succeeded',
    'failed',
    'cancelled'
  );
exception when duplicate_object then null; end $$;
```

### Table
```sql
create table if not exists public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,

  -- optional linkage to product objects
  presentation_id uuid references public.presentations(id) on delete set null,
  audience_profile_id uuid references public.audience_profiles(id) on delete set null,

  -- agent identity
  agent_id text not null,          -- stable product identifier (e.g., 'slide_critic_v1')
  agent_version text,              -- optional semantic version / git sha

  status public.agent_run_status not null default 'queued',

  -- correlation
  run_id text,                     -- external run id (Mastra runId or provider run id)
  trace_id text,                   -- distributed tracing / OpenTelemetry trace id
  parent_run_id uuid references public.agent_runs(id) on delete set null,

  -- IO
  inputs jsonb not null default '{}'::jsonb,
  outputs jsonb,
  error jsonb,
  schema_version int not null default 1,

  -- usage / cost
  model text,                      -- provider/model used
  prompt_tokens int,
  completion_tokens int,
  total_tokens int,
  cost_usd numeric(12,6),

  started_at timestamptz,
  finished_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists agent_runs_account_id_idx
  on public.agent_runs(account_id);

create index if not exists agent_runs_presentation_id_idx
  on public.agent_runs(presentation_id);

create index if not exists agent_runs_status_idx
  on public.agent_runs(status);

create index if not exists agent_runs_run_id_idx
  on public.agent_runs(run_id);

create index if not exists agent_runs_trace_id_idx
  on public.agent_runs(trace_id);

create index if not exists agent_runs_parent_run_id_idx
  on public.agent_runs(parent_run_id);
```

### Notes
- If runs can be large, consider moving `outputs` to object storage and store only a pointer + summary.
- `cost_usd` is optional but extremely useful for product analytics and rate limiting.

---

## 3) `workflow_runs`

Tracks a multi-step workflow (a “job”) composed of multiple agent runs; stores resume/snapshot state.

### Enums
```sql
do $$ begin
  create type public.workflow_run_status as enum (
    'queued',
    'running',
    'paused',
    'succeeded',
    'failed',
    'cancelled'
  );
exception when duplicate_object then null; end $$;
```

### Table
```sql
create table if not exists public.workflow_runs (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,

  presentation_id uuid references public.presentations(id) on delete set null,
  audience_profile_id uuid references public.audience_profiles(id) on delete set null,

  workflow_id text not null,        -- stable product identifier (e.g., 'storyboard_v1')
  workflow_version text,

  status public.workflow_run_status not null default 'queued',

  -- correlation
  mastra_run_id text,               -- if Mastra is the orchestrator
  trace_id text,

  -- state
  snapshot_refs jsonb,              -- e.g., refs to slide snapshot ids, storage keys, etc.
  resume_payload jsonb,             -- enough to resume a paused run
  inputs jsonb not null default '{}'::jsonb,
  outputs jsonb,
  error jsonb,
  schema_version int not null default 1,

  started_at timestamptz,
  finished_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workflow_runs_account_id_idx
  on public.workflow_runs(account_id);

create index if not exists workflow_runs_presentation_id_idx
  on public.workflow_runs(presentation_id);

create index if not exists workflow_runs_status_idx
  on public.workflow_runs(status);

create index if not exists workflow_runs_mastra_run_id_idx
  on public.workflow_runs(mastra_run_id);

create index if not exists workflow_runs_trace_id_idx
  on public.workflow_runs(trace_id);
```

### Optional: mapping table `workflow_run_steps`
If you need a first-class “step timeline”, add:
- `workflow_run_steps(id, workflow_run_id, step_key, agent_run_id, status, started_at, finished_at, error)`

---

## 4) `suggestions`

Stores agent-generated suggestions that can be accepted/rejected by users. Suggestion payload is flexible and should be typed.

### Enums
```sql
do $$ begin
  create type public.suggestion_status as enum (
    'pending',
    'accepted',
    'rejected',
    'dismissed'
  );
exception when duplicate_object then null; end $$;

-- keep types as text if you expect frequent additions
-- (or define enum if you want strictness)
```

### Table
```sql
create table if not exists public.suggestions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,

  presentation_id uuid not null references public.presentations(id) on delete cascade,

  -- suggestion provenance
  agent_run_id uuid references public.agent_runs(id) on delete set null,
  workflow_run_id uuid references public.workflow_runs(id) on delete set null,
  agent_id text,                 -- denormalized for convenience

  -- target
  slide_id uuid,                 -- nullable for deck-level suggestions

  -- classification
  type text not null,            -- e.g., 'rewrite_copy', 'fix_layout', 'add_slide', 'shorten_title'

  -- content
  payload jsonb not null,        -- the change proposal (typed by `type`)
  rationale text,                -- short explanation shown to user
  confidence numeric(4,3),       -- 0..1 optional
  schema_version int not null default 1,

  status public.suggestion_status not null default 'pending',
  decided_by uuid,               -- user id (if exists)
  decided_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists suggestions_account_id_idx
  on public.suggestions(account_id);

create index if not exists suggestions_presentation_id_idx
  on public.suggestions(presentation_id);

create index if not exists suggestions_slide_id_idx
  on public.suggestions(slide_id);

create index if not exists suggestions_status_idx
  on public.suggestions(status);

create index if not exists suggestions_agent_run_id_idx
  on public.suggestions(agent_run_id);

create index if not exists suggestions_workflow_run_id_idx
  on public.suggestions(workflow_run_id);
```

### Payload examples
- `rewrite_copy`: `{ from: { title, bullets }, to: { title, bullets }, style: {...} }`
- `add_slide`: `{ after_slide_id, slide_spec: {...} }`
- `fix_layout`: `{ layout_diff: {...}, constraints: {...} }`

---

## 5) Row-Level Security (Supabase)

RLS patterns (sketch):
- `account_id = auth.jwt()->>'account_id'` OR join via memberships.
- For writes, ensure user is member of account.

---

## 6) Open questions (to confirm)

1. Do we want `audience_profiles` to be **per-account** only, or also per-user overrides?
2. Should `agent_runs` / `workflow_runs` keep **full prompts** (privacy/cost), or store only a sanitized subset?
3. Are `slide_id` values UUIDs (table exists) or are slides embedded JSON inside presentations?
4. Do we need **rate limiting** and **quota** tables (per account), or is that handled elsewhere?

---

## 7) Suggested next step

If you want, I can convert this into:
- a `supabase/migrations/<timestamp>_agentic_layer_tables.sql`
- plus triggers for `updated_at`
- plus baseline RLS policies
