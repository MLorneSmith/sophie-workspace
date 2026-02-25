with companies as (
  select *
  from {{ ref('dim_companies') }}
),

customers as (
  select
    customer_key,
    email,
    account_id,
    stripe_customer_id,
    attio_person_id,
    account_created_at,
    stripe_created_at,
    attio_created_at,

    attio_company_id,
    email_domain,

    is_internal,
    is_test_record
  from {{ ref('dim_customers_deduped') }}
  where is_test_record = false
    and is_internal = false
),

company_person as (
  select *
  from {{ ref('company_person_map') }}
),

posthog_persons as (
  select
    posthog_person_uuid,
    email
  from {{ ref('stg_posthog_persons') }}
  where email is not null
),

posthog_events_by_email as (
  select
    p.email,
    count(*) as event_count
  from {{ ref('stg_posthog_events') }} e
  join posthog_persons p
    on e.person_id = p.posthog_person_uuid
  group by 1
),

stripe_subscriptions_by_customer as (
  select
    customer as stripe_customer_id,
    count(*) as subscription_count,
    max(case when status in ('active', 'trialing') then 1 else 0 end) as has_active_subscription
  from {{ ref('stg_stripe_subscriptions') }}
  group by 1
),

customer_rollup as (
  select
    m.company_id,

    -- behavioral
    sum(coalesce(p.event_count, 0)) as total_event_count,

    max(case when s.stripe_customer_id is not null then 1 else 0 end) as has_any_stripe_customer,
    max(coalesce(s.has_active_subscription, 0)) as has_active_subscription,

    -- recency
    min(c.account_created_at) as first_account_created_at,
    max(c.account_created_at) as most_recent_account_created_at
  from customers c
  join company_person m
    on c.customer_key = m.customer_key
  left join posthog_events_by_email p
    on c.email = p.email
  left join stripe_subscriptions_by_customer s
    on c.stripe_customer_id = s.stripe_customer_id
  group by 1
),

