
  
    

    create or replace table `slideheroes-data-platform`.`core`.`fct_bookings`
      
    
    

    
    OPTIONS()
    as (
      select
  booking_id,
  start_time,
  end_time,
  attendee_email
from `slideheroes-data-platform`.`core`.`stg_calcom_bookings`
    );
  