-- Signal: Completed course but no subscription/order on the platform
-- Action: Re-engagement DM — migrate them to the new product
-- Cadence: Weekly
-- Priority: High (proven buyers, warm audience)

SELECT
  cp.user_id,
  a.email,
  a.name AS account_name,
  cp.course_id,
  cp.completed_at AS course_completed_date,
  cp.completion_percentage,
  cp.certificate_generated,
  dc.job_title,
  dc.company,
  icp.icp_grade,
  icp.icp_total_score
FROM `slideheroes-data-platform.staging.course_progress` cp
JOIN `slideheroes-data-platform.staging.accounts_memberships` am
  ON cp.user_id = am.user_id
JOIN `slideheroes-data-platform.staging.accounts` a
  ON am.account_id = a.id AND a.is_personal_account = TRUE
LEFT JOIN `slideheroes-data-platform.core.dim_customers` dc
  ON a.email = dc.email
LEFT JOIN `slideheroes-data-platform.core.icp_scores` icp
  ON dc.company = icp.company_name
LEFT JOIN `slideheroes-data-platform.staging.subscriptions` s
  ON a.id = s.account_id AND s.active = TRUE
WHERE cp.completed_at IS NOT NULL  -- completed the course
  AND s.id IS NULL  -- no active subscription
ORDER BY icp.icp_total_score DESC NULLS LAST, cp.completed_at DESC