scored as (
  select
    co.company_id,
    co.company_name,
    co.domains as domain,

    co.employee_count,
    co.industry,
    co.annual_revenue,
    co.primary_location,
    co.headcount_growth_12m,
    co.languages,

    cr.total_event_count,
    cr.has_any_stripe_customer,
    cr.has_active_subscription,
    cr.first_account_created_at,
    cr.most_recent_account_created_at,

    -- Firm size (0-10): Use employee_count if available, otherwise infer from revenue
    -- ICP sweet spot: 5-50 employees (~$1M-$20M revenue for consultancies)
    case
      when co.employee_count between 5 and 50 then 10
      when co.employee_count between 51 and 200 then 7
      when co.employee_count between 1 and 4 then 5
      when co.employee_count between 201 and 500 then 3
      when co.employee_count >= 501 then 1
      -- No headcount? Use revenue as proxy (typical consulting firm: ~$200K revenue per employee)
      when co.annual_revenue between 1000000 and 10000000 then 10    -- ~5-50 employees
      when co.annual_revenue between 10000000 and 40000000 then 7   -- ~50-200 employees
      when co.annual_revenue between 100000 and 999999 then 5       -- ~1-4 employees
      when co.annual_revenue between 40000000 and 100000000 then 3  -- ~200-500
      when co.annual_revenue > 100000000 then 1                     -- 500+
      else 3
    end as firm_size_score,

    -- Industry (0-10)
    case
      when co.industry = 'Management Consulting' then 10
      when co.industry = 'Professional Services' then 7
      when co.industry = 'Technology' then 5
      when co.industry is null then 2
      else 2
    end as industry_score,

    -- Revenue (0-10) - annual_revenue is numeric in USD when present
    case
      when co.annual_revenue between 1000000 and 20000000 then 10
      when co.annual_revenue > 20000000 and co.annual_revenue <= 100000000 then 7
      when co.annual_revenue >= 500000 and co.annual_revenue < 1000000 then 5
      when co.annual_revenue > 100000000 then 3
      else 3
    end as revenue_score,

    -- Geography (0-10): Use Attio location first, then Apollo languages
    case
      -- Attio location available and English-speaking market
      when regexp_contains(lower(co.primary_location), r'united states|usa|canada|united kingdom|uk|australia|new zealand|ireland') then 10
      -- Apollo languages: primary language is English → likely English-speaking market
      when co.languages is not null and array_length(co.languages) > 0
        and co.languages[offset(0)] = 'English' then 8
      -- English appears anywhere in languages list
      when co.languages is not null and exists(select 1 from unnest(co.languages) l where l = 'English') then 6
      -- No location data at all
      when co.primary_location is null and (co.languages is null or array_length(co.languages) = 0) then 5
      -- Has location but not English-speaking
      when co.primary_location is not null then 2
      -- Has languages but no English
      else 2
    end as geography_score,

    -- Engagement (0-15)
    case
      when coalesce(cr.total_event_count, 0) >= 20 then 15
      when coalesce(cr.total_event_count, 0) between 10 and 19 then 10
      when coalesce(cr.total_event_count, 0) between 5 and 9 then 7
      when coalesce(cr.total_event_count, 0) between 1 and 4 then 3
      else 0
    end as engagement_score,

    -- Payment (0-15)
    case
      when coalesce(cr.has_active_subscription, 0) = 1 then 15
      when coalesce(cr.has_any_stripe_customer, 0) = 1 then 7
      else 0
    end as payment_score,

    -- Growth (0-15) (headcount_growth_12m is a decimal: 0.10 = 10%)
    case
      when co.headcount_growth_12m > 0.10 then 15
      when co.headcount_growth_12m > 0.05 then 10
      when co.headcount_growth_12m >= 0 then 5
      else 3
    end as growth_score,

    -- Recency (0-15) based on the earliest observed account created date for the company
    case
      when cr.first_account_created_at is null then 0
      when date_diff(current_date(), date(cr.first_account_created_at), day) < 30 then 15
      when date_diff(current_date(), date(cr.first_account_created_at), day) < 90 then 10
      when date_diff(current_date(), date(cr.first_account_created_at), day) < 180 then 7
      when date_diff(current_date(), date(cr.first_account_created_at), day) < 365 then 5
      else 3
    end as recency_score
  from companies co
  left join customer_rollup cr
    on co.company_id = cr.company_id
)

select
  *,
  (firm_size_score + industry_score + revenue_score + geography_score) as firmographic_score,
  (engagement_score + payment_score) as behavioral_score,
  (growth_score) as growth_score_total,
  (recency_score) as recency_score_total,

  (firm_size_score + industry_score + revenue_score + geography_score + engagement_score + payment_score + growth_score + recency_score) as icp_total_score,

  case
    when (firm_size_score + industry_score + revenue_score + geography_score + engagement_score + payment_score + growth_score + recency_score) >= 75 then 'A'
    when (firm_size_score + industry_score + revenue_score + geography_score + engagement_score + payment_score + growth_score + recency_score) >= 50 then 'B'
    when (firm_size_score + industry_score + revenue_score + geography_score + engagement_score + payment_score + growth_score + recency_score) >= 25 then 'C'
    else 'F'
  end as icp_grade,

  case
    when industry in ('Management Consulting', 'Professional Services')
      and firm_size_score >= 7
      and (firm_size_score + industry_score + revenue_score + geography_score + engagement_score + payment_score + growth_score + recency_score) >= 50
      then 'Primary'

    when industry in ('Management Consulting', 'Professional Services')
      and (annual_revenue between 10000000 and 100000000 or employee_count between 51 and 200)
      then 'Secondary - Mid-size'

    when industry in ('Management Consulting', 'Professional Services')
      and (annual_revenue < 1000000 or employee_count between 1 and 4)
      then 'Secondary - Solo'

    when industry in ('Management Consulting', 'Professional Services')
      then 'Secondary - Other Consulting'

    else 'Other'
  end as icp_segment
from scored
