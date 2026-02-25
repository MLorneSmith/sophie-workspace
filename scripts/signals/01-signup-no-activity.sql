-- Signal: Account created but no course progress and no orders
-- Action: Nurture DM sequence — they signed up but never engaged
-- Cadence: Weekly
-- Priority: High (they showed initial intent)

SELECT
  a.id AS account_id,
  a.email,
  a.name AS account_name,
  a.created_at AS signup_date,
  DATE_DIFF(CURRENT_DATE(), DATE(a.created_at), DAY) AS days_since_signup,
  dc.job_title,
  dc.company,
  icp.icp_grade,
  icp.icp_total_score
FROM `slideheroes-data-platform.staging.accounts` a
LEFT JOIN `slideheroes-data-platform.core.dim_customers` dc
  ON a.email = dc.email
LEFT JOIN `slideheroes-data-platform.core.icp_scores` icp
  ON dc.company = icp.company_name
LEFT JOIN `slideheroes-data-platform.staging.course_progress` cp
  ON a.primary_owner_user_id = cp.user_id
LEFT JOIN `slideheroes-data-platform.core.fct_orders` fo
  ON a.id = fo.account_id
WHERE a.is_personal_account = TRUE
  AND cp.id IS NULL  -- no course progress
  AND fo.order_id IS NULL  -- no orders
  AND a.created_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 90 DAY)  -- last 90 days
  AND a.created_at <= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY)  -- at least 7 days old
ORDER BY icp.icp_total_score DESC NULLS LAST, a.created_at DESC
