# Deployment Checklist: Sharp Optimization & Payload CMS

This checklist ensures a smooth production deployment of Payload CMS with serverless-optimized Sharp integration.

---

## 1. Environment Variables

- [ ] All required variables set (see [`SHARP_OPTIMIZATION_ENV.md`](./SHARP_OPTIMIZATION_ENV.md)):
  - `NODE_ENV=production`
  - `PAYLOAD_PUBLIC_SERVER_URL`
  - `PAYLOAD_SECRET`
  - `DATABASE_URI`
  - `SHARP_PLATFORM` (set to your platform: `vercel`, `cloudflare`, `aws-lambda`, etc.)
  - `SHARP_CONCURRENCY` (recommended: `2`)
  - Storage variables for R2/S3 as required

---

## 2. Platform-Specific Deployment Notes

### Vercel

- [ ] `SHARP_PLATFORM=vercel`
- [ ] Use `/tmp` for any cache paths
- [ ] Confirm serverless sharp adapter is bundled

### Cloudflare Workers

- [ ] `SHARP_PLATFORM=cloudflare`
- [ ] Use `/tmp` for cache if needed
- [ ] Confirm sharp/serverless-sharp is compatible with Workers

### AWS Lambda

- [ ] `SHARP_PLATFORM=aws-lambda`
- [ ] Use `/tmp` for cache if needed
- [ ] Set `SHARP_CONCURRENCY=2`

---

## 3. Pre-Deployment Testing

- [ ] Complete all steps in [`TESTING_SHARP_FIX.md`](./TESTING_SHARP_FIX.md)
- [ ] Verify image upload, transformation, and admin preview in staging/production

---

## 4. Monitoring & Debugging

- [ ] Enable sharp debug logs (`DEBUG=sharp*`) if troubleshooting
- [ ] Monitor platform logs for errors/timeouts
- [ ] Monitor function execution time and memory usage

---

## 5. Rollback Procedures

- [ ] If issues occur:
  - Revert to previous deployment (via platform dashboard)
  - Restore previous sharp configuration (local sharp import)
  - Disable serverless sharp adapter if necessary
  - Re-test with local sharp before re-enabling serverless mode

---

## 6. Final Checks

- [ ] CDN/image URLs resolve correctly
- [ ] No 522/504 or sharp errors in logs
- [ ] All admin and public image features work as expected

---

**Deployment is complete when all boxes are checked and tests pass in production.**
