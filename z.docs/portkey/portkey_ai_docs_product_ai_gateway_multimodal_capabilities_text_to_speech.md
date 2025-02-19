[Portkey Docs home page![light logo](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/logo-white.png)![dark logo](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/logo-black.png)](https://portkey.ai/docs)

Search or ask...

Ctrl K

Search...

Navigation

Multimodal Capabilities

Text-to-Speech

[Documentation](https://portkey.ai/docs/introduction/what-is-portkey) [Integrations](https://portkey.ai/docs/integrations) [Inference API](https://portkey.ai/docs/api-reference/inference-api/introduction) [Admin API](https://portkey.ai/docs/api-reference/admin-api/control-plane/configs/create-config) [Cookbook](https://portkey.ai/docs/guides/getting-started) [Changelog](https://portkey.ai/docs/changelog/2025/jan)

## [​](https://portkey.ai/docs/product/ai-gateway/multimodal-capabilities/text-to-speech\#usage)  Usage

We follow the OpenAI signature where you can send the input text and the voice option as a part of the API request. All the output formats `mp3`, `opus`, `aac`, `flac`, and `pcm` are supported. Portkey also supports real time audio streaming for TTS models.

Here’s an example:

- OpenAI NodeJS
- OpenAI Python
- Python SDK
- cURL

Copy

```js
import fs from "fs";
import path from "path";
import OpenAI from "openai";
import { PORTKEY_GATEWAY_URL, createHeaders } from 'portkey-ai'

const openai = new OpenAI({
  apiKey: "dummy", // We are using Virtual Key from Portkey
  baseURL: PORTKEY_GATEWAY_URL,
  defaultHeaders: createHeaders({
    apiKey: "PORTKEY_API_KEY",
    virtualKey: "OPENAI_VIRTUAL_KEY"
  })
});

const speechFile = path.resolve("./speech.mp3");

async function main() {
  const mp3 = await openai.audio.speech.create({
    model: "tts-1",
    voice: "alloy",
    input: "Today is a wonderful day to build something people love!",
  });
  const buffer = Buffer.from(await mp3.arrayBuffer());
  await fs.promises.writeFile(speechFile, buffer);
}

main();

```

On completion, the request will get logged in the logs UI and show the cost and latency incurred.

## [​](https://portkey.ai/docs/product/ai-gateway/multimodal-capabilities/text-to-speech\#supported-providers-and-models)  Supported Providers and Models

The following providers are supported for text-to-speech with more providers getting added soon. Please raise a [request](https://portkey.ai/docs/integrations/llms/suggest-a-new-integration) or a [PR](https://github.com/Portkey-AI/gateway/pulls) to add model or provider to the AI gateway.

| Provider | Models |
| --- | --- |
| [OpenAI](https://portkey.ai/docs/integrations/llms/openai) | tts-1 tts-1-hd |
| [Azure OpenAI](https://portkey.ai/docs/integrations/llms/azure-openai) | tts-1 tts-1-hd |
| Deepgram (Coming Soon) |  |
| ElevanLabs (Coming Soon) |  |

Was this page helpful?

YesNo

[Suggest edits](https://github.com/portkey-ai/docs-core/edit/main/product/ai-gateway/multimodal-capabilities/text-to-speech.mdx) [Raise issue](https://github.com/portkey-ai/docs-core/issues/new?title=Issue%20on%20docs&body=Path:%20/product/ai-gateway/multimodal-capabilities/text-to-speech)

[Vision](https://portkey.ai/docs/product/ai-gateway/multimodal-capabilities/vision) [Speech-to-Text](https://portkey.ai/docs/product/ai-gateway/multimodal-capabilities/speech-to-text)

On this page

- [Usage](https://portkey.ai/docs/product/ai-gateway/multimodal-capabilities/text-to-speech#usage)
- [Supported Providers and Models](https://portkey.ai/docs/product/ai-gateway/multimodal-capabilities/text-to-speech#supported-providers-and-models)