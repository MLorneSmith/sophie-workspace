-- Signal: High ICP score but no product engagement
-- Action: Warm outreach — they fit our ICP perfectly but haven't activated
-- Cadence: Weekly
-- Priority: High (best-fit companies that haven't converted)

SELECT
  mvl.company_name,
  mvl.domain,
  mvl.industry,
  mvl.employee_count,
  mvl.annual_revenue,
  mvl.revenue_printed,
  mvl.primary_location,
  mvl.icp_total_score,
  mvl.icp_grade,
  mvl.icp_segment,
  mvl.mvl_tier,
  mvl.contact_count,
  mvl.linkedin_url,
  mvl.website_url,
  mvl.has_product_engagement,
  mvl.has_active_subscription,
  mvl.already_in_attio
FROM `slideheroes-data-platform.core.mvl_qualified_leads` mvl
WHERE mvl.has_product_engagement = FALSE
  AND mvl.has_active_subscription = FALSE
  AND mvl.icp_grade IN ('A', 'B')  -- only top ICP grades
ORDER BY mvl.icp_total_score DESC
LIMIT 50
