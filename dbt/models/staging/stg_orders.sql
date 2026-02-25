{{ config(materialized='view') }}

with source as (
  select *
  from {{ source('staging', 'orders') }}
)

select
  *,
  safe_cast(total_amount as numeric) as total_amount_numeric
from source
