# Database Schema

## Overview

Our SlideHeroes application uses PostgreSQL on Supabase with three primary schemas:

1. **auth** - Supabase authentication system (managed by Supabase)
2. **public** - MakerKit SaaS application data (accounts, billing, memberships)
3. **payload** - Payload CMS content management (courses, lessons, quizzes, documentation)

## Auth Schema (Managed by Supabase)

Standard Supabase authentication tables:

- `auth.users` - User accounts and authentication
- `auth.identities` - OAuth and identity providers
- `auth.sessions` - Active user sessions
- `auth.mfa_factors` - Multi-factor authentication
- `auth.refresh_tokens` - Token management

## Public Schema (MakerKit SaaS)

The public schema contains MakerKit's SaaS infrastructure for multi-tenant applications.

### Core SaaS Tables

#### accounts

```sql
CREATE TABLE public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  picture_url TEXT,
  type TEXT NOT NULL DEFAULT 'personal',
  primary_owner_user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view accounts they belong to" ON public.accounts
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.accounts_memberships
      WHERE account_id = accounts.id
    )
  );
```

#### accounts_memberships

```sql
CREATE TABLE public.accounts_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(account_id, user_id)
);

-- RLS Policies
ALTER TABLE public.accounts_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own memberships" ON public.accounts_memberships
  FOR SELECT USING (auth.uid() = user_id);
```

#### subscriptions

```sql
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
  subscription_id TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL,
  currency TEXT,
  interval_count INTEGER,
  interval TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Additional SaaS Tables

- `public.invitations` - Team invitations
- `public.notifications` - User notifications
- `public.billing_customers` - Billing customer data
- `public.orders` - One-time purchases
- `public.one_time_tokens` - Secure token management
- `public.course_progress` - User course completion tracking
- `public.certificates` - Generated course certificates
- `public.ai_usage_tracking` - AI service usage and costs

## Payload Schema

The payload schema contains tables for content management, managed by Payload CMS.

### Course System

#### courses

```sql
CREATE TABLE payload.courses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  content JSONB,
  featured_image_id TEXT,
  status TEXT DEFAULT 'draft',
  price NUMERIC,
  difficulty TEXT,
  estimated_duration INTEGER,
  course_lessons TEXT[], -- Array of lesson IDs
  course_quizzes TEXT[], -- Array of quiz IDs
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### course_lessons

```sql
CREATE TABLE payload.course_lessons (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  content TEXT, -- Lexical JSON content
  course_id TEXT, -- Reference to parent course
  bunny_video_id TEXT, -- Video integration
  bunny_library_id TEXT,
  estimated_duration INTEGER,
  featured_image_id TEXT,
  downloads_id TEXT[], -- Array of download IDs
  todo TEXT, -- TODO items in HTML
  order_index INTEGER,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### course_quizzes

```sql
CREATE TABLE payload.course_quizzes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  course_id TEXT, -- Reference to parent course
  quiz_id TEXT, -- Reference to actual quiz
  required BOOLEAN DEFAULT false,
  passing_score INTEGER DEFAULT 70,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Quiz System

#### quizzes

