{{ config(materialized='table') }}

with icp as (
  select
    * except(has_active_subscription),
    (coalesce(has_active_subscription, 0) = 1) as has_active_subscription
  from {{ ref('icp_scores') }}
  where company_name is not null
    and trim(company_name) != ''
    and icp_total_score >= 25
),

companies as (
  select
    company_id,
    linkedin_url,
    website_url,
    annual_revenue,
    revenue_printed,
    headcount_growth_12m,
    industry
  from {{ ref('dim_companies') }}
),

company_person as (
  select
    company_id,
    customer_key
  from {{ ref('company_person_map') }}
),

customers as (
  select
    customer_key,
    customer_type,
    has_active_subscription,
    is_internal,
    is_test_record
  from {{ ref('dim_customers_deduped') }}
),

company_customer_rollup as (
  select
    m.company_id,

    count(distinct m.customer_key) as contact_count,

    max(case when c.customer_type in ('product_user', 'paying_customer') then 1 else 0 end) as has_product_engagement_int,
    max(coalesce(c.has_active_subscription, 0)) as has_active_subscription_int,

    max(case when coalesce(c.is_internal, false) then 1 else 0 end) as has_internal_int,
    max(case when coalesce(c.is_test_record, false) then 1 else 0 end) as has_test_int
  from company_person m
  left join customers c
    on m.customer_key = c.customer_key
  group by 1
),

joined as (
  select
    icp.*,

    co.linkedin_url,
    co.website_url,
    co.revenue_printed,

    -- lead-qualification flags
    (not starts_with(icp.company_id, 'apollo:')) as already_in_attio,

    coalesce(r.contact_count, 0) as contact_count,

    (coalesce(r.has_product_engagement_int, 0) = 1) as has_product_engagement,

    (coalesce(r.has_internal_int, 0) = 1) as has_internal_contact,
    (coalesce(r.has_test_int, 0) = 1) as has_test_contact
  from icp
  left join companies co
    on icp.company_id = co.company_id
  left join company_customer_rollup r
    on icp.company_id = r.company_id
),

qualified as (
  select
    *,

    case
      when industry in ('Management Consulting', 'Professional Services')
        and (
          icp_total_score >= 60
          or has_product_engagement
        )
        and not has_internal_contact
        and not has_test_contact
        then 'sales'

      when industry in ('Management Consulting', 'Professional Services')
        and icp_total_score >= 45
        and starts_with(company_id, 'apollo:')
        and not has_internal_contact
        and not has_test_contact
        then 'outbound'

      else null
    end as mvl_tier,

    current_timestamp() as qualified_at
  from joined
)

select
  -- all icp_scores columns
  qualified.* except(has_internal_contact, has_test_contact)
from qualified
where mvl_tier is not null
