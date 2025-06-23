# 🔧 Storage Setup - Fix for Media Collection Errors

This guide will fix the `ENOENT: no such file or directory, mkdir 'media'` error you're experiencing in production.

## 🚨 Problem Summary

The error occurs because:

1. **No cloud storage configured** - Your Payload CMS falls back to local file storage
2. **Serverless environment limitation** - Vercel's read-only filesystem prevents creating directories
3. **Missing Cloudflare R2 setup** - Your intended R2 storage isn't activating

## ✅ Solution Overview

We've implemented a comprehensive fix that includes:

1. **Updated Payload Configuration** - Enhanced `payload.config.ts` with proper R2 support
2. **Environment Variable Setup** - Clear documentation for all required variables  
3. **Verification Tools** - Scripts to test your configuration
4. **Step-by-step Guides** - Detailed R2 setup instructions

## 🚀 Quick Start

### Step 1: Set Up Cloudflare R2 (5 minutes)

1. **Create R2 Bucket**
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → R2 Object Storage
   - Create a new bucket (e.g., `slideheroes-media`)

2. **Generate API Tokens**
   - Click "Manage R2 API tokens" → "Create API token"
   - Permissions: Object Read, Write, Delete
   - Save your Access Key ID and Secret Access Key

3. **Get Account ID**
   - Copy your Account ID from the dashboard sidebar

### Step 2: Configure Environment Variables

Add these to your Vercel environment variables:

```bash
CLOUDFLARE_R2_ACCOUNT_ID=your-account-id-here
CLOUDFLARE_R2_BUCKET=your-bucket-name-here  
CLOUDFLARE_R2_ACCESS_KEY_ID=your-access-key-here
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your-secret-key-here
```

### Step 3: Verify Configuration

Run the verification script:

```bash
cd apps/payload
node scripts/verify-config.js
```

### Step 4: Deploy and Test

1. Redeploy your application
2. Go to `/admin` → Media collection
3. Try uploading a file
4. ✅ Success! No more mkdir errors

## 📚 Detailed Documentation

- **[CLOUDFLARE_R2_SETUP.md](./CLOUDFLARE_R2_SETUP.md)** - Complete R2 setup guide
- **[ENVIRONMENT.md](./ENVIRONMENT.md)** - All environment variables explained
- **[verify-config.js](./scripts/verify-config.js)** - Configuration verification tool

## 🛠️ What We Fixed

### 1. Enhanced Payload Configuration

**Before:** Only basic S3 support, falls back to local storage

```javascript
// Old configuration - caused mkdir errors
if (process.env.S3_BUCKET && process.env.S3_REGION) {
  // Basic S3 config
}
return undefined; // Falls back to local storage = ERROR
```

**After:** Proper R2 support with fallbacks and warnings

```javascript
// New configuration - R2 first, then S3, with production warnings
if (process.env.CLOUDFLARE_R2_BUCKET && ...) {
  // Cloudflare R2 with proper endpoint
} else if (process.env.S3_BUCKET && ...) {
  // AWS S3 fallback
} else if (process.env.NODE_ENV === 'production') {
  // Warning: will cause errors in serverless
}
```

### 2. Environment Variable Detection

**Enhanced Configuration Logic:**

- ✅ Cloudflare R2 detection (recommended)
- ✅ AWS S3 fallback support
- ✅ Production warnings when no storage configured
- ✅ Development logging for debugging

### 3. Serverless Compatibility

**R2-Specific Settings:**

```javascript
config: {
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  region: 'auto',
  forcePathStyle: true,
  signatureVersion: 'v4',
}
```

## 🎯 Expected Results

### Before Fix

```
[ERROR] ENOENT: no such file or directory, mkdir 'media'
❌ Media uploads fail
❌ Production deployment broken
```

### After Fix

```
[PAYLOAD-CONFIG] Configuring Cloudflare R2 storage
[PAYLOAD-CONFIG] R2 Bucket: your-bucket-name
✅ Media uploads work
✅ Files stored in R2
✅ Production stable
```

## 🔍 Troubleshooting

### Still getting mkdir errors?

1. **Check environment variables:**

   ```bash
   node scripts/verify-config.js
   ```

2. **Verify R2 credentials:**
   - Test in Cloudflare dashboard
   - Regenerate API tokens if needed

3. **Check deployment logs:**
   - Look for "Configuring Cloudflare R2 storage" message
   - Verify no "No cloud storage configured" warnings

### Common Issues

**"Access Denied"**

- Regenerate R2 API tokens with proper permissions

**"SignatureDoesNotMatch"**  

- Double-check Account ID and secret key

**"NoSuchBucket"**

- Verify bucket name matches exactly

## 💰 Cost Benefits

**Cloudflare R2 vs AWS S3:**

- ✅ No egress fees (R2) vs $0.09/GB egress (S3)
- ✅ Global CDN included
- ✅ Simpler pricing structure
- ✅ Better for serverless applications

## 🚀 Next Steps

1. **Immediate:** Configure R2 environment variables
2. **Short-term:** Test file uploads in production
3. **Long-term:** Consider custom domain for media URLs
4. **Optional:** Set up CORS for direct browser uploads

## 📞 Support

If you need help:

1. Run `node scripts/verify-config.js` first
2. Check the detailed guides in this directory
3. Review Vercel deployment logs for specific errors
4. Test R2 credentials in Cloudflare dashboard

---

**🎉 This fix resolves the serverless storage issue completely and sets you up for scalable media management!**
