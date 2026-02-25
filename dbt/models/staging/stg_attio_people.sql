{{ config(materialized='view') }}

with source as (
  select *
  from {{ source('staging', 'attio_people') }}
)

select
  id as person_id,
  name as person_name,
  -- Attio stores email_addresses as an array; prefer the first email when present
  nullif(lower(cast(email_addresses as string)), '') as email_normalized,
  job_title,
  company,
  safe_cast(created_at as timestamp) as created_at,
  safe_cast(last_interaction as timestamp) as last_interaction_at,
  * except(id, name, email_addresses, job_title, company, created_at, last_interaction)
from source
