# Quick Migration Reference

## 🚀 Essential Commands (Copy & Paste Ready)

### 1. SSL Certificate Setup (One Time)

```bash
cd apps/payload

# Download Supabase SSL certificate
curl -o supabase-ca-cert.crt https://supabase.com/docs/guides/database/ssl

# Verify certificate exists
ls -la supabase-ca-cert.crt
```

### 2. Environment Setup

```bash
cd apps/payload

# Edit .env.production with SSL-enabled DATABASE_URI
cp .env.production .env.production.local
# Update with working SSL configuration (see example below)
```

### 3. Working Environment Variables (Example)

```bash
# SSL-enabled Supabase connection
DATABASE_URI=postgresql://postgres.ldebzombxtszzcgnylgq:UcQ5TYC3Hdh0v5G0@aws-0-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require&sslrootcert=supabase-ca-cert.crt
PAYLOAD_SECRET=abcfedd4-6912-42ae-b4c9-b29101294a00
NODE_ENV=production
PAYLOAD_MIGRATION_MODE=production
PAYLOAD_ENABLE_SSL=true
PAYLOAD_PUBLIC_SERVER_URL=https://payload.slideheroes.com
```

### 4. Load Environment & Migrate

```bash
# Load environment variables
export $(cat .env.production.local | xargs)

# Test SSL connection first
psql "$DATABASE_URI" -c "SELECT version();"

# Execute migration
npm run payload migrate
```

### 5. Verify Success

```bash
# Check migration status
npm run payload migrate -- --status

# Verify database tables
psql "$DATABASE_URI" -c "\dt payload.*"

# Check schema exists
psql "$DATABASE_URI" -c "\dn payload"
```

## 🔧 Alternative: Direct Environment Setup

```bash
cd apps/payload

# Set variables directly (SSL-enabled example)
export DATABASE_URI="postgresql://postgres.user:password@host:6543/postgres?sslmode=require&sslrootcert=supabase-ca-cert.crt"
export PAYLOAD_SECRET="your-secret"
export NODE_ENV="production"
export PAYLOAD_MIGRATION_MODE="production" 
export PAYLOAD_ENABLE_SSL="true"
export PAYLOAD_PUBLIC_SERVER_URL="https://payload.slideheroes.com"

# Test connection
psql "$DATABASE_URI" -c "SELECT version();"

# Run migration
npm run payload migrate
```

## 🔄 Reset Commands (If Schema Corrupted)

```bash
# Quick reset sequence (see PAYLOAD_RESET_GUIDE.md for details)
psql "$DATABASE_URI" -c "DROP SCHEMA IF EXISTS payload CASCADE;"
rm -rf src/migrations/*.ts src/migrations/*.json
npm run payload generate:migration -- --name reset_schema
npm run payload migrate
```

## ✅ Success Indicators

- ✅ SSL connection test passes
- ✅ Output: "Migration completed successfully"
- ✅ No error messages
- ✅ Tables created in `payload` schema
- ✅ Migration recorded in `payload.payload_migrations`
- ✅ Schema verification queries work

## 🚨 Emergency Rollback

```bash
# Restore from backup (recommended)
psql "$DATABASE_URI" < your_backup.sql

# OR run down migration
npm run payload migrate -- --down

# OR complete reset (see PAYLOAD_RESET_GUIDE.md)
```

## 🐛 Quick Troubleshooting

### SSL Issues

```bash
# Verify certificate file
ls -la supabase-ca-cert.crt

# Re-download if needed
curl -o supabase-ca-cert.crt https://supabase.com/docs/guides/database/ssl
```

### Schema Corruption

```bash
# Check schema state
psql "$DATABASE_URI" -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'payload';"

# If corrupted, use reset procedure (see PAYLOAD_RESET_GUIDE.md)
```

### Connection Issues

```bash
# Test basic connection
psql "$DATABASE_URI" -c "SELECT 1;"

# Enable debug mode
export PAYLOAD_DEBUG=true
npm run payload migrate
```

## 📋 Pre-Flight Checklist

- [ ] Database backup created
- [ ] SSL certificate downloaded: `supabase-ca-cert.crt`
- [ ] Environment variables set with SSL parameters
- [ ] SSL connection test passes
- [ ] Network access to production database
- [ ] Payload CLI working: `npm run payload --help`

## 🔗 Related Guides

- **Complete Guide**: `MIGRATION_GUIDE.md` - Detailed procedures
- **Reset Guide**: `PAYLOAD_RESET_GUIDE.md` - Complete schema reset
- **Schema Verification**: Use queries in MIGRATION_GUIDE.md

---
💡 **Tip**: Always test with SSL connection first: `psql "$DATABASE_URI" -c "SELECT version();"`
