{{ config(materialized='view') }}

with source as (
  select *
  from {{ source('staging', 'stripe_customers') }}
)

select
  *,
  lower(email) as email_normalized,
  timestamp_seconds(safe_cast(created as int64)) as created_ts
from source
