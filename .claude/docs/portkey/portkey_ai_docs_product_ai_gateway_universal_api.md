[Portkey Docs home page![light logo](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/logo-white.png)![dark logo](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/logo-black.png)](https://portkey.ai/docs)

Search or ask...

Ctrl K

Search...

Navigation

AI Gateway

Universal API

[Documentation](https://portkey.ai/docs/introduction/what-is-portkey) [Integrations](https://portkey.ai/docs/integrations) [Inference API](https://portkey.ai/docs/api-reference/inference-api/introduction) [Admin API](https://portkey.ai/docs/api-reference/admin-api/control-plane/configs/create-config) [Cookbook](https://portkey.ai/docs/guides/getting-started) [Changelog](https://portkey.ai/docs/changelog/2025/jan)

This feature is available on all Portkey plans.

So, instead of maintaining separate integrations for different multimodal LLMs, you can interact with models from OpenAI, Anthropic, Meta, Cohere, Mistral, and many more (100+ models, 15+ providers) - all using a common, unified API signature.

## [​](https://portkey.ai/docs/product/ai-gateway/universal-api#portkey-follows-openai-spec) Portkey Follows OpenAI Spec

Portkey API is powered by its [battle-tested open-source AI Gateway](https://github.com/portkey-ai/gateway), which converts all incoming requests to the OpenAI signature and returns OpenAI-compliant responses.

## [​](https://portkey.ai/docs/product/ai-gateway/universal-api#switching-providers-is-a-breeze) Switching Providers is a Breeze

- Node
- Python

Copy

```JS
import Portkey from 'portkey-ai';

// Calling OpenAI
const portkey = new Portkey({
  provider: "openai",
  Authorization: "Bearer sk-xxxxx"
})

const response = await portkey.chat.completions.create({
  messages: [{ role: 'user', content: 'Hello' }],
  model: 'gpt-4',
});

// Swithing to Anthropic
const portkey = new Portkey({
  provider: "anthropic",
  Authorization: "Bearer sk-ant-xxxxx"
})

const response = await portkey.chat.completions.create({
  messages: [{ role: 'user', content: 'Hello' }],
  model: 'claude-3-opus-20240229',
});

```

## [​](https://portkey.ai/docs/product/ai-gateway/universal-api#integrating-local-or-private-models) Integrating Local or Private Models

Portkey can also route to and observe your locally or privately hosted LLMs, as long as the model is compliant with one of the 15+ providers supported by Portkey and the URL is exposed publicly.

Simply specify the `custom_host` parameter along with the `provider` name, and Portkey will handle the communication with your local model.

- NodeJS
- Python
- cURL

Copy

```js
import Portkey from 'portkey-ai';

const portkey = new Portkey({
  apiKey: 'PORTKEY_API_KEY',
  provider: 'mistral-ai',
  customHost: 'http://MODEL_URL/v1/', // Point Portkey to where the model is hosted
});

async function main() {
  const response = await portkey.chat.completions.create({
    messages: [{ role: 'user', content: '1729' }],
    model: 'mixtral-8x22b',
  });
  console.log(response);
}

main();
```

**Note:**

When using `custom_host`, include the version identifier (e.g., `/v1`) in the URL. Portkey will append the actual endpoint path ( `/chat/completions`, `/completions`, or `/embeddings`) automatically. (For Ollama models, this works differently. [Check here](https://portkey.ai/docs/integrations/llms/ollama))

## [​](https://portkey.ai/docs/product/ai-gateway/universal-api#powerful-routing-and-fallback-strategies) Powerful Routing and Fallback Strategies

With Portkey you can implement sophisticated routing and fallback strategies. Route requests to different providers based on various criteria, loadbalance them, set up retries or fallbacks to alternative models in case of failures or resource constraints.

Here’s an example config where we set up a fallback from OpenAI to a locally hosted Llama3 on Ollama:

Copy

```py
config = {
 "strategy": { "mode": "loadbalance" },
 "targets": [\
  {\
   "provider": "openai",\
   "api_key": "xxx",\
   "weight": 1,\
   "override_params": { "model": "gpt-3.5-turbo" }\
  },\
  {\
   "provider": "mistral-ai",\
   "custom_host": "http://MODEL_URL/v1/",\
   "weight": 1,\
   "override_params": { "model": "mixtral-8x22b" }\
  }\
 ]
}

from portkey_ai import Portkey

portkey = Portkey(
    api_key="PORTKEY_API_KEY",
    config=config
)

```

## [​](https://portkey.ai/docs/product/ai-gateway/universal-api#multimodality) Multimodality

Portkey integrates with multimodal models through the same unified API and supports vision, audio, image generation, and more capabilities across providers.

[Multimodal Capabilities](https://portkey.ai/docs/product/ai-gateway/multimodal-capabilities)

Was this page helpful?

YesNo

[Suggest edits](https://github.com/portkey-ai/docs-core/edit/main/product/ai-gateway/universal-api.mdx) [Raise issue](https://github.com/portkey-ai/docs-core/issues/new?title=Issue%20on%20docs&body=Path:%20/product/ai-gateway/universal-api)

[AI Gateway](https://portkey.ai/docs/product/ai-gateway) [Configs](https://portkey.ai/docs/product/ai-gateway/configs)

On this page

- [Portkey Follows OpenAI Spec](https://portkey.ai/docs/product/ai-gateway/universal-api#portkey-follows-openai-spec)
- [Switching Providers is a Breeze](https://portkey.ai/docs/product/ai-gateway/universal-api#switching-providers-is-a-breeze)
- [Integrating Local or Private Models](https://portkey.ai/docs/product/ai-gateway/universal-api#integrating-local-or-private-models)
- [Powerful Routing and Fallback Strategies](https://portkey.ai/docs/product/ai-gateway/universal-api#powerful-routing-and-fallback-strategies)
- [Multimodality](https://portkey.ai/docs/product/ai-gateway/universal-api#multimodality)
