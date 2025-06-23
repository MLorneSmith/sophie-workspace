[Portkey Docs home page![light logo](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/logo-white.png)![dark logo](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/logo-black.png)](https://portkey.ai/docs)

Search or ask...

Ctrl K

Search...

Navigation

Multimodal Capabilities

Image Generation

[Documentation](https://portkey.ai/docs/introduction/what-is-portkey) [Integrations](https://portkey.ai/docs/integrations) [Inference API](https://portkey.ai/docs/api-reference/inference-api/introduction) [Admin API](https://portkey.ai/docs/api-reference/admin-api/control-plane/configs/create-config) [Cookbook](https://portkey.ai/docs/guides/getting-started) [Changelog](https://portkey.ai/docs/changelog/2025/jan)

The most common use case is that of **text-to-image** where the user sends a prompt which the image model processes and returns an image.

The guide for vision models is [available here](https://portkey.ai/docs/product/ai-gateway/multimodal-capabilities/vision).

## [​](https://portkey.ai/docs/product/ai-gateway/multimodal-capabilities/image-generation\#text-to-image-usage)  Text-to-Image Usage

Portkey supports the OpenAI signature to make text-to-image requests.

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

async function main() {
  const image = await portkey.images.generate({
    model: "dall-e-3",
    prompt: "Lucy in the sky with diamonds"
  });

  console.log(image.data);
}

main();

```

### [​](https://portkey.ai/docs/product/ai-gateway/multimodal-capabilities/image-generation\#api-reference)  API Reference

[Create Image](https://portkey.ai/docs/provider-endpoints/images/create-image)

On completion, the request will get logged in the logs UI where the image can be viewed.

( _Note that providers may remove the hosted image after a period of time, so some logs might only contain the url_)

![](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/images/product/ai-gateway/ai-14.avif)

## [​](https://portkey.ai/docs/product/ai-gateway/multimodal-capabilities/image-generation\#supported-providers-and-models)  Supported Providers and Models

The following providers are supported for image generation with more providers getting added soon. Please raise a [request](https://portkey.ai/docs/integrations/llms/suggest-a-new-integration) or a [PR](https://github.com/Portkey-AI/gateway/pulls) to add model or provider to the AI gateway.

| Provider | Models | Functions |
| --- | --- | --- |
| [OpenAI](https://portkey.ai/docs/integrations/llms/openai) | dall-e-2, dall-e-3 | Create Image (text to image) |
| [Azure OpenAI](https://portkey.ai/docs/integrations/llms/azure-openai) | dall-e-2, dall-e-3 | Create Image (text to image) |
| [Stability](https://portkey.ai/docs/integrations/llms/stability-ai) | stable-diffusion-v1-6, stable-diffusion-xl-1024-v1-0 | Create Image (text to image) |
| [AWS Bedrock](https://portkey.ai/docs/integrations/llms/aws-bedrock) | `Stable Image Ultra, Stable Diffusion 3 Large (SD3 Large), Stable Image Core, Stable Diffusion XL 1.0` | Create Image (text to image) |
| Segmind | [Refer here](https://portkey.ai/docs/integrations/llms/segmind) | Create Image (text to image) |
| Together AI (Coming Soon) |  |  |
| Monster API (Coming Soon) |  |  |
| Replicate (Coming Soon) |  |  |

## [​](https://portkey.ai/docs/product/ai-gateway/multimodal-capabilities/image-generation\#cookbook)  Cookbook

[**Here’s a detailed cookbook on image generation using Portkey**](https://github.com/Portkey-AI/portkey-cookbook/blob/main/examples/image-generation.ipynb) which demonstrates the use of multiple providers and routing between them through Configs.

Was this page helpful?

YesNo

[Suggest edits](https://github.com/portkey-ai/docs-core/edit/main/product/ai-gateway/multimodal-capabilities/image-generation.mdx) [Raise issue](https://github.com/portkey-ai/docs-core/issues/new?title=Issue%20on%20docs&body=Path:%20/product/ai-gateway/multimodal-capabilities/image-generation)

[Multimodal Capabilities](https://portkey.ai/docs/product/ai-gateway/multimodal-capabilities) [Function Calling](https://portkey.ai/docs/product/ai-gateway/multimodal-capabilities/function-calling)

On this page

- [Text-to-Image Usage](https://portkey.ai/docs/product/ai-gateway/multimodal-capabilities/image-generation#text-to-image-usage)
- [API Reference](https://portkey.ai/docs/product/ai-gateway/multimodal-capabilities/image-generation#api-reference)
- [Supported Providers and Models](https://portkey.ai/docs/product/ai-gateway/multimodal-capabilities/image-generation#supported-providers-and-models)
- [Cookbook](https://portkey.ai/docs/product/ai-gateway/multimodal-capabilities/image-generation#cookbook)

![](https://portkey.ai/docs/product/ai-gateway/multimodal-capabilities/image-generation)
