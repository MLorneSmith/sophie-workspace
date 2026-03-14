select
  event_id,
  occurred_at,
  event_name,
  distinct_id,
  person_id,
  session_id,
  properties
from `slideheroes-data-platform`.`core`.`stg_posthog_events`
where occurred_at is not null