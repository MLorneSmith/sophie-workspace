# Sharp Optimization Environment Variables

This document describes the required environment variables for enabling serverless-optimized Sharp image processing in Payload CMS, including platform-specific recommendations.

---

## Required Environment Variables

| Variable                    | Description                                                    | Example Value / Notes                                          |
| --------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------- |
| `NODE_ENV`                  | Set to `production` in production environments                 | `production`                                                   |
| `PAYLOAD_PUBLIC_SERVER_URL` | Public URL for Payload CMS                                     | `https://yourdomain.com`                                       |
| `PAYLOAD_SECRET`            | Payload CMS secret                                             | (secure random string)                                         |
| `DATABASE_URI`              | Database connection string                                     | `postgres://user:pass@host:5432/db`                            |
| `SHARP_PLATFORM`            | Platform override for sharp optimization                       | `serverless`, `aws-lambda`, `vercel`, `cloudflare` (see below) |
| `SHARP_CACHE_PATH`          | (Optional) Path for sharp cache (if persistent storage needed) | `/tmp/sharp-cache`                                             |
| `SHARP_CONCURRENCY`         | (Optional) Max concurrency for sharp                           | `2` (recommended for serverless)                               |

---

## Platform-Specific Settings

### Vercel

- Set `SHARP_PLATFORM=vercel`
- Use `/tmp` for any cache paths
- Ensure all image processing is stateless (no persistent disk)

### Cloudflare Workers

- Set `SHARP_PLATFORM=cloudflare`
- Use `/tmp` for cache if needed (ephemeral)
- Ensure sharp/serverless-sharp is bundled correctly

### AWS Lambda

- Set `SHARP_PLATFORM=aws-lambda`
- Use `/tmp` for cache if needed
- Limit concurrency (`SHARP_CONCURRENCY=2`)

---

## Recommended Production Values

```env
NODE_ENV=production
PAYLOAD_PUBLIC_SERVER_URL=https://yourdomain.com
PAYLOAD_SECRET=your-secret
DATABASE_URI=your-database-uri
SHARP_PLATFORM=vercel # or cloudflare/aws-lambda/serverless as appropriate
SHARP_CONCURRENCY=2
```

---

## Additional Notes

- Do **not** set `SHARP_IGNORE_GLOBAL_LIBVIPS` unless you have a custom libvips build.
- Ensure all storage (R2, S3, etc.) environment variables are also set as required by your deployment.
- For debugging, set `DEBUG=sharp*` to enable verbose logging.
