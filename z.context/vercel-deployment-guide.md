# Vercel Deployment Guide for Web App and Payload CMS

This guide provides instructions for deploying both the Next.js web application and the Payload CMS to Vercel. It covers the setup process, environment configuration, and best practices for a production deployment.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Structure](#project-structure)
3. [Deploying the Web App](#deploying-the-web-app)
4. [Deploying the Payload CMS](#deploying-the-payload-cms)
5. [Environment Variables](#environment-variables)
6. [Database Configuration](#database-configuration)
7. [CORS and Cross-Domain Communication](#cors-and-cross-domain-communication)
8. [Deployment Strategies](#deployment-strategies)
9. [Troubleshooting](#troubleshooting)

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

## Deploying the Web App

### 1. Create a New Vercel Project

1. Log in to your Vercel account
2. Click "Add New" > "Project"
3. Import your Git repository
4. Select the `apps/web` directory as the root directory
5. Configure the project settings:
   - Framework Preset: Next.js
   - Build Command: `cd ../.. && pnpm --filter web build`
   - Output Directory: `.next`

### 2. Configure Environment Variables

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

### 3. Deploy the Web App

Click "Deploy" to start the deployment process. Vercel will build and deploy your web application.

## Deploying the Payload CMS

### 1. Create a New Vercel Project

1. Log in to your Vercel account
2. Click "Add New" > "Project"
3. Import your Git repository
4. Select the `apps/payload` directory as the root directory
5. Configure the project settings:
   - Framework Preset: Next.js
   - Build Command: `cd ../.. && pnpm --filter payload-app build`
   - Output Directory: `.next`

### 2. Configure Environment Variables

Add the following environment variables in the Vercel project settings:

```
# Database
DATABASE_URI=postgresql://postgres:password@your-postgres-host.com:5432/your-database
PAYLOAD_SECRET=your-payload-secret-key
PAYLOAD_PUBLIC_SERVER_URL=https://your-payload-cms-url.vercel.app

# CORS (if needed)
PAYLOAD_PUBLIC_CORS_ORIGINS=https://your-web-app-url.vercel.app
```

### 3. Deploy the Payload CMS

Click "Deploy" to start the deployment process. Vercel will build and deploy your Payload CMS application.

## Environment Variables

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

| Variable                      | Description                  | Example                               |
| ----------------------------- | ---------------------------- | ------------------------------------- |
| `DATABASE_URI`                | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `PAYLOAD_SECRET`              | Secret key for Payload       | `your-secret-key`                     |
| `PAYLOAD_PUBLIC_SERVER_URL`   | URL of your Payload CMS      | `https://your-payload-cms.vercel.app` |
| `PAYLOAD_PUBLIC_CORS_ORIGINS` | Allowed CORS origins         | `https://your-web-app.vercel.app`     |

## Database Configuration

### Supabase Database

The web app uses Supabase for its database. Ensure your Supabase project is properly configured:

1. Set up the necessary tables and schemas
2. Configure Row Level Security (RLS) policies
3. Set up authentication providers

### PostgreSQL for Payload CMS

Payload CMS uses a PostgreSQL database. You have several options:

1. **Supabase PostgreSQL**: Use the same Supabase database with a different schema

   ```
   DATABASE_URI=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?schema=payload
   ```

2. **Vercel Postgres**: Use Vercel's PostgreSQL offering

   ```
   DATABASE_URI=${POSTGRES_URL}
   ```

3. **External PostgreSQL**: Use any PostgreSQL provider (AWS RDS, DigitalOcean, etc.)

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

### Continuous Deployment

Set up continuous deployment from your Git repository:

1. Configure Vercel to deploy automatically on pushes to the main branch
2. Set up preview deployments for pull requests
3. Use branch protection rules to ensure code quality

### Monorepo Deployment

Since this is a monorepo, you need to configure Vercel to build only the specific app:

1. Use the root directory setting to specify the app directory
2. Use a custom build command that navigates to the root and then builds the specific app
3. Consider using Turborepo remote caching for faster builds

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

Deploying both the web app and Payload CMS to Vercel provides a scalable, reliable hosting solution. By following this guide, you should be able to successfully deploy both applications and configure them to work together.

Remember to keep your environment variables secure and regularly update your deployments as you make changes to your codebase.
