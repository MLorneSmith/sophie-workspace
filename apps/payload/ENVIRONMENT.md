# Payload CMS Environment Configuration

This document outlines the required environment variables for Payload CMS, with special focus on database configuration and storage setup for production deployments.

## Required Environment Variables

### Database Configuration

#### `DATABASE_URI`
The PostgreSQL connection string for Payload CMS database connectivity.

**Development Format:**
```bash
DATABASE_URI=postgresql://username:password@localhost:5432/database_name
```

**Production Format (with SSL):**
```bash
DATABASE_URI=postgresql://username:password@host:port/database?sslmode=require
```

**Examples for Common Hosting Providers:**

**Supabase:**
```bash
DATABASE_URI=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require
```

**Railway:**
```bash
DATABASE_URI=postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/railway?sslmode=require
```

**Neon:**
```bash
DATABASE_URI=postgresql://[USER]:[PASSWORD]@[HOST]/[DATABASE]?sslmode=require
```

**PlanetScale (MySQL variant - not recommended for Payload):**
Note: PlanetScale uses MySQL. Use PostgreSQL providers for Payload CMS.

#### Additional SSL Parameters (if needed)
For some hosted providers, you may need additional SSL parameters:

```bash
DATABASE_URI=postgresql://user:pass@host:port/db?sslmode=require&sslcert=server-ca.pem&sslkey=client-key.pem&sslrootcert=server-ca.pem
```

### Application Configuration

#### `PAYLOAD_SECRET`
A secret key used for JWT token generation and encryption.

**Requirements:**
- Minimum 32 characters
- Use strong, randomly generated string
- Keep secure and never commit to version control

**Generation:**
```bash
# Generate a secure secret
openssl rand -base64 32
```

**Example:**
```bash
PAYLOAD_SECRET=your-super-secure-secret-key-here-min-32-chars
```

#### `PAYLOAD_PUBLIC_SERVER_URL`
The public URL where your Payload CMS application is accessible.

**Development:**
```bash
PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3000
```

**Production:**
```bash
PAYLOAD_PUBLIC_SERVER_URL=https://your-domain.com
```

#### `NODE_ENV`
Environment mode that affects database connection behavior.

```bash
NODE_ENV=development  # For local development
NODE_ENV=production   # For production deployment
```

### Storage Configuration

#### Cloudflare R2 (Recommended for Production)

For serverless deployments, Cloudflare R2 provides S3-compatible storage without egress fees.

##### `CLOUDFLARE_R2_ACCOUNT_ID`
Your Cloudflare account ID (required for R2 storage).

```bash
CLOUDFLARE_R2_ACCOUNT_ID=your-cloudflare-account-id
```

##### `CLOUDFLARE_R2_BUCKET`
The name of your R2 bucket for storing media files.

```bash
CLOUDFLARE_R2_BUCKET=your-bucket-name
```

##### `CLOUDFLARE_R2_ACCESS_KEY_ID`
The access key ID for your R2 API token.

```bash
CLOUDFLARE_R2_ACCESS_KEY_ID=your-r2-access-key-id
```

##### `CLOUDFLARE_R2_SECRET_ACCESS_KEY`
The secret access key for your R2 API token.

```bash
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
```

#### Alternative: AWS S3

##### `S3_BUCKET`
The name of your S3 bucket (alternative to R2).

```bash
S3_BUCKET=your-s3-bucket-name
```

##### `S3_REGION`
The AWS region for your S3 bucket.

```bash
S3_REGION=us-east-1
```

##### `AWS_ACCESS_KEY_ID`
Your AWS access key ID.

```bash
AWS_ACCESS_KEY_ID=your-aws-access-key-id
```

##### `AWS_SECRET_ACCESS_KEY`
Your AWS secret access key.

```bash
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
```

**Important:** Without cloud storage configuration, Payload will attempt to use local file storage, which fails in serverless environments like Vercel, causing the "ENOENT: no such file or directory, mkdir 'media'" error.

## Environment File Setup

### Development (.env.local)
Create a `.env.local` file in your project root:

```bash
# Database
DATABASE_URI=postgresql://username:password@localhost:5432/payload_dev

# Payload Configuration
PAYLOAD_SECRET=your-development-secret-key-minimum-32-characters-long
PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3000

# Cloudflare R2 Storage (recommended)
CLOUDFLARE_R2_ACCOUNT_ID=your-cloudflare-account-id
CLOUDFLARE_R2_BUCKET=your-bucket-name
CLOUDFLARE_R2_ACCESS_KEY_ID=your-r2-access-key-id
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your-r2-secret-access-key

# Environment
NODE_ENV=development
```

### Production (Vercel/Netlify/Railway)
Set these environment variables in your hosting platform's dashboard:

