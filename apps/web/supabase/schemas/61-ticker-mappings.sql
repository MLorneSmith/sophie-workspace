-- Schema: ticker_mappings table for company name -> ticker/CIK resolution
-- Purpose: Cache resolved company name to stock ticker and CIK mappings with 30-day TTL

-- Note: This schema file documents the desired state for ticker_mappings table
-- The actual table is created via migration 20260305000000_web_ticker_mappings.sql
-- This file is used by the schema-as-source workflow and typegen tools

-- Table definition (matching migration)
create table if not exists
  public.ticker_mappings (
    id uuid primary key default gen_random_uuid (),
    company_name text not null,
    ticker text not null,
    cik text not null,
    confidence_score numeric not null default 0,
    user_id uuid references auth.users (id) on delete cascade not null,
    created_at timestamptz not null default now (),
    updated_at timestamptz not null default now (),
    resolved_at timestamptz not null default now (),
    expires_at timestamptz not null default (now() + interval '30 days')
  );

-- Indexes
create index if not exists ix_ticker_mappings_company_name_lower
  on public.ticker_mappings (lower(company_name));

create index if not exists ix_ticker_mappings_user_id
  on public.ticker_mappings (user_id);

create index if not exists ix_ticker_mappings_expires_at
  on public.ticker_mappings (expires_at);

-- Comments
comment on table public.ticker_mappings is 'Cached company name to ticker/CIK mappings for financial data enrichment';
