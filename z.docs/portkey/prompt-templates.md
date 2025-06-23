[Portkey Docs home page![light logo](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/logo-white.png)![dark logo](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/logo-black.png)](https://portkey.ai/docs)

Search or ask...

Ctrl K

Search...

Navigation

Prompt Library

Prompt Templates

[Documentation](https://portkey.ai/docs/introduction/what-is-portkey) [Integrations](https://portkey.ai/docs/integrations) [Inference API](https://portkey.ai/docs/api-reference/inference-api/introduction) [Admin API](https://portkey.ai/docs/api-reference/admin-api/control-plane/configs/create-config) [Cookbook](https://portkey.ai/docs/guides/getting-started) [Changelog](https://portkey.ai/docs/changelog/2025/jan)

This feature is available for all plans:

- [**Developer**](https://portkey.ai/pricing): 3 Prompt Templates
- [**Production**](https://portkey.ai/pricing) & [**Enterprise**](https://portkey.ai/docs/product/enterprise-offering): Unlimited Prompt Templates

Prompt templates on Portkey are built to be production-ready - Portkey automatically tracks changes, maintains versions, and gives both the developer and the prompt engineer immense flexibility to do fast experimentation without breaking prod.

## [​](https://portkey.ai/docs/product/prompt-library/prompt-templates\#how-to-use-prompt-templates)  How to use Prompt Templates

- On the Portkey app, just click on the “Prompts” button on the left, click on “Create” and a new, blank playground opens up.
- Here you can pick your provider & model of choice - Portkey supports `vision`, `chat`, and `completions` models from 20+ providers. Provider choice here is tied up to [Virtual keys](https://portkey.ai/docs/product/ai-gateway/virtual-keys) so you may see multiple options for the same provider, based on the number of virtual keys you have.
- You can write the user/assistant messages as well as configure all the model parameters like `top_p`, `max_tokens`, `logit_bias` etc - right from UI.
- Portkey prompts also has support for enabling `JSON Mode`, and writing `Tools/Functions` call chains.

![](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/images/product/ai-gateway/ai-20.webp)

* * *

## [​](https://portkey.ai/docs/product/prompt-library/prompt-templates\#templating-engine)  Templating Engine

**Portkey uses** [**Mustache**](https://mustache.github.io/mustache.5.html) **under the hood to power the prompt templates.**

Mustache is a commonly used logic-less templating engine that follows a simple schema for defining variables and more.

With Mustache, prompt templates become even more extensible by letting you incorporate various `{{tags}}` in your prompt template and easily pass your data.

The most common usage of mustache templates is for `{{variables}}`, used to pass a value at runtime.

### [​](https://portkey.ai/docs/product/prompt-library/prompt-templates\#using-variables)  Using Variables

Let’s look at the following template:

![](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/images/product/ai-gateway/ai-21.png)

As you can see, `{{customer_data}}` and `{{chat_query}}` are defined as variables in the template and you can pass their value at the runtime:

- NodeJS SDK
- Python SDK

Copy

```ts
import Portkey from 'portkey-ai'

const portkey = new Portkey()

const response = portkey.prompts.completions.create({
    promptID: "pp-hr-bot-5c8c6e",
    variables: {
        "customer_data":"",
        "chat_query":""
    }
})

```

#### [​](https://portkey.ai/docs/product/prompt-library/prompt-templates\#using-variables-is-just-the-start-portkey-supports-multiple-mustache-tags-that-let-you-extend-the-template-functionality)  Using variables is just the start! Portkey supports multiple Mustache tags that let you extend the template functionality

## [​](https://portkey.ai/docs/product/prompt-library/prompt-templates\#supported-tags)  Supported Tags

| Tag | Functionality | Example |
| --- | --- | --- |
| `{{variable}}` | Variable | Template: Hi! My name is `{{name}}`. I work at `{{company}}`. <br> Data: `Copy{ "name": "Chris",   "company": "GitHub" }`<br> Output: Hi! My name is Chris. I work at Github. |
| `{{#variable}}` `<string>` `{{/variable}}` | Render `<string>` only if variable is true or non Empty | Template: Hello I am Tesla bot. `{{#chat_mode_pleasant}}` Excited to chat with you! `{{chat_mode_pleasant}}` What can I help you with? <br> Data: Copy `{   "chat_mode_pleasant": False }`<br> Output: Hello I am Tesla bot. What can I help you with? |
| `{{^variable}}` ```<string>``{{/variable}}``` | Render `<string>` only if variable is false or empty | Template: Hello I am Tesla bot. `{{^chat_mode_pleasant}}` Excited to chat with you! `{{/chat_mode_pleasant}}` What can I help you with? <br> Data: Copy `{   "chat_mode_pleasant": False }`<br> Output: Hello I am Tesla bot. Excited to chat with you! What can I help you with? |
| `{{#variable}}` `{{sub_variable}}` `{{/variable}}` | Iteratively render all the values of sub\_variable if variable is true or non Empty | Template: Give atomic symbols for the following: `{{#variable}}` \- `{{sub_variable}}` `{{/variable}}`<br> Data: Copy `{  "variable": \[     { "sub\_variable": "Gold" },     { "sub\_variable": "Carbon" },     { "sub\_variable": "Zinc" }   \] }`<br> Output: Give atomic symbols for the following: - Gold - Carbon - Zinc |
| `{{! Comment}}` | Comments that are ignored | Template: Hello I am Tesla bot. `{{! How do tags work?}}` What can I help you with? <br> Data: Copy <br> Output: Hello I am Tesla bot. What can I help you with? |
| `{{>Partials}}` | ”Mini-templates” that can be called at runtime. On Portkey, you can save partials separately and call them in your prompt templates by typing `{{>` | Template: Hello I am Tesla bot. `{{>pp-tesla-template}}` What can I help you with? <br> Data in `pp-tesla-template`: CopyTake the context from `{{context}}`. And answer user questions. <br> Output: Hello I am Tesla bot. Take the context from `{{context}}`. And answer user questions. What can I help you with? |
| `{{>>Partial Variables}}` | Pass your privately saved partials to Portkey by creating tags with double >>Like: `{{>> }}` This is helpful if you do not want to save your partials with Portkey but are maintaining them elsewhere | Template: Hello I am Tesla bot. `{{>>My Private Partial}}` What can I help you with? |

## [​](https://portkey.ai/docs/product/prompt-library/prompt-templates\#using-tags)  Using Tags

You can directly pass your data object containing all the variable/tags info (in JSON) to Portkey’s `prompts.completions` method with the `variables` property.

**For example, here’s a prompt partial containing the key instructions for an AI support bot:**

![](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/images/product/ai-gateway/ai-22.avif)

**And the prompt template uses the partial like this:**

![](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/images/product/ai-gateway/ai-23.avif)

**We can pass the data object inside the variables:**

- NodeJS SDK
- Python SDK

Copy

```ts
import Portkey from 'portkey-ai'

const portkey = new Portkey({
    apiKey: "YOUR_PORTKEY_API_KEY"
})

const data = {
    "company": "NESTLE",
    "product": "MAGGI",
    "benefits": "HEALTH",
    "phone number": "123456",
    "name": "Sheila",
    "device": "iOS",
    "query": "Product related",
    "test_variable":"Something unrelated" // Your data object can also contain unrelated variables
}

// Make the prompt creation call with the variables

const response = portkey.prompts.completions.create({
    promptID: "pp-system-pro-34a60b",
    variables: {
        ...data,
        "user_query": "I ate Maggi and I think it was stale."
    }
})

console.log(response)

```

* * *

## [​](https://portkey.ai/docs/product/prompt-library/prompt-templates\#versioning-prompts)  Versioning Prompts

Whenever any changes are made to your prompt template, Portkey saves your changes in the browser **but** they are **not pushed** to Portkey. You can click on the `Update` button on the top right to save the latest version of the prompt on Portkey.

![](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/images/product/ai-gateway/ai-24.png)

**All** of your prompt versions can be seen on the right column of the playground:

![](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/images/product/ai-gateway/ai-25.png)

You can `Restore` or `Publish` any of the previous versions by clicking on the elipsis.

* * *

## [​](https://portkey.ai/docs/product/prompt-library/prompt-templates\#using-different-prompt-versions)  Using Different Prompt Versions

By default, when you pass the `PROMPT_ID` in `prompts.completions.create` method, Portkey sends the request to the `Published` version of your prompt.

But, you can also call any of the other prompt versions (that you can see on the right side bar) by appending their version numbers with the `PROMPT_ID` slug.

**For example,**

Copy

```js
response = portkey.prompts.completions.create(
    prompt_id="pp-classification-prompt@12",
    variables={ }
)

```

Here, I am sending my request to **Version #12** of my prompt template. Portkey also has the `latest` tag that will always send the request to the **latest available version** of your prompt, regardless if it’s published or not.

Copy

```js
response = portkey.prompts.completions.create(
    prompt_id="pp-classification-prompt@latest",
    variables={ }
)

```

- `latest` refers to the last version of prompt, it may not be the same as the `Published` version of your prompt.
- When no suffix is provided, Portkey defaults to send the request to the `Published` version of the prompt

This feature allows you to easily switch between different versions of your prompts for experimenting or specific use cases without affecting your production environment.

* * *

## [​](https://portkey.ai/docs/product/prompt-library/prompt-templates\#prompt-labels)  Prompt Labels

You can add version tags/labels like `staging`, `production` to any prompt version to track changes, and call them directly:

![](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/images/changelog/prompt-labels.gif)

@staging

@dev

@prod

Copy

```ts
const promptCompletion = portkey.prompts.completions.create({
    promptID: "pp-article-xx@staging",
    variables: {"":""}
})

```

- There are 3 default labels: `production`, `staging`, `development` which can not be removed.
- Custom labels are unique to the workspace where they are created.
- If you delete a custom label, any prompt completion requests to that label will start failing.

* * *

## [​](https://portkey.ai/docs/product/prompt-library/prompt-templates\#publishing-prompts)  Publishing Prompts

Updating the Prompt does not automatically update your prompt in production. While updating, you can tick `Publish prompt changes` which will also update your prompt deployment to the latest version.

![](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/images/product/ai-gateway/ai-26.png)

* * *

## [​](https://portkey.ai/docs/product/prompt-library/prompt-templates\#faqs)  FAQs

How many prompt templates can I create on Portkey?

On the Prod or Enterprise Portkey plans, you can create unlimited prompt templates, while on the free Dev plan, you can create upto 3 prompt templates.

How can I move my existing prompt template to a folder?

You will see a “move” icon next to the various actions buttons when you hover on your prompt template. You can click on it and then choose which folder you’d like to move the prompt to.

I want to move multiple prompts to a folder. How to do that?

Portkey supports multi-select for prompt templates. First select all the prompts you want, and at the top of the prompts page you will see the “move” icon using which you can move all the selected prompts to another folder.

Was this page helpful?

YesNo

[Suggest edits](https://github.com/portkey-ai/docs-core/edit/main/product/prompt-library/prompt-templates.mdx) [Raise issue](https://github.com/portkey-ai/docs-core/issues/new?title=Issue%20on%20docs&body=Path:%20/product/prompt-library/prompt-templates)

[Prompt Library](https://portkey.ai/docs/product/prompt-library) [Prompt Partials](https://portkey.ai/docs/product/prompt-library/prompt-partials)

On this page

- [How to use Prompt Templates](https://portkey.ai/docs/product/prompt-library/prompt-templates#how-to-use-prompt-templates)
- [Templating Engine](https://portkey.ai/docs/product/prompt-library/prompt-templates#templating-engine)
- [Using Variables](https://portkey.ai/docs/product/prompt-library/prompt-templates#using-variables)
- [Using variables is just the start! Portkey supports multiple Mustache tags that let you extend the template functionality:](https://portkey.ai/docs/product/prompt-library/prompt-templates#using-variables-is-just-the-start-portkey-supports-multiple-mustache-tags-that-let-you-extend-the-template-functionality)
- [Supported Tags](https://portkey.ai/docs/product/prompt-library/prompt-templates#supported-tags)
- [Using Tags](https://portkey.ai/docs/product/prompt-library/prompt-templates#using-tags)
- [Versioning Prompts](https://portkey.ai/docs/product/prompt-library/prompt-templates#versioning-prompts)
- [Using Different Prompt Versions](https://portkey.ai/docs/product/prompt-library/prompt-templates#using-different-prompt-versions)
- [Prompt Labels](https://portkey.ai/docs/product/prompt-library/prompt-templates#prompt-labels)
- [Publishing Prompts](https://portkey.ai/docs/product/prompt-library/prompt-templates#publishing-prompts)
- [FAQs](https://portkey.ai/docs/product/prompt-library/prompt-templates#faqs)

![](https://portkey.ai/docs/product/prompt-library/prompt-templates)

![](https://portkey.ai/docs/product/prompt-library/prompt-templates)

![](https://portkey.ai/docs/product/prompt-library/prompt-templates)

![](https://portkey.ai/docs/product/prompt-library/prompt-templates)

![](https://portkey.ai/docs/product/prompt-library/prompt-templates)

![](https://portkey.ai/docs/product/prompt-library/prompt-templates)
