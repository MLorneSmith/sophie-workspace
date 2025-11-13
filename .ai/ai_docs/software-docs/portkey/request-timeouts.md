[Portkey Docs home page![light logo](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/logo-white.png)![dark logo](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/logo-black.png)](https://portkey.ai/docs)

Search or ask...

Ctrl K

Search...

Navigation

AI Gateway

Request Timeouts

[Documentation](https://portkey.ai/docs/introduction/what-is-portkey) [Integrations](https://portkey.ai/docs/integrations) [Inference API](https://portkey.ai/docs/api-reference/inference-api/introduction) [Admin API](https://portkey.ai/docs/api-reference/admin-api/control-plane/configs/create-config) [Cookbook](https://portkey.ai/docs/guides/getting-started) [Changelog](https://portkey.ai/docs/changelog/2025/jan)

This feature is available on all Portkey [plans](https://portkey.ai/pricing).

This feature allows automatic termination of requests that exceed a specified duration, letting you gracefully handle errors or make another, faster request.

## [​](https://portkey.ai/docs/product/ai-gateway/request-timeouts\#enabling-request-timeouts)  Enabling Request Timeouts

You can enable request timeouts while **making your request** or you can **set them in Configs**.

Request timeouts are specified in **milliseconds** ( `integer)`

### [​](https://portkey.ai/docs/product/ai-gateway/request-timeouts\#while-making-request)  While Making Request

Set request timeout while instantiating your Portkey client or if you’re using the REST API, send the `x-portkey-request-timeout` header.

- NodeJS
- Python
- cURL

Copy

```js
import Portkey from 'portkey-ai';

// Construct a client with a virtual key
const portkey = new Portkey({
    apiKey: "PORTKEY_API_KEY",
    virtualKey: "VIRTUAL_KEY",
    requestTimeout: 3000
})

const chatCompletion = await portkey.chat.completions.create({
    messages: [{ role: 'user', content: 'Say this is a test' }],
    model: 'gpt-4o-mini',
});

console.log(chatCompletion.choices);

```

### [​](https://portkey.ai/docs/product/ai-gateway/request-timeouts\#with-configs)  With Configs

In Configs, request timeouts are set at either (1) strategy level, or (2) target level.

For a 10-second timeout, it will be:

Copy

```json
"request_timeout": 10000

```

### [​](https://portkey.ai/docs/product/ai-gateway/request-timeouts\#setting-request-timeout-at-strategy-level)  Setting Request Timeout at Strategy Level

Copy

```JSON
{
  "strategy": { "mode": "fallback" },
  "request_timeout": 10000,
  "targets": [\
    { "virtual_key": "open-ai-xxx" },\
    { "virtual_key": "azure-open-ai-xxx" }\
  ]
}

```

Here, the request timeout of 10 seconds will be applied to \* **all**\\* the targets in this Config.

### [​](https://portkey.ai/docs/product/ai-gateway/request-timeouts\#setting-request-timeout-at-target-level)  Setting Request Timeout at Target Level

Copy

```JSON
{
  "strategy": { "mode": "fallback" },
  "targets": [\
    { "virtual_key": "open-ai-xxx", "request_timeout": 10000, },\
    { "virtual_key": "azure-open-ai-xxx", "request_timeout": 2000,}\
  ]
}

```

Here, for the first target, a request timeout of 10s will be set, while for the second target, a request timeout of 2s will be set.

Nested target objects inherit the top-level timeout, with the option to override it at any level for customized control.

### [​](https://portkey.ai/docs/product/ai-gateway/request-timeouts\#how-timeouts-work-in-nested-configs)  How timeouts work in nested Configs

Copy

```JSON
{
  "strategy": { "mode": "loadbalance" },
  "request_timeout": 2000,
  "targets": [\
    {\
      "strategy": { "mode":"fallback" },\
      "request_timeout": 5000,\
      "targets": [\
        {\
          "virtual_key":"open-ai-1-1"\
        },\
        {\
          "virtual_key": "open-ai-1-2",\
          "request_timeout": 10000\
        }\
      ],\
      "weight": 1\
    },\
    {\
      "virtual_key": "azure-open-ai-1",\
      "weight": 1\
    }\
  ]
}

```

1. We’ve set a global timeout of **2s** at line #3
2. The first target has a nested fallback strategy, with a top level request timeout of **5s** at line #7
3. The first virtual key (at line #10), the **target-level** timeout of **5s** will be applied
4. For the second virtual key (i.e. `open-ai-1-2`), there is a timeout override, set at **10s**, which will be applied only to this target
5. For the last target (i.e. virtual key `azure-open-ai-1`), the top strategy-level timeout of **2s** will be applied

## [​](https://portkey.ai/docs/product/ai-gateway/request-timeouts\#handling-request-timeouts)  Handling Request Timeouts

Portkey issues a standard **408 error** for timed-out requests. You can leverage this by setting up fallback or retry strategies through the `on_status_codes` parameter, ensuring robust handling of these scenarios.

### [​](https://portkey.ai/docs/product/ai-gateway/request-timeouts\#triggering-fallbacks-with-request-timeouts)  Triggering Fallbacks with Request Timeouts

Copy

```JSON
{
  "strategy": {
    "mode": "fallback",
    "on_status_codes": [408]
  },
  "targets": [\
    { "virtual_key": "open-ai-xxx", "request_timeout": 2000, },\
    { "virtual_key": "azure-open-ai-xxx"}\
  ]
}

```

Here, fallback from OpenAI to Azure OpenAI will only be triggered if the first request times out after 2 seconds, otherwise the request will fail with a 408 error code.

### [​](https://portkey.ai/docs/product/ai-gateway/request-timeouts\#triggering-retries-with-request-timeouts)  Triggering Retries with Request Timeouts

Copy

```JSON
{
    "request_timeout": 1000,
    "retry": { "attempts": 3, "on_status_codes": [ 408 ] },
    "virtual_key": "open-ai-xxx"
}

```

Here, retry is triggered upto 3 times whenever the request takes more than 1s to return a response. After 3 unsuccessful retries, it will fail with a 408 code.

[Here’s a general guide on how to use Configs in your requests.](https://portkey.ai/docs/product/ai-gateway/configs)

### [​](https://portkey.ai/docs/product/ai-gateway/request-timeouts\#caveats-and-considerations)  Caveats and Considerations

While the request timeout is a powerful feature to help you gracefully handle unruly models & their latencies, there are a few things to consider:

1. Ensure that you are setting reasonable timeouts - for example, models like `gpt-4` often have sub-10-second response times
2. Ensure that you gracefully handle 408 errors for whenever a request does get timed out - you can inform the user to rerun their query and setup some neat interactions on your app
3. For streaming requests, the timeout will not be triggered if it gets **atleast a chunk** before the specified duration.

Was this page helpful?

YesNo

[Suggest edits](https://github.com/portkey-ai/docs-core/edit/main/product/ai-gateway/request-timeouts.mdx) [Raise issue](https://github.com/portkey-ai/docs-core/issues/new?title=Issue%20on%20docs&body=Path:%20/product/ai-gateway/request-timeouts)

[Connect Bedrock with Amazon Assumed Role](https://portkey.ai/docs/product/ai-gateway/virtual-keys/bedrock-amazon-assumed-role) [Files](https://portkey.ai/docs/product/ai-gateway/files)

On this page

- [Enabling Request Timeouts](https://portkey.ai/docs/product/ai-gateway/request-timeouts#enabling-request-timeouts)
- [While Making Request](https://portkey.ai/docs/product/ai-gateway/request-timeouts#while-making-request)
- [With Configs](https://portkey.ai/docs/product/ai-gateway/request-timeouts#with-configs)
- [Setting Request Timeout at Strategy Level](https://portkey.ai/docs/product/ai-gateway/request-timeouts#setting-request-timeout-at-strategy-level)
- [Setting Request Timeout at Target Level](https://portkey.ai/docs/product/ai-gateway/request-timeouts#setting-request-timeout-at-target-level)
- [How timeouts work in nested Configs](https://portkey.ai/docs/product/ai-gateway/request-timeouts#how-timeouts-work-in-nested-configs)
- [Handling Request Timeouts](https://portkey.ai/docs/product/ai-gateway/request-timeouts#handling-request-timeouts)
- [Triggering Fallbacks with Request Timeouts](https://portkey.ai/docs/product/ai-gateway/request-timeouts#triggering-fallbacks-with-request-timeouts)
- [Triggering Retries with Request Timeouts](https://portkey.ai/docs/product/ai-gateway/request-timeouts#triggering-retries-with-request-timeouts)
- [Caveats and Considerations](https://portkey.ai/docs/product/ai-gateway/request-timeouts#caveats-and-considerations)