```sql
CREATE TABLE payload.quizzes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  questions TEXT[], -- Array of question IDs
  time_limit INTEGER,
  passing_score INTEGER DEFAULT 70,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### quiz_questions

```sql
CREATE TABLE payload.quiz_questions (
  id TEXT PRIMARY KEY,
  question TEXT NOT NULL,
  type TEXT NOT NULL, -- 'multiple_choice', 'true_false', 'short_answer'
  options JSONB, -- Multiple choice options
  correct_answer TEXT,
  explanation TEXT,
  points INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Survey System

#### surveys

```sql
CREATE TABLE payload.surveys (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT, -- 'feedback', 'assessment', 'onboarding'
  questions TEXT[], -- Array of question IDs
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### survey_questions

```sql
CREATE TABLE payload.survey_questions (
  id TEXT PRIMARY KEY,
  question TEXT NOT NULL,
  type TEXT NOT NULL, -- 'scale', 'multiple_choice', 'text', 'textarea'
  options JSONB,
  required BOOLEAN DEFAULT false,
  order_index INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Content System

#### documentation

```sql
CREATE TABLE payload.documentation (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT, -- Lexical JSON content
  excerpt TEXT,
  meta_title TEXT,
  meta_description TEXT,
  breadcrumbs JSONB,
  categories TEXT[],
  tags TEXT[],
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### posts

```sql
CREATE TABLE payload.posts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT, -- Lexical JSON content
  excerpt TEXT,
  featured_image_id TEXT,
  meta_title TEXT,
  meta_description TEXT,
  categories TEXT[],
  tags TEXT[],
  status TEXT DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### downloads

```sql
CREATE TABLE payload.downloads (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  file_size INTEGER,
  mime_type TEXT,
  tags TEXT[],
  download_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### media

```sql
CREATE TABLE payload.media (
  id TEXT PRIMARY KEY,
  alt TEXT,
  filename TEXT,
  mime_type TEXT,
  filesize INTEGER,
  width INTEGER,
  height INTEGER,
  url TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Relationship Tables

Payload CMS uses relationship tables for many-to-many relationships:

- `payload.course_lessons_rels` - Course to lesson relationships
- `payload.course_quizzes_rels` - Course to quiz relationships
- `payload.courses_rels` - Course to category/tag relationships
- `payload.documentation_rels` - Documentation relationships
- `payload.posts_rels` - Post to category/tag relationships

## Functions

### insert_certificate

```sql
CREATE OR REPLACE FUNCTION public.insert_certificate(
  p_user_id UUID,
  p_course_id TEXT,
  p_file_path TEXT
)
RETURNS TABLE(id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  INSERT INTO public.certificates (user_id, course_id, file_path, issued_at)
  VALUES (p_user_id, p_course_id, p_file_path, NOW())
  RETURNING certificates.id;
END;
$$;
```

### AI Usage Functions

```sql
-- Check if user has exceeded AI usage limits
CREATE OR REPLACE FUNCTION public.check_ai_usage_limits(
  p_user_id UUID,
  p_team_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  usage_count INTEGER;
  usage_limit INTEGER;
BEGIN
  -- Implementation for checking usage limits
  -- Returns true if limit exceeded
  RETURN FALSE;
END;
$$;
```

## Indexes

```sql
-- Optimize account lookups
CREATE INDEX idx_accounts_slug ON public.accounts(slug);
CREATE INDEX idx_accounts_type ON public.accounts(type);

-- Optimize membership lookups
CREATE INDEX idx_memberships_user_id ON public.accounts_memberships(user_id);
CREATE INDEX idx_memberships_account_id ON public.accounts_memberships(account_id);

-- Optimize course content lookups
CREATE INDEX idx_courses_slug ON payload.courses(slug);
CREATE INDEX idx_courses_status ON payload.courses(status);
CREATE INDEX idx_course_lessons_course_id ON payload.course_lessons(course_id);
CREATE INDEX idx_course_lessons_slug ON payload.course_lessons(slug);

-- Optimize quiz lookups
CREATE INDEX idx_quizzes_status ON payload.quizzes(status);
CREATE INDEX idx_quiz_questions_type ON payload.quiz_questions(type);

-- Optimize content lookups
CREATE INDEX idx_posts_slug ON payload.posts(slug);
CREATE INDEX idx_posts_status ON payload.posts(status);
CREATE INDEX idx_documentation_slug ON payload.documentation(slug);
```

## Schema Relationships

```
auth.users 1--* public.accounts_memberships *--1 public.accounts
public.accounts 1--* public.subscriptions
public.accounts 1--* public.course_progress
public.course_progress *--1 payload.courses

payload.courses 1--* payload.course_lessons
payload.courses 1--* payload.course_quizzes
payload.course_quizzes *--1 payload.quizzes
payload.quizzes 1--* payload.quiz_questions

payload.courses 1--* payload.media (featured images)
payload.course_lessons 1--* payload.downloads
payload.course_lessons 1--* payload.media (featured images)
```

## TypeScript Types

Based on the generated `apps/web/lib/database.types.ts`:

```typescript
// Core SaaS types
export interface Account {
  id: string;
  name: string;
  slug: string | null;
  type: 'personal' | 'team';
  picture_url: string | null;
  primary_owner_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AccountMembership {
  id: string;
  account_id: string;
  user_id: string;
  role: string;
  created_at: string;
  updated_at: string;
}

// Course content types
export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  content: string | null;
  featured_image_id: string | null;
  status: 'draft' | 'published';
  price: number | null;
  difficulty: string | null;
  estimated_duration: number | null;
  course_lessons: string[] | null;
  course_quizzes: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface CourseLesson {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  content: string | null;
  course_id: string | null;
  bunny_video_id: string | null;
  bunny_library_id: string | null;
  estimated_duration: number | null;
  featured_image_id: string | null;
  downloads_id: string[] | null;
  todo: string | null;
  order_index: number | null;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
}

export interface Quiz {
  id: string;
  title: string;
  description: string | null;
  questions: string[] | null;
  time_limit: number | null;
  passing_score: number | null;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  options: Json | null;
  correct_answer: string | null;
  explanation: string | null;
  points: number | null;
  created_at: string;
  updated_at: string;
}
```
