{{ config(materialized='view') }}

with source as (
  select *
  from {{ source('staging', 'accounts') }}
)

select
  *,
  lower(email) as email_normalized
from source
