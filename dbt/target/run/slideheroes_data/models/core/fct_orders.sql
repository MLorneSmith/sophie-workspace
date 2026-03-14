
  
    

    create or replace table `slideheroes-data-platform`.`core`.`fct_orders`
      
    
    

    
    OPTIONS()
    as (
      select
  id as order_id,
  account_id,
  billing_customer_id,
  status,
  billing_provider,
  total_amount_numeric as total_amount,
  currency,
  created_at,
  updated_at
from `slideheroes-data-platform`.`core`.`stg_orders`
    );
  