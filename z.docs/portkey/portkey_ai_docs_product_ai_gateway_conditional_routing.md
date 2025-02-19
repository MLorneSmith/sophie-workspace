[Portkey Docs home page![light logo](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/logo-white.png)![dark logo](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/logo-black.png)](https://portkey.ai/docs)

Search or ask...

Ctrl K

Search...

Navigation

AI Gateway

Conditional Routing

[Documentation](https://portkey.ai/docs/introduction/what-is-portkey) [Integrations](https://portkey.ai/docs/integrations) [Inference API](https://portkey.ai/docs/api-reference/inference-api/introduction) [Admin API](https://portkey.ai/docs/api-reference/admin-api/control-plane/configs/create-config) [Cookbook](https://portkey.ai/docs/guides/getting-started) [Changelog](https://portkey.ai/docs/changelog/2025/jan)

This feature is available on all Portkey [plans](https://portkey.ai/pricing).

Using Portkey Gateway, you can route your requests to different provider targets based on custom conditions you define. These can be conditions like:

- If this user is on the `paid plan`, route their request to a `custom fine-tuned model`
- If this user is an `EU resident`, call an `EU hosted model`
- If this user is a `beta tester`, send their request to the `preview model`
- If the request is coming from `testing environment` with a `llm-pass-through` flag, route it to the `cheapest model`
- ..and more!

Using this strategy, you can set up various conditional checks on the `metadata` keys you’re passing with your requests and route requests to the appropriate target — all happening very fast on the _gateway_, on _edge_.

## [​](https://portkey.ai/docs/product/ai-gateway/conditional-routing\#enabling-conditional-routing)  Enabling Conditional Routing

Conditional routing is one of the _strategies_ in Portkey’s [Gateway Configs](https://portkey.ai/docs/product/ai-gateway/configs). (others being `fallback` and `loadbalance`). To use it in your app,

1. You need to create a `conditional` config in Portkey UI.
2. Save the Config and get an associated Config ID.
3. And just pass the Config ID along with your requests using the `config` param.

## [​](https://portkey.ai/docs/product/ai-gateway/conditional-routing\#1-creating-the-conditional-config)  1\. Creating the `conditional` Config

Here’s how a sample `conditional` config looks (along with its simpler, tree view).

- Sample Config
- Tree View

Copy

```json
{
  "strategy": {
    "mode": "conditional",
    "conditions": [\
      ...conditions\
    ],
    "default": "target_1"
  },
  "targets": [\
    {\
      "name": "target_1",\
      "virtual_key":"xx"\
    },\
    {\
      "name": "target_2",\
      "virtual_key":"yy"\
    }\
  ]
}

```

- `strategy.mode`: Set to `conditional`
- `strategy.conditions`: Query conditions with rules applied on metadata values along with which target to call when the condition passes
- `strategy.default`: The default target name to call when none of the conditions pass
- `targets`: Array of target objects with unique `names` and provider details. These target names are referenced in the `conditions` objects above.

`conditions` and `default` are **required params** for the `conditional` strategy.

### [​](https://portkey.ai/docs/product/ai-gateway/conditional-routing\#structure-of-conditions-object)  Structure of `conditions` Object

`conditions` are where you will actually write the routing rules. Here’s a sample `condition` object:

Copy

```json
{
  "query": { "metadata.user_plan": { "$eq": "paid" } },
  "then": "finetuned-gpt4"
}

```

`query`: Write the exact rule for checking metadata values

`then`: Define which target to call if the query `PASSES`

### [​](https://portkey.ai/docs/product/ai-gateway/conditional-routing\#list-of-condition-query-operators)  List of Condition Query Operators

| Operator | Description |
| --- | --- |
| `$eq` | Equals |
| `$ne` | Not equals |
| `$in` | In array |
| `$nin` | Not in array |
| `$regex` | Match the regex |
| `$gt` | Greater than |
| `$gte` | Greater than or equal to |
| `$lt` | Less than |
| `$lte` | Less than or equal to |

### [​](https://portkey.ai/docs/product/ai-gateway/conditional-routing\#logical-query-operators)  Logical Query Operators

- `$and`: All conditions must be true
- `$or`: At least one condition must be true

#### [​](https://portkey.ai/docs/product/ai-gateway/conditional-routing\#example-condition-objects-with-logical-operators)  Example Condition objects with Logical Operators

- AND
- OR
- NESTING AND, OR

Copy

```json
{
  "$and": [\
    { "metadata.user_type": { "$eq": "pro" } },\
    { "metadata.model": { "$eq": "gpt-4" } }\
  ]
}

```

1. You can write nested queries (with `$and`, `$or` operators)
2. When a condition is incorrect or it fails, Portkey moves on to the next condition until it finds a successful condition.
3. If no conditions pass, then the `default` target name is called
4. Since Portkey iterates through the queries sequentially, the order of your conditions is important

## [​](https://portkey.ai/docs/product/ai-gateway/conditional-routing\#2-getting-config-id)  2\. Getting Config ID

Based on the `conditions` and the Config structure described above, you can create your [Config in Portkey UI](https://app.portkey.ai/configs), and save it to get Config ID. The UI also helps you autofill and autoformat your Config.

#### [​](https://portkey.ai/docs/product/ai-gateway/conditional-routing\#adding-the-above-sample-condition-to-our-final-config)  Adding the above sample condition to our final Config:

- Simple Conditional Config
- Nested Conditional Config

Copy

```json
{
  "strategy": {
    "mode": "conditional",
    "conditions": [\
      {\
        "query": { "metadata.user_plan": { "$eq": "paid" } },\
        "then": "finetuned-gpt4"\
      },\
      {\
        "query": { "metadata.user_plan": { "$eq": "free" } },\
        "then": "base-gpt4"\
      }\
    ],
    "default": "base-gpt4"
  },
  "targets": [\
    {\
      "name": "finetuned-gpt4",\
      "virtual_key":"xx"\
    },\
    {\
      "name": "base-gpt4",\
      "virtual_key":"yy"\
    }\
  ]
}

```

## [​](https://portkey.ai/docs/product/ai-gateway/conditional-routing\#3-using-the-config-id-in-requests)  3\. Using the Config ID in Requests

Now, while instantiating your Portkey client or while sending headers, you just need to pass the Config ID and all your requests will start getting routed according to your conditions.

Conditional routing happens on Portkey’s on-the-edge stateless AI Gateway. We scan for the given query field in your request body, apply the query condition, and route to the specified target based on it.

Currently, we support **Metadata based routing** — i.e. routing your requests based on the metadata values you’re sending along with your request.

### [​](https://portkey.ai/docs/product/ai-gateway/conditional-routing\#applying-conditional-routing-based-on-metadata)  Applying Conditional Routing Based on Metadata

- Sample Full Request

Copy

```python
from portkey_ai import Portkey

portkey = Portkey(
    api_key="PORTKEY_API_KEY",
    config="my-conditional-router-config"
)

response = portkey.with_options(
    metadata = {
        "user_plan": "free",
        "environment": "production",
        "session_id": "1729"
}).chat.completions.create(
    messages = [{ "role": 'user', "content": 'What is 1729' }]
)

```

Here, we’re using the following Config that we defined above.

## [​](https://portkey.ai/docs/product/ai-gateway/conditional-routing\#more-examples-using-conditional-routing)  More Examples Using Conditional Routing

Here are some examples on how you can leverage conditional routing to handle real-world scenarios like:

- Data sensititvity or data residency requirements
- Calling a model based on user’s input lanuage
- Handling feature flags for your app
- Managing traffic better at peak usage times
- ..and many more

- Data Sensitivity
- Feature Flags
- Traffic Management
- Input Language

Route your requests to different models based on the `data sensitivity level` of the user.

Copy

```json
{
  "strategy": {
    "mode": "conditional",
    "conditions": [\
      {\
        "query": {\
          "metadata.data_sensitivity": "high"\
        },\
        "then": "on-premises-model"\
      },\
      {\
        "query": {\
          "metadata.data_sensitivity": {\
            "$in": ["medium", "low"]\
          }\
        },\
        "then": "cloud-model"\
      }\
    ],
    "default": "public-model"
  },
  "targets": [\
    {\
      "name": "public-model",\
      "virtual_key": "..."\
    },\
    {\
      "name": "on-premises-model",\
      "virtual_key": "..."\
    },\
    {\
      "name": "cloud-model",\
      "virtual_key": "..."\
    }\
  ]
}

```

Soon, Portkey will also support routing based on other critical parameters like `input character count`, `input token count`, `prompt type`, `tool support`, and more.

Similarly, we will also add support for smart routing to wider targets, like `fastest`, `cheapest`, `highest uptime`, `lowest error rate`, etc.

[Please join us on Discord](https://portkey.wiki/chat) to share your thoughts on this feature and get early access to more routing capabilities.

Was this page helpful?

YesNo

[Suggest edits](https://github.com/portkey-ai/docs-core/edit/main/product/ai-gateway/conditional-routing.mdx) [Raise issue](https://github.com/portkey-ai/docs-core/issues/new?title=Issue%20on%20docs&body=Path:%20/product/ai-gateway/conditional-routing)

[Configs](https://portkey.ai/docs/product/ai-gateway/configs) [Multimodal Capabilities](https://portkey.ai/docs/product/ai-gateway/multimodal-capabilities)

On this page

- [Enabling Conditional Routing](https://portkey.ai/docs/product/ai-gateway/conditional-routing#enabling-conditional-routing)
- [1\. Creating the conditional Config](https://portkey.ai/docs/product/ai-gateway/conditional-routing#1-creating-the-conditional-config)
- [Structure of conditions Object](https://portkey.ai/docs/product/ai-gateway/conditional-routing#structure-of-conditions-object)
- [List of Condition Query Operators](https://portkey.ai/docs/product/ai-gateway/conditional-routing#list-of-condition-query-operators)
- [Logical Query Operators](https://portkey.ai/docs/product/ai-gateway/conditional-routing#logical-query-operators)
- [Example Condition objects with Logical Operators](https://portkey.ai/docs/product/ai-gateway/conditional-routing#example-condition-objects-with-logical-operators)
- [2\. Getting Config ID](https://portkey.ai/docs/product/ai-gateway/conditional-routing#2-getting-config-id)
- [Adding the above sample condition to our final Config:](https://portkey.ai/docs/product/ai-gateway/conditional-routing#adding-the-above-sample-condition-to-our-final-config)
- [3\. Using the Config ID in Requests](https://portkey.ai/docs/product/ai-gateway/conditional-routing#3-using-the-config-id-in-requests)
- [Applying Conditional Routing Based on Metadata](https://portkey.ai/docs/product/ai-gateway/conditional-routing#applying-conditional-routing-based-on-metadata)
- [More Examples Using Conditional Routing](https://portkey.ai/docs/product/ai-gateway/conditional-routing#more-examples-using-conditional-routing)