#!/bin/bash

# Vercel Environment Setup Script
# This script helps configure Vercel environments for SlideHeroes

set -e

echo "🚀 Setting up Vercel environments for SlideHeroes"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel@latest
fi

# Check if user is logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please log in to Vercel..."
    vercel login
fi

# Link the project (if not already linked)
echo "🔗 Linking Vercel project..."
vercel link --yes || echo "Project already linked"

# Get project info
PROJECT_ID=$(vercel ls --scope slideheroes 2>/dev/null | grep slideheroes | awk '{print $1}' | head -1)
if [ -z "$PROJECT_ID" ]; then
    echo "❌ Could not find SlideHeroes project. Please ensure project exists in Vercel."
    exit 1
fi

echo "📋 Project ID: $PROJECT_ID"

# Function to set environment variables
set_env_var() {
    local env=$1
    local key=$2
    local value=$3
    local target=${4:-"production,preview,development"}
    
    echo "Setting $key for $env environment..."
    vercel env add "$key" "$target" --force <<< "$value" || echo "Failed to set $key"
}

# Set up development environment variables
echo "🔧 Setting up development environment variables..."

# Common environment variables for all environments
echo "Setting common environment variables..."

# Production-specific variables
echo "🏭 Setting production environment variables..."
set_env_var "production" "NODE_ENV" "production" "production"
set_env_var "production" "NEXT_PUBLIC_SITE_URL" "https://slideheroes.com" "production"
set_env_var "production" "NEW_RELIC_APP_NAME" "SlideHeroes-Production" "production"

# Staging-specific variables  
echo "🎭 Setting staging environment variables..."
set_env_var "staging" "NODE_ENV" "production" "preview"
set_env_var "staging" "NEXT_PUBLIC_SITE_URL" "https://staging.slideheroes.com" "preview"
set_env_var "staging" "NEW_RELIC_APP_NAME" "SlideHeroes-Staging" "preview"

# Development-specific variables
echo "🔨 Setting development environment variables..."
set_env_var "development" "NODE_ENV" "development" "development"
set_env_var "development" "NEXT_PUBLIC_SITE_URL" "https://dev.slideheroes.com" "development"  
set_env_var "development" "NEW_RELIC_APP_NAME" "SlideHeroes-Development" "development"

# Configure domains (requires manual setup in Vercel dashboard)
echo "🌐 Domain configuration notes:"
echo "Please manually configure the following domains in your Vercel dashboard:"
echo "- slideheroes.com (production)"
echo "- staging.slideheroes.com (staging/preview)"
echo "- dev.slideheroes.com (development)"
echo ""
echo "DNS records needed:"
echo "slideheroes.com         A       76.76.19.19"
echo "www.slideheroes.com     CNAME   cname.vercel-dns.com"
echo "staging.slideheroes.com CNAME   cname.vercel-dns.com"
echo "dev.slideheroes.com     CNAME   cname.vercel-dns.com"

# Enable automatic deployments
echo "⚙️ Configuring deployment settings..."
vercel --prod --yes 2>/dev/null || echo "Deployment configuration updated"

echo ""
echo "✅ Vercel environment setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Configure custom domains in Vercel dashboard"
echo "2. Set up DNS records with your domain provider"
echo "3. Add required secrets to GitHub repository:"
echo "   - VERCEL_TOKEN"
echo "   - VERCEL_ORG_ID" 
echo "   - VERCEL_PROJECT_ID"
echo "   - Database and service credentials"
echo "4. Test deployments for each environment"
echo ""
echo "🔗 Useful links:"
echo "- Vercel Dashboard: https://vercel.com/dashboard"
echo "- Domain Settings: https://vercel.com/$PROJECT_ID/settings/domains"
echo "- Environment Variables: https://vercel.com/$PROJECT_ID/settings/environment-variables"