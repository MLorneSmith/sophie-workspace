# Vercel Deployment Guide for Web App and Payload CMS

This guide provides step-by-step instructions for deploying both the Payload CMS and the Next.js web application to Vercel. It covers the setup process, environment configuration, and best practices for a production deployment.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Structure](#project-structure)
3. [Deployment Overview](#deployment-overview)
4. [Deploying the Payload CMS](#deploying-the-payload-cms)
5. [Deploying the Web App](#deploying-the-web-app)
6. [Environment Variables](#environment-variables)
7. [Database Configuration](#database-configuration)
8. [CORS and Cross-Domain Communication](#cors-and-cross-domain-communication)
9. [Deployment Strategies](#deployment-strategies)
10. [Troubleshooting](#troubleshooting)

## Prerequisites

Before you begin, ensure you have:

- A Vercel account
- Access to your Supabase project
- Git repository with your project code
- Access to any third-party services (Stripe, email providers, etc.)

## Project Structure

This project is a monorepo with multiple applications:

- `apps/web`: The main Next.js web application
- `apps/payload`: The Payload CMS application
- Various shared packages in the `packages/` directory

## Deployment Overview

Since this is a monorepo, you need to create separate Vercel projects for each application. The recommended deployment order is:

1. **Deploy the Payload CMS first** - This ensures the CMS is up and running before the web app tries to connect to it.
2. **Deploy the Web App second** - This allows you to use the Payload CMS URL in the web app's environment variables.

This order is important because:

- The web app depends on the Payload CMS for content
- You'll need the Payload CMS URL for the web app's environment variables
- The Payload CMS needs to initialize its database schema before the web app tries to fetch content

## Deploying the Payload CMS

### 1. Prepare Your Supabase Database

1. Log in to your Supabase dashboard
2. Note your database connection information:
   - Host: Found in Project Settings → Database → Connection Info → Host
   - Password: Found in Project Settings → Database → Connection Info → Password
   - Port: Usually 5432 (default PostgreSQL port)
   - Database name: Usually "postgres" for Supabase

### 2. Create a New Vercel Project for Payload CMS

1. Log in to your Vercel account
2. Click "Add New" > "Project"
3. Import your Git repository
4. Select the `apps/payload` directory as the root directory
5. Configure the project settings:
   - Framework Preset: Next.js
   - Build Command: `cd ../.. && pnpm --filter payload-app build`
   - Output Directory: `.next`

### 3. Configure Environment Variables for Payload CMS

Add the following environment variables in the Vercel project settings:

```
# Database
DATABASE_URI=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?schema=payload
PAYLOAD_SECRET=your-payload-secret-key
PAYLOAD_PUBLIC_SERVER_URL=https://your-payload-cms-url.vercel.app

# CORS (if needed)
PAYLOAD_PUBLIC_CORS_ORIGINS=https://your-web-app-url.vercel.app
```

Replace:

- `[PASSWORD]` with your Supabase database password
- `[HOST]` with your Supabase host
- `your-payload-secret-key` with a secure random string (e.g., generated using `openssl rand -base64 32`)
- `your-payload-cms-url.vercel.app` with your Vercel deployment URL (you can use a placeholder and update it after deployment)
- `your-web-app-url.vercel.app` with your planned web app URL

### 4. Deploy the Payload CMS

1. Click "Deploy" to start the deployment process
2. Wait for the deployment to complete
3. Note the deployment URL (e.g., `https://your-payload-cms.vercel.app`)
4. Verify that the Payload CMS is accessible at the deployment URL
5. Update the `PAYLOAD_PUBLIC_SERVER_URL` environment variable with the actual deployment URL if needed

## Deploying the Web App

### 1. Create a New Vercel Project for Web App

1. Log in to your Vercel account
2. Click "Add New" > "Project"
3. Import your Git repository
4. Select the `apps/web` directory as the root directory
5. Configure the project settings:
   - Framework Preset: Next.js
   - Build Command: `cd ../.. && pnpm --filter web build`
   - Output Directory: `.next`

### 2. Configure Environment Variables for Web App

Add the following environment variables in the Vercel project settings:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Payload CMS
CMS_CLIENT=payload
PAYLOAD_PUBLIC_SERVER_URL=https://your-payload-cms-url.vercel.app
NEXT_PUBLIC_SITE_URL=https://your-web-app-url.vercel.app

# Other services (as needed)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-key
EMAIL_SENDER=your-email@example.com
# Add other environment variables as needed
```

Replace:

- `your-project.supabase.co` with your Supabase project URL
- `your-anon-key` with your Supabase anonymous key
- `your-service-role-key` with your Supabase service role key
- `your-payload-cms-url.vercel.app` with the actual URL of your deployed Payload CMS
- `your-web-app-url.vercel.app` with your Vercel deployment URL (you can use a placeholder and update it after deployment)

### 3. Deploy the Web App

1. Click "Deploy" to start the deployment process
2. Wait for the deployment to complete
3. Note the deployment URL (e.g., `https://your-web-app.vercel.app`)
4. Update the `NEXT_PUBLIC_SITE_URL` environment variable with the actual deployment URL if needed
5. Update the `PAYLOAD_PUBLIC_CORS_ORIGINS` environment variable in the Payload CMS project with the actual web app URL

## Environment Variables

### Where to Find Environment Variables

#### Supabase Variables

1. **NEXT_PUBLIC_SUPABASE_URL**

   - Where to find it: Supabase Dashboard → Project Settings → API
   - Example: `https://abcdefghijklm.supabase.co`

2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**

   - Where to find it: Supabase Dashboard → Project Settings → API → Project API keys → `anon` `public`
   - Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

3. **SUPABASE_SERVICE_ROLE_KEY**
   - Where to find it: Supabase Dashboard → Project Settings → API → Project API keys → `service_role` (secret)
   - Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - ⚠️ This is a sensitive key with admin privileges - never expose it client-side

#### Database Connection Variables

1. **DATABASE_URI**
   - This is a PostgreSQL connection string to your Supabase database
   - Where to find the components:
     - Host: Supabase Dashboard → Project Settings → Database → Connection Info → Host
     - Password: Supabase Dashboard → Project Settings → Database → Connection Info → Password
     - Format: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?schema=payload`
   - The `?schema=payload` part is important as it tells Payload to use a separate schema in your Supabase database

#### Payload CMS Variables

1. **PAYLOAD_SECRET**

   - This is a secret key you generate yourself for securing Payload CMS
   - You need to create this key; it's not provided by any service
   - Ways to generate a secure PAYLOAD_SECRET:
     - Using OpenSSL: `openssl rand -base64 32`
     - Using Node.js: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
     - Using an online secure key generator
   - Example: `3a4b5c6d7e8f9g0h1i2j3k4l5m6n7o8p9q0r1s2t3u4v5w6x7y8z9`
   - Store this securely - you'll need the same value in both development and production

2. **PAYLOAD_PUBLIC_SERVER_URL**

   - This will be the URL of your deployed Payload CMS on Vercel
   - Example: `https://your-payload-cms.vercel.app`

3. **PAYLOAD_PUBLIC_CORS_ORIGINS**
   - This should be the URL of your web app to allow cross-domain communication
   - Example: `https://your-web-app.vercel.app`

### Web App Environment Variables

| Variable                        | Description               | Example                                   |
| ------------------------------- | ------------------------- | ----------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Your Supabase project URL | `https://abcdefghijklm.supabase.co`       |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key    | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `SUPABASE_SERVICE_ROLE_KEY`     | Supabase service role key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `CMS_CLIENT`                    | CMS client type           | `payload`                                 |
| `PAYLOAD_PUBLIC_SERVER_URL`     | URL of your Payload CMS   | `https://your-payload-cms.vercel.app`     |
| `NEXT_PUBLIC_SITE_URL`          | URL of your web app       | `https://your-web-app.vercel.app`         |

### Payload CMS Environment Variables

| Variable                      | Description                  | Example                                                                        |
| ----------------------------- | ---------------------------- | ------------------------------------------------------------------------------ |
| `DATABASE_URI`                | PostgreSQL connection string | `postgresql://postgres:password@host.supabase.co:5432/postgres?schema=payload` |
| `PAYLOAD_SECRET`              | Secret key for Payload       | `your-secret-key`                                                              |
| `PAYLOAD_PUBLIC_SERVER_URL`   | URL of your Payload CMS      | `https://your-payload-cms.vercel.app`                                          |
| `PAYLOAD_PUBLIC_CORS_ORIGINS` | Allowed CORS origins         | `https://your-web-app.vercel.app`                                              |

## Database Configuration

### Supabase Database

The web app uses Supabase for its database. Ensure your Supabase project is properly configured:

1. Set up the necessary tables and schemas
2. Configure Row Level Security (RLS) policies
3. Set up authentication providers

### PostgreSQL for Payload CMS

Payload CMS uses a PostgreSQL database. You have several options:

1. **Supabase PostgreSQL**: Use the same Supabase database with a different schema (recommended)

   ```
   DATABASE_URI=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?schema=payload
   ```

   This approach keeps all your data in one database but separates the Payload tables into their own schema.

2. **Vercel Postgres**: Use Vercel's PostgreSQL offering

   ```
   DATABASE_URI=${POSTGRES_URL}
   ```

   This requires setting up a Vercel Postgres instance and connecting it to your Payload CMS.

3. **External PostgreSQL**: Use any PostgreSQL provider (AWS RDS, DigitalOcean, etc.)

### Important Notes About DATABASE_URI

1. **Production vs. Development**: The DATABASE_URI in your local development environment points to a local database (`127.0.0.1:5432`), but for production, you need to use your actual Supabase database connection string.

2. **Security**: The DATABASE_URI contains your database password, so it should be kept secure and only added as an environment variable in Vercel (never committed to your repository).

3. **Schema Separation**: The `?schema=payload` query parameter in the DATABASE_URI is crucial as it ensures Payload CMS uses a separate schema in your Supabase database, preventing conflicts with your existing tables.

4. **Connection Pooling**: For production deployments, Supabase recommends using connection pooling. You might want to use Supabase's connection pooling URL instead of the direct database connection for better performance.

## CORS and Cross-Domain Communication

When deploying the web app and Payload CMS to different domains, you need to configure CORS to allow cross-domain communication.

### Payload CMS CORS Configuration

In your Payload CMS configuration, ensure CORS is properly set up:

```javascript
// In payload.config.ts
export default buildConfig({
  // ... other config
  cors: [
    'https://your-web-app.vercel.app',
    // Add other domains as needed
  ],
  // ... other config
});
```

### Web App API Routes

If your web app has API routes that need to communicate with Payload CMS, ensure they handle CORS properly:

```javascript
// In your API route
export const config = {
  cors: {
    origin: 'https://your-payload-cms.vercel.app',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
};
```

## Deployment Strategies

### Monorepo Deployment

Since this is a monorepo, you need to create separate Vercel projects for each application you want to deploy, rather than deploying the entire monorepo as a single project. Here's a detailed explanation of what this means and how to do it:

#### What Monorepo Deployment Means

In your project, you have a Turborepo monorepo with two main applications:

1. `apps/payload` - Your Payload CMS application
2. `apps/web` - Your Next.js web application

Each of these applications needs its own Vercel project with specific configuration.

#### Steps for Deploying Each App

1. **Create separate Vercel projects** - You need to create two different Vercel projects: one for your Payload CMS and one for your web app.

2. **Configure root directories** - For each Vercel project, specify which directory in your monorepo contains the app you want to deploy:

   - For the Payload CMS: set the root directory to `apps/payload`
   - For the web app: set the root directory to `apps/web`

3. **Use custom build commands** - Instead of using the default build command, use Turborepo's filtering capability to build only the specific app:

   ```
   cd ../.. && turbo run build --filter=<app-name>
   ```

   - For the Payload CMS: `cd ../.. && turbo run build --filter=payload-app`
   - For the web app: `cd ../.. && turbo run build --filter=web`

   The `cd ../..` part is necessary because Vercel sets the working directory to the specified root directory (e.g., `apps/payload`), but you need to run the Turborepo commands from the root of the monorepo.

4. **Set environment variables** - Each Vercel project needs its own set of environment variables as specified in the earlier sections of this guide.

5. **Consider using Turborepo remote caching** - This can significantly speed up your builds by reusing cached build artifacts across deployments.

#### Why This Approach Is Necessary

This approach is necessary because:

1. **Independent deployments** - Each app can be deployed independently, allowing you to update one without affecting the other.

2. **Separate environments** - Each app can have its own environment variables and configuration.

3. **Optimized builds** - Using Turborepo's filtering ensures that only the necessary parts of your monorepo are built for each deployment.

4. **Cross-domain communication** - The web app and Payload CMS will be deployed to different domains (e.g., `your-web-app.vercel.app` and `your-payload-cms.vercel.app`), which is why the guide also includes a section on CORS configuration.

### Continuous Deployment

Set up continuous deployment from your Git repository:

1. Configure Vercel to deploy automatically on pushes to the main branch
2. Set up preview deployments for pull requests
3. Use branch protection rules to ensure code quality

### Environment-Specific Deployments

For different environments (staging, production):

1. Create separate Vercel projects for each environment
2. Use environment-specific environment variables
3. Consider using Vercel's environment feature to manage different environments

## Troubleshooting

### Common Issues

1. **Build Failures**:

   - Check build logs for errors
   - Ensure all dependencies are installed
   - Verify environment variables are set correctly

2. **Database Connection Issues**:

   - Check database connection strings
   - Ensure database is accessible from Vercel
   - Verify database credentials
   - Check if the database allows connections from Vercel's IP addresses

3. **CORS Errors**:

   - Check CORS configuration in Payload CMS
   - Verify origin URLs are correct
   - Use browser developer tools to debug CORS issues

4. **Environment Variable Issues**:
   - Ensure all required environment variables are set
   - Check for typos in environment variable names
   - Verify environment variables are in the correct project

### Getting Help

If you encounter issues:

1. Check Vercel documentation: [https://vercel.com/docs](https://vercel.com/docs)
2. Check Payload CMS documentation: [https://payloadcms.com/docs](https://payloadcms.com/docs)
3. Check the project's internal documentation
4. Reach out to the development team

## Conclusion

Deploying both the Payload CMS and web app to Vercel provides a scalable, reliable hosting solution. By following this step-by-step guide, you should be able to successfully deploy both applications and configure them to work together.

Remember to keep your environment variables secure and regularly update your deployments as you make changes to your codebase.
