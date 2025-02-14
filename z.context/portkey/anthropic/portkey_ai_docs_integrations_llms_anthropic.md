[Portkey Docs home page![light logo](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/logo-white.png)![dark logo](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/logo-black.png)](https://portkey.ai/docs)

Search or ask...

Ctrl K

Search...

Navigation

Anthropic

Anthropic

[Documentation](https://portkey.ai/docs/introduction/what-is-portkey) [Integrations](https://portkey.ai/docs/integrations) [Inference API](https://portkey.ai/docs/api-reference/inference-api/introduction) [Admin API](https://portkey.ai/docs/api-reference/admin-api/control-plane/configs/create-config) [Cookbook](https://portkey.ai/docs/guides/getting-started) [Changelog](https://portkey.ai/docs/changelog/2025/jan)

Portkey provides a robust and secure gateway to facilitate the integration of various Large Language Models (LLMs) into your applications, including [Anthropic’s Claude APIs](https://docs.anthropic.com/claude/reference/getting-started-with-the-api).

With Portkey, you can take advantage of features like fast AI gateway access, observability, prompt management, and more, all while ensuring the secure management of your LLM API keys through a [virtual key](https://portkey.ai/docs/product/ai-gateway/virtual-keys) system.

Provider Slug. `anthropic`

## [​](https://portkey.ai/docs/integrations/llms/anthropic\#portkey-sdk-integration-with-anthropic)  Portkey SDK Integration with Anthropic

Portkey provides a consistent API to interact with models from various providers. To integrate Anthropic with Portkey:

### [​](https://portkey.ai/docs/integrations/llms/anthropic\#1-install-the-portkey-sdk)  1\. Install the Portkey SDK

Add the Portkey SDK to your application to interact with Anthropic’s API through Portkey’s gateway.

- NodeJS
- Python

Copy

```sh
npm install --save portkey-ai

```

### [​](https://portkey.ai/docs/integrations/llms/anthropic\#2-initialize-portkey-with-the-virtual-key)  2\. Initialize Portkey with the Virtual Key

To use Anthropic with Portkey, [get your Anthropic API key from here](https://console.anthropic.com/settings/keys), then add it to Portkey to create your Anthropic virtual key.

- NodeJS SDK
- Python SDK
- OpenAI Python SDK
- OpenAI Node SDK

Copy

```js
import Portkey from 'portkey-ai'

const portkey = new Portkey({
    apiKey: "PORTKEY_API_KEY", // defaults to process.env["PORTKEY_API_KEY"]
    virtualKey: "VIRTUAL_KEY" // Your Anthropic Virtual Key
})

```

### [​](https://portkey.ai/docs/integrations/llms/anthropic\#3-invoke-chat-completions-with-anthropic)  3\. Invoke Chat Completions with Anthropic

Use the Portkey instance to send requests to Anthropic. You can also override the virtual key directly in the API call if needed.

- NodeJS SDK
- Python SDK
- OpenAI Python SDK
- OpenAI Node SDK

Copy

```js
const chatCompletion = await portkey.chat.completions.create({
    messages: [{ role: 'user', content: 'Say this is a test' }],
    model: 'claude-3-opus-20240229',
    max_tokens: 250 // Required field for Anthropic
});

console.log(chatCompletion.choices[0].message.content);

```

## [​](https://portkey.ai/docs/integrations/llms/anthropic\#how-to-use-anthropic-system-prompt)  How to Use Anthropic System Prompt

With Portkey, we make Anthropic models interoperable with the OpenAI schema and SDK methods. So, instead of passing the `system` prompt separately, you can pass it as part of the `messages` body, similar to OpenAI:

- NodeJS
- Python

Copy

```js
const chatCompletion = await portkey.chat.completions.create({
    messages: [\
        { role: 'system', content: 'Your system prompt' },\
        { role: 'user', content: 'Say this is a test' }\
    ],
    model: 'claude-3-opus-20240229',
    max_tokens: 250
});

console.log(chatCompletion.choices);

```

## [​](https://portkey.ai/docs/integrations/llms/anthropic\#vision-chat-completion-usage)  Vision Chat Completion Usage

Portkey’s multimodal Gateway fully supports Anthropic’s vision models `claude-3-sonnet`, `claude-3-haiku`, `claude-3-opus`, and the latest `claude-3.5-sonnet`.
Portkey follows the OpenAI schema, which means you can send your image data to Anthropic in the same format as OpenAI.

- Anthropic ONLY accepts `base64` -encoded images. Unlike OpenAI, it **does not** support `image URLs`.
- With Portkey, you can use the same format to send base64-encoded images to both Anthropic and OpenAI models.

Here’s an example using Anthropic `claude-3.5-sonnet` model

- Python
- NodeJS
- OpenAI NodeJS
- OpenAI Python
- cURL

Copy

```python
import base64
import httpx
from portkey_ai import Portkey

# Fetch and encode the image
image_url = "https://upload.wikimedia.org/wikipedia/commons/a/a7/Camponotus_flavomarginatus_ant.jpg"
image_data = base64.b64encode(httpx.get(image_url).content).decode("utf-8")

# Initialize the Portkey client
portkey = Portkey(
    api_key="PORTKEY_API_KEY",  # Replace with your Portkey API key
    virtual_key="VIRTUAL_KEY"   # Add your provider's virtual key
)

# Create the request
response = portkey.chat.completions.create(
    model="claude-3-5-sonnet-20240620",
    messages=[\
        {\
            "role": "system",\
            "content": "You are a helpful assistant, who describes imagse"\
        },\
        {\
            "role": "user",\
            "content": [\
                {\
                    "type": "image_url",\
                    "image_url": {\
                        "url": f"data:image/jpeg;base64,{image_data}"\
                    }\
                }\
            ]\
        }\
    ],
    max_tokens=1400,
)
print(response)

```

To prompt with pdfs, simply update the “url” field inside the “image\_url” object to this pattern: `data:application/pdf;base64,BASE64_PDF_DATA`

#### [​](https://portkey.ai/docs/integrations/llms/anthropic\#api-reference)  [API Reference](https://portkey.ai/docs/integrations/llms/anthropic\#vision-chat-completion-usage)

On completion, the request will get logged in Portkey where any image inputs or outputs can be viewed. Portkey will automatically render the base64 images to help you debug any issues quickly.

**For more info, check out this guide:**

[**Vision** \\
\\
Learn more about Vision capabilities](https://portkey.ai/docs/product/ai-gateway/multimodal-capabilities/vision)

## [​](https://portkey.ai/docs/integrations/llms/anthropic\#prompt-caching)  Prompt Caching

Portkey also works with Anthropic’s new prompt caching feature and helps you save time & money for all your Anthropic requests. Refer to this guide to learn how to enable it:

[**Prompt Caching**](https://portkey.ai/docs/integrations/llms/anthropic/prompt-caching)

## [​](https://portkey.ai/docs/integrations/llms/anthropic\#managing-anthropic-prompts)  Managing Anthropic Prompts

You can manage all prompts to Anthropic in the [Prompt Library](https://portkey.ai/docs/product/prompt-library). All the current models of Anthropic are supported and you can easily start testing different prompts.

Once you’re ready with your prompt, you can use the `portkey.prompts.completions.create` interface to use the prompt in your application.

## [​](https://portkey.ai/docs/integrations/llms/anthropic\#next-steps)  Next Steps

The complete list of features supported in the SDK are available on the link below.

[**SDK**](https://portkey.ai/docs/api-reference/portkey-sdk-client)

You’ll find more information in the relevant sections:

1. [Add metadata to your requests](https://portkey.ai/docs/product/observability/metadata)
2. [Add gateway configs to your Anthropic requests](https://portkey.ai/docs/product/ai-gateway/configs)
3. [Tracing Anthropic requests](https://portkey.ai/docs/product/observability/traces)
4. [Setup a fallback from OpenAI to Anthropic’s Claude APIs](https://portkey.ai/docs/product/ai-gateway/fallbacks)

Was this page helpful?

YesNo

[Suggest edits](https://github.com/portkey-ai/docs-core/edit/main/integrations/llms/anthropic.mdx) [Raise issue](https://github.com/portkey-ai/docs-core/issues/new?title=Issue%20on%20docs&body=Path:%20/integrations/llms/anthropic)

[Batches](https://portkey.ai/docs/integrations/llms/openai/batches) [Prompt Caching](https://portkey.ai/docs/integrations/llms/anthropic/prompt-caching)

On this page

- [Portkey SDK Integration with Anthropic](https://portkey.ai/docs/integrations/llms/anthropic#portkey-sdk-integration-with-anthropic)
- [1\. Install the Portkey SDK](https://portkey.ai/docs/integrations/llms/anthropic#1-install-the-portkey-sdk)
- [2\. Initialize Portkey with the Virtual Key](https://portkey.ai/docs/integrations/llms/anthropic#2-initialize-portkey-with-the-virtual-key)
- [3\. Invoke Chat Completions with Anthropic](https://portkey.ai/docs/integrations/llms/anthropic#3-invoke-chat-completions-with-anthropic)
- [How to Use Anthropic System Prompt](https://portkey.ai/docs/integrations/llms/anthropic#how-to-use-anthropic-system-prompt)
- [Vision Chat Completion Usage](https://portkey.ai/docs/integrations/llms/anthropic#vision-chat-completion-usage)
- [API Reference](https://portkey.ai/docs/integrations/llms/anthropic#api-reference)
- [Prompt Caching](https://portkey.ai/docs/integrations/llms/anthropic#prompt-caching)
- [Managing Anthropic Prompts](https://portkey.ai/docs/integrations/llms/anthropic#managing-anthropic-prompts)
- [Next Steps](https://portkey.ai/docs/integrations/llms/anthropic#next-steps)