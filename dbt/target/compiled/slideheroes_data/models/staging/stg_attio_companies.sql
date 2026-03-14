

with source as (
  select *
  from `slideheroes-data-platform`.`staging`.`attio_companies`
)

select
  id as company_id,
  name as company_name,
  web_url,
  domains,
  primary_location,
  safe_cast(created_at as timestamp) as created_at,
  safe_cast(last_interaction as timestamp) as last_interaction_at,
  * except(id, name, web_url, domains, primary_location, created_at, last_interaction)
from source