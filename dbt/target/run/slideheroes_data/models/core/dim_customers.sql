
  
    

    create or replace table `slideheroes-data-platform`.`core`.`dim_customers`
      
    
    

    
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
),

stripe as (
  select
    id as stripe_customer_id,
    email_normalized as email,
    name as stripe_customer_name,
    created_ts as stripe_created_at
  from `slideheroes-data-platform`.`core`.`stg_stripe_customers`
),

attio as (
  select
    person_id as attio_person_id,
    email_normalized as email,
    person_name as attio_person_name,
    job_title,
    company,
    created_at as attio_created_at
  from `slideheroes-data-platform`.`core`.`stg_attio_people`
  where email_normalized is not null
)

select
  coalesce(a.email, s.email, p.email) as email,
  a.account_id,
  s.stripe_customer_id,
  p.attio_person_id,

  coalesce(a.account_name, p.attio_person_name, s.stripe_customer_name) as customer_name,

  a.account_created_at,
  s.stripe_created_at,
  p.attio_created_at,

  p.job_title,
  p.company
from accounts a
full outer join stripe s
  on a.email = s.email
full outer join attio p
  on coalesce(a.email, s.email) = p.email
    );
  