

with customers as (
  select *
  from `slideheroes-data-platform`.`core`.`dim_customers_deduped`
),

company_map as (
  select *
  from `slideheroes-data-platform`.`core`.`company_person_map`
),

by_source_overlap as (
  select
    case
      when source_systems = 'supabase' then 'supabase_only'
      when source_systems = 'stripe' then 'stripe_only'
      when source_systems = 'attio' then 'attio_only'
      when source_systems in ('supabase,stripe','stripe,supabase') then 'supabase_and_stripe'
      when source_systems in ('supabase,attio','attio,supabase') then 'supabase_and_attio'
      when source_systems in ('stripe,attio','attio,stripe') then 'stripe_and_attio'
      when source_systems like '%supabase%' and source_systems like '%stripe%' and source_systems like '%attio%' then 'all_three'
      else 'other'
    end as overlap_bucket,
    count(*) as people_count
  from customers
  group by 1
),

by_link_method as (
  select
    link_method,
    count(distinct customer_key) as people_linked,
    count(distinct company_id) as companies_linked
  from company_map
  group by 1
),

email_domains as (
  select
    email_domain,
    count(*) as people_count
  from customers
  where email_domain is not null
    and is_test_record = false
  group by 1
  order by people_count desc
  limit 50
)

select
  -- headline counts
  (select count(*) from customers) as total_people,
  (select count(*) from customers where email is null) as people_missing_email,
  (select count(*) from customers where is_internal) as internal_people,
  (select count(*) from customers where is_test_record) as test_people,
  (select count(distinct customer_key) from company_map) as people_with_any_company_link,
  (select count(*) from customers where is_test_record = false and customer_key not in (select distinct customer_key from company_map)) as people_without_company_link,

  -- packed diagnostics
  (select array_agg(struct(overlap_bucket, people_count) order by people_count desc) from by_source_overlap) as people_by_source_overlap,
  (select array_agg(struct(link_method, people_linked, companies_linked) order by people_linked desc) from by_link_method) as company_links_by_method,
  (select array_agg(struct(email_domain, people_count) order by people_count desc) from email_domains) as top_email_domains