[Portkey Docs home page![light logo](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/logo-white.png)![dark logo](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/logo-black.png)](https://portkey.ai/docs)

Search or ask...

Ctrl K

Search...

Navigation

AI Gateway

Cache (Simple & Semantic)

[Documentation](https://portkey.ai/docs/introduction/what-is-portkey) [Integrations](https://portkey.ai/docs/integrations) [Inference API](https://portkey.ai/docs/api-reference/inference-api/introduction) [Admin API](https://portkey.ai/docs/api-reference/admin-api/control-plane/configs/create-config) [Cookbook](https://portkey.ai/docs/guides/getting-started) [Changelog](https://portkey.ai/docs/changelog/2025/jan)

**Simple** caching is available for all plans.

**Semantic** caching is available for [**Production**](https://portkey.ai/pricing) and [**Enterprise**](https://portkey.ai/docs/product/enterprise-offering) users.

Speed up and save money on your LLM requests by storing past responses in the Portkey cache. There are 2 cache modes:

- **Simple:** Matches requests verbatim. Perfect for repeated, identical prompts. Works on **all models** including image generation models.
- **Semantic:** Matches responses for requests that are semantically similar. Ideal for denoising requests with extra prepositions, pronouns, etc. Works on any model available on `/chat/completions` or `/completions` routes.

Portkey cache serves requests upto **20x times faster** and **cheaper**.

## [​](https://portkey.ai/docs/product/ai-gateway/cache-simple-and-semantic\#enable-cache-in-the-config)  Enable Cache in the Config

To enable Portkey cache, just add the `cache` params to your [config object](https://portkey.ai/docs/api-reference/config-object#cache-object-details).

## [​](https://portkey.ai/docs/product/ai-gateway/cache-simple-and-semantic\#simple-cache)  Simple Cache

Copy

```sh
"cache": { "mode": "simple" }

```

### [​](https://portkey.ai/docs/product/ai-gateway/cache-simple-and-semantic\#how-it-works)  How it Works

Simple cache performs an exact match on the input prompts. If the exact same request is received again, Portkey retrieves the response directly from the cache, bypassing the model execution.

* * *

## [​](https://portkey.ai/docs/product/ai-gateway/cache-simple-and-semantic\#semantic-cache)  Semantic Cache

Copy

```sh
"cache": { "mode": "semantic" }

```

### [​](https://portkey.ai/docs/product/ai-gateway/cache-simple-and-semantic\#how-it-works-2)  How it Works

Semantic cache considers the contextual similarity between input requests. It uses cosine similarity to ascertain if the similarity between the input and a cached request exceeds a specific threshold. If the similarity threshold is met, Portkey retrieves the response from the cache, saving model execution time. Check out this [blog](https://portkey.ai/blog/reducing-llm-costs-and-latency-semantic-cache/) for more details on how we do this.

Semantic cache is a “superset” of both caches. Setting cache mode to “semantic” will work for when there are simple cache hits as well.

To optimise for accurate cache hit rates, Semantic cache only works with requests with less than 8,191 input tokens, and with number of messages (human, assistant, system combined) less than or equal to 4.

### [​](https://portkey.ai/docs/product/ai-gateway/cache-simple-and-semantic\#ignoring-the-first-message-in-semantic-cache)  Ignoring the First Message in Semantic Cache

When using the `/chat/completions` endpoint, Portkey requires at least **two** message objects in the `messages` array. The first message object, typically used for the `system` message, is not considered when determining semantic similarity for caching purposes.

For example:

Copy

```JSON
messages = [\
        { "role": "system", "content": "You are a helpful assistant" },\
        { "role": "user", "content": "Who is the president of the US?" }\
]

```

In this case, only the content of the `user` message (“Who is the president of the US?”) is used for finding semantic matches in the cache. The `system` message (“You are a helpful assistant”) is ignored.

This means that even if you change the `system` message while keeping the `user` message semantically similar, Portkey will still return a semantic cache hit.

This allows you to modify the behavior or context of the assistant without affecting the cache hits for similar user queries.

### [​](https://portkey.ai/docs/product/ai-gateway/cache-simple-and-semantic\#read-more-how-to-set-cache-in-configs)  [Read more how to set cache in Configs](https://portkey.ai/docs/product/ai-gateway/cache-simple-and-semantic\#how-cache-works-with-configs)

* * *

## [​](https://portkey.ai/docs/product/ai-gateway/cache-simple-and-semantic\#setting-cache-age)  Setting Cache Age

You can set the age (or “ttl”) of your cached response with this setting. Cache age is also set in your Config object:

Copy

```json
"cache": {
    "mode": "semantic",
    "max_age": 60
}

```

In this example, your cache will automatically expire after 60 seconds. Cache age is set in **seconds**.

- **Minimum** cache age is **60 seconds**
- **Maximum** cache age is **90 days** (i.e. **7776000** seconds)
- **Default** cache age is **7 days** (i.e. **604800** seconds)

* * *

## [​](https://portkey.ai/docs/product/ai-gateway/cache-simple-and-semantic\#force-refresh-cache)  Force Refresh Cache

Ensure that a new response is fetched and stored in the cache even when there is an existing cached response for your request. Cache force refresh can only be done **at the time of making a request**, and it is **not a part of your Config**.

You can enable cache force refresh with this header:

Copy

```sh
"x-portkey-cache-force-refresh": "True"

```

- NodeJS
- Python
- Node

Copy

```sh
curl https://api.portkey.ai/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "x-portkey-api-key: $PORTKEY_API_KEY" \
  -H "x-portkey-virtual-key: open-ai-xxx" \
  -H "x-portkey-config: cache-config-xxx" \
  -H "x-portkey-cache-force-refresh: true" \
  -d '{
    "messages": [{"role": "user","content": "Hello!"}]
  }'

```

- Cache force refresh is only activated if a cache config is **also passed** along with your request. (setting `cacheForceRefresh` as `true` without passing the relevant cache config will not have any effect)
- For requests that have previous semantic hits, force refresh is performed on ALL the semantic matches of your request.

* * *

## [​](https://portkey.ai/docs/product/ai-gateway/cache-simple-and-semantic\#cache-namespace-simplified-cache-partitioning)  Cache Namespace: Simplified Cache Partitioning

Portkey generally partitions the cache along all the values passed in your request header. With a custom cache namespace, you can now ignore metadata and other headers, and only partition the cache based on the custom strings that you send.

This allows you to have finer control over your cached data and optimize your cache hit ratio.

### [​](https://portkey.ai/docs/product/ai-gateway/cache-simple-and-semantic\#how-it-works-3)  How It Works

To use Cache Namespaces, simply include the `x-portkey-cache-namespace` header in your API requests, followed by any custom string value. Portkey will then use this namespace string as the sole basis for partitioning the cache, disregarding all other headers, including metadata.

For example, if you send the following header:

Copy

```sh
"x-portkey-cache-namespace: user-123"

```

Portkey will cache the response under the namespace `user-123`, ignoring any other headers or metadata associated with the request.

- NodeJS
- Python
- cURL

Copy

```JS
import Portkey from 'portkey-ai';

const portkey = new Portkey({
    apiKey: "PORTKEY_API_KEY",
    config: "pc-cache-xxx",
    virtualKey: "open-ai-xxx"
})

async function main(){
    const response = await portkey.chat.completions.create({
        messages: [{ role: 'user', content: 'Hello' }],
        model: 'gpt-4',
    }, {
        cacheNamespace: 'user-123'
    });
}

main()

```

In this example, the response will be cached under the namespace `user-123`, ignoring any other headers or metadata.

* * *

## [​](https://portkey.ai/docs/product/ai-gateway/cache-simple-and-semantic\#cache-in-analytics)  Cache in Analytics

Portkey shows you powerful stats on cache usage on the Analytics page. Just head over to the Cache tab, and you will see:

- Your raw number of cache hits as well as daily cache hit rate
- Your average latency for delivering results from cache and how much time it saves you
- How much money the cache saves you

## [​](https://portkey.ai/docs/product/ai-gateway/cache-simple-and-semantic\#cache-in-logs)  Cache in Logs

On the Logs page, the cache status is updated on the Status column. You will see `Cache Disabled` when you are not using the cache, and any of `Cache Miss`, `Cache Refreshed`, `Cache Hit`, `Cache Semantic Hit` based on the cache hit status. Read more [here](https://portkey.ai/docs/product/observability/logs).

![](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/images/product/ai-gateway/ai-11.png)

For each request we also calculate and show the cache response time and how much money you saved with each hit.

* * *

## [​](https://portkey.ai/docs/product/ai-gateway/cache-simple-and-semantic\#how-cache-works-with-configs)  How Cache works with Configs

You can set cache at two levels:

- **Top-level** that works across all the targets.
- **Target-level** that works when that specific target is triggered.

- Setting Top-Level Cache
- Setting Target-Level Cache

Copy

```json
{
  "cache": {"mode": "semantic", "max_age": 60},
  "strategy": {"mode": "fallback"},
  "targets": [\
    {"virtual_key": "openai-key-1"},\
    {"virtual_key": "openai-key-2"}\
  ]
}

```

You can also set cache at **both levels (top & target).**

In this case, the **target-level cache** setting will be **given preference** over the **top-level cache** setting. You should start getting cache hits from the second request onwards for that specific target.

If any of your targets have `override_params` then cache on that target will not work until that particular combination of params is also stored with the cache. If there are **no** `override_params` for that target, then **cache will be active** on that target even if it hasn’t been triggered even once.

Was this page helpful?

YesNo

[Suggest edits](https://github.com/portkey-ai/docs-core/edit/main/product/ai-gateway/cache-simple-and-semantic.mdx) [Raise issue](https://github.com/portkey-ai/docs-core/issues/new?title=Issue%20on%20docs&body=Path:%20/product/ai-gateway/cache-simple-and-semantic)

[Speech-to-Text](https://portkey.ai/docs/product/ai-gateway/multimodal-capabilities/speech-to-text) [Fallbacks](https://portkey.ai/docs/product/ai-gateway/fallbacks)

On this page

- [Enable Cache in the Config](https://portkey.ai/docs/product/ai-gateway/cache-simple-and-semantic#enable-cache-in-the-config)
- [Simple Cache](https://portkey.ai/docs/product/ai-gateway/cache-simple-and-semantic#simple-cache)
- [How it Works](https://portkey.ai/docs/product/ai-gateway/cache-simple-and-semantic#how-it-works)
- [Semantic Cache](https://portkey.ai/docs/product/ai-gateway/cache-simple-and-semantic#semantic-cache)
- [How it Works](https://portkey.ai/docs/product/ai-gateway/cache-simple-and-semantic#how-it-works-2)
- [Ignoring the First Message in Semantic Cache](https://portkey.ai/docs/product/ai-gateway/cache-simple-and-semantic#ignoring-the-first-message-in-semantic-cache)
- [Read more how to set cache in Configs.](https://portkey.ai/docs/product/ai-gateway/cache-simple-and-semantic#read-more-how-to-set-cache-in-configs)
- [Setting Cache Age](https://portkey.ai/docs/product/ai-gateway/cache-simple-and-semantic#setting-cache-age)
- [Force Refresh Cache](https://portkey.ai/docs/product/ai-gateway/cache-simple-and-semantic#force-refresh-cache)
- [Cache Namespace: Simplified Cache Partitioning](https://portkey.ai/docs/product/ai-gateway/cache-simple-and-semantic#cache-namespace-simplified-cache-partitioning)
- [How It Works](https://portkey.ai/docs/product/ai-gateway/cache-simple-and-semantic#how-it-works-3)
- [Cache in Analytics](https://portkey.ai/docs/product/ai-gateway/cache-simple-and-semantic#cache-in-analytics)
- [Cache in Logs](https://portkey.ai/docs/product/ai-gateway/cache-simple-and-semantic#cache-in-logs)
- [How Cache works with Configs](https://portkey.ai/docs/product/ai-gateway/cache-simple-and-semantic#how-cache-works-with-configs)

![](https://portkey.ai/docs/product/ai-gateway/cache-simple-and-semantic)
