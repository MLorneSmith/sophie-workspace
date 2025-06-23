# Testing Sharp Optimization & Serverless Integration

This guide provides step-by-step instructions for testing the Sharp optimization integration in Payload CMS, including admin preview, troubleshooting, and performance monitoring.

---

## 1. Basic Functionality Tests

### a. Image Upload

1. Log in to the Payload CMS admin dashboard.
2. Navigate to the **Media** collection.
3. Upload a variety of images (JPG, PNG, WebP, large and small files).
4. Confirm uploads complete without errors.

### b. Image Transformation

1. After upload, view the image details in the admin panel.
2. Confirm that thumbnails/previews are generated and visible.
3. Download the original and transformed images to verify integrity.

### c. Admin Preview

1. In the Media collection, use the preview feature to view images.
2. Confirm images load quickly and without errors.
3. Test on different browsers and devices if possible.

---

## 2. Serverless/Platform-Specific Testing

- Deploy to your target platform (Vercel, Cloudflare, AWS Lambda, etc.).
- Repeat the above tests in the deployed environment.
- Confirm that image processing works and no 522/timeout errors occur.

---

## 3. Troubleshooting Common Issues

| Issue                          | Steps to Diagnose / Fix                                                                                          |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| **522/504 Timeout**            | - Check platform logs for sharp errors<br>- Reduce SHARP_CONCURRENCY<br>- Ensure SHARP_PLATFORM is set correctly |
| **Missing Images/Thumbnails**  | - Check storage config (R2/S3)<br>- Verify env vars<br>- Check sharp/serverless-sharp logs                       |
| **Sharp Initialization Error** | - Ensure platform adapter is imported<br>- Check SHARP_PLATFORM value                                            |
| **Slow Performance**           | - Lower SHARP_CONCURRENCY<br>- Use smaller test images<br>- Monitor cold start times                             |

---

## 4. Performance Monitoring

- Enable sharp debug logs: `DEBUG=sharp*`
- Monitor server logs for image processing times and errors.
- Use platform monitoring tools (Vercel/Cloudflare/AWS dashboards) to track function execution time and memory usage.
- For persistent issues, profile with a single image and gradually increase load.

---

## 5. Additional Tips

- Always test with both small and large images.
- Test concurrent uploads if possible.
- If using custom domains or CDN, verify image URLs resolve correctly.
- For persistent failures, revert to local sharp and test, then re-enable serverless adapter.
