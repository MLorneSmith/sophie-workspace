
  
    

    create or replace table `slideheroes-data-platform`.`core`.`dim_customers_deduped`
      
    
    

    
    OPTIONS()
    as (
      

with accounts as (
  select
    id as account_id,
    email_normalized as email,
    name as account_name,
    created_at as account_created_at,
    updated_at as account_updated_at
  from `slideheroes-data-platform`.`core`.`stg_accounts`
  where email_normalized is not null
),

stripe_customers as (
  select
    id as stripe_customer_id,
    email_normalized as email,
    name as stripe_customer_name,
    created_ts as stripe_created_at
  from `slideheroes-data-platform`.`core`.`stg_stripe_customers`
  where email_normalized is not null
),

stripe_subscriptions_by_customer as (
  select
    customer as stripe_customer_id,
    count(*) as subscription_count,
    max(case when status in ('active', 'trialing') then 1 else 0 end) as has_active_subscription
  from `slideheroes-data-platform`.`core`.`stg_stripe_subscriptions`
  group by 1
),

attio_people as (
  select
    person_id as attio_person_id,
    email_normalized as email,
    person_name as attio_person_name,
    job_title,
    company,
    created_at as attio_created_at,
    json_value(cast(company as string), '$.target_record_id') as attio_company_id
  from `slideheroes-data-platform`.`core`.`stg_attio_people`
  -- keep null emails; they won't dedupe across sources but still matter for CRM coverage
),

-- Create one row per (source, email/person) so we can aggregate cleanly
unioned as (
  select
    email,
    'supabase' as source_system,
    3 as source_priority,
    account_id,
    null as stripe_customer_id,
    null as attio_person_id,
    account_name as customer_name,
    account_created_at,
    null as stripe_created_at,
    null as attio_created_at,
    null as job_title,
    null as company,
    null as attio_company_id,
    null as has_active_subscription
  from accounts

  union all

  select
    sc.email,
    'stripe' as source_system,
    2 as source_priority,
    null as account_id,
    sc.stripe_customer_id,
    null as attio_person_id,
    sc.stripe_customer_name as customer_name,
    null as account_created_at,
    sc.stripe_created_at,
    null as attio_created_at,
    null as job_title,
    null as company,
    null as attio_company_id,
    coalesce(ss.has_active_subscription, 0) as has_active_subscription
  from stripe_customers sc
  left join stripe_subscriptions_by_customer ss
    on sc.stripe_customer_id = ss.stripe_customer_id

  union all

  select
    ap.email,
    'attio' as source_system,
    1 as source_priority,
    null as account_id,
    null as stripe_customer_id,
    ap.attio_person_id,
    ap.attio_person_name as customer_name,
    null as account_created_at,
    null as stripe_created_at,
    ap.attio_created_at,
    ap.job_title,
    ap.company,
    ap.attio_company_id,
    null as has_active_subscription
  from attio_people ap
),

aggregated as (
  select
    -- Use email as the dedupe key when available; otherwise fall back to Attio person id
    coalesce(email, concat('attio_person:', cast(attio_person_id as string))) as customer_key,
    email,

    -- prefer supabase > stripe > attio for name
    (array_agg(customer_name ignore nulls order by source_priority desc limit 1))[offset(0)] as customer_name,

    max(account_id) as account_id,
    max(stripe_customer_id) as stripe_customer_id,
    max(attio_person_id) as attio_person_id,

    min(account_created_at) as account_created_at,
    min(stripe_created_at) as stripe_created_at,
    min(attio_created_at) as attio_created_at,

    (array_agg(job_title ignore nulls order by source_priority desc limit 1))[offset(0)] as job_title,
    (array_agg(company ignore nulls order by source_priority desc limit 1))[offset(0)] as company,
    (array_agg(attio_company_id ignore nulls order by source_priority desc limit 1))[offset(0)] as attio_company_id,

    max(coalesce(has_active_subscription, 0)) as has_active_subscription,

    max(case when source_system = 'supabase' then 1 else 0 end) as has_supabase,
    max(case when source_system = 'stripe' then 1 else 0 end) as has_stripe,
    max(case when source_system = 'attio' then 1 else 0 end) as has_attio
  from unioned
  group by 1, 2
),

classified as (
  select
    *,

    -- flags
    case
      when email is null then false
      when ends_with(email, '@slideheroes.com') then true
      else false
    end as is_internal,

    case
      when email is null then false
      when email in ('bitbucket@wpengine.com', 'hello@slideheroes.com', 'msmith@slideheroes.com', 'michael@slideheroes.com') then true
      when regexp_contains(email, r'^test.*@slideheroes\.com$') then true
      when regexp_contains(email, r'\+test@') then true
      else false
    end as is_test_record,

    -- derived fields
    array_to_string(
      array(
        select s from unnest([
          if(has_supabase = 1, 'supabase', null),
          if(has_stripe = 1, 'stripe', null),
          if(has_attio = 1, 'attio', null)
        ]) s
        where s is not null
      ),
      ','
    ) as source_systems,

    split(email, '@')[safe_offset(1)] as email_domain,

    case
      when has_active_subscription = 1 then 'paying_customer'
      when has_supabase = 1 then 'product_user'
      when has_stripe = 1 then 'past_customer'
      when has_attio = 1 then 'prospect'
      else 'unknown'
    end as customer_type
  from aggregated
)

select
  customer_key,
  email,
  email_domain,
  customer_name,

  account_id,
  stripe_customer_id,
  attio_person_id,

  account_created_at,
  stripe_created_at,
  attio_created_at,

  job_title,

  company,
  attio_company_id,

  has_active_subscription,
  customer_type,
  source_systems,

  is_internal,
  is_test_record
from classified
    );
  