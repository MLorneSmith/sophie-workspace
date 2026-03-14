

  create or replace view `slideheroes-data-platform`.`core`.`stg_orders`
  OPTIONS()
  as 

with source as (
  select *
  from `slideheroes-data-platform`.`staging`.`orders`
)

select
  *,
  safe_cast(total_amount as numeric) as total_amount_numeric
from source;

