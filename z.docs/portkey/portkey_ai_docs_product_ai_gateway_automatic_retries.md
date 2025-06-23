[Portkey Docs home page![light logo](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/logo-white.png)![dark logo](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/logo-black.png)](https://portkey.ai/docs)

Search or ask...

Ctrl K

Search...

Navigation

AI Gateway

Automatic Retries

[Documentation](https://portkey.ai/docs/introduction/what-is-portkey) [Integrations](https://portkey.ai/docs/integrations) [Inference API](https://portkey.ai/docs/api-reference/inference-api/introduction) [Admin API](https://portkey.ai/docs/api-reference/admin-api/control-plane/configs/create-config) [Cookbook](https://portkey.ai/docs/guides/getting-started) [Changelog](https://portkey.ai/docs/changelog/2025/jan)

This feature is available on all Portkey [plans](https://portkey.ai/pricing).

- Automatic retries are triggered **up to 5 times**
- Retries can also be triggered only on **specific error codes**
- And each subsequent retry attempt follows **exponential backoff strategy** to prevent network overload

## [​](https://portkey.ai/docs/product/ai-gateway/automatic-retries\#enabling-retries)  Enabling Retries

To enable retry, just add the `retry` param to your [config object](https://portkey.ai/docs/api-reference/config-object).

### [​](https://portkey.ai/docs/product/ai-gateway/automatic-retries\#retry-with-5-attempts)  Retry with 5 attempts

Copy

```JSON
{
    "retry": {
        "attempts": 5
    },
    "virtual_key": "virtual-key-xxx"
}

```

### [​](https://portkey.ai/docs/product/ai-gateway/automatic-retries\#retry-only-on-specific-error-codes)  Retry only on specific error codes

By default, Portkey triggers retries on the following error codes: **\[429, 500, 502, 503, 504\]**

You can change this behaviour by setting the optional `on_status_codes` param in your retry config and manually inputting the error codes on which rety will be triggered.

Copy

```JSON
{
  "retry": {
    "attempts": 3,
    "on_status_codes": [ 408, 429, 401 ]
  },
  "virtual_key": "virtual-key-xxx"
}

```

If the `on_status_codes` param is present, retries will be triggered **only** on the error codes specified in that Config and not on Portkey’s default error codes for retries (i.e. \[429, 500, 502, 503, 504\])

### [​](https://portkey.ai/docs/product/ai-gateway/automatic-retries\#exponential-backoff-strategy)  Exponential backoff strategy

Here’s how Portkey triggers retries following exponential backoff:

| Attempt | Time out between requests |
| --- | --- |
| Initial Call | Immediately |
| Retry 1st attempt | 1 second |
| Retry 2nd attempt | 2 seconds |
| Retry 3rd attempt | 4 seconds |
| Retry 4th attempt | 8 seconds |
| Retry 5th attempt | 16 seconds |

Was this page helpful?

YesNo

[Suggest edits](https://github.com/portkey-ai/docs-core/edit/main/product/ai-gateway/automatic-retries.mdx) [Raise issue](https://github.com/portkey-ai/docs-core/issues/new?title=Issue%20on%20docs&body=Path:%20/product/ai-gateway/automatic-retries)

[Fallbacks](https://portkey.ai/docs/product/ai-gateway/fallbacks) [Realtime API](https://portkey.ai/docs/product/ai-gateway/realtime-api)

On this page

- [Enabling Retries](https://portkey.ai/docs/product/ai-gateway/automatic-retries#enabling-retries)
- [Retry with 5 attempts](https://portkey.ai/docs/product/ai-gateway/automatic-retries#retry-with-5-attempts)
- [Retry only on specific error codes](https://portkey.ai/docs/product/ai-gateway/automatic-retries#retry-only-on-specific-error-codes)
- [Exponential backoff strategy](https://portkey.ai/docs/product/ai-gateway/automatic-retries#exponential-backoff-strategy)
