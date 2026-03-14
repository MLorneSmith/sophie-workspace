

  create or replace view `slideheroes-data-platform`.`core`.`stg_stripe_subscriptions`
  OPTIONS()
  as 

with source as (
  select *
  from `slideheroes-data-platform`.`staging`.`stripe_subscriptions`
)

select
  *,
  timestamp_seconds(safe_cast(created as int64)) as created_ts,
  timestamp_seconds(safe_cast(start_date as int64)) as start_date_ts,
  timestamp_seconds(safe_cast(trial_start as int64)) as trial_start_ts,
  timestamp_seconds(safe_cast(trial_end as int64)) as trial_end_ts,
  timestamp_seconds(safe_cast(canceled_at as int64)) as canceled_at_ts,
  timestamp_seconds(safe_cast(ended_at as int64)) as ended_at_ts
from source;

