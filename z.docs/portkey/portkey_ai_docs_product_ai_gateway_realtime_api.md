[Portkey Docs home page![light logo](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/logo-white.png)![dark logo](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/logo-black.png)](https://portkey.ai/docs)

Search or ask...

Ctrl K

Search...

Navigation

AI Gateway

Realtime API

[Documentation](https://portkey.ai/docs/introduction/what-is-portkey) [Integrations](https://portkey.ai/docs/integrations) [Inference API](https://portkey.ai/docs/api-reference/inference-api/introduction) [Admin API](https://portkey.ai/docs/api-reference/admin-api/control-plane/configs/create-config) [Cookbook](https://portkey.ai/docs/guides/getting-started) [Changelog](https://portkey.ai/docs/changelog/2025/jan)

This feature is available on all Portkey [plans](https://portkey.ai/pricing).

[OpenAI’s Realtime API](https://platform.openai.com/docs/guides/realtime) while the fastest way to use multi-modal generation, presents its own set of problems around logging, cost tracking and guardrails.

Portkey’s AI Gateway provides a solution to these problems with a seamless integration. Portkeys logging is unique in that it captures the entire request and response, including the model’s response, cost, and guardrail violations.

### [​](https://portkey.ai/docs/product/ai-gateway/realtime-api\#heres-how-to-get-started)  Here’s how to get started

- Python
- NodeJS
- OpenAI NodeJS
- OpenAI Python
- cURL

Copy

```python
from portkey_ai import AsyncPortkey as Portkey, PORTKEY_GATEWAY_URL
import asyncio

async def main():
client = Portkey(
    api_key="PORTKEY_API_KEY",
    virtual_key="VIRTUAL_KEY",
    base_url=PORTKEY_GATEWAY_URL,
)

async with client.beta.realtime.connect(model="gpt-4o-realtime-preview-2024-10-01") as connection: #replace with the model you want to use
    await connection.session.update(session={'modalities': ['text']})

    await connection.conversation.item.create(
        item={
            "type": "message",
            "role": "user",
            "content": [{"type": "input_text", "text": "Say hello!"}],
        }
    )
    await connection.response.create()

    async for event in connection:
        if event.type == 'response.text.delta':
            print(event.delta, flush=True, end="")

        elif event.type == 'response.text.done':
            print()

        elif event.type == "response.done":
            break

asyncio.run(main())

```

For advanced use cases, you can use configs ( [https://portkey.ai/docs/product/ai-gateway/configs#configs](https://portkey.ai/docs/product/ai-gateway/configs#configs))

If you would not like to store your API Keys with Portkey, you can pass your openai key in the `Authorization` header.

## [​](https://portkey.ai/docs/product/ai-gateway/realtime-api\#fire-away)  Fire Away

You can see your logs in realtime with neatly visualized traces and cost tracking.

![Realtime API](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/images/product/ai-gateway/realtime-logs.png)

Realtime API Traces

## [​](https://portkey.ai/docs/product/ai-gateway/realtime-api\#next-steps)  Next Steps

- [For more info on realtime API, refer here](https://platform.openai.com/docs/guides/realtime)
- [Portkeys OpenAI Integration](https://portkey.ai/docs/integrations/llms/openai)
- [Logs](https://portkey.ai/docs/product/observability/logs)
- [Traces](https://portkey.ai/docs/product/observability/traces)
- [Guardrails](https://portkey.ai/docs/product/ai-gateway/guardrails)

Was this page helpful?

YesNo

[Suggest edits](https://github.com/portkey-ai/docs-core/edit/main/product/ai-gateway/realtime-api.mdx) [Raise issue](https://github.com/portkey-ai/docs-core/issues/new?title=Issue%20on%20docs&body=Path:%20/product/ai-gateway/realtime-api)

[Automatic Retries](https://portkey.ai/docs/product/ai-gateway/automatic-retries) [Load Balancing](https://portkey.ai/docs/product/ai-gateway/load-balancing)

On this page

- [Here’s how to get started:](https://portkey.ai/docs/product/ai-gateway/realtime-api#heres-how-to-get-started)
- [Fire Away!](https://portkey.ai/docs/product/ai-gateway/realtime-api#fire-away)
- [Next Steps](https://portkey.ai/docs/product/ai-gateway/realtime-api#next-steps)

![Realtime API](https://portkey.ai/docs/product/ai-gateway/realtime-api)
