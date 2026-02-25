{{ config(materialized='view') }}

{#
  Cal.com bookings table is expected as `staging.calcom_bookings`.
  If the raw sync hasn't created it yet, build an empty relation so dbt run/test still succeeds.
#}

{% set rel = adapter.get_relation(database=target.project, schema='staging', identifier='calcom_bookings') %}

{% if rel is none %}
  select
    cast(null as string) as booking_id,
    cast(null as timestamp) as start_time,
    cast(null as timestamp) as end_time,
    cast(null as string) as attendee_email
  limit 0
{% else %}
  with source as (
    select *
    from {{ source('staging', 'calcom_bookings') }}
  )

  select
    *
  from source
{% endif %}
