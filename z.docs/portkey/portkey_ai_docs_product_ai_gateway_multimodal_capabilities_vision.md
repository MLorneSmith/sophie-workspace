[Portkey Docs home page![light logo](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/logo-white.png)![dark logo](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/logo-black.png)](https://portkey.ai/docs)

Search or ask...

Ctrl K

Search...

Navigation

Multimodal Capabilities

Vision

[Documentation](https://portkey.ai/docs/introduction/what-is-portkey) [Integrations](https://portkey.ai/docs/integrations) [Inference API](https://portkey.ai/docs/api-reference/inference-api/introduction) [Admin API](https://portkey.ai/docs/api-reference/admin-api/control-plane/configs/create-config) [Cookbook](https://portkey.ai/docs/guides/getting-started) [Changelog](https://portkey.ai/docs/changelog/2025/jan)

**What are vision models?**

Vision models are artificial intelligence systems that combine both vision and language modalities to process images and natural language text. These models are typically trained on large image and text datasets with different structures based on the pre-training objective.

## [​](https://portkey.ai/docs/product/ai-gateway/multimodal-capabilities/vision\#vision-chat-completion-usage)  Vision Chat Completion Usage

Portkey supports the OpenAI signature to define messages with images as part of the API request. Images are made available to the model in two main ways: by passing a link to the image or by passing the base64 encoded image directly in the request.

Here’s an example using OpenAI’s `gpt-4-vision-preview` model

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
  const response = await portkey.chat.completions.create({
    model: "gpt-4-vision-preview",
    messages: [\
      {\
        role: "user",\
        content: [\
          { type: "text", text: "What’s in this image?" },\
          {\
            type: "image_url",\
            image_url:\
              "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gfp-wisconsin-madison-the-nature-boardwalk.jpg/2560px-Gfp-wisconsin-madison-the-nature-boardwalk.jpg",\
          },\
        ],\
      },\
    ],
  });

  console.log(response)

}
await getChatCompletionFunctions();

```

### [​](https://portkey.ai/docs/product/ai-gateway/multimodal-capabilities/vision\#api-reference)  [API Reference](https://portkey.ai/docs/product/ai-gateway/multimodal-capabilities/vision\#vision-chat-completion-usage)

On completion, the request will get logged in the logs UI where any image inputs or outputs can be viewed. Portkey will automatically load the image URLs or the base64 images making for a great debugging experience with vision models.

![](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/images/product/ai-gateway/ai-17.webp)

## [​](https://portkey.ai/docs/product/ai-gateway/multimodal-capabilities/vision\#creating-prompt-templates-for-vision-models)  Creating prompt templates for vision models

Portkey’s prompt library supports creating templates with image inputs. If the same image will be used in all prompt calls, you can save it as part of the template’s image URL itself. Or, if the image will be sent via the API as a variable, add a variable to the image link.

![](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/images/product/ai-gateway/ai-18.gif)

## [​](https://portkey.ai/docs/product/ai-gateway/multimodal-capabilities/vision\#supported-providers-and-models)  Supported Providers and Models

Portkey supports all vision models from its integrated providers as they become available. The table below shows some examples of supported vision models. Please raise a [request](https://portkey.ai/docs/integrations/llms/suggest-a-new-integration) or a [PR](https://github.com/Portkey-AI/gateway/pulls) to add a provider to the AI gateway.

| Provider | Models | Functions |
| --- | --- | --- |
| [OpenAI](https://portkey.ai/docs/integrations/llms/openai) | `gpt-4-vision-preview`, `gpt-4o`, `gpt-4o-mini` | Create Chat Completion |
| [Azure OpenAI](https://portkey.ai/docs/integrations/llms/azure-openai) | `gpt-4-vision-preview`, `gpt-4o`, `gpt-4o-mini` | Create Chat Completion |
| [Gemini](https://portkey.ai/docs/integrations/llms/gemini) | `gemini-1.0-pro-vision`, `gemini-1.5-flash`, `gemini-1.5-flash-8b`, `gemini-1.5-pro` | Create Chat Completion |
| [Anthropic](https://portkey.ai/docs/integrations/llms/anthropic) | `claude-3-sonnet`, `claude-3-haiku`, `claude-3-opus`, `claude-3.5-sonnet`, `claude-3.5-haiku` | Create Chat Completion |
| [AWS Bedrock](https://portkey.ai/docs/integrations/llms/aws-bedrock) | `anthropic.claude-3-5-sonnet anthropic.claude-3-5-haiku anthropic.claude-3-5-sonnet-20240620-v1:0` | Create Chat Completion |

For a complete list of all supported provider (including non-vision LLMs), check out our [providers documentation](https://portkey.ai/docs/integrations/llms).

Was this page helpful?

YesNo

[Suggest edits](https://github.com/portkey-ai/docs-core/edit/main/product/ai-gateway/multimodal-capabilities/vision.mdx) [Raise issue](https://github.com/portkey-ai/docs-core/issues/new?title=Issue%20on%20docs&body=Path:%20/product/ai-gateway/multimodal-capabilities/vision)

[Function Calling](https://portkey.ai/docs/product/ai-gateway/multimodal-capabilities/function-calling) [Text-to-Speech](https://portkey.ai/docs/product/ai-gateway/multimodal-capabilities/text-to-speech)

On this page

- [Vision Chat Completion Usage](https://portkey.ai/docs/product/ai-gateway/multimodal-capabilities/vision#vision-chat-completion-usage)
- [API Reference](https://portkey.ai/docs/product/ai-gateway/multimodal-capabilities/vision#api-reference)
- [Creating prompt templates for vision models](https://portkey.ai/docs/product/ai-gateway/multimodal-capabilities/vision#creating-prompt-templates-for-vision-models)
- [Supported Providers and Models](https://portkey.ai/docs/product/ai-gateway/multimodal-capabilities/vision#supported-providers-and-models)
