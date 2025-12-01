---
id: "database-schema"
title: "Database Schema Reference"
version: "1.0.0"
category: "reference"
description: "Supabase database schema overview for public and payload schemas"
tags: ["database", "schema", "supabase", "tables", "payload"]
created: "2025-12-01"
last_updated: "2025-12-01"
author: "agent"
dependencies:
  - "development/database-patterns.md"
---

# Database Schema Reference

## Schemas

| Schema | Purpose |
|--------|---------|
| `public` | Main application data (30 tables) |
| `payload` | CMS content (60 tables) |
| `auth` | Supabase authentication |
| `storage` | File storage |
| `kit` | Internal helper functions |

## Public Schema - Core Tables

### Multi-Tenant Foundation

```
accounts (id, primary_owner_user_id, name, slug, email, is_personal_account, picture_url, public_data)
  └── accounts_memberships (user_id, account_id, account_role)
        └── roles (name, hierarchy_level)
              └── role_permissions (role, permission)
```

**Key Relationships:**
- `accounts.primary_owner_user_id` → `auth.users.id`
- `accounts_memberships` links users to accounts with roles
- Personal accounts: `is_personal_account=true`, `slug=NULL`
- Team accounts: `is_personal_account=false`, `slug` required

### Billing Tables

```
billing_customers (account_id, provider, customer_id)
subscriptions (id, account_id, billing_customer_id, status, active, period_starts_at, period_ends_at)
subscription_items (subscription_id, product_id, variant_id, type, price_amount, quantity)
orders (id, account_id, billing_customer_id, status, total_amount)
order_items (order_id, product_id, variant_id, price_amount, quantity)
```

### AI Usage Tracking

```
ai_request_logs (user_id, team_id, provider, model, prompt_tokens, completion_tokens, cost, feature)
ai_usage_allocations (user_id, team_id, credits_allocated, credits_used, allocation_type)
ai_credit_transactions (user_id, team_id, allocation_id, amount, transaction_type)
ai_cost_configuration (provider, model, input_cost_per_1k_tokens, output_cost_per_1k_tokens)
ai_usage_limits (user_id, team_id, limit_type, time_period, max_value)
```

### Learning Progress

```
course_progress (user_id, course_id, completion_percentage, current_lesson_id, certificate_generated)
lesson_progress (user_id, course_id, lesson_id, completion_percentage, completed_at)
quiz_attempts (user_id, course_id, lesson_id, quiz_id, score, passed, answers)
survey_responses (user_id, survey_id, responses, category_scores, completed)
survey_progress (user_id, survey_id, current_question_index, progress_percentage)
certificates (user_id, course_id, file_path)
```

### Other Tables

```
invitations (email, account_id, invited_by, role, invite_token, expires_at)
notifications (account_id, type, body, link, channel, dismissed)
nonces (client_token, nonce, user_id, purpose, expires_at)  -- One-time tokens
onboarding (user_id, completed, primary_goal, work_role, theme_preference)
testimonials (author_name, content, rating, status)
tasks/subtasks (Kanban board)
building_blocks_submissions (user_id, title, situation, complication, answer)
```

## Payload Schema - CMS Tables

### Content Collections

```
courses (title, slug, description, content, status)
  └── course_lessons (title, slug, bunny_video_id, content, lesson_number, course_id_id, quiz_id_id)
        └── course_quizzes (title, slug, pass_threshold)
              └── quiz_questions (question, type, explanation, order)
                    └── quiz_questions_options (option, is_correct)

surveys (title, slug, description)
  └── survey_questions (text, type, category, required, position)
        └── survey_questions_options (option, value)

posts (title, slug, content, published_at, status)
documentation (title, slug, parent_id, content, order)
media (alt, url, filename, mime_type, filesize)
downloads (title, description, category, access_level, url)
users (name, email, role)  -- CMS admin users
```

### Relationship Tables

Payload creates `*_rels` tables for polymorphic relationships and `*_tags`/`*_categories` for taxonomies.

## Enums

| Enum | Values |
|------|--------|
| `app_permissions` | roles.manage, billing.manage, settings.manage, members.manage, invites.manage |
| `subscription_status` | active, trialing, past_due, canceled, unpaid, incomplete, incomplete_expired, paused |
| `billing_provider` | stripe, lemon-squeezy, paddle |
| `payment_status` | pending, succeeded, failed |
| `notification_type` | info, warning, error |
| `notification_channel` | in_app, email |
| `task_status` | do, doing, done |
| `task_priority` | low, medium, high |
| `testimonial_status` | pending, approved, rejected |

## Key Helper Functions

| Function | Purpose |
|----------|---------|
| `has_role_on_account(account_id, role?)` | Check user membership |
| `has_permission(user_id, account_id, permission)` | Check specific permission |
| `is_account_owner(account_id)` | Check primary ownership |
| `is_team_member(account_id, user_id)` | Check team membership |
| `is_super_admin()` | Check super admin + MFA |
| `is_mfa_compliant()` | Check MFA requirements |
| `team_account_workspace(slug)` | Load team workspace data |

## Views

| View | Purpose |
|------|---------|
| `user_account_workspace` | Personal account data for current user |
| `user_accounts` | Team accounts for current user |

## Storage Buckets

- `account_image` - Profile/account images (public)
- `certificates` - Generated course certificates
