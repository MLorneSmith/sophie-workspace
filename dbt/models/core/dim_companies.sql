with attio as (
  select
    company_id,
    company_name,
    web_url,
    -- attio `domains` is a single domain string in our raw table
    lower(regexp_replace(domains, r'^www\.', '')) as domain,
    domains,
    primary_location,
    created_at,
    last_interaction_at,

    employee_range
  from {{ ref('stg_attio_companies') }}
),

apollo as (
  select
    apollo_id,
    apollo_name,
    primary_domain as domain,

    annual_revenue,
    revenue_printed,
    founded_year,

    headcount_growth_6m,
    headcount_growth_12m,
    headcount_growth_24m,

    linkedin_url,
    website_url,
    sic_codes,
    languages,

    -- crude industry mapping from SIC codes (stored as strings)
    case
      when exists (
        select 1 from unnest(sic_codes) as code
        where code in ('7389','7392','8742','8748','6282')
      ) then 'Management Consulting'
      when exists (
        select 1 from unnest(sic_codes) as code
        where safe_cast(code as int64) between 8711 and 8749
      ) then 'Professional Services'
      when exists (
        select 1 from unnest(sic_codes) as code
        where substr(code, 1, 2) in ('35','36','37','38','48','73')
      ) then 'Technology'
      else 'Other'
    end as industry
  from {{ ref('stg_apollo_organizations') }}
),

joined as (
  select
    -- Preserve Attio company ids; for Apollo-only companies, mint a stable synthetic id
    coalesce(a.company_id, concat('apollo:', p.apollo_id)) as company_id,

    coalesce(a.company_name, p.apollo_name) as company_name,

    coalesce(a.web_url, p.website_url) as web_url,
    coalesce(a.domains, p.domain) as domains,
    a.primary_location,
    a.created_at,
    a.last_interaction_at,

    -- Firmographics (Apollo-first, with Attio fallback where available)
    coalesce(
      -- Apollo raw table does not currently include an employee count field; fallback to Attio employee_range.
      case
        when regexp_contains(a.employee_range, r'\d+\s*-\s*\d+') then (
          safe_cast(regexp_extract(a.employee_range, r'^(\d+)') as int64) +
          safe_cast(regexp_extract(a.employee_range, r'-(\d+)') as int64)
        ) / 2
        when regexp_contains(a.employee_range, r'\d+\+') then safe_cast(regexp_extract(a.employee_range, r'^(\d+)') as int64)
        when regexp_contains(a.employee_range, r'^(\d+)$') then safe_cast(a.employee_range as int64)
        else null
      end,
      null
    ) as employee_count,
    p.industry,
    p.annual_revenue,
    p.revenue_printed,
    p.founded_year,
    p.headcount_growth_6m,
    p.headcount_growth_12m,
    p.headcount_growth_24m,
    p.linkedin_url,
    p.website_url,
    p.apollo_id,
    p.sic_codes,
    p.languages,

    -- Attio employee range (kept for downstream scoring fallback)
    a.employee_range
  from attio a
  full outer join apollo p
    on a.domain = p.domain
)

select *
from joined
