[Portkey Docs home page![light logo](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/logo-white.png)![dark logo](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/logo-black.png)](https://portkey.ai/docs)

Search or ask...

Ctrl K

Search...

Navigation

Multimodal Capabilities

Function Calling

[Documentation](https://portkey.ai/docs/introduction/what-is-portkey) [Integrations](https://portkey.ai/docs/integrations) [Inference API](https://portkey.ai/docs/api-reference/inference-api/introduction) [Admin API](https://portkey.ai/docs/api-reference/admin-api/control-plane/configs/create-config) [Cookbook](https://portkey.ai/docs/guides/getting-started) [Changelog](https://portkey.ai/docs/changelog/2025/jan)

## [​](https://portkey.ai/docs/product/ai-gateway/multimodal-capabilities/function-calling#functions-usage) Functions Usage

Portkey supports the OpenAI signature to define functions as part of the API request. The `tools` parameter accepts functions which can be sent specifically for models that support function/tool calling.

- NodeJS
- Python
- OpenAI NodeJS
- OpenAI Python
- cURL

Copy

```js
import Portkey from 'portkey-ai';

// Initialize the Portkey client
const portkey = new Portkey({
    apiKey: "PORTKEY_API_KEY",  // Replace with your Portkey API key
    virtualKey: "VIRTUAL_KEY"   // Add your provider's virtual key
});

// Generate a chat completion with streaming
async function getChatCompletionFunctions(){
  const messages = [{"role": "user", "content": "What's the weather like in Boston today?"}];
  const tools = [\
      {\
        "type": "function",\
        "function": {\
          "name": "get_current_weather",\
          "description": "Get the current weather in a given location",\
          "parameters": {\
            "type": "object",\
            "properties": {\
              "location": {\
                "type": "string",\
                "description": "The city and state, e.g. San Francisco, CA",\
              },\
              "unit": {"type": "string", "enum": ["celsius", "fahrenheit"]},\
            },\
            "required": ["location"],\
          },\
        }\
      }\
  ];

  const response = await portkey.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: messages,
    tools: tools,
    tool_choice: "auto",
  });

  console.log(response)

}
await getChatCompletionFunctions();

```

### [​](https://portkey.ai/docs/product/ai-gateway/multimodal-capabilities/function-calling#api-reference) [API Reference](https://portkey.ai/docs/provider-endpoints/chat)

On completion, the request will get logged in the logs UI where the tools and functions can be viewed. Portkey will automatically format the JSON blocks in the input and output which makes a great debugging experience.

![](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/images/product/ai-gateway/ai-15.webp)

## [​](https://portkey.ai/docs/product/ai-gateway/multimodal-capabilities/function-calling#managing-functions-and-tools-in-prompts) Managing Functions and Tools in Prompts

Portkey’s Prompt Library supports creating prompt templates with function/tool definitions, as well as letting you set the `tool choice` param. Portkey will also validate your tool definition on the fly, eliminating syntax errors.

![](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/images/product/ai-gateway/ai-16.avif)

## [​](https://portkey.ai/docs/product/ai-gateway/multimodal-capabilities/function-calling#supported-providers-and-models) Supported Providers and Models

The following providers are supported for function calling with more providers getting added soon. Please raise a [request](https://portkey.ai/docs/integrations/llms/suggest-a-new-integration) or a [PR](https://github.com/Portkey-AI/gateway/pulls) to add model or provider to the AI gateway.

| Provider                                                                                                                             | Models                                                                                                          |
| ------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| [OpenAI](https://portkey.ai/docs/integrations/llms/openai)                                                                           | gpt-4 series of modelsgpt-3.5-turbo series of models                                                            |
| [Azure OpenAI](https://portkey.ai/docs/integrations/llms/azure-openai)                                                               | gpt-4 series of modelsgpt-3.5-turbo series of models                                                            |
| [Anyscale](https://portkey.ai/docs/integrations/llms/anyscale-llama2-mistral-zephyr)                                                 | mistralai/Mistral-7B-Instruct-v0.1 mistralai/Mixtral-8x7B-Instruct-v0.1                                         |
| [Together AI](https://portkey.ai/docs/integrations/llms/together-ai)                                                                 | mistralai/Mixtral-8x7B-Instruct-v0.1 mistralai/Mistral-7B-Instruct-v0.1 togethercomputer/CodeLlama-34b-Instruct |
| [Fireworks AI](https://portkey.ai/docs/integrations/llms/fireworks)                                                                  | firefunction-v1fw-function-call-34b-v0                                                                          |
| [Google Gemini](https://portkey.ai/docs/integrations/llms/gemini) / [Vertex AI](https://portkey.ai/docs/integrations/llms/vertex-ai) | gemini-1.0-progemini-1.0-pro-001gemini-1.5-pro-latest                                                           |

## [​](https://portkey.ai/docs/product/ai-gateway/multimodal-capabilities/function-calling#cookbook) Cookbook

[**Here’s a detailed cookbook on function calling using Portkey.**](https://portkey.ai/docs/guides/getting-started/function-calling)

Was this page helpful?

YesNo

[Suggest edits](https://github.com/portkey-ai/docs-core/edit/main/product/ai-gateway/multimodal-capabilities/function-calling.mdx) [Raise issue](https://github.com/portkey-ai/docs-core/issues/new?title=Issue%20on%20docs&body=Path:%20/product/ai-gateway/multimodal-capabilities/function-calling)

[Image Generation](https://portkey.ai/docs/product/ai-gateway/multimodal-capabilities/image-generation) [Vision](https://portkey.ai/docs/product/ai-gateway/multimodal-capabilities/vision)

On this page

- [Functions Usage](https://portkey.ai/docs/product/ai-gateway/multimodal-capabilities/function-calling#functions-usage)
- [API Reference](https://portkey.ai/docs/product/ai-gateway/multimodal-capabilities/function-calling#api-reference)
- [Managing Functions and Tools in Prompts](https://portkey.ai/docs/product/ai-gateway/multimodal-capabilities/function-calling#managing-functions-and-tools-in-prompts)
- [Supported Providers and Models](https://portkey.ai/docs/product/ai-gateway/multimodal-capabilities/function-calling#supported-providers-and-models)
- [Cookbook](https://portkey.ai/docs/product/ai-gateway/multimodal-capabilities/function-calling#cookbook)

![](https://portkey.ai/docs/product/ai-gateway/multimodal-capabilities/function-calling)
