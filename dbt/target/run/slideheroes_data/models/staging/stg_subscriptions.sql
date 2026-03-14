

  create or replace view `slideheroes-data-platform`.`core`.`stg_subscriptions`
  OPTIONS()
  as 

with source as (
  select *
  from `slideheroes-data-platform`.`staging`.`subscriptions`
)

select
  *,
  safe_cast(period_starts_at as timestamp) as period_starts_ts,
  safe_cast(period_ends_at as timestamp) as period_ends_ts,
  safe_cast(trial_starts_at as timestamp) as trial_starts_ts,
  safe_cast(trial_ends_at as timestamp) as trial_ends_ts
from source;

