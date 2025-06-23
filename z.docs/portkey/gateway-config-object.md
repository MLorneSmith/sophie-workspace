[Portkey Docs home page![light logo](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/logo-white.png)![dark logo](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/logo-black.png)](https://portkey.ai/docs)

Search or ask...

Ctrl K

Search...

Navigation

API Details

Gateway Config Object

[Documentation](https://portkey.ai/docs/introduction/what-is-portkey) [Integrations](https://portkey.ai/docs/integrations) [Inference API](https://portkey.ai/docs/api-reference/inference-api/introduction) [Admin API](https://portkey.ai/docs/api-reference/admin-api/control-plane/configs/create-config) [Cookbook](https://portkey.ai/docs/guides/getting-started) [Changelog](https://portkey.ai/docs/changelog/2025/jan)

The `config` object is used to configure API interactions with various providers. It supports multiple modes such as single provider access, load balancing between providers, and fallback strategies.

**The following JSON schema is used to validate the config object:**

JSON Schema

Copy

```js
{
"$schema": "http://json-schema.org/draft-07/schema#",
"type": "object",
"properties": {
  "strategy": {
    "type": "object",
    "properties": {
      "mode": {
        "type": "string",
        "enum": [\
          "single",\
          "loadbalance",\
          "fallback"\
        ]
      },
      "on_status_codes": {
        "type": "array",
        "items": {
          "type": "number"
        },
        "optional": true
      }
    }
  },
  "provider": {
    "type": "string",
    "enum": [\
      "openai",\
      "anthropic",\
      "azure-openai",\
      "anyscale",\
      "cohere",\
      "palm"\
    ]
  },
  "resource_name": {
    "type": "string",
    "optional": true
  },
  "deployment_id": {
    "type": "string",
    "optional": true
  },
  "api_version": {
    "type": "string",
    "optional": true
  },
  "override_params": {
    "type": "object"
  },
  "api_key": {
    "type": "string"
  },
  "virtual_key": {
    "type": "string"
  },
  "cache": {
    "type": "object",
    "properties": {
      "mode": {
        "type": "string",
        "enum": [\
          "simple",\
          "semantic"\
        ]
      },
      "max_age": {
        "type": "integer",
        "optional": true
      }
    },
    "required": [\
      "mode"\
    ]
  },
  "retry": {
    "type": "object",
    "properties": {
      "attempts": {
        "type": "integer"
      },
      "on_status_codes": {
        "type": "array",
        "items": {
          "type": "number"
        },
        "optional": true
      }
    },
    "required": [\
      "attempts"\
    ]
  },
  "weight": {
    "type": "number"
  },
  "on_status_codes": {
    "type": "array",
    "items": {
      "type": "integer"
    }
  },
  "targets": {
    "type": "array",
    "items": {
      "$ref": "#"
    }
  }
},
"anyOf": [\
  {\
    "required": [\
      "provider",\
      "api_key"\
    ]\
  },\
  {\
    "required": [\
      "virtual_key"\
    ]\
  },\
  {\
    "required": [\
      "strategy",\
      "targets"\
    ]\
  },\
  {\
    "required": [\
      "cache"\
    ]\
  },\
  {\
    "required": [\
      "retry"\
    ]\
  }\
],
"additionalProperties": false
}

```

## [​](https://portkey.ai/docs/api-reference/inference-api/config-object\#example-configs)  Example Configs

Copy

```js
// Simple config with cache and retry
{
  "virtual_key": "***", // Your Virtual Key
  "cache": { // Optional
    "mode": "semantic",
    "max_age": 10000
  },
  "retry": { // Optional
    "attempts": 5,
    "on_status_codes": []
  }
}

// Load balancing with 2 OpenAI keys
{
  "strategy": {
      "mode": "loadbalance"
    },
  "targets": [\
    {\
      "provider": "openai",\
      "api_key": "sk-***"\
    },\
    {\
      "provider": "openai",\
      "api_key": "sk-***"\
    }\
  ]
}

```

You can find more examples of schemas [below](https://portkey.ai/docs/api-reference/inference-api/config-object#examples).

## [​](https://portkey.ai/docs/api-reference/inference-api/config-object\#schema-details)  Schema Details

| Key Name | Description | Type | Required | Enum Values | Additional Info |
| --- | --- | --- | --- | --- | --- |
| `strategy` | Operational strategy for the config or any individual target | object | Yes (if no `provider` or `virtual_key`) | - | See Strategy Object Details |
| `provider` | Name of the service provider | string | Yes (if no `mode` or `virtual_key`) | “openai”, “anthropic”, “azure-openai”, “anyscale”, “cohere” | - |
| `api_key` | API key for the service provider | string | Yes (if `provider` is specified) | - | - |
| `virtual_key` | Virtual key identifier | string | Yes (if no `mode` or `provider`) | - | - |
| `cache` | Caching configuration | object | No | - | See Cache Object Details |
| `retry` | Retry configuration | object | No | - | See Retry Object Details |
| `weight` | Weight for load balancing | number | No | - | Used in `loadbalance` mode |
| `on_status_codes` | Status codes triggering fallback | array of strings | No | - | Used in `fallback` mode |
| `targets` | List of target configurations | array | Yes (if `mode` is specified) | - | Each item follows the config schema |
| `request_timeout` | Request timeout configuration | number | No | - | - |
| `custom_host` | Route to privately hosted model | string | No | - | Used in combination with `provider` \+ `api_key` |
| `forward_headers` | Forward sensitive headers directly | array of strings | No | - | - |
| `override_params` | Pass model name and other hyper parameters | object | No | ”model”, “temperature”, “frequency\_penalty”, “logit\_bias”, “logprobs”, “top\_logprobs”, “max\_tokens”, “n”, “presence\_penalty”, “response\_format”, “seed”, “stop”, “top\_p”, etc. | Pass everything that’s typically part of the payload |

### [​](https://portkey.ai/docs/api-reference/inference-api/config-object\#strategy-object-details)  Strategy Object Details

| Key Name | Description | Type | Required | Enum Values | Additional Info |
| --- | --- | --- | --- | --- | --- |
| `mode` | strategy mode for the config | string | Yes | ”loadbalance”, “fallback” |  |
| `on_status_codes` | status codes to apply the strategy. This field is only used when strategy mode is “fallback” | array of numbers | No |  | Optional |

### [​](https://portkey.ai/docs/api-reference/inference-api/config-object\#cache-object-details)  Cache Object Details

| Key Name | Description | Type | Required | Enum Values | Additional Info |
| --- | --- | --- | --- | --- | --- |
| `mode` | Cache mode | string | Yes | ”simple”, “semantic” | - |
| `max_age` | Maximum age for cache entries | integer | No | - | Optional |

### [​](https://portkey.ai/docs/api-reference/inference-api/config-object\#retry-object-details)  Retry Object Details

| Key Name | Description | Type | Required | Enum Values | Additional Info |
| --- | --- | --- | --- | --- | --- |
| `attempts` | Number of retry attempts | integer | Yes | - | - |
| `on_status_codes` | Status codes to trigger retries | array of strings | No | - | Optional |

### [​](https://portkey.ai/docs/api-reference/inference-api/config-object\#cloud-provider-params-azure-openai%2C-google-vertex%2C-aws-bedrock)  Cloud Provider Params (Azure OpenAI, Google Vertex, AWS Bedrock)

#### [​](https://portkey.ai/docs/api-reference/inference-api/config-object\#azure-openai)  Azure OpenAI

| Key Name | Type | Required |
| --- | --- | --- |
| `azure_resource_name` | string | No |
| `azure_deployment_id` | string | No |
| `azure_api_version` | string | No |
| `azure_model_name` | string | No |
| `Authorization` | string (“Bearer $API\_KEY”) | No |

#### [​](https://portkey.ai/docs/api-reference/inference-api/config-object\#google-vertex-ai)  Google Vertex AI

| Key Name | Type | Required |
| --- | --- | --- |
| `vertex_project_id` | string | No |
| `vertex_region` | string | No |

#### [​](https://portkey.ai/docs/api-reference/inference-api/config-object\#aws-bedrock)  AWS Bedrock

| Key Name | Type | Required |
| --- | --- | --- |
| `aws_access_key_id` | string | No |
| `aws_secret_access_key` | string | No |
| `aws_region` | string | No |
| `aws_session_token` | string | No |

### [​](https://portkey.ai/docs/api-reference/inference-api/config-object\#notes)  Notes

- The strategy `mode` key determines the operational mode of the config. If strategy `mode` is not specified, a single provider mode is assumed, requiring either `provider` and `api_key` or `virtual_key`.
- In `loadbalance` and `fallback` modes, the `targets` array specifies the configurations for each target.
- The `cache` and `retry` objects provide additional configurations for caching and retry policies, respectively.

## [​](https://portkey.ai/docs/api-reference/inference-api/config-object\#examples)  Examples

Single Provider with API Key

Copy

```json
{
  "provider": "openai",
  "api_key": "sk-***"
}

```

Passing Model & Hyperparameters with Override Option

Copy

```json
{
  "provider": "anthropic",
  "api_key": "xxx",
  "override_params": {
    "model": "claude-3-sonnet-20240229",
    "max_tokens": 512,
    "temperature": 0
  }
}

```

Single Provider with Virtual Key

Copy

```json
{
  "virtual_key": "***"
}

```

Single Provider with Virtual Key, Cache and Retry

Copy

```json
{
  "virtual_key": "***",
  "cache": {
    "mode": "semantic",
    "max_age": 10000
  },
  "retry": {
    "attempts": 5,
    "on_status_codes": [429]
  }
}

```

Load Balancing with Two OpenAI API Keys

Copy

```json
{
  "strategy": {
    "mode": "loadbalance"
  },
  "targets": [\
    {\
      "provider": "openai",\
      "api_key": "sk-***"\
    },\
    {\
      "provider": "openai",\
      "api_key": "sk-***"\
    }\
  ]
}

```

Load Balancing and Fallback Combination

Copy

```json
  {
    "strategy": {
      "mode": "loadbalance"
    },
    "targets": [\
      {\
        "provider": "openai",\
        "api_key": "sk-***"\
      },\
      {\
        "strategy": {\
          "mode": "fallback",\
          "on_status_codes": [429, 241]\
        },\
        "targets": [\
          {\
            "virtual_key": "***"\
          },\
          {\
            "virtual_key": "***"\
          }\
        ]\
      }\
    ]
  }

```

Was this page helpful?

YesNo

[Suggest edits](https://github.com/portkey-ai/docs-core/edit/main/api-reference/inference-api/config-object.mdx) [Raise issue](https://github.com/portkey-ai/docs-core/issues/new?title=Issue%20on%20docs&body=Path:%20/api-reference/inference-api/config-object)

[Response Schema](https://portkey.ai/docs/api-reference/inference-api/response-schema) [OpenAPI Specification](https://portkey.ai/docs/api-reference/inference-api/open-api-specification)

On this page

- [Example Configs](https://portkey.ai/docs/api-reference/inference-api/config-object#example-configs)
- [Schema Details](https://portkey.ai/docs/api-reference/inference-api/config-object#schema-details)
- [Strategy Object Details](https://portkey.ai/docs/api-reference/inference-api/config-object#strategy-object-details)
- [Cache Object Details](https://portkey.ai/docs/api-reference/inference-api/config-object#cache-object-details)
- [Retry Object Details](https://portkey.ai/docs/api-reference/inference-api/config-object#retry-object-details)
- [Cloud Provider Params (Azure OpenAI, Google Vertex, AWS Bedrock)](https://portkey.ai/docs/api-reference/inference-api/config-object#cloud-provider-params-azure-openai%2C-google-vertex%2C-aws-bedrock)
- [Azure OpenAI](https://portkey.ai/docs/api-reference/inference-api/config-object#azure-openai)
- [Google Vertex AI](https://portkey.ai/docs/api-reference/inference-api/config-object#google-vertex-ai)
- [AWS Bedrock](https://portkey.ai/docs/api-reference/inference-api/config-object#aws-bedrock)
- [Notes](https://portkey.ai/docs/api-reference/inference-api/config-object#notes)
- [Examples](https://portkey.ai/docs/api-reference/inference-api/config-object#examples)
