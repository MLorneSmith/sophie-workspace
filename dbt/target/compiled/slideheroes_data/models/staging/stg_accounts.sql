

with source as (
  select *
  from `slideheroes-data-platform`.`staging`.`accounts`
)

select
  *,
  lower(email) as email_normalized
from source