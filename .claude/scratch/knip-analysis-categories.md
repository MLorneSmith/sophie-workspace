# Knip Analysis Categories

## 1. SAFE TO REMOVE - ESLint Configs (Replaced by Biome)

✅ Already removed - these were replaced by Biome

- packages/billing/core/eslint.config.mjs
- packages/billing/gateway/eslint.config.mjs
- packages/billing/lemon-squeezy/eslint.config.mjs
- packages/billing/stripe/eslint.config.mjs
- packages/cms/core/eslint.config.mjs
- packages/cms/keystatic/eslint.config.mjs
- packages/cms/types/eslint.config.mjs
- packages/cms/wordpress/eslint.config.mjs
- packages/features/accounts/eslint.config.mjs
- packages/features/admin/eslint.config.mjs
- packages/features/auth/eslint.config.mjs
- packages/features/notifications/eslint.config.mjs
- packages/features/team-accounts/eslint.config.mjs
- packages/mailers/core/eslint.config.mjs
- packages/mailers/nodemailer/eslint.config.mjs
- packages/mailers/resend/eslint.config.mjs
- packages/mailers/shared/eslint.config.mjs
- packages/monitoring/api/eslint.config.mjs
- packages/monitoring/baselime/eslint.config.mjs
- packages/monitoring/core/eslint.config.mjs
- packages/monitoring/sentry/eslint.config.mjs
- packages/plugins/analytics/posthog/eslint.config.mjs
- packages/plugins/testimonial/eslint.config.mjs
- tooling/eslint/apps.js
- tooling/eslint/base.js
- tooling/eslint/nextjs.js

## 2. MAKERKIT TEMPLATE FEATURES - Keep for Future Use

These are MakerKit features that aren't currently used but may be valuable:

### Authentication Features

- packages/features/auth/src/components/existing-account-hint.tsx
- packages/features/auth/src/components/last-auth-method-hint.tsx
- packages/features/auth/src/components/otp-sign-in-container.tsx
- packages/features/accounts/src/schema/link-email-password.schema.ts

### Billing/Payment Features

- packages/billing/gateway/src/server/utils/resolve-product-plan.ts (multi-plan support)

### Plugin Features

- packages/plugins/testimonial/src/server/index.ts (testimonial plugin backend)

## 3. PROJECT-SPECIFIC UNUSED FILES - Safe to Remove

- packages/cms/payload/src/api/course-enhanced.ts (appears to be old/duplicate API)

## 4. UNUSED DEPENDENCIES TO INVESTIGATE

### Payload CMS Dependencies

These might be needed for Payload features not yet used:

- @lexical/list (rich text editor lists)
- @lexical/rich-text (rich text features)
- @markdoc/markdoc (markdown processing)
- @payloadcms/payload-cloud (cloud deployment)
- lexical (rich text editor base)
- sharp (image processing)
- gray-matter (frontmatter parsing)
- js-yaml (YAML parsing)
- uuid (unique IDs)
- execa (process execution)

### Web App Dependencies

- @marsidev/react-turnstile (Cloudflare Turnstile CAPTCHA - might want this)
- @tanstack/react-table (data tables - might be used somewhere)
- @makerkit/data-loader-supabase-core (data loading utility)
- @kit/email-templates (email template system)

### Other Dependencies

- portkey-ai in packages/ai-gateway (but using @portkey-ai/vercel-provider)
- Various React/UI dependencies that might be used by MakerKit components

## 5. UNRESOLVED IMPORTS - Need Fixing

- ../../../../../../../apps/payload/payload-types references (path issues)
- ~/app/home/(user)/\_lib/server/load-user-workspace.loader import
