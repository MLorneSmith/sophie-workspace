

  create or replace view `slideheroes-data-platform`.`core`.`mvl_summary`
  OPTIONS()
  as 

with scored as (
  select *
  from `slideheroes-data-platform`.`core`.`icp_scores`
  where company_name is not null
    and trim(company_name) != ''
),

qualified as (
  select *
  from `slideheroes-data-platform`.`core`.`mvl_qualified_leads`
),

metrics as (
  select 'metrics' as section, 'total_companies_scored' as metric, count(*) as value_int, cast(null as float64) as value_float,
         cast(null as string) as mvl_tier, cast(null as string) as industry,
         cast(null as string) as company_id, cast(null as string) as company_name,
         cast(null as float64) as icp_total_score, cast(null as int64) as annual_revenue
  from scored

  union all

  select 'metrics', 'mvl_outbound_companies', count(*), null,
         null, null, null, null, null, null
  from qualified
  where mvl_tier = 'outbound'

  union all

  select 'metrics', 'mvl_sales_companies', count(*), null,
         null, null, null, null, null, null
  from qualified
  where mvl_tier = 'sales'

  union all

  select 'metrics', 'already_in_attio', count(*), null,
         null, null, null, null, null, null
  from qualified
  where already_in_attio

  union all

  select 'metrics', 'new_not_in_attio', count(*), null,
         null, null, null, null, null, null
  from qualified
  where not already_in_attio
),

avg_score_by_tier as (
  select
    'avg_score_by_tier' as section,
    'avg_icp_total_score' as metric,
    cast(null as int64) as value_int,
    avg(icp_total_score) as value_float,
    mvl_tier,
    cast(null as string) as industry,
    cast(null as string) as company_id,
    cast(null as string) as company_name,
    cast(null as float64) as icp_total_score,
    cast(null as int64) as annual_revenue
  from qualified
  group by 1,2,5
),

industry_breakdown as (
  select
    'industry_breakdown' as section,
    'qualified_companies' as metric,
    count(*) as value_int,
    cast(null as float64) as value_float,
    cast(null as string) as mvl_tier,
    industry,
    cast(null as string) as company_id,
    cast(null as string) as company_name,
    cast(null as float64) as icp_total_score,
    cast(null as int64) as annual_revenue
  from qualified
  group by 1,2,6
),

top_10 as (
  select
    'top_10_by_score' as section,
    cast(row_number() over(order by icp_total_score desc) as string) as metric,
    cast(null as int64) as value_int,
    cast(null as float64) as value_float,
    mvl_tier,
    industry,
    company_id,
    company_name,
    icp_total_score,
    cast(annual_revenue as int64) as annual_revenue
  from qualified
  qualify row_number() over(order by icp_total_score desc) <= 10
)

select * from metrics
union all select * from avg_score_by_tier
union all select * from industry_breakdown
union all select * from top_10;

