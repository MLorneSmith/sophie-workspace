[Portkey Docs home page![light logo](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/logo-white.png)![dark logo](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/logo-black.png)](https://portkey.ai/docs)

Search or ask...

Ctrl K

Search...

Navigation

Virtual Keys

Connect Bedrock with Amazon Assumed Role

[Documentation](https://portkey.ai/docs/introduction/what-is-portkey) [Integrations](https://portkey.ai/docs/integrations) [Inference API](https://portkey.ai/docs/api-reference/inference-api/introduction) [Admin API](https://portkey.ai/docs/api-reference/admin-api/control-plane/configs/create-config) [Cookbook](https://portkey.ai/docs/guides/getting-started) [Changelog](https://portkey.ai/docs/changelog/2025/jan)

Available on all plans.

## [​](https://portkey.ai/docs/product/ai-gateway/virtual-keys/bedrock-amazon-assumed-role\#select-aws-assumed-role-authentication)  Select AWS Assumed Role Authentication

Create a new virtual key on Portkey, select **Bedrock** as the provider and **AWS Assumed Role** as the authentication method.

![](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/images/product/ai-gateway/Bedrock-Assumed-Role.png)

## [​](https://portkey.ai/docs/product/ai-gateway/virtual-keys/bedrock-amazon-assumed-role\#create-an-aws-role-for-portkey-to-assume)  Create an AWS Role for Portkey to Assume

This role you create will be used by Porktey to execute InvokeModel commands on Bedrock models in your AWS account. The setup process will establish a minimal-permission (“least privilege”) role and set it up to allow Porktey to assume this role.

### [​](https://portkey.ai/docs/product/ai-gateway/virtual-keys/bedrock-amazon-assumed-role\#create-a-permission-policy-in-your-aws-account-using-the-following-json)  Create a permission policy in your AWS account using the following JSON

Copy

```json
{
  "Version": "2012-10-17",
  "Statement": [\
    {\
      "Sid": "BedrockConsole",\
      "Effect": "Allow",\
      "Action": [\
        "bedrock:InvokeModel",\
        "bedrock:InvokeModelWithResponseStream"\
        ],\
      "Resource": "*"\
    }\
  ]
}

```

![](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/images/product/ai-gateway/create-policy.png)

### [​](https://portkey.ai/docs/product/ai-gateway/virtual-keys/bedrock-amazon-assumed-role\#create-a-new-iam-role)  Create a new IAM role

Choose _AWS account_ as the trusted entity type. If you set an external ID be sure to copy it, we will need it later.

![](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/images/product/ai-gateway/create-role.png)

### [​](https://portkey.ai/docs/product/ai-gateway/virtual-keys/bedrock-amazon-assumed-role\#add-the-above-policy-to-the-role)  Add the above policy to the role

Search for the policy you created above and add it to the role.

![](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/images/product/ai-gateway/add-policy.png)

### [​](https://portkey.ai/docs/product/ai-gateway/virtual-keys/bedrock-amazon-assumed-role\#configure-trust-relationship-for-the-role)  Configure Trust Relationship for the role

Once the role is created, open the role and navigate to the _Trust relationships_ tab and click _Edit trust policy_.
This is where you will add the Portkey AWS account as a trusted entity.

Portkey Account ARN

Copy

```sh
arn:aws:iam::299329113195:role/portkey-app

```

The above ARN only works for our [hosted app](https://app.portkey.ai/).

To enable Assumed Role for AWS in your Portkey Enterprise deployment, please reach out to your Portkey representative or contact us on [support@portkey.ai](mailto:support@portkey.ai). ( [Link to our Helm chart docs](https://github.com/Portkey-AI/helm-chart/blob/main/helm/enterprise/README.md#aws-assumed-role-for-bedrock))

Paste the following JSON into the trust policy editor and click _Update Trust Policy_.

Copy

```json
{
  "Version": "2012-10-17",
  "Statement": [\
    {\
      "Effect": "Allow",\
      "Principal": {\
        "AWS": "arn:aws:iam::299329113195:role/portkey-app"\
      },\
      "Action": "sts:AssumeRole",\
      "Condition": {}\
}\
]
}

```

If you set an external ID, add it to the condition as shown below.

Copy

```json
  {
    "Version": "2012-10-17",
    "Statement": [\
      {\
        "Effect": "Allow",\
        "Principal": {\
          "AWS": "<Portkey Account ARN>"\
        },\
        "Action": "sts:AssumeRole",\
        "Condition": {\
          "StringEquals": {\
            "sts:ExternalId": "<your external ID>"\
          }\
        }\
      }\
    ]
}

```

## [​](https://portkey.ai/docs/product/ai-gateway/virtual-keys/bedrock-amazon-assumed-role\#configure-the-virtual-key-with-the-role-arn)  Configure the virtual key with the role ARN

Once the role is created, copy the role ARN and paste it into the Bedrock integrations modal in Portkey along with the external ID if you set one and the AWS region you are using.

![](https://mintlify.s3.us-west-1.amazonaws.com/portkey-docs/images/product/ai-gateway/add-role-arn.png)

You’re all set! You can now use the virtual key to invoke Bedrock models.

Was this page helpful?

YesNo

[Suggest edits](https://github.com/portkey-ai/docs-core/edit/main/product/ai-gateway/virtual-keys/bedrock-amazon-assumed-role.mdx) [Raise issue](https://github.com/portkey-ai/docs-core/issues/new?title=Issue%20on%20docs&body=Path:%20/product/ai-gateway/virtual-keys/bedrock-amazon-assumed-role)

[Budget Limits](https://portkey.ai/docs/product/ai-gateway/virtual-keys/budget-limits) [Request Timeouts](https://portkey.ai/docs/product/ai-gateway/request-timeouts)

On this page

- [Select AWS Assumed Role Authentication](https://portkey.ai/docs/product/ai-gateway/virtual-keys/bedrock-amazon-assumed-role#select-aws-assumed-role-authentication)
- [Create an AWS Role for Portkey to Assume](https://portkey.ai/docs/product/ai-gateway/virtual-keys/bedrock-amazon-assumed-role#create-an-aws-role-for-portkey-to-assume)
- [Create a permission policy in your AWS account using the following JSON](https://portkey.ai/docs/product/ai-gateway/virtual-keys/bedrock-amazon-assumed-role#create-a-permission-policy-in-your-aws-account-using-the-following-json)
- [Create a new IAM role](https://portkey.ai/docs/product/ai-gateway/virtual-keys/bedrock-amazon-assumed-role#create-a-new-iam-role)
- [Add the above policy to the role](https://portkey.ai/docs/product/ai-gateway/virtual-keys/bedrock-amazon-assumed-role#add-the-above-policy-to-the-role)
- [Configure Trust Relationship for the role](https://portkey.ai/docs/product/ai-gateway/virtual-keys/bedrock-amazon-assumed-role#configure-trust-relationship-for-the-role)
- [Configure the virtual key with the role ARN](https://portkey.ai/docs/product/ai-gateway/virtual-keys/bedrock-amazon-assumed-role#configure-the-virtual-key-with-the-role-arn)

![](https://portkey.ai/docs/product/ai-gateway/virtual-keys/bedrock-amazon-assumed-role)

![](https://portkey.ai/docs/product/ai-gateway/virtual-keys/bedrock-amazon-assumed-role)

![](https://portkey.ai/docs/product/ai-gateway/virtual-keys/bedrock-amazon-assumed-role)

![](https://portkey.ai/docs/product/ai-gateway/virtual-keys/bedrock-amazon-assumed-role)

![](https://portkey.ai/docs/product/ai-gateway/virtual-keys/bedrock-amazon-assumed-role)