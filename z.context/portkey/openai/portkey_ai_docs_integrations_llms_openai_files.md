[Portkey Docs home page![light logo](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/logo-white.png)![dark logo](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/logo-black.png)](https://portkey.ai/docs)

Search or ask...

Ctrl K

Search...

Navigation

OpenAI

Files

[Documentation](https://portkey.ai/docs/introduction/what-is-portkey) [Integrations](https://portkey.ai/docs/integrations) [Inference API](https://portkey.ai/docs/api-reference/inference-api/introduction) [Admin API](https://portkey.ai/docs/api-reference/admin-api/control-plane/configs/create-config) [Cookbook](https://portkey.ai/docs/guides/getting-started) [Changelog](https://portkey.ai/docs/changelog/2025/jan)

With Portkey, you can upload the file in [OpenAI format](https://platform.openai.com/docs/guides/batch#1-preparing-your-batch-file) and portkey will upload the file to OpenAI!

This is the most efficient way to

- Test your data with different foundation models
- Perform A/B testing with different foundation models
- Perform batch inference with different foundation models

## [​](https://portkey.ai/docs/integrations/llms/openai/files\#uploading-files)  Uploading Files

Copy

```sh
curl --location --request POST 'https://api.portkey.ai/v1/files' \
--header 'x-portkey-api-key: <portkey_api_key>' \
--form 'purpose="<purpose>"' \
--form 'file=@"<file_path>"'

```

## [​](https://portkey.ai/docs/integrations/llms/openai/files\#list-files)  List Files

Copy

```sh
curl --location 'https://api.portkey.ai/v1/files' \
--header 'x-portkey-api-key: <portkey_api_key>'

```

## [​](https://portkey.ai/docs/integrations/llms/openai/files\#get-file)  Get File

Copy

```sh
curl --location 'https://api.portkey.ai/v1/files/<file_id>' \
--header 'x-portkey-api-key: <portkey_api_key>'

```

## [​](https://portkey.ai/docs/integrations/llms/openai/files\#get-file-content)  Get File Content

Copy

```sh
curl --location 'https://api.portkey.ai/v1/files/<file_id>/content' \
--header 'x-portkey-api-key: <portkey_api_key>'

```

## [​](https://portkey.ai/docs/integrations/llms/openai/files\#delete-file)  Delete File

Copy

```sh
curl --location --request DELETE 'https://api.portkey.ai/v1/files/<file_id>' \
--header 'x-portkey-api-key: <portkey_api_key>'

```

Was this page helpful?

YesNo

[Suggest edits](https://github.com/portkey-ai/docs-core/edit/main/integrations/llms/openai/files.mdx) [Raise issue](https://github.com/portkey-ai/docs-core/issues/new?title=Issue%20on%20docs&body=Path:%20/integrations/llms/openai/files)

[Prompt Caching](https://portkey.ai/docs/integrations/llms/openai/prompt-caching-openai) [Batches](https://portkey.ai/docs/integrations/llms/openai/batches)

On this page

- [Uploading Files](https://portkey.ai/docs/integrations/llms/openai/files#uploading-files)
- [List Files](https://portkey.ai/docs/integrations/llms/openai/files#list-files)
- [Get File](https://portkey.ai/docs/integrations/llms/openai/files#get-file)
- [Get File Content](https://portkey.ai/docs/integrations/llms/openai/files#get-file-content)
- [Delete File](https://portkey.ai/docs/integrations/llms/openai/files#delete-file)