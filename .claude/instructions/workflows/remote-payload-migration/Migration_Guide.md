# Payload CMS Remote Migration Guide

This guide provides step-by-step instructions for running Payload CMS migrations against the production database using the CLI, including SSL certificate setup and production environment configuration.

## ✅ Prerequisites Checklist

- [ ] Payload CLI script exists: `npm run payload`
- [ ] Migration files exist in `src/migrations/`
- [ ] Production database credentials available
- [ ] SSL certificate file obtained: `supabase-ca-cert.crt`
- [ ] Database backup completed (CRITICAL)

## 🔐 SSL Certificate Setup

### 1. Obtain SSL Certificate

Download the Supabase SSL certificate:

```bash
cd apps/payload
curl -o supabase-ca-cert.crt https://supabase.com/docs/guides/database/ssl
# Or download manually from Supabase dashboard under Database settings
```

### 2. Verify Certificate Location

```bash
# Certificate should be in apps/payload directory
ls -la supabase-ca-cert.crt
```

## 🔧 Environment Setup

### 1. Configure Environment Variables

Edit `apps/payload/.env.production` with your actual values:

```bash
# Database Connection (SSL Required)
DATABASE_URI=postgresql://postgres.ldebzombxtszzcgnylgq:UcQ5TYC3Hdh0v5G0@aws-0-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require&sslrootcert=supabase-ca-cert.crt

# Payload Configuration
PAYLOAD_SECRET=abcfedd4-6912-42ae-b4c9-b29101294a00
PAYLOAD_PUBLIC_SERVER_URL=https://payload.slideheroes.com

# Migration Settings
NODE_ENV=production
PAYLOAD_MIGRATION_MODE=production
PAYLOAD_ENABLE_SSL=true
```

### 2. Load Environment Variables

```bash
cd apps/payload
export $(cat .env.production | xargs)
```

### 3. Verify SSL Connection

```bash
# Test database connectivity with SSL
psql "$DATABASE_URI" -c "SELECT version();"
```

## 🚀 Migration Execution

### Step 1: Verify Connection and Schema State

```bash
# Test database connectivity
npm run payload migrate -- --status

# Check current schema state
psql "$DATABASE_URI" -c "\dn payload;"
psql "$DATABASE_URI" -c "\dt payload.*;"
```

### Step 2: Preview Migration

```bash
# Check what migrations will run
npm run payload migrate -- --dry-run
```

### Step 3: Execute Migration

```bash
# Run the migration
npm run payload migrate
```

### Expected Output

```
[PAYLOAD-INFO] Database adapter created successfully
[PAYLOAD-INFO] Running migration: 20250527_161647
[PAYLOAD-INFO] Migration completed successfully
```

## 🔍 Schema Verification Steps

### 1. Check Migration Status

```bash
# Verify migration was recorded
npm run payload migrate -- --status
```

### 2. Database Schema Verification

```bash
# Connect to database
psql "$DATABASE_URI"

# Check payload schema exists
\dn payload

# Verify key tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'payload' 
ORDER BY table_name;

# Check migration record
SELECT * FROM payload.payload_migrations 
ORDER BY created_at DESC LIMIT 5;

# Verify specific collections exist
\dt payload.courses
\dt payload.users
\dt payload.media
```

### 3. Application Health Check

```bash
# Test Payload admin access
curl -f https://payload.slideheroes.com/admin || echo "Admin not accessible"

# Test API endpoints
curl -f https://payload.slideheroes.com/api/health || echo "API not accessible"
```

## 🚨 Safety Measures

### Database Backup (CRITICAL)

```bash
# Create backup before migration
pg_dump "$DATABASE_URI" > "backup_$(date +%Y%m%d_%H%M%S).sql"
```

### Schema Isolation

- ✅ Migration affects `payload` schema only
- ✅ No changes to `public` schema
- ✅ Foreign key constraints preserved

### Connection Pool Settings

- Production: max 15 connections
- SSL: enabled automatically
- Timeout: 10 seconds

## 🔄 Rollback Procedures

### Option 1: Database Restore (Recommended)

```bash
# Restore from backup
psql "$DATABASE_URI" < backup_20250528_120000.sql
```

### Option 2: Migration Rollback

```bash
# Run down migration (if available)
npm run payload migrate -- --down

# Or target specific migration
npm run payload migrate -- --down 20250527_161647
```

### Option 3: Complete Reset (See Reset Guide)

For complete schema reset, refer to: `PAYLOAD_RESET_GUIDE.md`

## 🐛 Troubleshooting

### Common Issues

**SSL Certificate Issues:**

```bash
# Verify certificate file exists
ls -la supabase-ca-cert.crt

# Check SSL connection
psql "$DATABASE_URI" -c "SELECT version();"

# If certificate issues persist, download fresh certificate
curl -o supabase-ca-cert.crt https://supabase.com/docs/guides/database/ssl
```

**"Column does not exist" Errors:**

```bash
# Check if schema is corrupted
psql "$DATABASE_URI" -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'payload';"

# If schema is corrupted, perform reset (see PAYLOAD_RESET_GUIDE.md)
```

**Connection Timeout:**

```bash
# Increase timeout
export PAYLOAD_DB_TIMEOUT=30000
npm run payload migrate
```

**Migration Already Exists:**

```bash
# Force re-run migration
npm run payload migrate -- --force
```

### Debug Mode

```bash
# Enable debug logging
export PAYLOAD_DEBUG=true
export LOG_LEVEL=debug
npm run payload migrate
```

## 📊 Post-Migration Validation

### 1. Data Integrity Checks

```sql
-- Check table counts
SELECT 
  schemaname,
  tablename,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes
FROM pg_stat_user_tables 
WHERE schemaname = 'payload'
ORDER BY tablename;

-- Verify foreign key constraints
SELECT 
  tc.table_name, 
  tc.constraint_name, 
  tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.table_schema = 'payload'
AND tc.constraint_type = 'FOREIGN KEY';
```

### 2. Application Testing

```bash
# Test core collections
curl -H "Authorization: Bearer $TOKEN" \
  https://payload.slideheroes.com/api/users

curl -H "Authorization: Bearer $TOKEN" \
  https://payload.slideheroes.com/api/courses
```

## 📝 Migration Completion Checklist

- [ ] SSL certificate downloaded and verified
- [ ] Environment variables configured correctly
- [ ] Migration executed successfully
- [ ] No error messages in logs
- [ ] Database schema updated
- [ ] Migration recorded in payload_migrations table
- [ ] Application starts without errors
- [ ] Admin panel accessible
- [ ] API endpoints responding
- [ ] Data integrity verified
- [ ] Backup created and verified

## 🔗 Additional Resources

- **Reset Guide**: `PAYLOAD_RESET_GUIDE.md` - Complete reset procedures
- **Quick Reference**: `QUICK_MIGRATION_REFERENCE.md` - Essential commands
- **Migration Files**: `src/migrations/`
- **Config File**: `src/payload.config.ts`
- **Database Adapter**: `src/lib/database-adapter-singleton.ts`
- **Package Scripts**: `package.json`

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review debug logs with `PAYLOAD_DEBUG=true`
3. Verify SSL certificate and environment variables
4. Ensure database connectivity from your location
5. Consider reset procedure if schema is corrupted
