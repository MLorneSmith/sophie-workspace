[Portkey Docs home page![light logo](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/logo-white.png)![dark logo](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/logo-black.png)](https://portkey.ai/docs)

Search or ask...

Ctrl K

Search...

Navigation

OpenAI

Batches

[Documentation](https://portkey.ai/docs/introduction/what-is-portkey) [Integrations](https://portkey.ai/docs/integrations) [Inference API](https://portkey.ai/docs/api-reference/inference-api/introduction) [Admin API](https://portkey.ai/docs/api-reference/admin-api/control-plane/configs/create-config) [Cookbook](https://portkey.ai/docs/guides/getting-started) [Changelog](https://portkey.ai/docs/changelog/2025/jan)

With Portkey, you can perform [OpenAI Batch Inference](https://platform.openai.com/docs/guides/batch) operations.
This is the most efficient way to

- Test your data with different foundation models
- Perform A/B testing with different foundation models
- Perform batch inference with different foundation models

## [​](https://portkey.ai/docs/integrations/llms/openai/batches#start-batch-inference) Start Batch Inference

Copy

```sh
curl --location 'https://api.portkey.ai/v1/batches' \
--header 'x-portkey-api-key: <portkey_api_key>' \
--header 'x-portkey-virtual-key: <virtual_key>' \
--header 'Content-Type: application/json' \
--data '{
    "input_file_id": "<file_id>",
    "endpoint": "<endpoint>",
    "completion_window": "<completion_window>",
    "metadata": {},
}'

```

## [​](https://portkey.ai/docs/integrations/llms/openai/batches#list-batch-inferences) List Batch Inferences

Copy

```sh
curl --location 'https://api.portkey.ai/v1/batches' \
--header 'x-portkey-api-key: <portkey_api_key>' \
--header 'x-portkey-virtual-key: <virtual_key>'

```

## [​](https://portkey.ai/docs/integrations/llms/openai/batches#get-batch-inference) Get Batch Inference

Copy

```sh
curl --location 'https://api.portkey.ai/v1/batches/<batch_id>' \
--header 'x-portkey-api-key: <portkey_api_key>' \
--header 'x-portkey-virtual-key: <virtual_key>'

```

## [​](https://portkey.ai/docs/integrations/llms/openai/batches#cancel-batch-inference) Cancel Batch Inference

Copy

```sh
curl --location --request POST 'https://api.portkey.ai/v1/batches/<batch_id>/cancel' \
--header 'x-portkey-api-key: <portkey_api_key>' \
--header 'x-portkey-virtual-key: <virtual_key>'

```

## [​](https://portkey.ai/docs/integrations/llms/openai/batches#get-batch-output) Get Batch Output

**This is a Gateway only feature**

Copy

```sh
curl --location 'https://api.portkey.ai/v1/batches/<batch_id>/output' \
--header 'x-portkey-api-key: <portkey_api_key>' \
--header 'x-portkey-virtual-key: <virtual_key>'

```

Was this page helpful?

YesNo

[Suggest edits](https://github.com/portkey-ai/docs-core/edit/main/integrations/llms/openai/batches.mdx) [Raise issue](https://github.com/portkey-ai/docs-core/issues/new?title=Issue%20on%20docs&body=Path:%20/integrations/llms/openai/batches)

[Files](https://portkey.ai/docs/integrations/llms/openai/files) [Anthropic](https://portkey.ai/docs/integrations/llms/anthropic)

On this page

- [Start Batch Inference](https://portkey.ai/docs/integrations/llms/openai/batches#start-batch-inference)
- [List Batch Inferences](https://portkey.ai/docs/integrations/llms/openai/batches#list-batch-inferences)
- [Get Batch Inference](https://portkey.ai/docs/integrations/llms/openai/batches#get-batch-inference)
- [Cancel Batch Inference](https://portkey.ai/docs/integrations/llms/openai/batches#cancel-batch-inference)
- [Get Batch Output](https://portkey.ai/docs/integrations/llms/openai/batches#get-batch-output)
