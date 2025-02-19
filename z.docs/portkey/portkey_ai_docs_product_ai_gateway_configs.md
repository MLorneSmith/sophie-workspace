[Portkey Docs home page![light logo](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/logo-white.png)![dark logo](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/logo-black.png)](https://portkey.ai/docs)

Search or ask...

Ctrl K

Search...

Navigation

AI Gateway

Configs

[Documentation](https://portkey.ai/docs/introduction/what-is-portkey) [Integrations](https://portkey.ai/docs/integrations) [Inference API](https://portkey.ai/docs/api-reference/inference-api/introduction) [Admin API](https://portkey.ai/docs/api-reference/admin-api/control-plane/configs/create-config) [Cookbook](https://portkey.ai/docs/guides/getting-started) [Changelog](https://portkey.ai/docs/changelog/2025/jan)

Available on all Portkey plans.

Configs streamline your Gateway management, enabling you to programmatically control various aspects like fallbacks, load balancing, retries, caching, and more.

A configuration is a JSON object that can be used to define routing rules for all the requests coming to your gateway. You can configure multiple configs and use them in your requests.

## [​](https://portkey.ai/docs/product/ai-gateway/configs\#creating-configs)  Creating Configs

Navigate to the ‘Configs’ page in the Portkey app and click ‘Create’ to start writing a new config.

## [​](https://portkey.ai/docs/product/ai-gateway/configs\#using-configs)  Using Configs

Configs are supported across all integrations.

- Through the config parameter of the Portkey SDK client(Directly or via [frameworks](https://portkey.ai/docs/integrations/llms))
- Through the config headers in the OpenAI SDK
- Via the REST API through the `x-portkey-config` header

### [​](https://portkey.ai/docs/product/ai-gateway/configs\#applying-gateway-configs)  Applying Gateway Configs

Gateway [configs](https://portkey.ai/docs/product/ai-gateway/configs) allow you to unlock the gateway superpowers of Portkey. You can create a config in the UI and attach it’s config id in the OpenAI client.

- NodeJS
- Python
- OpenAI NodeJS
- OpenAI Python
- cURL

Copy

```js
const portkey = new Portkey({
    apiKey: "PORTKEY_API_KEY",
    config: "pc-***" // Supports a string config id or a config object
});

```

If you want to attach the configuration to only a few requests instead of modifying the client, you can send it in the request headers for OpenAI or in the config parameter while using the Portkey SDK.

> Note: If you have a default configuration set in the client, but also include a configuration in a specific request, the request-specific configuration will take precedence and replace the default config for that particular request.

- NodeJS
- Python
- OpenAI NodeJS
- OpenAI Python

Copy

```js
portkey.chat.completions.create({
  messages: [{role: "user", content: "Say this is a test"}],
  model: "gpt-3.5-turbo"
}, {config: "pc-***"})

```

You can also add the config JSON as a string instead of the slug.

## [​](https://portkey.ai/docs/product/ai-gateway/configs\#configs-in-logs)  Configs in Logs

Portkey shows your Config usage smartly on the logs page with the **Status column** and gives you a snapshot of the Gateway activity for every request. [Read more about the status column here](https://portkey.ai/docs/product/observability/logs#request-status-guide).

You can also see the ID of the specific Config used for a request separately in the log details, and jump into viewing/editing it directly from the log details page.

## [​](https://portkey.ai/docs/product/ai-gateway/configs\#config-object-documentation)  Config Object Documentation

Find detailed info about the Config object schema, and more examples:

[**Config Schema**](https://portkey.ai/docs/api-reference/inference-api/config-object)

Was this page helpful?

YesNo

[Suggest edits](https://github.com/portkey-ai/docs-core/edit/main/product/ai-gateway/configs.mdx) [Raise issue](https://github.com/portkey-ai/docs-core/issues/new?title=Issue%20on%20docs&body=Path:%20/product/ai-gateway/configs)

[Universal API](https://portkey.ai/docs/product/ai-gateway/universal-api) [Conditional Routing](https://portkey.ai/docs/product/ai-gateway/conditional-routing)

On this page

- [Creating Configs](https://portkey.ai/docs/product/ai-gateway/configs#creating-configs)
- [Using Configs](https://portkey.ai/docs/product/ai-gateway/configs#using-configs)
- [Applying Gateway Configs](https://portkey.ai/docs/product/ai-gateway/configs#applying-gateway-configs)
- [Configs in Logs](https://portkey.ai/docs/product/ai-gateway/configs#configs-in-logs)
- [Config Object Documentation](https://portkey.ai/docs/product/ai-gateway/configs#config-object-documentation)