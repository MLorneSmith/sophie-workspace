# Remote Database Migration Guide

## 1. Overview & Architecture

Our current setup involves a dual-schema architecture within a PostgreSQL database hosted on Supabase:

- **Payload CMS migrations** target the `payload` schema.
- **Supabase migrations** target the `public` schema.

This separation allows independent management and versioning of each schema, facilitating complex migrations and schema evolution.

## 2. Prerequisites & Setup

### SSL Certificate Download

- Access your Supabase Dashboard.
- Navigate to **Settings > Database > SSL Certificates**.
- Download the **full CA bundle** (`ca.crt`) file.
- Place the certificate file in a secure directory, e.g., `C:\certs\supabase\ca.crt`.

### Environment Configuration

- Ensure your environment variables include the connection string with SSL parameters.
- Example connection string format:

```plaintext
postgresql://<user>:<password>@<host>:<port>/<database>?sslmode=verify-full&sslrootcert=C:/certs/supabase/ca.crt
```

- Replace `<user>`, `<password>`, `<host>`, `<port>`, and `<database>` with your actual credentials.

### Connection String Format

- Use `sslmode=verify-full` to enforce SSL verification.
- Reference the CA certificate file with `sslrootcert` parameter.
- Example:

```plaintext
postgresql://myuser:mypassword@db.example.com:5432/mydb?sslmode=verify-full&sslrootcert=C:/certs/supabase/ca.crt
```

## 3. Step-by-Step Migration Process

### Payload CMS Migration

1. **Configure Migration Scripts:**

   - Migration scripts are located in `apps/payload/src/migrations/`.
   - Ensure your migration scripts are up-to-date and tested locally.

2. **Run Payload Migration:**

```bash
cd apps/payload
npm run payload migrate:create -- --name add_nested_docs_breadcrumbs
```

3. **Apply Payload Migrations:**

```bash
npm run payload migrate
```

- This applies all pending migrations to the `payload` schema.

### Supabase Migration

1. **Prepare Migration Files:**

   - Migration files are located in `apps/web/supabase/migrations/`.
   - Confirm all migration files are committed and in order.

2. **Push Migrations to Supabase:**

```bash
supabase db push
```

- This command applies all new migration files to the connected database.

3. **Verify Migration State:**

```bash
supabase db diff --linked
```

- Ensures the local migration files are in sync with the database schema.

## 4. SSL Configuration Details

- **Connection String:**

```plaintext
postgresql://<user>:<password>@<host>:<port>/<database>?sslmode=verify-full&sslrootcert=C:/certs/supabase/ca.crt
```

- **Certificate Placement:**

  - Save `ca.crt` in a dedicated directory, e.g., `C:\certs\supabase\`.
  - Reference the full path in the connection string.

- **Common SSL Issues & Fixes:**

  - **Error:** `SSL connection error: certificate verify failed`
    - Fix: Ensure `sslrootcert` path is correct and accessible.
    - Fix: Confirm the certificate file is valid and matches the server CA.

  - **Error:** `SSL connection error: self-signed certificate`
    - Fix: Use `sslmode=verify-full` and correct CA bundle.

## 5. Troubleshooting Section

- **SSL Connection Errors:**

  - Verify the certificate file path.
  - Check file permissions.
  - Confirm the certificate is valid and matches the server CA.

- **Migration Failures:**

  - Check migration logs in `z.migration-logs/`.
  - Revert to previous migration state if needed.
  - Run `supabase db reset` if schema drift occurs.

- **Verification Commands:**

```bash
supabase db diff --linked
```

- Use this after migrations to confirm schema alignment.

## 6. Migration Files Location

- Payload migrations: `apps/payload/src/migrations/`
- Supabase migrations: `apps/web/supabase/migrations/`

## 7. Success Criteria & Validation

- Both schemas (`payload` and `public`) are populated with the latest schema objects.
- No pending migrations in either system.
- `supabase db diff --linked` reports no differences.
- Schema drift is eliminated, and the database is consistent with migration files.

---

This guide ensures future developers can replicate the migration process reliably, maintaining schema integrity and security with SSL configurations.