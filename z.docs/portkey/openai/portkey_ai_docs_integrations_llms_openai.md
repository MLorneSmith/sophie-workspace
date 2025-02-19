[Portkey Docs home page![light logo](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/logo-white.png)![dark logo](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/logo-black.png)](https://portkey.ai/docs)

Search or ask...

Ctrl K

Search...

Navigation

OpenAI

OpenAI

[Documentation](https://portkey.ai/docs/introduction/what-is-portkey) [Integrations](https://portkey.ai/docs/integrations) [Inference API](https://portkey.ai/docs/api-reference/inference-api/introduction) [Admin API](https://portkey.ai/docs/api-reference/admin-api/control-plane/configs/create-config) [Cookbook](https://portkey.ai/docs/guides/getting-started) [Changelog](https://portkey.ai/docs/changelog/2025/jan)

Portkey has native integrations with OpenAI SDKs for Node.js, Python, and its REST APIs. For OpenAI integration using other frameworks, explore our partnerships, including [Langchain](https://portkey.ai/docs/integrations/libraries/langchain-python), [LlamaIndex](https://portkey.ai/docs/integrations/libraries/llama-index-python), among [others](https://portkey.ai/docs/integrations/llms).

Provider Slug. `openai`

## [​](https://portkey.ai/docs/integrations/llms/openai\#using-the-portkey-gateway)  Using the Portkey Gateway

To integrate the Portkey gateway with OpenAI,

- Set the `baseURL` to the Portkey Gateway URL
- Include Portkey-specific headers such as `provider`, `apiKey`, ‘virtualKey’ and others.

Here’s how to apply it to a **chat completion** request:

- OpenAI NodeJS
- OpenAI Python
- cURL

1. Install the Portkey SDK in your application

Copy

```sh
npm i --save portkey-ai

```

2. Next, insert the Portkey-specific code as shown in the highlighted lines to your OpenAI completion calls. PORTKEY\_GATEWAY\_URL is portkey’s gateway URL to route your requests and createHeaders is a convenience function that generates the headers object. (All supported params/headers)

Copy

```js
import OpenAI from 'openai'; // We're using the v4 SDK
import { PORTKEY_GATEWAY_URL, createHeaders } from 'portkey-ai'

const openai = new OpenAI({
  apiKey: 'OPENAI_API_KEY', // defaults to process.env["OPENAI_API_KEY"],
  baseURL: PORTKEY_GATEWAY_URL,
  defaultHeaders: createHeaders({
    provider: "openai",
    apiKey: "PORTKEY_API_KEY" // defaults to process.env["PORTKEY_API_KEY"]
    // virtualKey: "VIRTUAL_KEY_VALUE" if you want provider key on gateway instead of client
  })
});

async function main() {
  const chatCompletion = await openai.chat.completions.create({
    messages: [{ role: 'user', content: 'Say this is a test' }],
    model: 'gpt-4-turbo',
  });

  console.log(chatCompletion.choices);
}

main();

```

This request will be automatically logged by Portkey. You can view this in your logs dashboard. Portkey logs the tokens utilized, execution time, and cost for each request. Additionally, you can delve into the details to review the precise request and response data.

### [​](https://portkey.ai/docs/integrations/llms/openai\#track-end-user-ids)  Track End-User IDs

Portkey allows you to track user IDs passed with the `user` parameter in OpenAI requests, enabling you to monitor user-level costs, requests, and more.

- NodeJS
- Python

Copy

```js
const chatCompletion = await portkey.chat.completions.create({
  messages: [{ role: "user", content: "Say this is a test" }],
  model: "gpt-4o",
  user: "user_12345",
});

```

When you include the `user` parameter in your requests, Portkey logs will display the associated user ID, as shown in the image below:

![logs](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/images/open-ai-2.avif)

In addition to the `user` parameter, Portkey allows you to send arbitrary custom metadata with your requests. This powerful feature enables you to associate additional context or information with each request, which can be useful for analysis, debugging, or other custom use cases.

[**Metadata**](https://portkey.ai/docs/product/observability/metadata)

- The same integration approach applies to APIs for [completions](https://platform.openai.com/docs/guides/text-generation/completions-api), [embeddings](https://platform.openai.com/docs/api-reference/embeddings/create), [vision](https://platform.openai.com/docs/guides/vision/quick-start), [moderation](https://platform.openai.com/docs/api-reference/moderations/create), [transcription](https://platform.openai.com/docs/api-reference/audio/createTranscription), [translation](https://platform.openai.com/docs/api-reference/audio/createTranslation), [speech](https://platform.openai.com/docs/api-reference/audio/createSpeech) and [files](https://platform.openai.com/docs/api-reference/files/create).
- If you are looking for a way to add your **Org ID** & **Project ID** to the requests, head over to [this section](https://portkey.ai/docs/integrations/llms/openai#managing-openai-projects-and-organizations-in-portkey).

## [​](https://portkey.ai/docs/integrations/llms/openai\#using-the-prompts-api)  Using the Prompts API

Portkey also supports creating and managing prompt templates in the [prompt library](https://portkey.ai/docs/product/prompt-library). This enables the collaborative development of prompts directly through the user interface.

1. Create a prompt template with variables and set the hyperparameters.

![prompt](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/images/llms/prompt-creation.gif)

2. Use this prompt in your codebase using the Portkey SDK.

- Node
- Python
- cURL

Copy

```js
import Portkey from 'portkey-ai'

const portkey = new Portkey({
    apiKey: "PORTKEY_API_KEY",
})

// Make the prompt creation call with the variables

const promptCompletion = await portkey.prompts.completions.create({
    promptID: "Your Prompt ID",
    variables: {
       // The variables specified in the prompt
    }
})

```

Copy

```js
// We can also override the hyperparameters

const promptCompletion = await portkey.prompts.completions.create({
    promptID: "Your Prompt ID",
    variables: {
       // The variables specified in the prompt
    },
    max_tokens: 250,
    presence_penalty: 0.2
})

```

Observe how this streamlines your code readability and simplifies prompt updates via the UI without altering the codebase.

## [​](https://portkey.ai/docs/integrations/llms/openai\#advanced-use-cases)  Advanced Use Cases

### [​](https://portkey.ai/docs/integrations/llms/openai\#realtime-api)  Realtime API

Portkey supports OpenAI’s Realtime API with a seamless integration. This allows you to use Portkey’s logging, cost tracking, and guardrail features while using the Realtime API.

[**Realtime API**](https://portkey.ai/docs/product/ai-gateway/realtime-api)

### [​](https://portkey.ai/docs/integrations/llms/openai\#streaming-responses)  Streaming Responses

Portkey supports streaming responses using Server Sent Events (SSE).

- OpenAI NodeJS
- OpenAI Python

Copy

```js
import OpenAI from 'openai';

import { PORTKEY_GATEWAY_URL, createHeaders } from 'portkey-ai'
const openai = new OpenAI({
  baseURL: PORTKEY_GATEWAY_URL,
  defaultHeaders: createHeaders({
    provider: "openai",
    apiKey: "PORTKEY_API_KEY" // defaults to process.env["PORTKEY_API_KEY"]
  })
});

async function main() {
  const stream = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: 'Say this is a test' }],
    stream: true,
  });

  for await (const chunk of stream) {
    process.stdout.write(chunk.choices[0]?.delta?.content || '');
  }
}

main();

```

### [​](https://portkey.ai/docs/integrations/llms/openai\#using-vision-models)  Using Vision Models

Portkey’s multimodal Gateway fully supports OpenAI vision models as well. See this guide for more info:

[Vision](https://portkey.ai/docs/product/ai-gateway/multimodal-capabilities/vision)

### [​](https://portkey.ai/docs/integrations/llms/openai\#function-calling)  Function Calling

Function calls within your OpenAI or Portkey SDK operations remain standard. These logs will appear in Portkey, highlighting the utilized functions and their outputs.

Additionally, you can define functions within your prompts and invoke the `portkey.prompts.completions.create` method as above.

### [​](https://portkey.ai/docs/integrations/llms/openai\#fine-tuning)  Fine-Tuning

Please refer to our fine-tuning guides to take advantage of Portkey’s advanced [continuous fine-tuning](https://portkey.ai/docs/product/autonomous-fine-tuning) capabilities.

### [​](https://portkey.ai/docs/integrations/llms/openai\#image-generation)  Image Generation

Portkey supports multiple modalities for OpenAI and you can make image generation requests through Portkey’s AI Gateway the same way as making completion calls.

- OpenAI NodeJS
- OpenAI Python

Copy

```js
// Define the OpenAI client as shown above

const image = await openai.images.generate({
  model:"dall-e-3",
  prompt:"Lucy in the sky with diamonds",
  size:"1024x1024"
})

```

Portkey’s fast AI gateway captures the information about the request on your Portkey Dashboard. On your logs screen, you’d be able to see this request with the request and response.

![querying-vision-language-models](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/images/llms/openai-logs.png)

Log view for an image generation request on OpenAI

More information on image generation is available in the [API Reference](https://portkey.ai/docs/provider-endpoints/images/create-image#create-image).

### [​](https://portkey.ai/docs/integrations/llms/openai\#audio-transcription-translation-and-text-to-speech)  Audio - Transcription, Translation, and Text-to-Speech

Portkey’s multimodal Gateway also supports the `audio` methods on OpenAI API. Check out the below guides for more info:

Check out the below guides for more info:

[Text-to-Speech](https://portkey.ai/docs/product/ai-gateway/multimodal-capabilities/text-to-speech)

[Speech-to-Text](https://portkey.ai/docs/product/ai-gateway/multimodal-capabilities/speech-to-text)

* * *

## [​](https://portkey.ai/docs/integrations/llms/openai\#managing-openai-projects-and-organizations-in-portkey)  Managing OpenAI Projects & Organizations in Portkey

When integrating OpenAI with Portkey, you can specify your OpenAI organization and project IDs along with your API key. This is particularly useful if you belong to multiple organizations or are accessing projects through a legacy user API key.

Specifying the organization and project IDs helps you maintain better control over your access rules, usage, and costs.

In Portkey, you can add your Org & Project details by,

1. Creating your Virtual Key
2. Defining a Gateway Config
3. Passing Details in a Request

Let’s explore each method in more detail.

### [​](https://portkey.ai/docs/integrations/llms/openai\#using-virtual-keys)  Using Virtual Keys

When selecting OpenAI from the dropdown menu while creating a virtual key, Portkey automatically displays optional fields for the organization ID and project ID alongside the API key field.

[Get your OpenAI API key from here](https://platform.openai.com/api-keys), then add it to Portkey to create the virtual key that can be used throughout Portkey.

![LOGO](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/images/llms/virtual.png)

[Virtual Keys](https://portkey.ai/docs/product/ai-gateway/virtual-keys)

Portkey takes budget management a step further than OpenAI. While OpenAI allows setting budget limits per project, Portkey enables you to set budget limits for each virtual key you create. For more information on budget limits, refer to this documentation:

[Budget Limits](https://portkey.ai/docs/product/ai-gateway/virtual-keys/budget-limits)

### [​](https://portkey.ai/docs/integrations/llms/openai\#using-the-gateway-config)  Using The Gateway Config

You can also specify the organization and project details in the gateway config, either at the root level or within a specific target.

Copy

```json
{
	"provider": "openai",
	"api_key": "OPENAI_API_KEY",
	"openai_organization": "org-xxxxxx",
	"openai_project": "proj_xxxxxxxx"
}

```

### [​](https://portkey.ai/docs/integrations/llms/openai\#while-making-a-request)  While Making a Request

You can also pass your organization and project details directly when making a request using curl, the OpenAI SDK, or the Portkey SDK.

- OpenAI Python SDK
- OpenAI TS SDK
- cURL
- Portkey Python SDK
- Portkey Node SDK

Copy

```python
from openai import OpenAI
from portkey_ai import PORTKEY_GATEWAY_URL, createHeaders

client = OpenAI(
    api_key="OPENAI_API_KEY",
    organization="org-xxxxxxxxxx",
    project="proj_xxxxxxxxx",
    base_url=PORTKEY_GATEWAY_URL,
    default_headers=createHeaders(
        provider="openai",
        api_key="PORTKEY_API_KEY"
    )
)

chat_complete = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Say this is a test"}],
)

print(chat_complete.choices[0].message.content)

```

* * *

### [​](https://portkey.ai/docs/integrations/llms/openai\#portkey-features)  Portkey Features

Portkey supports the complete host of it’s functionality via the OpenAI SDK so you don’t need to migrate away from it.

Please find more information in the relevant sections:

1. [Add metadata to your requests](https://portkey.ai/docs/product/observability/metadata)
2. [Add gateway configs to the OpenAI client or a single request](https://portkey.ai/docs/product/ai-gateway/configs)
3. [Tracing OpenAI requests](https://portkey.ai/docs/product/observability/traces)
4. [Setup a fallback to Azure OpenAI](https://portkey.ai/docs/product/ai-gateway/fallbacks)

Was this page helpful?

YesNo

[Suggest edits](https://github.com/portkey-ai/docs-core/edit/main/integrations/llms/openai.mdx) [Raise issue](https://github.com/portkey-ai/docs-core/issues/new?title=Issue%20on%20docs&body=Path:%20/integrations/llms/openai)

[Overview](https://portkey.ai/docs/integrations/llms) [Structured Outputs](https://portkey.ai/docs/integrations/llms/openai/structured-outputs)

On this page

- [Using the Portkey Gateway](https://portkey.ai/docs/integrations/llms/openai#using-the-portkey-gateway)
- [Track End-User IDs](https://portkey.ai/docs/integrations/llms/openai#track-end-user-ids)
- [Using the Prompts API](https://portkey.ai/docs/integrations/llms/openai#using-the-prompts-api)
- [Advanced Use Cases](https://portkey.ai/docs/integrations/llms/openai#advanced-use-cases)
- [Realtime API](https://portkey.ai/docs/integrations/llms/openai#realtime-api)
- [Streaming Responses](https://portkey.ai/docs/integrations/llms/openai#streaming-responses)
- [Using Vision Models](https://portkey.ai/docs/integrations/llms/openai#using-vision-models)
- [Function Calling](https://portkey.ai/docs/integrations/llms/openai#function-calling)
- [Fine-Tuning](https://portkey.ai/docs/integrations/llms/openai#fine-tuning)
- [Image Generation](https://portkey.ai/docs/integrations/llms/openai#image-generation)
- [Audio - Transcription, Translation, and Text-to-Speech](https://portkey.ai/docs/integrations/llms/openai#audio-transcription-translation-and-text-to-speech)
- [Managing OpenAI Projects & Organizations in Portkey](https://portkey.ai/docs/integrations/llms/openai#managing-openai-projects-and-organizations-in-portkey)
- [Using Virtual Keys](https://portkey.ai/docs/integrations/llms/openai#using-virtual-keys)
- [Using The Gateway Config](https://portkey.ai/docs/integrations/llms/openai#using-the-gateway-config)
- [While Making a Request](https://portkey.ai/docs/integrations/llms/openai#while-making-a-request)
- [Portkey Features](https://portkey.ai/docs/integrations/llms/openai#portkey-features)

![querying-vision-language-models](https://portkey.ai/docs/integrations/llms/openai)

![LOGO](https://portkey.ai/docs/integrations/llms/openai)

![logs](https://portkey.ai/docs/integrations/llms/openai)