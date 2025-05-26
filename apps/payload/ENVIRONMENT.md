# Payload CMS Environment Configuration

This document outlines the required environment variables for Payload CMS, with special focus on database configuration for production deployments.

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

## Environment File Setup

### Development (.env.local)
Create a `.env.local` file in your project root:

```bash
# Database
DATABASE_URI=postgresql://username:password@localhost:5432/payload_dev

# Payload Configuration
PAYLOAD_SECRET=your-development-secret-key-minimum-32-characters-long
PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3000

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

# Environment
NODE_ENV=production
```

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

4. **Monitor connection usage**
   - Watch for connection pool exhaustion
   - Monitor database connection metrics in production

## Verification

To verify your environment configuration:

1. **Check environment variables are loaded:**
   ```bash
   # In your application, add temporary logging
   console.log('DATABASE_URI configured:', !!process.env.DATABASE_URI);
   console.log('NODE_ENV:', process.env.NODE_ENV);
   console.log('SSL mode:', process.env.NODE_ENV === 'production' ? 'enabled' : 'disabled');
   ```

2. **Test database connection:**
   - Start your application
   - Check console logs for connection success/failure
   - Access Payload admin panel at `/admin`

3. **Monitor production logs:**
   - Check Vercel/Railway/Netlify function logs
   - Look for database connection errors
   - Monitor response times for database queries

## Support

If you encounter issues:

1. Verify your DATABASE_URI format matches your provider's requirements
2. Check that SSL parameters are included for production
3. Ensure NODE_ENV is set to 'production' in production environment
4. Review your hosting provider's database connection documentation