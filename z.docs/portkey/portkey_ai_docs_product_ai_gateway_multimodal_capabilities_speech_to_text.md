[Portkey Docs home page![light logo](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/logo-white.png)![dark logo](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/logo-black.png)](https://portkey.ai/docs)

Search or ask...

Ctrl K

Search...

Navigation

Multimodal Capabilities

Speech-to-Text

[Documentation](https://portkey.ai/docs/introduction/what-is-portkey) [Integrations](https://portkey.ai/docs/integrations) [Inference API](https://portkey.ai/docs/api-reference/inference-api/introduction) [Admin API](https://portkey.ai/docs/api-reference/admin-api/control-plane/configs/create-config) [Cookbook](https://portkey.ai/docs/guides/getting-started) [Changelog](https://portkey.ai/docs/changelog/2025/jan)

## [​](https://portkey.ai/docs/product/ai-gateway/multimodal-capabilities/speech-to-text\#transcription-and-translation-usage)  Transcription & Translation Usage

Portkey supports both `Transcription` and `Translation` methods for STT models and follows the OpenAI signature where you can send the file (in `flac`, `mp3`, `mp4`, `mpeg`, `mpga`, `m4a`, `ogg`, `wav`, or `webm` formats) as part of the API request.

Here’s an example:

OpenAI NodeJSOpenAI PythonREST

- OpenAI NodeJS
- OpenAI Python
- Python SDK
- cURL

Copy

```js
import fs from "fs";
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

// Transcription

async function transcribe() {
  const transcription = await openai.audio.transcriptions.create({
    file: fs.createReadStream("/path/to/file.mp3"),
    model: "whisper-1",
  });

  console.log(transcription.text);
}
transcribe();

// Translation

async function translate() {
    const translation = await openai.audio.translations.create({
        file: fs.createReadStream("/path/to/file.mp3"),
        model: "whisper-1",
    });
    console.log(translation.text);
}
translate();

```

On completion, the request will get logged in the logs UI where you can see trasncribed or translated text, along with the cost and latency incurred.

## [​](https://portkey.ai/docs/product/ai-gateway/multimodal-capabilities/speech-to-text\#supported-providers-and-models)  Supported Providers and Models

The following providers are supported for speech-to-text with more providers getting added soon. Please raise a [request](https://portkey.ai/docs/integrations/llms/suggest-a-new-integration) or a [PR](https://github.com/Portkey-AI/gateway/pulls) to add model or provider to the AI gateway.

| Provider | Models | Functions |
| --- | --- | --- |
| [OpenAI](https://portkey.ai/docs/integrations/llms/openai) | whisper-1 | Transcription Translation |

Was this page helpful?

YesNo

[Suggest edits](https://github.com/portkey-ai/docs-core/edit/main/product/ai-gateway/multimodal-capabilities/speech-to-text.mdx) [Raise issue](https://github.com/portkey-ai/docs-core/issues/new?title=Issue%20on%20docs&body=Path:%20/product/ai-gateway/multimodal-capabilities/speech-to-text)

[Text-to-Speech](https://portkey.ai/docs/product/ai-gateway/multimodal-capabilities/text-to-speech) [Cache (Simple & Semantic)](https://portkey.ai/docs/product/ai-gateway/cache-simple-and-semantic)

On this page

- [Transcription & Translation Usage](https://portkey.ai/docs/product/ai-gateway/multimodal-capabilities/speech-to-text#transcription-and-translation-usage)
- [Supported Providers and Models](https://portkey.ai/docs/product/ai-gateway/multimodal-capabilities/speech-to-text#supported-providers-and-models)
