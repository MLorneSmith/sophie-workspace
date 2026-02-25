-- Signal: Cal.com booking made but no subsequent purchase
-- Action: Follow-up DM — they were interested enough to book, what happened?
-- Cadence: Weekly
-- Priority: Medium-High (high intent shown)

SELECT
  fb.booking_id,
  fb.attendee_email,
  fb.start_time AS booking_date,
  DATE_DIFF(CURRENT_DATE(), DATE(fb.start_time), DAY) AS days_since_booking,
  dc.account_id,
  dc.customer_name,
  dc.job_title,
  dc.company,
  icp.icp_grade,
  icp.icp_total_score
FROM `slideheroes-data-platform.core.fct_bookings` fb
LEFT JOIN `slideheroes-data-platform.core.dim_customers` dc
  ON fb.attendee_email = dc.email
LEFT JOIN `slideheroes-data-platform.core.icp_scores` icp
  ON dc.company = icp.company_name
LEFT JOIN `slideheroes-data-platform.core.fct_orders` fo
  ON dc.account_id = fo.account_id
  AND fo.created_at > fb.start_time  -- order AFTER the booking
WHERE fo.order_id IS NULL  -- no purchase after booking
  AND fb.start_time >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 90 DAY)
  AND fb.start_time <= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 3 DAY)  -- give them a few days
ORDER BY icp.icp_total_score DESC NULLS LAST, fb.start_time DESC
