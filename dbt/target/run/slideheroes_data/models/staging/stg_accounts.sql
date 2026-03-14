

  create or replace view `slideheroes-data-platform`.`core`.`stg_accounts`
  OPTIONS()
  as 

with source as (
  select *
  from `slideheroes-data-platform`.`staging`.`accounts`
)

select
  *,
  lower(email) as email_normalized
from source;

