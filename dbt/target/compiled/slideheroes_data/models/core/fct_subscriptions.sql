with app_subscriptions as (
  select
    id as subscription_id,
    account_id,
    cast(billing_customer_id as string) as billing_customer_id,
    status as app_status,
    active as is_active,
    billing_provider,
    cancel_at_period_end,
    currency,
    period_starts_ts,
    period_ends_ts,
    trial_starts_ts,
    trial_ends_ts,
    created_at,
    updated_at
  from `slideheroes-data-platform`.`core`.`stg_subscriptions`
),

stripe_subscriptions as (
  select
    id as stripe_subscription_id,
    customer as stripe_customer_id,
    status as stripe_status,
    cancel_at_period_end as stripe_cancel_at_period_end,
    start_date_ts,
    trial_start_ts,
    trial_end_ts,
    canceled_at_ts,
    ended_at_ts,
    created_ts
  from `slideheroes-data-platform`.`core`.`stg_stripe_subscriptions`
)

select
  a.subscription_id,
  a.account_id,
  a.billing_customer_id,
  s.stripe_subscription_id,

  a.app_status,
  s.stripe_status,

  a.is_active,
  a.billing_provider,
  a.currency,

  a.period_starts_ts,
  a.period_ends_ts,
  a.trial_starts_ts,
  a.trial_ends_ts,

  s.start_date_ts,
  s.trial_start_ts,
  s.trial_end_ts,
  s.canceled_at_ts,
  s.ended_at_ts,
  s.created_ts as stripe_created_at,

  a.created_at,
  a.updated_at
from app_subscriptions a
left join stripe_subscriptions s
  on a.billing_customer_id = s.stripe_customer_id