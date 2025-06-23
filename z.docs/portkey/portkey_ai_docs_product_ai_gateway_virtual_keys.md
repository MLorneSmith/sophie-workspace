[Portkey Docs home page![light logo](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/logo-white.png)![dark logo](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/logo-black.png)](https://portkey.ai/docs)

Search or ask...

Search...

Navigation

Virtual Keys

Virtual Keys

[Documentation](https://portkey.ai/docs/introduction/what-is-portkey) [Integrations](https://portkey.ai/docs/integrations) [Inference API](https://portkey.ai/docs/api-reference/inference-api/introduction) [Admin API](https://portkey.ai/docs/api-reference/admin-api/control-plane/configs/create-config) [Cookbook](https://portkey.ai/docs/guides/getting-started) [Changelog](https://portkey.ai/docs/changelog/2025/jan)

This feature is available on all Portkey [plans](https://portkey.ai/pricing).

This feature also provides the following benefits:

- Easier key rotation
- The ability to generate multiple virtual keys for a single API key
- Imposition of restrictions [based on cost](https://portkey.ai/docs/product/ai-gateway/virtual-keys/budget-limits), request volume, and user access

These can be managed within your account under the “Virtual Keys” tab.

## [​](https://portkey.ai/docs/product/ai-gateway/virtual-keys\#creating-virtual-keys)  Creating Virtual Keys

1. Navigate to the “Virtual Keys” page and click the “Add Key” button in the top right corner.
2. Select your AI provider, name your key uniquely, and note any usage specifics if needed.

**Tip:** You can register multiple keys for one provider or use different names for the same key for easy identification.

### [​](https://portkey.ai/docs/product/ai-gateway/virtual-keys\#azure-virtual-keys)  Azure Virtual Keys

Azure Virtual Keys allow you to manage multiple Azure deployments under a single virtual key. This feature simplifies API key management and enables flexible usage of different Azure OpenAI models.
You can create multiple deployments under the same resource group and manage them using a single virtual key.

Configure Multiple Azure Deployments

To use the required deployment, simply pass the `alias` of the deployment as the `model` in LLM request body. In case the models is left empty or the specified alias does not exist, the default deployment is used.

## [​](https://portkey.ai/docs/product/ai-gateway/virtual-keys\#how-are-the-provider-api-keys-stored)  How are the provider API keys stored?

Your API keys are encrypted and stored in secure vaults, accessible only at the moment of a request. Decryption is performed exclusively in isolated workers and only when necessary, ensuring the highest level of data security.

## [​](https://portkey.ai/docs/product/ai-gateway/virtual-keys\#how-are-the-provider-keys-linked-to-the-virtual-key)  How are the provider keys linked to the virtual key?

We randomly generate virtual keys and link them separately to the securely stored keys. This means, your raw API keys can not be reverse engineered from the virtual keys.

## [​](https://portkey.ai/docs/product/ai-gateway/virtual-keys\#using-virtual-keys)  Using Virtual Keys

### [​](https://portkey.ai/docs/product/ai-gateway/virtual-keys\#using-the-portkey-sdk)  Using the Portkey SDK

Add the virtual key directly to the initialization configuration for Portkey.

- NodeJS
- Python

```js
import Portkey from 'portkey-ai'

const portkey = new Portkey({
    apiKey: "PORTKEY_API_KEY", // defaults to process.env["PORTKEY_API_KEY"]
    virtualKey: "VIRTUAL_KEY" // Portkey supports a vault for your LLM Keys
})

```

Alternatively, you can override the virtual key during the completions call as follows:

- NodeJS SDK
- Python SDK

```js
const chatCompletion = await portkey.chat.completions.create({
    messages: [{ role: 'user', content: 'Say this is a test' }],
    model: 'gpt-3.5-turbo',
}, {virtualKey: "OVERRIDING_VIRTUAL_KEY"});

```

### [​](https://portkey.ai/docs/product/ai-gateway/virtual-keys\#using-the-openai-sdk)  Using the OpenAI SDK

Add the virtual key directly to the initialization configuration for the OpenAI client.

- NodeJS
- Python

```js
import OpenAI from "openai";
import { PORTKEY_GATEWAY_URL, createHeaders } from 'portkey-ai'

const openai = new OpenAI({
  apiKey: '', // can be left blank
  baseURL: PORTKEY_GATEWAY_URL,
  defaultHeaders: createHeaders({
    apiKey: "PORTKEY_API_KEY", // defaults to process.env["PORTKEY_API_KEY"]
    virtualKey: "VIRTUAL_KEY" // Portkey supports a vault for your LLM Keys
  })
});

```

Alternatively, you can override the virtual key during the completions call as follows:

- NodeJS SDK
- Python SDK

```js
const chatCompletion = await portkey.chat.completions.create({
    messages: [{ role: 'user', content: 'Say this is a test' }],
    model: 'gpt-3.5-turbo',
}, {virtualKey: "OVERRIDING_VIRTUAL_KEY"});

```

### [​](https://portkey.ai/docs/product/ai-gateway/virtual-keys\#using-alias-with-azure-virtual-keys)  Using alias with Azure virtual keys

```js
const chatCompletion = await portkey.chat.completions.create({
    messages: [{ role: 'user', content: 'Say this is a test' }],
    model: 'gpt-4o', // This will be the alias of the deployment
}, {virtualKey: "VIRTUAL_KEY"});

```

## [​](https://portkey.ai/docs/product/ai-gateway/virtual-keys\#setting-budget-limits)  Setting Budget Limits

Portkey provides a simple way to set budget limits for any of your virtual keys and helps you manage your spending on AI providers (and LLMs) - giving you confidence and control over your application’s costs.

[Budget Limits](https://portkey.ai/docs/product/ai-gateway/virtual-keys/budget-limits)

## [​](https://portkey.ai/docs/product/ai-gateway/virtual-keys\#prompt-templates)  Prompt Templates

Choose your Virtual Key within Portkey’s prompt templates, and it will be automatically retrieved and ready for use.

## [​](https://portkey.ai/docs/product/ai-gateway/virtual-keys\#langchain-llamaindex)  Langchain / LlamaIndex

Set the virtual key when utilizing Portkey’s custom LLM as shown below:

```py
# Example in Langchain
llm = PortkeyLLM(api_key="PORTKEY_API_KEY",virtual_key="VIRTUAL_KEY")

```

Was this page helpful?

YesNo

[Suggest edits](https://github.com/portkey-ai/docs-core/edit/main/product/ai-gateway/virtual-keys.mdx) [Raise issue](https://github.com/portkey-ai/docs-core/issues/new?title=Issue%20on%20docs&body=Path:%20/product/ai-gateway/virtual-keys)

[Strict OpenAI Compliance](https://portkey.ai/docs/product/ai-gateway/strict-open-ai-compliance) [Budget Limits](https://portkey.ai/docs/product/ai-gateway/virtual-keys/budget-limits)

On this page

- [Creating Virtual Keys:](https://portkey.ai/docs/product/ai-gateway/virtual-keys#creating-virtual-keys)
- [Azure Virtual Keys](https://portkey.ai/docs/product/ai-gateway/virtual-keys#azure-virtual-keys)
- [How are the provider API keys stored?](https://portkey.ai/docs/product/ai-gateway/virtual-keys#how-are-the-provider-api-keys-stored)
- [How are the provider keys linked to the virtual key?](https://portkey.ai/docs/product/ai-gateway/virtual-keys#how-are-the-provider-keys-linked-to-the-virtual-key)
- [Using Virtual Keys](https://portkey.ai/docs/product/ai-gateway/virtual-keys#using-virtual-keys)
- [Using the Portkey SDK](https://portkey.ai/docs/product/ai-gateway/virtual-keys#using-the-portkey-sdk)
- [Using the OpenAI SDK](https://portkey.ai/docs/product/ai-gateway/virtual-keys#using-the-openai-sdk)
- [Using alias with Azure virtual keys:](https://portkey.ai/docs/product/ai-gateway/virtual-keys#using-alias-with-azure-virtual-keys)
- [Setting Budget Limits](https://portkey.ai/docs/product/ai-gateway/virtual-keys#setting-budget-limits)
- [Prompt Templates](https://portkey.ai/docs/product/ai-gateway/virtual-keys#prompt-templates)
- [Langchain / LlamaIndex](https://portkey.ai/docs/product/ai-gateway/virtual-keys#langchain-llamaindex)
