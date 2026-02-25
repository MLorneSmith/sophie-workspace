{{ config(materialized='view') }}

with source as (
  select *
  from {{ source('staging', 'posthog_events') }}
)

select
  uuid as event_id,
  safe_cast(timestamp as timestamp) as occurred_at,
  event as event_name,
  distinct_id,
  person_id,
  session_id,
  properties,
  * except(uuid, timestamp, event, distinct_id, person_id, session_id, properties)
from source
