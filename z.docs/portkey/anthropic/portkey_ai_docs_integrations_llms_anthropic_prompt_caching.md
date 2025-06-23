[Portkey Docs home page![light logo](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/logo-white.png)![dark logo](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/logo-black.png)](https://portkey.ai/docs)

Search or ask...

Ctrl K

Search...

Navigation

Anthropic

Prompt Caching

[Documentation](https://portkey.ai/docs/introduction/what-is-portkey) [Integrations](https://portkey.ai/docs/integrations) [Inference API](https://portkey.ai/docs/api-reference/inference-api/introduction) [Admin API](https://portkey.ai/docs/api-reference/admin-api/control-plane/configs/create-config) [Cookbook](https://portkey.ai/docs/guides/getting-started) [Changelog](https://portkey.ai/docs/changelog/2025/jan)

Prompt caching on Anthropic lets you cache individual messages in your request for repeat use. With caching, you can free up your tokens to include more context in your prompt, and also deliver responses significantly faster and cheaper.

You can use this feature on our OpenAI-compliant universal API as well as with our prompt templates.

## [​](https://portkey.ai/docs/integrations/llms/anthropic/prompt-caching#api-support) API Support

Just set the `cache_control` param in your respective message body:

NodeJS

Python

OpenAI NodeJS

OpenAI Python

REST API

Copy

```javascript
import Portkey from 'portkey-ai'

const portkey = new Portkey({
    apiKey: "PORTKEY_API_KEY", // defaults to process.env["PORTKEY_API_KEY"]
    virtualKey: "VIRTUAL_KEY" // Your Anthropic Virtual Key
})

const chatCompletion = await portkey.chat.completions.create({
    messages: [\
        { "role": 'system', "content": [\
            {\
                "type":"text","text":"You are a helpful assistant"\
            },\
            {\
                "type":"text","text":"<TEXT_TO_CACHE>",\
                "cache_control": {"type": "ephemeral"}\
            }\
        ]},\
        { "role": 'user', "content": 'Summarize the above story for me in 20 words' }\
    ],
    model: 'claude-3-5-sonnet-20240620',
    max_tokens: 250 // Required field for Anthropic
});

console.log(chatCompletion.choices[0].message.content);

```

## [​](https://portkey.ai/docs/integrations/llms/anthropic/prompt-caching#prompt-templates-support) Prompt Templates Support

Set any message in your prompt template to be cached by just toggling the `Cache Control` setting in the UI:

![](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/images/llms/anthropic/prompt-caching.gif)

Anthropic currently has certain restrictions on prompt caching, like:

- Cache TTL is set at **5 minutes** and can not be changed
- The message you are caching needs to cross minimum length to enable this feature
  - 1024 tokens for Claude 3.5 Sonnet and Claude 3 Opus
  - 2048 tokens for Claude 3 Haiku

For more, refer to Anthropic’s prompt caching documentation [here](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching).

## [​](https://portkey.ai/docs/integrations/llms/anthropic/prompt-caching#seeing-cache-results-in-portkey) Seeing Cache Results in Portkey

Portkey automatically calculate the correct pricing for your prompt caching requests & responses based on Anthropic’s calculations here:

![Anthropic's pricing calculations](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/images/supported-llm/anthropic-prompt-caching-1.png)

In the individual log for any request, you can also see the exact status of your request and verify if it was cached, or delivered from cache with two `usage` parameters:

- `cache_creation_input_tokens`: Number of tokens written to the cache when creating a new entry.
- `cache_read_input_tokens`: Number of tokens retrieved from the cache for this request.

![Cache status in Portkey logs](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/images/supported-llm/anthropic-prompt-caching-2.png)

Was this page helpful?

YesNo

[Suggest edits](https://github.com/portkey-ai/docs-core/edit/main/integrations/llms/anthropic/prompt-caching.mdx) [Raise issue](https://github.com/portkey-ai/docs-core/issues/new?title=Issue%20on%20docs&body=Path:%20/integrations/llms/anthropic/prompt-caching)

[Anthropic](https://portkey.ai/docs/integrations/llms/anthropic) [Google Gemini](https://portkey.ai/docs/integrations/llms/gemini)

On this page

- [API Support](https://portkey.ai/docs/integrations/llms/anthropic/prompt-caching#api-support)
- [Prompt Templates Support](https://portkey.ai/docs/integrations/llms/anthropic/prompt-caching#prompt-templates-support)
- [Seeing Cache Results in Portkey](https://portkey.ai/docs/integrations/llms/anthropic/prompt-caching#seeing-cache-results-in-portkey)

![Anthropic's pricing calculations](https://portkey.ai/docs/integrations/llms/anthropic/prompt-caching)

![Cache status in Portkey logs](https://portkey.ai/docs/integrations/llms/anthropic/prompt-caching)
