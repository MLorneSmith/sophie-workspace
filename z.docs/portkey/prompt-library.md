[Portkey Docs home page![light logo](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/logo-white.png)![dark logo](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/logo-black.png)](https://portkey.ai/docs)

Search or ask...

Ctrl K

Search...

Navigation

Prompt Library

Prompt Library

[Documentation](https://portkey.ai/docs/introduction/what-is-portkey) [Integrations](https://portkey.ai/docs/integrations) [Inference API](https://portkey.ai/docs/api-reference/inference-api/introduction) [Admin API](https://portkey.ai/docs/api-reference/admin-api/control-plane/configs/create-config) [Cookbook](https://portkey.ai/docs/guides/getting-started) [Changelog](https://portkey.ai/docs/changelog/2025/jan)

This enables you to experiment with various combinations of parameters and prompts effortlessly, view the outputs, iterate, and when satisfied, deploy with a single click.

#### [​](https://portkey.ai/docs/product/prompt-library\#setting-up-ai-providers)  Setting Up AI Providers

Before you can create and manage prompts, you’ll need to set up your [Virtual Keys](https://portkey.ai/docs/product/ai-gateway/virtual-keys). After saving the key, the respective AI provider can be used to run and manage prompts.

#### [​](https://portkey.ai/docs/product/prompt-library\#defining-and-saving-prompts)  Defining and Saving Prompts

The UI allows you to input your model prompt, set various parameters like model type, temperature, max tokens, and so on. Once you’re happy with the prompt and its parameters, you can save it. Portkey’s UI makes it easy for you to test and modify your prompts before saving.

#### [​](https://portkey.ai/docs/product/prompt-library\#versioning-of-prompts)  Versioning of Prompts

Portkey provides versioning of prompts, so any update on the saved prompt will create a new version. You can switch back to an older version anytime. This feature allows you to experiment with changes to your prompts, while always having the option to revert to a previous version if needed.

#### [​](https://portkey.ai/docs/product/prompt-library\#prompt-templating)  Prompt Templating

Portkey supports variables inside prompts to allow for prompt templating. This enables you to create dynamic prompts that can change based on the variables passed in. You can add as many variables as you need, but note that all variables should be strictly string. This powerful feature allows you to reuse and personalize your prompts for different use cases or users.

#### [​](https://portkey.ai/docs/product/prompt-library\#api-endpoint-for-saved-prompts)  API Endpoint for Saved Prompts

For each saved prompt, there is a tab called “API” which shows the API endpoint for the saved model. Users can directly call this API and pass the variables required in their prompt template. This makes it easy to integrate your saved prompts into your application or service.

#### [​](https://portkey.ai/docs/product/prompt-library\#retrieving-saved-prompt-templates)  Retrieving Saved Prompt Templates

You can use the `render` endpoint to retrieve your saved prompt template on Portkey. Read more below:

[**Retrieve Prompts**](https://portkey.ai/docs/product/prompt-library/retrieve-prompts)

#### [​](https://portkey.ai/docs/product/prompt-library\#global-prompt-partials)  Global Prompt Partials

Docs coming soon!

#### [​](https://portkey.ai/docs/product/prompt-library\#advanded-prompting-with-json-mode)  Advanded Prompting with JSON Mode

Docs coming soon!

* * *

## [​](https://portkey.ai/docs/product/prompt-library\#multimodal-prompts)  Multimodal Prompts

Portkey’s prompt playground also supports vision models. You can pass image URL/data along with the rest of your messages body and deploy multimodal prompt templates to production easily.

* * *

## [​](https://portkey.ai/docs/product/prompt-library\#prompts-in-logs)  Prompts in Logs

You can easily view only the logs for a specific prompt template by filtering the logs on that relevant prompt template.

Portkey also shows you the Prompt template’s name separately in the log’s details - you can easily jump into viewing/editing the prompt template directly from the log details page.

Was this page helpful?

YesNo

[Suggest edits](https://github.com/portkey-ai/docs-core/edit/main/product/prompt-library.mdx) [Raise issue](https://github.com/portkey-ai/docs-core/issues/new?title=Issue%20on%20docs&body=Path:%20/product/prompt-library)

[Batches](https://portkey.ai/docs/product/ai-gateway/batches) [Prompt Templates](https://portkey.ai/docs/product/prompt-library/prompt-templates)

On this page

- [Setting Up AI Providers](https://portkey.ai/docs/product/prompt-library#setting-up-ai-providers)
- [Defining and Saving Prompts](https://portkey.ai/docs/product/prompt-library#defining-and-saving-prompts)
- [Versioning of Prompts](https://portkey.ai/docs/product/prompt-library#versioning-of-prompts)
- [Prompt Templating](https://portkey.ai/docs/product/prompt-library#prompt-templating)
- [API Endpoint for Saved Prompts](https://portkey.ai/docs/product/prompt-library#api-endpoint-for-saved-prompts)
- [Retrieving Saved Prompt Templates](https://portkey.ai/docs/product/prompt-library#retrieving-saved-prompt-templates)
- [Global Prompt Partials](https://portkey.ai/docs/product/prompt-library#global-prompt-partials)
- [Advanded Prompting with JSON Mode](https://portkey.ai/docs/product/prompt-library#advanded-prompting-with-json-mode)
- [Multimodal Prompts](https://portkey.ai/docs/product/prompt-library#multimodal-prompts)
- [Prompts in Logs](https://portkey.ai/docs/product/prompt-library#prompts-in-logs)