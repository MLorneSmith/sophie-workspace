[Portkey Docs home page![light logo](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/logo-white.png)![dark logo](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/logo-black.png)](https://portkey.ai/docs)

Search or ask...

Ctrl K

Search...

Navigation

OpenAI

Prompt Caching

[Documentation](https://portkey.ai/docs/introduction/what-is-portkey) [Integrations](https://portkey.ai/docs/integrations) [Inference API](https://portkey.ai/docs/api-reference/inference-api/introduction) [Admin API](https://portkey.ai/docs/api-reference/admin-api/control-plane/configs/create-config) [Cookbook](https://portkey.ai/docs/guides/getting-started) [Changelog](https://portkey.ai/docs/changelog/2025/jan)

OpenAI now offers prompt caching, a feature that can significantly reduce both latency and costs for your API requests. This feature is particularly beneficial for prompts exceeding 1024 tokens, offering up to an 80% reduction in latency for longer prompts over 10,000 tokens.

**Prompt Caching is enabled for following models**

- `gpt-4o (excludes gpt-4o-2024-05-13)`
- `gpt-4o-mini`
- `o1-preview`
- `o1-mini`

Portkey supports OpenAI’s prompt caching feature out of the box. Here is an examples on of how to use it:

- Python
- NodeJs
- OpenAI Python
- OpenAI NodeJS

Copy

```python
from portkey_ai import Portkey

portkey = Portkey(
    api_key="PORTKEY_API_KEY",
    virtual_key="OPENAI_VIRTUAL_KEY",
)

# Define tools (for function calling example)
tools = [\
    {\
        "type": "function",\
        "function": {\
            "name": "get_weather",\
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
]

# Example: Function calling with caching
response = portkey.chat.completions.create(
  model="gpt-4",
  messages=[\
    {"role": "system", "content": "You are a helpful assistant that can check the weather."},\
    {"role": "user", "content": "What's the weather like in San Francisco?"}\
  ],
  tools=tools,
  tool_choice="auto"
)
print(json.dumps(response.model_dump(), indent=2))

```

### [​](https://portkey.ai/docs/integrations/llms/openai/prompt-caching-openai\#what-can-be-cached)  What can be cached

- **Messages:** The complete messages array, encompassing system, user, and assistant interactions.
- **Images:** Images included in user messages, either as links or as base64-encoded data, as well as multiple images can be sent. Ensure the detail parameter is set identically, as it impacts image tokenization.
- **Tool use:** Both the messages array and the list of available `tools` can be cached, contributing to the minimum 1024 token requirement.
- **Structured outputs:** The structured output schema serves as a prefix to the system message and can be cached.

### [​](https://portkey.ai/docs/integrations/llms/openai/prompt-caching-openai\#whats-not-supported)  What’s Not Supported

- Completions API (only Chat Completions API is supported)
- Streaming responses (caching works, but streaming itself is not affected)

### [​](https://portkey.ai/docs/integrations/llms/openai/prompt-caching-openai\#monitoring-cache-performance)  Monitoring Cache Performance

Prompt caching requests & responses based on OpenAI’s calculations here:

![](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/images/llms/openai/prompt-caching/monitoring.avif)

All requests, including those with fewer than 1024 tokens, will display a `cached_tokens` field of the `usage.prompt_tokens_details` [chat completions object](https://platform.openai.com/docs/api-reference/chat/object) indicating how many of the prompt tokens were a cache hit.

For requests under 1024 tokens, `cached_tokens` will be zero.

![](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/images/llms/openai/prompt-caching/cached-tokens.avif)

**Key Features:**

- Reduced Latency: Especially significant for longer prompts.
- Lower Costs: Cached portions of prompts are billed at a discounted rate.
- Improved Efficiency: Allows for more context in prompts without increasing costs proportionally.
- Zero Data Retention: No data is stored during the caching process, making it eligible for zero data retention policies.

Was this page helpful?

YesNo

[Suggest edits](https://github.com/portkey-ai/docs-core/edit/main/integrations/llms/openai/prompt-caching-openai.mdx) [Raise issue](https://github.com/portkey-ai/docs-core/issues/new?title=Issue%20on%20docs&body=Path:%20/integrations/llms/openai/prompt-caching-openai)

[Structured Outputs](https://portkey.ai/docs/integrations/llms/openai/structured-outputs) [Files](https://portkey.ai/docs/integrations/llms/openai/files)

On this page

- [What can be cached](https://portkey.ai/docs/integrations/llms/openai/prompt-caching-openai#what-can-be-cached)
- [What’s Not Supported](https://portkey.ai/docs/integrations/llms/openai/prompt-caching-openai#whats-not-supported)
- [Monitoring Cache Performance](https://portkey.ai/docs/integrations/llms/openai/prompt-caching-openai#monitoring-cache-performance)

![](https://portkey.ai/docs/integrations/llms/openai/prompt-caching-openai)

![](https://portkey.ai/docs/integrations/llms/openai/prompt-caching-openai)