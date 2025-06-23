[Portkey Docs home page![light logo](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/logo-white.png)![dark logo](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/logo-black.png)](https://portkey.ai/docs)

Search or ask...

Ctrl K

Search...

Navigation

More

Groq

[Documentation](https://portkey.ai/docs/introduction/what-is-portkey) [Integrations](https://portkey.ai/docs/integrations) [Inference API](https://portkey.ai/docs/api-reference/inference-api/introduction) [Admin API](https://portkey.ai/docs/api-reference/admin-api/control-plane/configs/create-config) [Cookbook](https://portkey.ai/docs/guides/getting-started) [Changelog](https://portkey.ai/docs/changelog/2025/jan)

Portkey provides a robust and secure gateway to facilitate the integration of various Large Language Models (LLMs) into your applications, including [Groq APIs](https://console.groq.com/docs/quickstart).

With Portkey, you can take advantage of features like fast AI gateway access, observability, prompt management, and more, all while ensuring the secure management of your LLM API keys through a [virtual key](https://portkey.ai/docs/product/ai-gateway/virtual-keys) system.

Provider Slug. `groq`

## [​](https://portkey.ai/docs/integrations/llms/groq\#portkey-sdk-integration-with-groq-models)  Portkey SDK Integration with Groq Models

Portkey provides a consistent API to interact with models from various providers. To integrate Groq with Portkey:

### [​](https://portkey.ai/docs/integrations/llms/groq\#1-install-the-portkey-sdk)  1\. Install the Portkey SDK

Add the Portkey SDK to your application to interact with Groq AI’s API through Portkey’s gateway.

- NodeJS
- Python

Copy

```sh
npm install --save portkey-ai

```

### [​](https://portkey.ai/docs/integrations/llms/groq\#2-initialize-portkey-with-the-virtual-key)  2\. Initialize Portkey with the Virtual Key

To use Groq with Portkey, [get your API key from here](https://console.groq.com/keys), then add it to Portkey to create the virtual key.

- NodeJS SDK
- Python SDK

Copy

```js
import Portkey from 'portkey-ai'

const portkey = new Portkey({
    apiKey: "PORTKEY_API_KEY", // defaults to process.env["PORTKEY_API_KEY"]
    virtualKey: "VIRTUAL_KEY" // Your Groq Virtual Key
})

```

### [​](https://portkey.ai/docs/integrations/llms/groq\#3-invoke-chat-completions-with-groq)  **3\. Invoke Chat Completions with** Groq

Use the Portkey instance to send requests to Groq. You can also override the virtual key directly in the API call if needed.

- NodeJS SDK
- Python SDK

Copy

```js
const chatCompletion = await portkey.chat.completions.create({
    messages: [{ role: 'user', content: 'Say this is a test' }],
    model: 'mixtral-8x7b-32768',
});

console.log(chatCompletion.choices);

```

## [​](https://portkey.ai/docs/integrations/llms/groq\#managing-groq-prompts)  Managing Groq Prompts

You can manage all prompts to Groq in the [Prompt Library](https://portkey.ai/docs/product/prompt-library). All the current models of Groq are supported and you can easily start testing different prompts.

Once you’re ready with your prompt, you can use the `portkey.prompts.completions.create` interface to use the prompt in your application.

* * *

You’ll find more information in the relevant sections:

1. [Add metadata to your requests](https://portkey.ai/docs/product/observability/metadata)
2. [Add gateway configs to your Groq](https://portkey.ai/docs/product/ai-gateway/configs) [requests](https://portkey.ai/docs/product/ai-gateway/configs)
3. [Tracing Groq requests](https://portkey.ai/docs/product/observability/traces)
4. [Setup a fallback from OpenAI to Groq APIs](https://portkey.ai/docs/product/ai-gateway/fallbacks)

Was this page helpful?

YesNo

[Suggest edits](https://github.com/portkey-ai/docs-core/edit/main/integrations/llms/groq.mdx) [Raise issue](https://github.com/portkey-ai/docs-core/issues/new?title=Issue%20on%20docs&body=Path:%20/integrations/llms/groq)

[Github](https://portkey.ai/docs/integrations/llms/github) [Hugging Face](https://portkey.ai/docs/integrations/llms/huggingface)

On this page

- [Portkey SDK Integration with Groq Models](https://portkey.ai/docs/integrations/llms/groq#portkey-sdk-integration-with-groq-models)
- [1\. Install the Portkey SDK](https://portkey.ai/docs/integrations/llms/groq#1-install-the-portkey-sdk)
- [2\. Initialize Portkey with the Virtual Key](https://portkey.ai/docs/integrations/llms/groq#2-initialize-portkey-with-the-virtual-key)
- [3\. Invoke Chat Completions with Groq](https://portkey.ai/docs/integrations/llms/groq#3-invoke-chat-completions-with-groq)
- [Managing Groq Prompts](https://portkey.ai/docs/integrations/llms/groq#managing-groq-prompts)
