[Skip to content](https://developers.cloudflare.com/r2/buckets/create-buckets/#_top)

# Create new buckets

You can create a bucket from the Cloudflare dashboard or using Wrangler.

## Bucket-Level Operations

Create a bucket with the [`r2 bucket create`](https://developers.cloudflare.com/workers/wrangler/commands/#r2-bucket-create) command:

```

wrangler r2 bucket create your-bucket-name
```

List buckets in the current account with the [`r2 bucket list`](https://developers.cloudflare.com/workers/wrangler/commands/#r2-bucket-list) command:

```

wrangler r2 bucket list
```

Delete a bucket with the [`r2 bucket delete`](https://developers.cloudflare.com/workers/wrangler/commands/#r2-bucket-delete) command. Note that the bucket must be empty and all objects must be deleted.

```

wrangler r2 bucket delete BUCKET_TO_DELETE
```

## Notes

- Bucket names and buckets are not public by default. To allow public access to a bucket, [visit the public bucket documentation](https://developers.cloudflare.com/r2/buckets/public-buckets/).
- Invalid (unauthorized) access attempts to private buckets do not incur R2 operations charges against that bucket. Refer to the [R2 pricing FAQ](https://developers.cloudflare.com/r2/pricing/#frequently-asked-questions) to understand what operations are billed vs. not billed.

## Was this helpful?

[Cloudflare Dashboard](https://dash.cloudflare.com/?to=/:account/r2) [Discord](https://discord.cloudflare.com/) [Community](https://community.cloudflare.com/) [Learning Center](https://www.cloudflare.com/learning/) [Support Portal](https://developers.cloudflare.com/support/contacting-cloudflare-support/)

Cookie Settings