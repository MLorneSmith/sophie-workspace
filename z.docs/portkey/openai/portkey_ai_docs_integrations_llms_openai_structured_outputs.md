[Portkey Docs home page![light logo](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/logo-white.png)![dark logo](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/logo-black.png)](https://portkey.ai/docs)

Search or ask...

Ctrl K

Search...

Navigation

OpenAI

Structured Outputs

[Documentation](https://portkey.ai/docs/introduction/what-is-portkey) [Integrations](https://portkey.ai/docs/integrations) [Inference API](https://portkey.ai/docs/api-reference/inference-api/introduction) [Admin API](https://portkey.ai/docs/api-reference/admin-api/control-plane/configs/create-config) [Cookbook](https://portkey.ai/docs/guides/getting-started) [Changelog](https://portkey.ai/docs/changelog/2025/jan)

Structured Outputs is different from OpenAI’s `JSON Mode` as well as `Function Calling`. [Check out this table](https://portkey.ai/docs/integrations/llms/openai/structured-outputs#difference-between-structured-outputs-json-mode-and-function-calling) for a quick comparison.

Portkey SDKs for [Python](https://github.com/openai/openai-python/blob/main/helpers.md#structured-outputs-parsing-helpers) and [JavaScript](https://github.com/openai/openai-node/blob/master/helpers.md#structured-outputs-parsing-helpers) also make it easy to define object schemas using [Pydantic](https://docs.pydantic.dev/latest/) and [Zod](https://zod.dev/) respectively. Below, you can see how to extract information from unstructured text that conforms to a schema defined in code.

- Pydantic with Python
- Zod with NodeJS

Copy

```python
from portkey_ai import Portkey
from pydantic import BaseModel

class Step(BaseModel):
    explanation: str
    output: str

class MathReasoning(BaseModel):
    steps: list[Step]
    final_answer: str

portkey = Portkey(
    api_key="PORTKEY_API_KEY",
    virtual_key="OPENAI_VIRTUAL_KEY"
)

completion = portkey.beta.chat.completions.parse(
    model="gpt-4o-2024-08-06",
    messages=[\
        {"role": "system", "content": "You are a helpful math tutor. Guide the user through the solution step by step."},\
        {"role": "user", "content": "how can I solve 8x + 7 = -23"}\
    ],
    response_format=MathReasoning,
)

print(completion.choices[0].message)
print(completion.choices[0].message.parsed)

```

The second approach, shown in the subsequent examples, uses a JSON schema directly in the API call. This method is more portable across different languages and doesn’t require additional libraries, but lacks the integrated type checking of the Pydantic/Zod approach. Choose the method that best fits your project’s needs and language ecosystem.

- NodeJS
- Python
- cURL

Copy

```typescript
import Portkey from "portkey-ai";

const portkey = new Portkey({
  apiKey: "PORTKEY_API_KEY",
  virtualKey: "OPENAI_VIRTUAL_KEY",
});

async function main() {
  const completion = await portkey.chat.completions.create({
    model: "gpt-4o-2024-08-06",
    messages: [\
      { role: "system", content: "Extract the event information." },\
      {\
        role: "user",\
        content: "Alice and Bob are going to a science fair on Friday.",\
      },\
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "math_reasoning",
        schema: {
          type: "object",
          properties: {
            steps: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  explanation: { type: "string" },
                  output: { type: "string" },
                },
                required: ["explanation", "output"],
                additionalProperties: false,
              },
            },
            final_answer: { type: "string" },
          },
          required: ["steps", "final_answer"],
          additionalProperties: false,
        },
        strict: true,
      },
    },
  });
  const event = completion.choices[0].message?.content;
  console.log(event);
}

main();

```

## [​](https://portkey.ai/docs/integrations/llms/openai/structured-outputs\#difference-between-structured-outputs-json-mode-and-function-calling)  Difference Between Structured Outputs, JSON Mode, and Function Calling

- If you are connecting the model to tools, functions, data, etc. in your system, then you should use **function calling.**
- And if you want to structure the model’s output when it responds to the user, then you should use a structured `response_format`.

  - In `response_format`, you can set it as `{ "type": "json_object" }` to enable the [JSON Mode](https://platform.openai.com/docs/guides/structured-outputs/json-mode).
  - And you can set it as `{ "type": "json_schema" }` to use the [Structured Outputs Mode described above](https://platform.openai.com/docs/guides/structured-outputs).

For more, refer to OpenAI’s [detailed documentation on Structured Outputs here](https://platform.openai.com/docs/guides/structured-outputs/supported-schemas).

Was this page helpful?

YesNo

[Suggest edits](https://github.com/portkey-ai/docs-core/edit/main/integrations/llms/openai/structured-outputs.mdx) [Raise issue](https://github.com/portkey-ai/docs-core/issues/new?title=Issue%20on%20docs&body=Path:%20/integrations/llms/openai/structured-outputs)

[OpenAI](https://portkey.ai/docs/integrations/llms/openai) [Prompt Caching](https://portkey.ai/docs/integrations/llms/openai/prompt-caching-openai)

On this page

- [Difference Between Structured Outputs, JSON Mode, and Function Calling](https://portkey.ai/docs/integrations/llms/openai/structured-outputs#difference-between-structured-outputs-json-mode-and-function-calling)
