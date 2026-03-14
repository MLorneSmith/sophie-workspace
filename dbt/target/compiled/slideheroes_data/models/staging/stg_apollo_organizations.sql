

with source as (
  select *
  from `slideheroes-data-platform`.`staging`.`apollo_organizations`
),

clean as (
  select
    id as apollo_id,
    name as apollo_name,

    -- normalize domains for joining (lowercase, strip leading www.)
    lower(regexp_replace(primary_domain, r'^www\.', '')) as primary_domain,

    -- Revenue: Apollo already stores organization_revenue as FLOAT64 in the raw table
    safe_cast(organization_revenue as float64) as annual_revenue,
    organization_revenue_printed as revenue_printed,

    safe_cast(founded_year as int64) as founded_year,

    -- Growth fields arrive as strings; represent as decimals (e.g. 0.12 = 12%)
    safe_cast(organization_headcount_six_month_growth as float64) as headcount_growth_6m,
    safe_cast(organization_headcount_twelve_month_growth as float64) as headcount_growth_12m,
    safe_cast(organization_headcount_twenty_four_month_growth as float64) as headcount_growth_24m,

    linkedin_url,
    website_url,

    -- Parse JSON array of strings
    array(
      select trim(cast(x as string), '"')
      from unnest(json_extract_array(sic_codes)) as x
    ) as sic_codes,

    -- Languages — JSON array of strings e.g. '["English","French"]'
    array(
      select trim(cast(x as string), '"')
      from unnest(json_extract_array(languages)) as x
    ) as languages,

    -- Keep raw fields for debugging
    sic_codes as sic_codes_raw,

    * except(
      id,
      name,
      primary_domain,
      organization_revenue,
      organization_revenue_printed,
      founded_year,
      organization_headcount_six_month_growth,
      organization_headcount_twelve_month_growth,
      organization_headcount_twenty_four_month_growth,
      linkedin_url,
      website_url,
      sic_codes,
      languages
    )
  from source
)

select *
from clean