[Portkey Docs home page![light logo](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/logo-white.png)![dark logo](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/logo-black.png)](https://portkey.ai/docs)

Search or ask...

Ctrl K

Search...

Navigation

Virtual Keys

Budget Limits

[Documentation](https://portkey.ai/docs/introduction/what-is-portkey) [Integrations](https://portkey.ai/docs/integrations) [Inference API](https://portkey.ai/docs/api-reference/inference-api/introduction) [Admin API](https://portkey.ai/docs/api-reference/admin-api/control-plane/configs/create-config) [Cookbook](https://portkey.ai/docs/guides/getting-started) [Changelog](https://portkey.ai/docs/changelog/2025/jan)

Available on **Enterprise** plan and select **Pro** customers.

**Budget Limits on Virtual Keys** provide a simple way to manage your spending on AI providers (and LLMs) - giving you confidence and control over your application’s costs.

Budget Limit is currently only available to **Portkey** [**Enterprise Plan**](https://portkey.ai/docs/product/enterprise-offering) customers. Email us at `support@portkey.ai` if you would like to enable it for your org.

## [​](https://portkey.ai/docs/product/ai-gateway/virtual-keys/budget-limits#setting-budget-limits-on-virtual-keys) Setting Budget Limits on Virtual Keys

When creating a new virtual key on Portkey, you can set a one-time or monthly budget limit in USD. Once the limit is reached, the key automatically expires, preventing further usage and overspending.

![](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/images/product/budget-limit.png)

> #### Key Considerations
>
> - There is **No time period** for budget limits; they apply until the budget is exhausted
> - Budget limits are set in **USD** and can include decimal values
> - The budget limit **applies only** to requests made after the limit is set; it **does not retroactively** apply to previous requests
> - Once set, budget limits **cannot be edited** by any organization member
> - The minimum budget limit you can set is **$1**
> - Budget limits work for **all providers** available on Portkey and apply to **all organization members** who use the virtual key

## [​](https://portkey.ai/docs/product/ai-gateway/virtual-keys/budget-limits#editing-budget-limits) Editing Budget Limits

If you need to change or update a budget limit, you can **duplicate** the existing virtual key and create a new one with the desired limit.

## [​](https://portkey.ai/docs/product/ai-gateway/virtual-keys/budget-limits#resetting-budget-limits) Resetting Budget Limits

You can also periodically reset a budget limit by ticking the `Periodic Reset` option in the UI.

![](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/images/product/reset-budget-limit.png)

### [​](https://portkey.ai/docs/product/ai-gateway/virtual-keys/budget-limits#reset-period) Reset Period

- Currently, budget limits are automatically reset **every month**.
- The reset automatically happens on the **1st** calendar day of the month, at **12 AM UTC**, irrespective of when the budget limit was set prior.

## [​](https://portkey.ai/docs/product/ai-gateway/virtual-keys/budget-limits#monitoring-your-spending) Monitoring Your Spending

You can track your spending for any specific virtual key by navigating to the Analytics tab and filtering by the **desired key** and **timeframe**.

## [​](https://portkey.ai/docs/product/ai-gateway/virtual-keys/budget-limits#pricing-support-and-limitations) Pricing Support and Limitations

Budget limits currently apply to all providers and models for which Portkey has pricing support. If a specific request log shows `0 cents` in the COST column, it means that Portkey does not currently track pricing for that model, and it will not count towards the virtual key’s budget limit.

It’s important to note that budget limits cannot be applied retrospectively. The spend counter starts from zero only after you’ve set a budget limit for a key.

## [​](https://portkey.ai/docs/product/ai-gateway/virtual-keys/budget-limits#availability) Availability

Budget Limits is currently available **exclusively to Portkey Enterprise** customers. If you’re interested in enabling this feature for your account, please reach out us at [support@portkey.ai](mailto:support@portkey.ai) or join the [Portkey Discord](https://portkey.ai/community) community.

## [​](https://portkey.ai/docs/product/ai-gateway/virtual-keys/budget-limits#enterprise-plan) Enterprise Plan

To discuss Portkey Enterprise plan details and pricing, [you can schedule a quick call here](https://portkey.sh/demo-16).

Was this page helpful?

YesNo

[Suggest edits](https://github.com/portkey-ai/docs-core/edit/main/product/ai-gateway/virtual-keys/budget-limits.mdx) [Raise issue](https://github.com/portkey-ai/docs-core/issues/new?title=Issue%20on%20docs&body=Path:%20/product/ai-gateway/virtual-keys/budget-limits)

[Virtual Keys](https://portkey.ai/docs/product/ai-gateway/virtual-keys) [Connect Bedrock with Amazon Assumed Role](https://portkey.ai/docs/product/ai-gateway/virtual-keys/bedrock-amazon-assumed-role)

On this page

- [Setting Budget Limits on Virtual Keys](https://portkey.ai/docs/product/ai-gateway/virtual-keys/budget-limits#setting-budget-limits-on-virtual-keys)
- [Editing Budget Limits](https://portkey.ai/docs/product/ai-gateway/virtual-keys/budget-limits#editing-budget-limits)
- [Resetting Budget Limits](https://portkey.ai/docs/product/ai-gateway/virtual-keys/budget-limits#resetting-budget-limits)
- [Reset Period](https://portkey.ai/docs/product/ai-gateway/virtual-keys/budget-limits#reset-period)
- [Monitoring Your Spending](https://portkey.ai/docs/product/ai-gateway/virtual-keys/budget-limits#monitoring-your-spending)
- [Pricing Support and Limitations](https://portkey.ai/docs/product/ai-gateway/virtual-keys/budget-limits#pricing-support-and-limitations)
- [Availability](https://portkey.ai/docs/product/ai-gateway/virtual-keys/budget-limits#availability)
- [Enterprise Plan](https://portkey.ai/docs/product/ai-gateway/virtual-keys/budget-limits#enterprise-plan)

![](https://portkey.ai/docs/product/ai-gateway/virtual-keys/budget-limits)

![](https://portkey.ai/docs/product/ai-gateway/virtual-keys/budget-limits)
