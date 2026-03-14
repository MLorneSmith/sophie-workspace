

  create or replace view `slideheroes-data-platform`.`core`.`stg_posthog_persons`
  OPTIONS()
  as 

with source as (
  select *
  from `slideheroes-data-platform`.`staging`.`posthog_persons`
)

select
  uuid as posthog_person_uuid,
  safe_cast(created_at as timestamp) as created_at,
  lower(json_value(properties, '$.email')) as email,
  properties,
  distinct_ids,
  * except(uuid, created_at, properties, distinct_ids)
from source;

