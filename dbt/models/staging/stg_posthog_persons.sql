{{ config(materialized='view') }}

with source as (
  select *
  from {{ source('staging', 'posthog_persons') }}
)

select
  uuid as posthog_person_uuid,
  safe_cast(created_at as timestamp) as created_at,
  lower(json_value(properties, '$.email')) as email,
  properties,
  distinct_ids,
  * except(uuid, created_at, properties, distinct_ids)
from source
