# Vercel Environment Setup Guide

This document outlines the Vercel deployment configuration for SlideHeroes across multiple environments.

## 🌍 Environment Structure

### Production Environment

- **Domain**: `slideheroes.com`
- **Branch**: `main`
- **Deployment**: Automatic on push to main
- **Protection**: Requires 2 code reviews + all CI checks

#### Staging Environment

- **Domain**: `staging.slideheroes.com`
- **Branch**: `staging`
- **Deployment**: Automatic on push to staging
- **Protection**: Requires 1 code review + all CI checks
- **Purpose**: Final testing before production release

#### Development Environment

- **Domain**: `dev.slideheroes.com`
- **Branch**: `dev`
- **Deployment**: Automatic on push to dev
- **Protection**: Requires CI checks only
- **Purpose**: Integration testing and development preview

#### Preview Deployments

- **Domain**: Auto-generated Vercel URLs
- **Trigger**: Pull requests to any branch
- **Purpose**: Feature preview and testing

## 🔧 Vercel Project Configuration

### Required Secrets in Vercel Dashboard

```bash
# Vercel Integration
VERCEL_ORG_ID=team_xxxxxxxxxxxxx
VERCEL_PROJECT_ID=prj_xxxxxxxxxxxxx

# Database & Auth
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
SUPABASE_DB_WEBHOOK_SECRET=your-webhook-secret

# Payment Processing
STRIPE_SECRET_KEY=sk_live_or_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_live_or_test_...

# Email Service
RESEND_API_KEY=re_...

# AI Services
PORTKEY_API_KEY=pk-...
PORTKEY_VIRTUAL_KEY=...

# Monitoring
NEW_RELIC_LICENSE_KEY=...
NEW_RELIC_APP_NAME=SlideHeroes
```

### Environment-Specific Variables

#### Production (`slideheroes.com`)

```bash
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://slideheroes.com
NEXT_PUBLIC_SUPABASE_URL=https://your-prod.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
STRIPE_PUBLISHABLE_KEY=pk_live_...
NEW_RELIC_APP_NAME=SlideHeroes-Production
```

#### Staging (`staging.slideheroes.com`)

```bash
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://staging.slideheroes.com
NEXT_PUBLIC_SUPABASE_URL=https://your-staging.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
STRIPE_PUBLISHABLE_KEY=pk_test_...
NEW_RELIC_APP_NAME=SlideHeroes-Staging
```

#### Development (`dev.slideheroes.com`)

```bash
NODE_ENV=development
NEXT_PUBLIC_SITE_URL=https://dev.slideheroes.com
NEXT_PUBLIC_SUPABASE_URL=https://your-dev.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
STRIPE_PUBLISHABLE_KEY=pk_test_...
NEW_RELIC_APP_NAME=SlideHeroes-Development
```

## 🌐 DNS Configuration

### Domain Setup via Vercel Dashboard

**Important**: Custom domains should be configured in the Vercel project dashboard, not via CLI commands.
This ensures proper automatic routing.

1. **Go to Vercel Dashboard** → Project Settings → Domains
2. **Add each domain**:
   - `slideheroes.com` (production)
   - `staging.slideheroes.com` (staging)
   - `dev.slideheroes.com` (development)
3. **Configure branch targeting** for each domain in dashboard

### Required DNS Records

Configure these with your domain provider:

```dns
# Production
slideheroes.com         A       76.76.19.19
www.slideheroes.com     CNAME   cname.vercel-dns.com

# Staging
staging.slideheroes.com CNAME   cname.vercel-dns.com

# Development
dev.slideheroes.com     CNAME   cname.vercel-dns.com
```

### SSL Certificates

Vercel automatically provisions and manages SSL certificates for all custom domains.

## 🚀 Deployment Process

### Automatic Deployments

1. **Production**: Push to `main` → Vercel production deployment
2. **Staging**: Push to `staging` → Vercel staging deployment
3. **Development**: Push to `dev` → Vercel dev deployment
4. **Preview**: Open PR → Vercel preview deployment

### Manual Deployments

```bash
# Install Vercel CLI
npm i -g vercel

# Link project (one-time setup)
vercel link

# Deploy to production
vercel --prod

# Deploy to staging
vercel --target staging

# Deploy to development
vercel --target development
```

## 📋 Setup Checklist

### Initial Setup

- [ ] Create Vercel project
- [ ] Configure custom domains in Vercel dashboard
- [ ] Set up DNS records with domain provider
- [ ] Configure environment variables for each environment
- [ ] Set up GitHub integration for automatic deployments

### Environment Variables

- [ ] Add all required secrets to Vercel project settings
- [ ] Configure environment-specific variables for each deployment
- [ ] Test variable access in each environment

### Deployment Testing

- [ ] Test production deployment from main branch
- [ ] Test staging deployment from staging branch
- [ ] Test development deployment from dev branch
- [ ] Verify preview deployments work for pull requests

### Domain Configuration

- [ ] Verify slideheroes.com points to production
- [ ] Verify staging.slideheroes.com works
- [ ] Verify dev.slideheroes.com works
- [ ] Confirm SSL certificates are active

## 🔍 Troubleshooting

### Common Issues

<<<<<<< HEAD

#### Build Failures

=======
**Build Failures**
>>>>>>> origin/main

- Check build logs in Vercel dashboard
- Verify all environment variables are set
- Ensure pnpm lockfile is up to date

<<<<<<< HEAD

#### Domain Issues

=======
**Domain Issues**
>>>>>>> origin/main

- Verify DNS propagation (can take up to 48 hours)
- Check DNS records are correctly configured
- Ensure domain is added in Vercel dashboard

<<<<<<< HEAD

#### Environment Variable Issues

=======
**Environment Variable Issues**
>>>>>>> origin/main

- Ensure variables are set for the correct environment
- Check variable names match exactly (case-sensitive)
- Verify secrets are not exposed in client-side code

### Debug Commands

```bash
# Check deployment status
vercel ls

# View deployment logs
vercel logs [deployment-url]

# Inspect environment variables
vercel env ls

# Test domain configuration
dig slideheroes.com
dig staging.slideheroes.com
dig dev.slideheroes.com
```

## 📞 Support

For Vercel-specific issues:

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Community](https://github.com/vercel/vercel/discussions)
- Vercel Support (for Pro/Team plans)

For project-specific deployment issues:

- Check GitHub Actions workflow logs
- Review Vercel dashboard deployment logs
- Verify branch protection rules are not blocking deployments
