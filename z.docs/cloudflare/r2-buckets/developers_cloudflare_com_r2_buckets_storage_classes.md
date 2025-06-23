[Skip to content](https://developers.cloudflare.com/r2/buckets/storage-classes/#_top)

# Storage classes

Storage classes allow you to trade off between the cost of storage and the cost of accessing data. Every object stored in R2 has an associated storage class.

All storage classes share the following characteristics:

- Compatible with Workers API, S3 API, and public buckets.
- 99.999999999% (eleven 9s) of annual durability.
- No minimum object size.

## Available storage classes

| Storage class     | Minimum storage duration | Data retrieval fees (processing) | Egress fees (data transfer to Internet) |
| ----------------- | ------------------------ | -------------------------------- | --------------------------------------- |
| Standard          | None                     | None                             | None                                    |
| Infrequent Access | 30 days                  | Yes                              | None                                    |

For more information on how storage classes impact pricing, refer to [Pricing](https://developers.cloudflare.com/r2/pricing/).

### Standard storage

Standard storage is designed for data that is accessed frequently. This is the default storage class for new R2 buckets unless otherwise specified.

#### Example use cases

- Website and application data
- Media content (e.g., images, video)
- Storing large datasets for analysis and processing
- AI training data
- Other workloads involving frequently accessed data

### Infrequent Access storage Beta

Infrequent Access storage is ideal for data that is accessed less frequently. This storage class offers lower storage cost compared to Standard storage, but includes [retrieval fees](https://developers.cloudflare.com/r2/pricing/#data-retrieval) and a 30 day [minimum storage duration](https://developers.cloudflare.com/r2/pricing/#minimum-storage-duration) requirement.

#### Example use cases

- Long-term data archiving (for example, logs and historical records needed for compliance)
- Data backup and disaster recovery
- Long tail user-generated content

## Set default storage class for buckets

By setting the default storage class for a bucket, all objects uploaded into the bucket will automatically be assigned the selected storage class unless otherwise specified. Default storage class can be changed after bucket creation in the Dashboard.

To learn more about creating R2 buckets, refer to [Create new buckets](https://developers.cloudflare.com/r2/buckets/create-buckets/).

## Set storage class for objects

### Specify storage class during object upload

To learn more about how to specify the storage class for new objects, refer to the [Workers API](https://developers.cloudflare.com/r2/api/workers/) and [S3 API](https://developers.cloudflare.com/r2/api/s3/) documentation.

### Use object lifecycle rules to transition objects to Infrequent Access storage

To learn more about how to transition objects from Standard storage to Infrequent Access storage, refer to [Object lifecycles](https://developers.cloudflare.com/r2/buckets/object-lifecycles/).

## Was this helpful?

[Cloudflare Dashboard](https://dash.cloudflare.com/?to=/:account/r2) [Discord](https://discord.cloudflare.com/) [Community](https://community.cloudflare.com/) [Learning Center](https://www.cloudflare.com/learning/) [Support Portal](https://developers.cloudflare.com/support/contacting-cloudflare-support/)

Cookie Settings
