[Portkey Docs home page![light logo](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/logo-white.png)![dark logo](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/logo-black.png)](https://portkey.ai/docs)

Search or ask...

Ctrl K

Search...

Navigation

More

OpenRouter

[Documentation](https://portkey.ai/docs/introduction/what-is-portkey) [Integrations](https://portkey.ai/docs/integrations) [Inference API](https://portkey.ai/docs/api-reference/inference-api/introduction) [Admin API](https://portkey.ai/docs/api-reference/admin-api/control-plane/configs/create-config) [Cookbook](https://portkey.ai/docs/guides/getting-started) [Changelog](https://portkey.ai/docs/changelog/2025/jan)

Portkey provides a robust and secure gateway to facilitate the integration of various Large Language Models (LLMs) into your applications, including [OpenRouter](https://openrouter.ai/).

With Portkey, you can take advantage of features like fast AI gateway access, observability, prompt management, and more, all while ensuring the secure management of your LLM API keys through a [virtual key](https://portkey.ai/docs/product/ai-gateway/virtual-keys) system.

Provider Slug. `openrouter`

## [​](https://portkey.ai/docs/integrations/llms/openrouter\#portkey-sdk-integration-with-openrouter-models)  Portkey SDK Integration with OpenRouter Models

Portkey provides a consistent API to interact with models from various providers. To integrate OpenRouter with Portkey:

### [​](https://portkey.ai/docs/integrations/llms/openrouter\#1-install-the-portkey-sdk)  1\. Install the Portkey SDK

Add the Portkey SDK to your application to interact with OpenRouter AI’s API through Portkey’s gateway.

- NodeJS
- Python

Copy

```sh
npm install --save portkey-ai

```

### [​](https://portkey.ai/docs/integrations/llms/openrouter\#2-initialize-portkey-with-the-virtual-key)  2\. Initialize Portkey with the Virtual Key

To use OpenRouter with Portkey, [get your API key from here](https://openrouter.ai/settings/keys), then add it to Portkey to create the virtual key.

- NodeJS SDK
- Python SDK

Copy

```js
import Portkey from 'portkey-ai'

const portkey = new Portkey({
    apiKey: "PORTKEY_API_KEY", // defaults to process.env["PORTKEY_API_KEY"]
    virtualKey: "VIRTUAL_KEY" // Your OpenRouter Virtual Key
})

```

### [​](https://portkey.ai/docs/integrations/llms/openrouter\#3-invoke-chat-completions-with-openrouter)  **3\. Invoke Chat Completions with** OpenRouter

Use the Portkey instance to send requests to OpenRouter. You can also override the virtual key directly in the API call if needed.

- NodeJS SDK
- Python SDK

Copy

```js
const chatCompletion = await portkey.chat.completions.create({
    messages: [{ role: 'user', content: 'Say this is a test' }],
    model: 'openai/gpt-4o-2024-08-06',
});

console.log(chatCompletion.choices);

```

The complete list of features supported in the SDK are available on the link below.

[**SDK**](https://portkey.ai/docs/api-reference/portkey-sdk-client)

Was this page helpful?

YesNo

[Suggest edits](https://github.com/portkey-ai/docs-core/edit/main/integrations/llms/openrouter.mdx) [Raise issue](https://github.com/portkey-ai/docs-core/issues/new?title=Issue%20on%20docs&body=Path:%20/integrations/llms/openrouter)

[Novita AI](https://portkey.ai/docs/integrations/llms/novita-ai) [Perplexity AI](https://portkey.ai/docs/integrations/llms/perplexity-ai)

On this page

- [Portkey SDK Integration with OpenRouter Models](https://portkey.ai/docs/integrations/llms/openrouter#portkey-sdk-integration-with-openrouter-models)
- [1\. Install the Portkey SDK](https://portkey.ai/docs/integrations/llms/openrouter#1-install-the-portkey-sdk)
- [2\. Initialize Portkey with the Virtual Key](https://portkey.ai/docs/integrations/llms/openrouter#2-initialize-portkey-with-the-virtual-key)
- [3\. Invoke Chat Completions with OpenRouter](https://portkey.ai/docs/integrations/llms/openrouter#3-invoke-chat-completions-with-openrouter)