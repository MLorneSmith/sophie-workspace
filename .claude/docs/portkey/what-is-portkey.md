[Portkey Docs home page![light logo](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/logo-white.png)![dark logo](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/logo-black.png)](https://portkey.ai/docs)

Search or ask...

Ctrl K

Search...

Navigation

Introduction

What is Portkey?

[Documentation](https://portkey.ai/docs/introduction/what-is-portkey) [Integrations](https://portkey.ai/docs/integrations) [Inference API](https://portkey.ai/docs/api-reference/inference-api/introduction) [Admin API](https://portkey.ai/docs/api-reference/admin-api/control-plane/configs/create-config) [Cookbook](https://portkey.ai/docs/guides/getting-started) [Changelog](https://portkey.ai/docs/changelog/2025/jan)

[![](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/images/llms-in-prod-banner.png)](https://portkey.sh/docs-banner)

It takes 2 mins to integrate and with that, it starts monitoring all of your LLM requests and makes your app resilient, secure, performant, and more accurate at the same time.

Here’s a product walkthrough (3 mins):

What is Portkey? - YouTube

Portkey

116 subscribers

[What is Portkey?](https://www.youtube.com/watch?v=9aO340Hew2I)

Portkey

Search

Watch later

Share

Copy link

Info

Shopping

Tap to unmute

If playback doesn't begin shortly, try restarting your device.

Full screen is unavailable. [Learn More](https://support.google.com/youtube/answer/6276924)

You're signed out

Videos you watch may be added to the TV's watch history and influence TV recommendations. To avoid this, cancel and sign in to YouTube on your computer.

CancelConfirm

More videos

## More videos

Share

Include playlist

An error occurred while retrieving sharing information. Please try again later.

[Watch on](https://www.youtube.com/watch?v=9aO340Hew2I&embeds_referring_euri=https%3A%2F%2Fportkey.ai%2F)

0:00

0:00 / 3:03•Live

•

[Watch on YouTube](https://www.youtube.com/watch?v=9aO340Hew2I "Watch on YouTube")

### [​](https://portkey.ai/docs/introduction/what-is-portkey\#integrate-in-3-lines-of-code)  Integrate in 3 Lines of Code

Python

NodeJS

REST API

OpenAI Python SDK

OpenAI NodeJS SDK

Copy

```Python
from portkey_ai import Portkey

portkey = Portkey(
    api_key="YOUR_PORTKEY_API_KEY",
    virtual_key="YOUR_VIRTUAL_KEY"
)

chat_complete = portkey.chat.completions.create(
    model="gpt-3.5-turbo",
    messages=[\
        {"role": "system", "content": "You are a helpful assistant."},\
        {"role": "user", "content": "Hello!"}\
    ]
)
print(chat_complete.choices[0].message.content)

```

While you’re here, why not [give us a star](https://git.new/ai-gateway-docs)? It helps us a lot!

## [​](https://portkey.ai/docs/introduction/what-is-portkey\#faqs)  FAQs

### [​](https://portkey.ai/docs/introduction/what-is-portkey\#will-portkey-increase-the-latency-of-my-api-requests)  Will Portkey increase the latency of my API requests?

Portkey is hosted on edge workers throughout the world, ensuring minimal latency. Our benchmarks estimate a total latency addition between 20-40ms compared to direct API calls. This slight increase is often offset by the benefits of our caching and routing optimizations.

Our edge worker locations:

![](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/images/welcome/welcome-4.avif)

### [​](https://portkey.ai/docs/introduction/what-is-portkey\#is-my-data-secure)  Is my data secure?

Portkey AI is ISO:27001 and SOC 2 certified, and GDPR & HIPAA compliant. We maintain best practices for service security, data storage, and retrieval. All data is encrypted in transit and at rest using industry-standard AES-256 encryption.

For enhanced security, we offer:

1. On request, we can enable a feature that does NOT store any of your request and response body objects in Portkey datastores or our logs.
2. For enterprises, we offer managed hosting to deploy Portkey inside private clouds.

For more information on these options, contact us at [support@portkey.ai](mailto:support@portkey.ai).

### [​](https://portkey.ai/docs/introduction/what-is-portkey\#will-portkey-scale-if-my-app-explodes)  Will Portkey scale if my app explodes?

Portkey is built on scalable infrastructure and can handle millions of requests per minute with very high concurrency. We currently serve over 25M requests daily with a 99.99% uptime. Our edge architecture & scaling capabilities ensure we can accommodate sudden spikes in traffic without performance degradation.

[**View our Status Page**](https://status.portkey.ai/)

### [​](https://portkey.ai/docs/introduction/what-is-portkey\#does-portkey-impose-timeouts-on-requests)  Does Portkey impose timeouts on requests?

We _DO NOT_ impose any explicit timeout for our free OR paid plans currently. While we don’t time out requests on our end, we recommend implementing client-side timeouts appropriate for your use case to handle potential network issues or upstream API delays.

### [​](https://portkey.ai/docs/introduction/what-is-portkey\#do-you-support-sso)  Do you support SSO?

Yes! We support SSO with any custom OIDC provider.

### [​](https://portkey.ai/docs/introduction/what-is-portkey\#what-are-the-pricing-options-is-there-a-free-trial)  What are the pricing options? Is there a free trial?

Portkey’s Gateway is open source and free to use.
On managed version, Portkey offers a free plan with 10k requests per month. We also offer paid plans with more requests and additional features.

### [​](https://portkey.ai/docs/introduction/what-is-portkey\#where-can-i-reach-you)  Where can I reach you?

We’re available all the time on [Discord](https://discord.gg/DD7vgKK299), or on our support email - [support@portkey.ai](mailto:support@portkey.ai)

Was this page helpful?

YesNo

[Suggest edits](https://github.com/portkey-ai/docs-core/edit/main/introduction/what-is-portkey.mdx) [Raise issue](https://github.com/portkey-ai/docs-core/issues/new?title=Issue%20on%20docs&body=Path:%20/introduction/what-is-portkey)

[Make Your First Request](https://portkey.ai/docs/introduction/make-your-first-request)

On this page

- [Integrate in 3 Lines of Code](https://portkey.ai/docs/introduction/what-is-portkey#integrate-in-3-lines-of-code)
- [FAQs](https://portkey.ai/docs/introduction/what-is-portkey#faqs)
- [Will Portkey increase the latency of my API requests?](https://portkey.ai/docs/introduction/what-is-portkey#will-portkey-increase-the-latency-of-my-api-requests)
- [Is my data secure?](https://portkey.ai/docs/introduction/what-is-portkey#is-my-data-secure)
- [Will Portkey scale if my app explodes?](https://portkey.ai/docs/introduction/what-is-portkey#will-portkey-scale-if-my-app-explodes)
- [Does Portkey impose timeouts on requests?](https://portkey.ai/docs/introduction/what-is-portkey#does-portkey-impose-timeouts-on-requests)
- [Do you support SSO?](https://portkey.ai/docs/introduction/what-is-portkey#do-you-support-sso)
- [What are the pricing options? Is there a free trial?](https://portkey.ai/docs/introduction/what-is-portkey#what-are-the-pricing-options-is-there-a-free-trial)
- [Where can I reach you?](https://portkey.ai/docs/introduction/what-is-portkey#where-can-i-reach-you)

![](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/images/welcome/welcome-4.avif)
