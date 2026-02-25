-- Signal: Started course but didn't complete (stalled learner)
-- Action: DM offering help / check-in
-- Cadence: Weekly
-- Priority: Medium (showed deeper intent than just signup)

SELECT
  cp.user_id,
  a.email,
  a.name AS account_name,
  cp.course_id,
  cp.completion_percentage,
  cp.started_at,
  cp.last_accessed_at,
  DATE_DIFF(CURRENT_DATE(), DATE(cp.last_accessed_at), DAY) AS days_since_last_access,
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
WHERE cp.completed_at IS NULL  -- not completed
  AND cp.completion_percentage > 0  -- actually started
  AND cp.last_accessed_at <= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 14 DAY)  -- stalled 14+ days
  AND cp.last_accessed_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 180 DAY)  -- not ancient
ORDER BY cp.completion_percentage DESC, icp.icp_total_score DESC NULLS LAST
