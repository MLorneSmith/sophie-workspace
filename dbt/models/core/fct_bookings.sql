select
  booking_id,
  start_time,
  end_time,
  attendee_email
from {{ ref('stg_calcom_bookings') }}
