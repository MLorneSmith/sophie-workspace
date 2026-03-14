

  create or replace view `slideheroes-data-platform`.`core`.`stg_calcom_bookings`
  OPTIONS()
  as 






  select
    cast(null as string) as booking_id,
    cast(null as timestamp) as start_time,
    cast(null as timestamp) as end_time,
    cast(null as string) as attendee_email
  limit 0
;

