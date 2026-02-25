{{ config(materialized='table') }}

with customers as (
  select *
  from {{ ref('dim_customers_deduped') }}
  where email is not null
    and is_test_record = false
),

companies as (
  select
    company_id,
    lower(regexp_replace(domains, r'^www\.', '')) as domain,
    domains
  from {{ ref('dim_companies') }}
),

-- 1) Direct Attio person->company link
attio_links as (
  select
    c.customer_key,
    c.email,
    c.attio_company_id as company_id,
    'attio_company_id' as link_method
  from customers c
  where c.attio_company_id is not null
),

-- 2) Email domain->company link
email_domain_links as (
  select
    c.customer_key,
    c.email,
    co.company_id,
    'email_domain' as link_method
  from customers c
  join companies co
    on c.email_domain = co.domain
  where c.email_domain is not null
),

unioned as (
  select * from attio_links
  union all
  select * from email_domain_links
)

select
  customer_key,
  email,
  company_id,
  link_method
from unioned
qualify row_number() over (
  partition by customer_key, company_id
  order by case when link_method = 'attio_company_id' then 1 else 2 end
) = 1
