[Portkey Docs home page![light logo](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/logo-white.png)![dark logo](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/logo-black.png)](https://portkey.ai/docs)

Search or ask...

Ctrl K

Search...

Navigation

Prompt Library

Prompt Partials

[Documentation](https://portkey.ai/docs/introduction/what-is-portkey) [Integrations](https://portkey.ai/docs/integrations) [Inference API](https://portkey.ai/docs/api-reference/inference-api/introduction) [Admin API](https://portkey.ai/docs/api-reference/admin-api/control-plane/configs/create-config) [Cookbook](https://portkey.ai/docs/guides/getting-started) [Changelog](https://portkey.ai/docs/changelog/2025/jan)

This feature is available on all Portkey [plans](https://portkey.ai/pricing).

Partials can also serve as a global variable store. You can define common variables that are used across multiple of your prompt template and can reference or update them easily.

## [​](https://portkey.ai/docs/product/prompt-library/prompt-partials\#creating-partials)  Creating Partials

Partials are directly accessible from the Prompts Page:

![](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/images/product/ai-gateway/ai-27.avif)

You can create a new Partial and use it for any purpose in any of your prompt templates. For example, here’s a prompt partial where we are separately storing the instructions:

![](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/images/product/ai-gateway/ai-28.avif)

Upon saving, each Partial generates a unique ID that you can use inside prompt templates.

### [​](https://portkey.ai/docs/product/prompt-library/prompt-partials\#template-engine)  Template Engine

Partials also follow the [Mustache template engine](https://mustache.github.io/) and let you easily handle data input at runtime by using tags.

Portkey supports `{{variable}}`, `{{#block}} <string> {{/block}}`, `{{^block}}` and other tags.

[**Check out this comprehensive guide on how to use tags**](https://portkey.ai/docs/product/prompt-library/prompt-templates#templating-engine).

### [​](https://portkey.ai/docs/product/prompt-library/prompt-partials\#versioning)  Versioning

Portkey follow the same `Update` **&** `Publish` flow as prompt templates. You can keep updating the partial and save new versions, and choose to send any version to prod using the `Publish` feature.

All the version history for any partial is avaiable on the right column and any previous version can be restored to be `latest` or `published` to prod easily.

* * *

## [​](https://portkey.ai/docs/product/prompt-library/prompt-partials\#using-partials)  Using Partials

You can call Partials by their ID inside any prompt template by just starting to type `{{>`

Portkey lists all of the available prompt partials with their names to help you easily pick.

![](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/images/product/ai-gateway/ai-29.png)

When a partial is incorporated in a template, all the variables/blocks defined are also rendered on the Prompt variables section:

![](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/images/product/ai-gateway/ai-30.webp)

When a new Partial version is **Published**, your partial that is in use in any of the prompt templates also gets automatically updated.

### [​](https://portkey.ai/docs/product/prompt-library/prompt-partials\#making-a-prompt-completion-request)  Making a Prompt Completion Request

All the variables/tags defined inside the partial can now be directly called at the time of making a `prompts.completion` request:

- NodeJS SDK
- Python SDK

Copy

```js
const response = portkey.prompts.completions.create({
    promptID: "pp-system-pro-34a60b",
    variables: {
        "user_query":"",
        "company":"",
        "product":"",
        "benefits":"",
        "phone number":"",
        "name":"",
        "device":"",
        "query":""
    }
})

```

Was this page helpful?

YesNo

[Suggest edits](https://github.com/portkey-ai/docs-core/edit/main/product/prompt-library/prompt-partials.mdx) [Raise issue](https://github.com/portkey-ai/docs-core/issues/new?title=Issue%20on%20docs&body=Path:%20/product/prompt-library/prompt-partials)

[Prompt Templates](https://portkey.ai/docs/product/prompt-library/prompt-templates) [Retrieve Prompts](https://portkey.ai/docs/product/prompt-library/retrieve-prompts)

On this page

- [Creating Partials](https://portkey.ai/docs/product/prompt-library/prompt-partials#creating-partials)
- [Template Engine](https://portkey.ai/docs/product/prompt-library/prompt-partials#template-engine)
- [Versioning](https://portkey.ai/docs/product/prompt-library/prompt-partials#versioning)
- [Using Partials](https://portkey.ai/docs/product/prompt-library/prompt-partials#using-partials)
- [Making a Prompt Completion Request](https://portkey.ai/docs/product/prompt-library/prompt-partials#making-a-prompt-completion-request)

![](https://portkey.ai/docs/product/prompt-library/prompt-partials)

![](https://portkey.ai/docs/product/prompt-library/prompt-partials)

![](https://portkey.ai/docs/product/prompt-library/prompt-partials)