```bash
# Database (with SSL)
DATABASE_URI=postgresql://user:pass@host:port/db?sslmode=require

# Payload Configuration
PAYLOAD_SECRET=your-production-secret-key-minimum-32-characters-long
PAYLOAD_PUBLIC_SERVER_URL=https://your-production-domain.com

# Cloudflare R2 Storage (required for production)
CLOUDFLARE_R2_ACCOUNT_ID=your-cloudflare-account-id
CLOUDFLARE_R2_BUCKET=your-bucket-name
CLOUDFLARE_R2_ACCESS_KEY_ID=your-r2-access-key-id
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your-r2-secret-access-key

# Environment
NODE_ENV=production
```

## Storage Troubleshooting

### Common Storage Issues

**Error: "ENOENT: no such file or directory, mkdir 'media'"**
- **Cause:** No cloud storage configured, falling back to local storage in serverless environment
- **Solution:** Configure Cloudflare R2 or AWS S3 environment variables

**Error: "Access Denied" with R2**
- **Cause:** Incorrect API token permissions or credentials
- **Solution:** Regenerate R2 API tokens with proper permissions (Object Read, Write, Delete)

**Error: "SignatureDoesNotMatch" with R2**
- **Cause:** Incorrect secret access key or endpoint configuration
- **Solution:** Double-check R2 credentials and Account ID

**Error: "NoSuchBucket"**
- **Cause:** Bucket name doesn't exist or incorrect
- **Solution:** Verify bucket name matches exactly in R2 dashboard

## Database Connection Troubleshooting

### Common SSL/TLS Issues

**Error: "SASL: SCRAM-SERVER-FINAL-MESSAGE: server signature is missing"**
- **Cause:** SSL handshake issues with hosted PostgreSQL providers
- **Solution:** Ensure `sslmode=require` is in your DATABASE_URI and `NODE_ENV=production`

**Error: "Connection timeout"**
- **Cause:** Connection pool exhaustion in serverless environments
- **Solution:** The configuration now includes optimized pool settings for serverless deployment

**Error: "SSL connection required"**
- **Cause:** Hosted PostgreSQL provider requires SSL but connection string missing SSL parameters
- **Solution:** Add `?sslmode=require` to your DATABASE_URI

### Connection Pool Optimization

The Payload configuration includes serverless-optimized settings:

- **Max connections:** 2 (reduced for serverless)
- **Connection timeout:** 10 seconds
- **Idle timeout:** 30 seconds
- **SSL enabled in production:** Automatic based on NODE_ENV

## Security Best Practices

1. **Never commit secrets to version control**
   - Use `.env.local` for development
   - Set environment variables in hosting platform dashboard for production

2. **Use strong PAYLOAD_SECRET**
   - Minimum 32 characters
   - Randomly generated
   - Different for development and production

3. **Enable SSL in production**
   - Always use `sslmode=require` for hosted databases
   - Verify SSL certificate settings with your provider

4. **Secure storage credentials**
   - Use separate R2/S3 credentials for development and production
   - Regularly rotate API tokens
   - Apply principle of least privilege for storage permissions

5. **Monitor connection usage**
   - Watch for connection pool exhaustion
   - Monitor database connection metrics in production
   - Monitor storage usage and costs

## Verification

To verify your environment configuration:

1. **Check environment variables are loaded:**
   ```bash
   # In your application, add temporary logging
   console.log('DATABASE_URI configured:', !!process.env.DATABASE_URI);
   console.log('NODE_ENV:', process.env.NODE_ENV);
   console.log('SSL mode:', process.env.NODE_ENV === 'production' ? 'enabled' : 'disabled');
   console.log('R2 Storage configured:', !!(process.env.CLOUDFLARE_R2_BUCKET && process.env.CLOUDFLARE_R2_ACCOUNT_ID));
   ```

2. **Test database connection:**
   - Start your application
   - Check console logs for connection success/failure
   - Access Payload admin panel at `/admin`

3. **Test storage configuration:**
   - Go to `/admin` and navigate to Media collection
   - Try uploading a test file
   - Verify file appears in your R2 bucket

4. **Monitor production logs:**
   - Check Vercel/Railway/Netlify function logs
   - Look for database connection errors
   - Monitor storage operation success/failure

## Support

If you encounter issues:

1. Verify your DATABASE_URI format matches your provider's requirements
2. Check that SSL parameters are included for production
3. Ensure NODE_ENV is set to 'production' in production environment
4. Verify all R2/S3 environment variables are set correctly
5. Test storage credentials using your cloud provider's dashboard or CLI
6. Review your hosting provider's database connection documentation
7. Check the detailed setup guide in `CLOUDFLARE_R2_SETUP.md`