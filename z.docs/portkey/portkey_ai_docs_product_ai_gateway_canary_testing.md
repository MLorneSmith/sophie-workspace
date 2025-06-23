[Portkey Docs home page![light logo](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/logo-white.png)![dark logo](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/logo-black.png)](https://portkey.ai/docs)

Search or ask...

Ctrl K

Search...

Navigation

AI Gateway

Canary Testing

[Documentation](https://portkey.ai/docs/introduction/what-is-portkey) [Integrations](https://portkey.ai/docs/integrations) [Inference API](https://portkey.ai/docs/api-reference/inference-api/introduction) [Admin API](https://portkey.ai/docs/api-reference/admin-api/control-plane/configs/create-config) [Cookbook](https://portkey.ai/docs/guides/getting-started) [Changelog](https://portkey.ai/docs/changelog/2025/jan)

This feature is available on all Portkey [plans](https://portkey.ai/pricing).

This uses the same techniques as [load balancing](https://portkey.ai/docs/product/ai-gateway/load-balancing) but to achieve a different outcome.

### [​](https://portkey.ai/docs/product/ai-gateway/canary-testing\#example-test-llama2-on-5-of-the-traffic)  Example: Test Llama2 on 5% of the traffic

Let’s take an example where we want to introduce llama2 in our systems (through Anyscale) but we’re not sure of the impact. We can create a config specifically for this use case to test llama2 in production.

The config object would look like this

Copy

```JSON
{
  "strategy": {
      "mode": "loadbalance"
  },
  "targets": [\
    {\
      "virtual_key": "openai-virtual-key",\
      "weight": 0.95\
    },\
    {\
      "virtual_key": "anyscale-virtual-key",\
      "weight": 0.05,\
      "override_params": {\
          "model": "meta-llama/Llama-2-70b-chat-hf"\
    }\
  ]
}

```

Here we are telling the gateway to send 5% of the traffic to anyscale’s hosted llama2-70b model. Portkey handles all the request transforms to make sure you don’t have to change your code.

You can now [use this config like this](https://portkey.ai/docs/product/ai-gateway/configs#using-configs) in your requests.

Once data starts flowing in, we can use Portkey’s [analytics dashboards](https://portkey.ai/docs/product/observability/analytics) to see the impact of the new model on cost, latency, errors and feedback.

Was this page helpful?

YesNo

[Suggest edits](https://github.com/portkey-ai/docs-core/edit/main/product/ai-gateway/canary-testing.mdx) [Raise issue](https://github.com/portkey-ai/docs-core/issues/new?title=Issue%20on%20docs&body=Path:%20/product/ai-gateway/canary-testing)

[Load Balancing](https://portkey.ai/docs/product/ai-gateway/load-balancing) [Strict OpenAI Compliance](https://portkey.ai/docs/product/ai-gateway/strict-open-ai-compliance)

On this page

- [Example: Test Llama2 on 5% of the traffic](https://portkey.ai/docs/product/ai-gateway/canary-testing#example-test-llama2-on-5-of-the-traffic)
