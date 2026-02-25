-- Signal: Had active subscription but it lapsed / cancelled
-- Action: Win-back DM — understand why they left, offer to help
-- Cadence: Weekly
-- Priority: Medium (known buyers who stopped)

SELECT
  s.account_id,
  a.email,
  a.name AS account_name,
  s.status AS subscription_status,
  s.cancel_at_period_end,
  s.period_ends_at,
  s.created_at AS subscription_started,
  DATE_DIFF(CURRENT_DATE(), DATE(s.period_ends_at), DAY) AS days_since_expiry,
  dc.job_title,
  dc.company,
  icp.icp_grade,
  icp.icp_total_score
FROM `slideheroes-data-platform.staging.subscriptions` s
JOIN `slideheroes-data-platform.staging.accounts` a
  ON s.account_id = a.id AND a.is_personal_account = TRUE
LEFT JOIN `slideheroes-data-platform.core.dim_customers` dc
  ON a.email = dc.email
LEFT JOIN `slideheroes-data-platform.core.icp_scores` icp
  ON dc.company = icp.company_name
WHERE s.active = FALSE  -- no longer active
  AND s.period_ends_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 90 DAY)  -- churned in last 90 days
  AND s.account_id NOT IN (
    SELECT account_id FROM `slideheroes-data-platform.staging.subscriptions` WHERE active = TRUE
  )  -- no current active subscription
ORDER BY icp.icp_total_score DESC NULLS LAST, s.period_ends_at DESC
