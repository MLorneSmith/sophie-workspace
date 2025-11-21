# Test Scripts Documentation

## Overview

This directory contains test infrastructure scripts for managing automated testing in the SlideHeroes project.

## Configuration

### Environment Variables

The test scripts use environment variables for all sensitive configuration, including:

- **JWT Tokens**:
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
  - `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (admin access)

- **Test User Credentials**:
  - `E2E_TEST_USER_EMAIL` - Standard test user email
  - `E2E_TEST_USER_PASSWORD` - Standard test user password
  - `E2E_OWNER_EMAIL` - Account owner test email
  - `E2E_OWNER_PASSWORD` - Account owner test password
  - `E2E_ADMIN_EMAIL` - Admin user email
  - `E2E_ADMIN_PASSWORD` - Admin user password

### Environment Files

The scripts prioritize environment files in this order:

1. `apps/web/.env.test.locked` - Immutable test configuration (highest priority)
2. `apps/web/.env.test` - Test environment configuration
3. `apps/web/.env` - Default environment

**IMPORTANT**: Never hardcode passwords or sensitive credentials in the scripts. Always use environment variables.

## Unified Architecture

All test scripts use the **unified Web Supabase instance** as the single source of truth:

- **API Port**: 54521 (changed from 54321 to avoid Hyper-V port reservation conflicts)
- **Database Port**: 54522 (changed from 54322 to avoid Hyper-V port reservation conflicts)
- **Directory**: All Supabase commands run from `apps/web/` (not `apps/e2e/`)

## Key Scripts

### test-config.cjs

Central configuration file that loads environment variables and defines:

- Port configurations (54521/54522 for unified Web Supabase)
- Test user credentials from environment variables
- Database connection strings
- Timeouts and execution settings

### infrastructure-manager.cjs

Manages infrastructure setup and health checks:

- Checks for `.env.test.locked` first for immutable configuration
- Loads test user credentials from environment variables
- Uses environment variables for JWT tokens
- Manages Web Supabase instance (not E2E)

### test-controller-monolith.cjs

Main test orchestration controller:

- Uses environment variables for all API authentication
- Connects to unified Web Supabase on ports 54321/54322
- Loads test credentials from environment

## Security Best Practices

1. **No Hardcoded Passwords**: All passwords and sensitive data must come from environment variables
2. **Use .env.test.locked**: This file contains immutable test configuration for consistency
3. **JWT Tokens**: While local development tokens are less sensitive, still load from environment
4. **Password Storage**: Never commit actual passwords to the repository
5. **Environment Isolation**: Test environments should have their own credential sets

## Migration Notes

These scripts have been updated from the dual-database architecture to the unified architecture:

- All references to `apps/e2e` changed to `apps/web`
- All ports updated from 55321/55322 to 54321/54322
- All hardcoded credentials replaced with environment variables
- Support added for `.env.test.locked` files
