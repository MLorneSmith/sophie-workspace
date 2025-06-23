[Portkey Docs home page![light logo](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/logo-white.png)![dark logo](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/logo-black.png)](https://portkey.ai/docs)

Search or ask...

Ctrl K

Search...

Navigation

AI Gateway

Load Balancing

[Documentation](https://portkey.ai/docs/introduction/what-is-portkey) [Integrations](https://portkey.ai/docs/integrations) [Inference API](https://portkey.ai/docs/api-reference/inference-api/introduction) [Admin API](https://portkey.ai/docs/api-reference/admin-api/control-plane/configs/create-config) [Cookbook](https://portkey.ai/docs/guides/getting-started) [Changelog](https://portkey.ai/docs/changelog/2025/jan)

This feature is available on all Portkey [plans](https://portkey.ai/pricing).

This ensures high availability and optimal performance of your generative AI apps, preventing any single LLM from becoming a performance bottleneck.

## [​](https://portkey.ai/docs/product/ai-gateway/load-balancing\#enable-load-balancing)  Enable Load Balancing

To enable Load Balancing, you can modify the `config` object to include a `strategy` with `loadbalance` mode.

Here’s a quick example to **load balance 75-25** between an OpenAI and an Azure OpenAI account

Copy

```JSON
{
  "strategy": {
      "mode": "loadbalance"
  },
  "targets": [\
    {\
      "virtual_key": "openai-virtual-key",\
      "weight": 0.75\
    },\
    {\
      "virtual_key": "azure-virtual-key",\
      "weight": 0.25\
    }\
  ]
}

```

### [​](https://portkey.ai/docs/product/ai-gateway/load-balancing\#you-can-create-and-then-use-the-config-in-your-requests)  You can [create](https://portkey.ai/docs/product/ai-gateway/configs\#creating-configs) and then [use](https://portkey.ai/docs/product/ai-gateway/configs\#using-configs) the config in your requests

## [​](https://portkey.ai/docs/product/ai-gateway/load-balancing\#how-load-balancing-works)  How Load Balancing Works

1. **Defining the Loadbalance Targets & their Weights**: You provide a list of `virtual keys` (or `provider` \+ `api_key` pairs), and assign a `weight` value to each target. The weights represent the relative share of requests that should be routed to each target.
2. **Weight Normalization**: Portkey first sums up all the weights you provided for the targets. It then divides each target’s weight by the total sum to calculate the normalized weight for that target. This ensures the weights add up to 1 (or 100%), allowing Portkey to distribute the load proportionally.
For example, let’s say you have three targets with weights 5, 3, and 1. The total sum of weights is 9 (5 + 3 + 1). Portkey will then normalize the weights as follows:

   - Target 1: 5 / 9 = 0.55 (55% of the traffic)
   - Target 2: 3 / 9 = 0.33 (33% of the traffic)
   - Target 3: 1 / 9 = 0.11 (11% of the traffic)
3. **Request Distribution**: When a request comes in, Portkey routes it to a target LLM based on the normalized weight probabilities. This ensures the traffic is distributed across the LLMs according to the specified weights.

- Default `weight` value is `1`
- Minimum `weight` value is `0`
- If `weight` is not set for a target, the default `weight` value (i.e. `1`) is applied.
- You can set `"weight":0` for a specific target to stop routing traffic to it without removing it from your Config

## [​](https://portkey.ai/docs/product/ai-gateway/load-balancing\#caveats-and-considerations)  Caveats and Considerations

While the Load Balancing feature offers numerous benefits, there are a few things to consider:

1. Ensure the LLMs in your list are compatible with your use case. Not all LLMs offer the same capabilities or respond in the same format.
2. Be aware of your usage with each LLM. Depending on your weight distribution, your usage with each LLM could vary significantly.
3. Keep in mind that each LLM has its own latency and pricing. Diversifying your traffic could have implications on the cost and response time.

Was this page helpful?

YesNo

[Suggest edits](https://github.com/portkey-ai/docs-core/edit/main/product/ai-gateway/load-balancing.mdx) [Raise issue](https://github.com/portkey-ai/docs-core/issues/new?title=Issue%20on%20docs&body=Path:%20/product/ai-gateway/load-balancing)

[Realtime API](https://portkey.ai/docs/product/ai-gateway/realtime-api) [Canary Testing](https://portkey.ai/docs/product/ai-gateway/canary-testing)

On this page

- [Enable Load Balancing](https://portkey.ai/docs/product/ai-gateway/load-balancing#enable-load-balancing)
- [You can create and then use the config in your requests.](https://portkey.ai/docs/product/ai-gateway/load-balancing#you-can-create-and-then-use-the-config-in-your-requests)
- [How Load Balancing Works](https://portkey.ai/docs/product/ai-gateway/load-balancing#how-load-balancing-works)
- [Caveats and Considerations](https://portkey.ai/docs/product/ai-gateway/load-balancing#caveats-and-considerations)
