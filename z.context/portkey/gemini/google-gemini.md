[Portkey Docs home page![light logo](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/logo-white.png)![dark logo](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/logo-black.png)](https://portkey.ai/docs)

Search or ask...

Ctrl K

Search...

Navigation

LLMs

Google Gemini

[Documentation](https://portkey.ai/docs/introduction/what-is-portkey) [Integrations](https://portkey.ai/docs/integrations) [Inference API](https://portkey.ai/docs/api-reference/inference-api/introduction) [Admin API](https://portkey.ai/docs/api-reference/admin-api/control-plane/configs/create-config) [Cookbook](https://portkey.ai/docs/guides/getting-started) [Changelog](https://portkey.ai/docs/changelog/2025/jan)

Portkey provides a robust and secure gateway to facilitate the integration of various Large Language Models (LLMs) into your applications, including [Google Gemini APIs](https://cloud.google.com/vertex-ai/docs/generative-ai/model-reference/gemini).

With Portkey, you can take advantage of features like fast AI gateway access, observability, prompt management, and more, all while ensuring the secure management of your LLM API keys through a [virtual key](https://portkey.ai/docs/product/ai-gateway/virtual-keys) system.

Provider Slug. `google`

## [​](https://portkey.ai/docs/integrations/llms/gemini\#portkey-sdk-integration-with-google-gemini-models)  Portkey SDK Integration with Google Gemini Models

Portkey provides a consistent API to interact with models from various providers. To integrate Google Gemini with Portkey:

### [​](https://portkey.ai/docs/integrations/llms/gemini\#1-install-the-portkey-sdk)  1\. Install the Portkey SDK

Add the Portkey SDK to your application to interact with Google Gemini’s API through Portkey’s gateway.

- NodeJS
- Python

Copy

```sh
npm install --save portkey-ai

```

### [​](https://portkey.ai/docs/integrations/llms/gemini\#2-initialize-portkey-with-the-virtual-key)  2\. Initialize Portkey with the Virtual Key

To use Gemini with Portkey, [get your API key from here](https://aistudio.google.com/app/apikey), then add it to Portkey to create the virtual key.

- NodeJS SDK
- Python SDK

Copy

```js
import Portkey from 'portkey-ai'

const portkey = new Portkey({
    apiKey: "PORTKEY_API_KEY", // defaults to process.env["PORTKEY_API_KEY"]
    virtualKey: "VIRTUAL_KEY" // Your Google Virtual Key
})

```

### [​](https://portkey.ai/docs/integrations/llms/gemini\#3-invoke-chat-completions-with-google-gemini)  **3\. Invoke Chat Completions with** Google Gemini

Use the Portkey instance to send requests to Google Gemini. You can also override the virtual key directly in the API call if needed.

- NodeJS SDK
- Python SDK

Copy

```js
const chatCompletion = await portkey.chat.completions.create({
    messages: [\
        { role: 'system', content: 'You are not a helpful assistant' },\
        { role: 'user', content: 'Say this is a test' }\
    ],
    model: 'gemini-1.5-pro',
});

console.log(chatCompletion.choices);

```

Portkey supports the `system_instructions` parameter for Google Gemini 1.5 - allowing you to control the behavior and output of your Gemini-powered applications with ease.

Simply include your Gemini system prompt as part of the `{"role":"system"}` message within the `messages` array of your request body. Portkey Gateway will automatically transform your message to ensure seamless compatibility with the Google Gemini API.

## [​](https://portkey.ai/docs/integrations/llms/gemini\#function-calling)  Function Calling

Portkey supports function calling mode on Google’s Gemini Models. Explore this  Cookbook for a deep dive and examples:

[Function Calling](https://portkey.ai/docs/guides/getting-started/function-calling)

## [​](https://portkey.ai/docs/integrations/llms/gemini\#document-video-audio-processing-with-gemini)  Document, Video, Audio Processing with Gemini

Gemini supports attaching `mp4`, `pdf`, `jpg`, `mp3`, `wav`, etc. file types to your messages.

Gemini Docs:

- [Document Processing](https://ai.google.dev/gemini-api/docs/document-processing?lang=python)
- [Video & Image Processing](https://ai.google.dev/gemini-api/docs/vision?lang=python)
- [Audio Processing](https://ai.google.dev/gemini-api/docs/audio?lang=python)

Using Portkey, here’s how you can send these media files:

JavaScript

Python

cURL

Copy

```javascript
const chatCompletion = await portkey.chat.completions.create({
    messages: [\
        { role: 'system', content: 'You are a helpful assistant' },\
        { role: 'user', content: [\
            {\
                type: 'image_url',\
                image_url: {\
                    url: 'gs://cloud-samples-data/generative-ai/image/scones.jpg'\
                }\
            },\
            {\
                type: 'text',\
                text: 'Describe the image'\
            }\
        ]}\
    ],
    model: 'gemini-1.5-pro',
    max_tokens: 200
});

```

This same message format also works for all other media types — just send your media file in the `url` field, like `"url": "gs://cloud-samples-data/video/animals.mp4"`.

Your URL should have the file extension, this is used for inferring `MIME_TYPE` which is a required parameter for prompting Gemini models with files.

### [​](https://portkey.ai/docs/integrations/llms/gemini\#sending-base64-image)  Sending base64 Image

Here, you can send the `base64` image data along with the `url` field too:

Copy

```json
"url": "data:image/png;base64,UklGRkacAABXRUJQVlA4IDqcAAC....."

```

## [​](https://portkey.ai/docs/integrations/llms/gemini\#grounding-with-google-search)  Grounding with Google Search

Vertex AI supports grounding with Google Search. This is a feature that allows you to ground your LLM responses with real-time search results.
Grounding is invoked by passing the `google_search` tool (for newer models like gemini-2.0-flash-001), and `google_search_retrieval` (for older models like gemini-1.5-flash) in the `tools` array.

Copy

```json
"tools": [\
    {\
        "type": "function",\
        "function": {\
            "name": "google_search" // or google_search_retrieval for older models\
        }\
    }]

```

If you mix regular tools with grounding tools, vertex might throw an error saying only one tool can be used at a time.

## [​](https://portkey.ai/docs/integrations/llms/gemini\#gemini-2-0-flash-thinking-exp-and-other-thinking-models)  gemini-2.0-flash-thinking-exp and other thinking models

`gemini-2.0-flash-thinking-exp` models return a Chain of Thought response along with the actual inference text,
this is not openai compatible, however, Portkey supports this by adding a `\r\n\r\n` and appending the two responses together.
You can split the response along this pattern to get the Chain of Thought response and the actual inference text.

If you require the Chain of Thought response along with the actual inference text, pass the [strict open ai compliance flag](https://portkey.ai/docs/product/ai-gateway/strict-open-ai-compliance) as `false` in the request.

If you want to get the inference text only, pass the [strict open ai compliance flag](https://portkey.ai/docs/product/ai-gateway/strict-open-ai-compliance) as `true` in the request.

## [​](https://portkey.ai/docs/integrations/llms/gemini\#managing-google-gemini-prompts)  Managing Google Gemini Prompts

You can manage all prompts to Google Gemini in the [Prompt Library](https://portkey.ai/docs/product/prompt-library). All the current models of Google Gemini are supported and you can easily start testing different prompts.

Once you’re ready with your prompt, you can use the `portkey.prompts.completions.create` interface to use the prompt in your application.

Gemini grounding mode may not work via Portkey SDK. Contact [support@portkey.ai](mailto:support@portkey.ai) for assistance.

## [​](https://portkey.ai/docs/integrations/llms/gemini\#next-steps)  Next Steps

The complete list of features supported in the SDK are available on the link below.

[**SDK**](https://portkey.ai/docs/api-reference/portkey-sdk-client)

You’ll find more information in the relevant sections:

1. [Add metadata to your requests](https://portkey.ai/docs/product/observability/metadata)
2. [Add gateway configs to your Gemini requests](https://portkey.ai/docs/product/ai-gateway/configs)
3. [Tracing Google Gemini requests](https://portkey.ai/docs/product/observability/traces)
4. [Setup a fallback from OpenAI to Gemini APIs](https://portkey.ai/docs/product/ai-gateway/fallbacks)

Was this page helpful?

YesNo

[Suggest edits](https://github.com/portkey-ai/docs-core/edit/main/integrations/llms/gemini.mdx) [Raise issue](https://github.com/portkey-ai/docs-core/issues/new?title=Issue%20on%20docs&body=Path:%20/integrations/llms/gemini)

[Prompt Caching](https://portkey.ai/docs/integrations/llms/anthropic/prompt-caching) [Google Vertex AI](https://portkey.ai/docs/integrations/llms/vertex-ai)

On this page

- [Portkey SDK Integration with Google Gemini Models](https://portkey.ai/docs/integrations/llms/gemini#portkey-sdk-integration-with-google-gemini-models)
- [1\. Install the Portkey SDK](https://portkey.ai/docs/integrations/llms/gemini#1-install-the-portkey-sdk)
- [2\. Initialize Portkey with the Virtual Key](https://portkey.ai/docs/integrations/llms/gemini#2-initialize-portkey-with-the-virtual-key)
- [3\. Invoke Chat Completions with Google Gemini](https://portkey.ai/docs/integrations/llms/gemini#3-invoke-chat-completions-with-google-gemini)
- [Function Calling](https://portkey.ai/docs/integrations/llms/gemini#function-calling)
- [Document, Video, Audio Processing with Gemini](https://portkey.ai/docs/integrations/llms/gemini#document-video-audio-processing-with-gemini)
- [Sending base64 Image](https://portkey.ai/docs/integrations/llms/gemini#sending-base64-image)
- [Grounding with Google Search](https://portkey.ai/docs/integrations/llms/gemini#grounding-with-google-search)
- [gemini-2.0-flash-thinking-exp and other thinking models](https://portkey.ai/docs/integrations/llms/gemini#gemini-2-0-flash-thinking-exp-and-other-thinking-models)
- [Managing Google Gemini Prompts](https://portkey.ai/docs/integrations/llms/gemini#managing-google-gemini-prompts)
- [Next Steps](https://portkey.ai/docs/integrations/llms/gemini#next-steps)