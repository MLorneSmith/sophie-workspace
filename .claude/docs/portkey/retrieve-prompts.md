[Portkey Docs home page![light logo](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/logo-white.png)![dark logo](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/logo-black.png)](https://portkey.ai/docs)

Search or ask...

Ctrl K

Search...

Navigation

Prompt Library

Retrieve Prompts

[Documentation](https://portkey.ai/docs/introduction/what-is-portkey) [Integrations](https://portkey.ai/docs/integrations) [Inference API](https://portkey.ai/docs/api-reference/inference-api/introduction) [Admin API](https://portkey.ai/docs/api-reference/admin-api/control-plane/configs/create-config) [Cookbook](https://portkey.ai/docs/guides/getting-started) [Changelog](https://portkey.ai/docs/changelog/2025/jan)

This feature is available on all Portkey [plans](https://portkey.ai/pricing).

You can retrieve your saved prompts on Portkey using the `/prompts/$PROMPT_ID/render` endpoint. Portkey returns a JSON containing your prompt or messages body along with all the saved parameters that you can directly use in any request.

This is helpful if you are required to use provider SDKs and can not use the Portkey SDK in production. ( [Example of how to use Portkey prompt templates with OpenAI SDK](https://portkey.ai/docs/product/prompt-library/retrieve-prompts#using-the-render-output-in-a-new-request))

## [​](https://portkey.ai/docs/product/prompt-library/retrieve-prompts\#using-the-render-endpoint-method)  Using the `Render` Endpoint/Method

1. Make a request to `https://api.portkey.ai/v1/prompts/$PROMPT_ID/render` with your prompt ID
2. Pass your Portkey API key with `x-portkey-api-key` in the header
3. Send up the variables in your payload with `{ "variables": { "VARIABLE_NAME": "VARIABLE_VALUE" } }`

That’s it! See it in action:

- cURL
- Portkey Python SDK
- Portkey Node SDK

Copy

```sh
curl -X POST "https://api.portkey.ai/v1/prompts/$PROMPT_ID/render" \
-H "Content-Type: application/json" \
-H "x-portkey-api-key: $PORTKEY_API_KEY" \
-d '{
  "variables": {"movie":"Dune 2"}
}'

```

The Output:

Copy

```JSON
{
    "success": true,
    "data": {
        "model": "gpt-4",
        "n": 1,
        "top_p": 1,
        "max_tokens": 256,
        "temperature": 0,
        "presence_penalty": 0,
        "frequency_penalty": 0,
        "messages": [\
            {\
                "role": "system",\
                "content": "You're a helpful assistant."\
            },\
            {\
                "role": "user",\
                "content": "Who directed Dune 2?"\
            }\
        ]
    }
}

```

## [​](https://portkey.ai/docs/product/prompt-library/retrieve-prompts\#updating-prompt-params-while-retrieving-the-prompt)  Updating Prompt Params While Retrieving the Prompt

If you want to change any model params (like `temperature`, `messages body` etc) while retrieving your prompt from Portkey, you can send the override params in your `render` payload.

Portkey will send back your prompt with overridden params, **without** making any changes to the saved prompt on Portkey.

- cURL
- Python SDK
- NodeJS SDK

Copy

```sh
curl -X POST "https://api.portkey.ai/v1/prompts/$PROMPT_ID/render" \
-H "Content-Type: application/json" \
-H "x-portkey-api-key: $PORTKEY_API_KEY" \
-d '{
 "variables": {"movie":"Dune 2"},
 "model": "gpt-3.5-turbo",
 "temperature": 2
}'

```

Based on the above snippet, `model` and `temperature` params in the retrieved prompt will be **overridden** with the newly passed values

The New Output:

Copy

```JSON
{
    "success": true,
    "data": {
        "model": "gpt-3.5-turbo",
        "n": 1,
        "top_p": 1,
        "max_tokens": 256,
        "temperature": 2,
        "presence_penalty": 0,
        "frequency_penalty": 0,
        "messages": [\
            {\
                "role": "system",\
                "content": "You're a helpful assistant."\
            },\
            {\
                "role": "user",\
                "content": "Who directed Dune 2?"\
            }\
        ]
    }
}

```

## [​](https://portkey.ai/docs/product/prompt-library/retrieve-prompts\#using-the-render-output-in-a-new-request)  Using the `render` Output in a New Request

Here’s how you can take the output from the `render` API and use it for making a call. We’ll take example of OpenAI SDKs, but you can use it simlarly for any other provider SDK as well.

- OpenAI NodeJS
- OpenAI Python

Copy

```js
import Portkey from 'portkey-ai';
import OpenAI from 'openai';

// Retrieving the Prompt from Portkey

const portkey = new Portkey({
    apiKey: "PORTKEY_API_KEY"
})

async function getPromptTemplate() {
    const render_response = await portkey.prompts.render({
        promptID: "PROMPT_ID",
        variables: { "movie":"Dune 2" }
    })
    return render_response.data;
}

// Making a Call to OpenAI with the Retrieved Prompt

const openai = new OpenAI({
    apiKey: 'OPENAI_API_KEY',
    baseURL: 'https://api.portkey.ai/v1',
    defaultHeaders: {
      'x-portkey-provider': 'openai',
      'x-portkey-api-key': 'PORTKEY_API_KEY',
      'Content-Type': 'application/json',
    }
});

async function main() {
    const PROMPT_TEMPLATE = await getPromptTemplate();
    const chatCompletion = await openai.chat.completions.create(PROMPT_TEMPLATE);
    console.log(chatCompletion.choices[0]);
}

main();

```

Was this page helpful?

YesNo

[Suggest edits](https://github.com/portkey-ai/docs-core/edit/main/product/prompt-library/retrieve-prompts.mdx) [Raise issue](https://github.com/portkey-ai/docs-core/issues/new?title=Issue%20on%20docs&body=Path:%20/product/prompt-library/retrieve-prompts)

[Prompt Partials](https://portkey.ai/docs/product/prompt-library/prompt-partials) [Advanced Prompting with JSON Mode](https://portkey.ai/docs/product/prompt-library/advanced-prompting-with-json-mode)

On this page

- [Using the Render Endpoint/Method](https://portkey.ai/docs/product/prompt-library/retrieve-prompts#using-the-render-endpoint-method)
- [Updating Prompt Params While Retrieving the Prompt](https://portkey.ai/docs/product/prompt-library/retrieve-prompts#updating-prompt-params-while-retrieving-the-prompt)
- [Using the render Output in a New Request](https://portkey.ai/docs/product/prompt-library/retrieve-prompts#using-the-render-output-in-a-new-request)
