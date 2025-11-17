# Authorization Patterns

## Overview

SlideHeroes implements a comprehensive authorization system using Supabase Row-Level Security (RLS) with MakerKit's account-based multi-tenancy. The system operates across three database schemas: `auth` (Supabase), `public` (MakerKit SaaS), and `payload` (CMS content).

## Account-Based Authorization

### Account Membership Model

SlideHeroes uses MakerKit's account-based authorization where users belong to accounts with specific roles:

```sql
-- Core account structure
CREATE TABLE public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  type TEXT NOT NULL DEFAULT 'personal', -- 'personal' or 'team'
  picture_url TEXT,
  primary_owner_user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Account memberships with roles
CREATE TABLE public.accounts_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member', -- 'owner', 'admin', 'member'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(account_id, user_id)
);
```

### Account-Based RLS Policies

All MakerKit tables follow the account-based access pattern:

```sql
-- Enable RLS for accounts table
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

-- Users can view accounts they belong to
CREATE POLICY "Users can view accounts they belong to" ON public.accounts
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.accounts_memberships
      WHERE account_id = accounts.id
    )
  );

-- Account owners can update account details
CREATE POLICY "Account owners can update account" ON public.accounts
  FOR UPDATE USING (
    auth.uid() = primary_owner_user_id OR
    auth.uid() IN (
      SELECT user_id FROM public.accounts_memberships
      WHERE account_id = accounts.id
      AND role IN ('owner', 'admin')
    )
  );

-- Users can create personal accounts
CREATE POLICY "Users can create personal accounts" ON public.accounts
  FOR INSERT WITH CHECK (
    type = 'personal' AND
    auth.uid() = primary_owner_user_id
  );
```

## Course Progress Authorization

### User-Specific Course Progress

Course progress is tied to individual users with account context:

```sql
CREATE TABLE public.course_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL, -- References payload.courses
  lesson_id TEXT,
  completed BOOLEAN DEFAULT false,
  completion_percentage DECIMAL(5,2) DEFAULT 0,
  time_spent INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, course_id, lesson_id)
);

-- Enable RLS
ALTER TABLE public.course_progress ENABLE ROW LEVEL SECURITY;

-- Users can only access their own progress
CREATE POLICY "Users can view their own course progress" ON public.course_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own course progress" ON public.course_progress
  FOR INSERT, UPDATE USING (auth.uid() = user_id);

-- Account admins can view team member progress
CREATE POLICY "Account admins can view team progress" ON public.course_progress
  FOR SELECT USING (
    account_id IN (
      SELECT account_id FROM public.accounts_memberships
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );
```

## AI Usage Tracking Authorization

### Account-Based AI Usage

AI usage is tracked per account with role-based access:

```sql
CREATE TABLE public.ai_request_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES public.accounts(id),
  user_id UUID REFERENCES auth.users(id),
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  cost DECIMAL(10,6) DEFAULT 0,
  request_timestamp TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.ai_request_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their account's AI usage
CREATE POLICY "Users can view their account's AI usage" ON public.ai_request_logs
  FOR SELECT USING (
    account_id IN (
      SELECT account_id FROM public.accounts_memberships
      WHERE user_id = auth.uid()
    )
  );

-- Only authenticated users can insert AI logs
CREATE POLICY "Allow insert for authenticated users" ON public.ai_request_logs
  FOR INSERT TO authenticated WITH CHECK (true);

-- Service role has full access for AI gateway
CREATE POLICY "Service role can do all operations" ON public.ai_request_logs
  FOR ALL TO service_role USING (true) WITH CHECK (true);
```

## Certificate Authorization

### User-Specific Certificates

Course certificates are tied to users with account context:

```sql
CREATE TABLE public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL, -- References payload.courses
  file_path TEXT NOT NULL,
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Users can view their own certificates
CREATE POLICY "Users can view their own certificates" ON public.certificates
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own certificates
CREATE POLICY "Users can create their own certificates" ON public.certificates
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

## Admin Authorization

### Super Admin Access

SlideHeroes implements super admin access for administrative functions:

```tsx
// Server-side admin check
import { isSuperAdmin } from '@kit/admin';
import { createMiddlewareClient } from '@kit/supabase/middleware-client';

async function adminMiddleware(request: NextRequest, response: NextResponse) {
  const {
    data: { user },
  } = await getUser(request, response);

  if (!user) {
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }

  const client = createMiddlewareClient(request, response);
  const userIsSuperAdmin = await isSuperAdmin(client);

  if (!userIsSuperAdmin) {
    return NextResponse.redirect(new URL('/404', request.url));
  }

  return response;
}

// Client-side admin check
export function AdminOnly({ children }: { children: React.ReactNode }) {
  const user = useUser();
  const { data: isAdmin, isLoading } = useQuery({
    queryKey: ['user', 'is-admin'],
    queryFn: async () => {
      const response = await fetch('/api/admin/check');
      return response.json();
    },
    enabled: !!user,
  });

  if (isLoading) return <LoadingSpinner />;
  if (!isAdmin) return <AccessDenied />;

  return children;
}
```

## Content Management Authorization

### Payload CMS Integration

Access to Payload CMS content through the public schema:

```sql
-- Cross-schema view for course data
CREATE OR REPLACE VIEW public.course_details AS
SELECT
  c.id,
  c.title,
  c.slug,
  c.description,
  c.status,
  c.difficulty,
  c.estimated_duration,
  c.course_lessons,
  c.course_quizzes
FROM payload.courses c
WHERE c.status = 'published';

-- Grant access to authenticated users
GRANT SELECT ON public.course_details TO authenticated;

-- RLS policy for course access
CREATE POLICY "Published courses are viewable by authenticated users"
  ON public.course_details FOR SELECT TO authenticated USING (true);
```

## Multi-Factor Authentication Enforcement

### MFA-Required Operations

Enforce MFA for sensitive operations using restrictive policies:

```sql
-- Example: Require MFA for AI cost tracking access
CREATE POLICY "Require MFA for AI cost tracking" ON public.ai_request_logs
  AS RESTRICTIVE FOR SELECT TO authenticated
  USING ((auth.jwt()->>'aal') = 'aal2');

-- Function to check MFA status
CREATE OR REPLACE FUNCTION public.user_has_mfa()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.mfa_factors
    WHERE user_id = auth.uid()
    AND status = 'verified'
  );
$$;

-- Policy requiring MFA for sensitive operations
CREATE POLICY "Sensitive operations require MFA" ON public.sensitive_table
  AS RESTRICTIVE FOR ALL TO authenticated
  USING (
    CASE
      WHEN public.user_has_mfa() THEN (auth.jwt()->>'aal') = 'aal2'
      ELSE true
    END
  );
```

## Server Action Authorization

### Enhanced Action Wrapper

Use MakerKit's `enhanceAction` for server-side authorization:

```tsx
import { requireAccountOwnership } from '@/lib/auth';

import { enhanceAction } from '@kit/next/actions';

// Account ownership check
export const updateAccountAction = enhanceAction(
  async ({ accountId, data }, user) => {
    // Verify user owns or administers the account
    const hasAccess = await checkAccountAccess(user.id, accountId, [
      'owner',
      'admin',
    ]);
    if (!hasAccess) {
      throw new Error('Insufficient permissions');
    }

    const supabase = getSupabaseServerClient();
    const { error } = await supabase
      .from('accounts')
      .update(data)
      .eq('id', accountId);

    if (error) throw error;
    return { success: true };
  },
  {
    schema: z.object({
      accountId: z.string().uuid(),
      data: z.object({
        name: z.string().min(1).max(100),
        picture_url: z.string().url().optional(),
      }),
    }),
  },
);

// Course progress update
export const updateCourseProgressAction = enhanceAction(
  async ({ courseId, lessonId, completed }, user) => {
    const supabase = getSupabaseServerClient();

    // Get user's default account
    const { data: membership } = await supabase
      .from('accounts_memberships')
      .select('account_id')
      .eq('user_id', user.id)
      .single();

    if (!membership) throw new Error('No account found');

    // Update progress (RLS automatically restricts to user's data)
    const { error } = await supabase.from('course_progress').upsert({
      user_id: user.id,
      account_id: membership.account_id,
      course_id: courseId,
      lesson_id: lessonId,
      completed,
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;
    return { success: true };
  },
  {
    schema: z.object({
      courseId: z.string(),
      lessonId: z.string().optional(),
      completed: z.boolean(),
    }),
  },
);
```

## Authorization Helper Functions

### Account Access Validation

```tsx
// Check if user has access to account with specific roles
export async function checkAccountAccess(
  userId: string,
  accountId: string,
  requiredRoles: string[] = ['member'],
): Promise<boolean> {
  const supabase = getSupabaseServerClient();

  const { data } = await supabase
    .from('accounts_memberships')
    .select('role')
    .eq('user_id', userId)
    .eq('account_id', accountId)
    .single();

  return data ? requiredRoles.includes(data.role) : false;
}

// Get user's accounts with roles
export async function getUserAccounts(userId: string) {
  const supabase = getSupabaseServerClient();

  const { data } = await supabase
    .from('accounts_memberships')
    .select(
      `
      account_id,
      role,
      account:accounts(
        id,
        name,
        slug,
        type,
        picture_url
      )
    `,
    )
    .eq('user_id', userId);

  return data || [];
}

// Check if user is account owner
export async function isAccountOwner(
  userId: string,
  accountId: string,
): Promise<boolean> {
  const supabase = getSupabaseServerClient();

  const { data } = await supabase
    .from('accounts')
    .select('primary_owner_user_id')
    .eq('id', accountId)
    .single();

  return data?.primary_owner_user_id === userId;
}
```

## Client-Side Authorization

### Role-Based UI Components

```tsx
import { useAccountRole } from '@/hooks/use-account-role';

// Component that checks account role
export function AccountAdminOnly({
  accountId,
  children
}: {
  accountId: string;
  children: React.ReactNode;
}) {
  const { role, isLoading } = useAccountRole(accountId);

  if (isLoading) return <LoadingSkeleton />;
  if (!['owner', 'admin'].includes(role)) return null;

  return children;
}

// Hook for checking account role
function useAccountRole(accountId: string) {
  const user = useUser();

  return useQuery({
    queryKey: ['account-role', accountId],
    queryFn: async () => {
      const response = await fetch(`/api/accounts/${accountId}/role`);
      const { role } = await response.json();
      return role;
    },
    enabled: !!user && !!accountId,
  });
}

// Conditional rendering based on permissions
export function ConditionalRender({
  condition,
  fallback = null,
  children
}: {
  condition: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  return condition ? children : fallback;
}

// Usage example
function AccountSettings({ accountId }: { accountId: string }) {
  const { role } = useAccountRole(accountId);

  return (
    <div>
      <h1>Account Settings</h1>

      <ConditionalRender condition={role === 'owner'}>
        <DangerZone accountId={accountId} />
      </ConditionalRender>

      <ConditionalRender condition={['owner', 'admin'].includes(role)}>
        <MemberManagement accountId={accountId} />
      </ConditionalRender>

      <ConditionalRender condition={['owner', 'admin', 'member'].includes(role)}>
        <AccountProfile accountId={accountId} />
      </ConditionalRender>
    </div>
  );
}
```

## Database Functions for Authorization

### Secure Definer Functions

Create security definer functions for complex authorization logic:

```sql
-- Check if user can access course content
CREATE OR REPLACE FUNCTION public.can_access_course(course_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_has_access BOOLEAN := FALSE;
BEGIN
  -- Check if user has an active subscription or course access
  SELECT EXISTS (
    SELECT 1 FROM public.course_progress cp
    JOIN public.accounts_memberships am ON am.account_id = cp.account_id
    WHERE am.user_id = auth.uid()
    AND cp.course_id = course_id
  ) INTO user_has_access;

  RETURN user_has_access;
END;
$$;

-- Generate certificate with authorization check
CREATE OR REPLACE FUNCTION public.generate_certificate(
  p_course_id TEXT,
  p_file_path TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  certificate_id UUID;
  user_account_id UUID;
  course_completed BOOLEAN;
BEGIN
  -- Get user's primary account
  SELECT account_id INTO user_account_id
  FROM public.accounts_memberships
  WHERE user_id = auth.uid()
  LIMIT 1;

  -- Check if course is completed
  SELECT (completion_percentage >= 100) INTO course_completed
  FROM public.course_progress
  WHERE user_id = auth.uid()
  AND course_id = p_course_id
  AND lesson_id IS NULL;

  IF NOT course_completed THEN
    RAISE EXCEPTION 'Course not completed';
  END IF;

  -- Generate certificate
  INSERT INTO public.certificates (
    user_id, account_id, course_id, file_path, issued_at
  )
  VALUES (
    auth.uid(), user_account_id, p_course_id, p_file_path, NOW()
  )
  RETURNING id INTO certificate_id;

  RETURN certificate_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.can_access_course(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_certificate(TEXT, TEXT) TO authenticated;
```

## Security Best Practices

### 1. Principle of Least Privilege

- Grant minimal necessary permissions
- Use restrictive RLS policies for sensitive operations
- Regularly audit and remove unused permissions

### 2. Defense in Depth

- Multiple layers of authorization checks
- Server-side validation for all operations
- Client-side checks for UI/UX only

### 3. Audit Trail

```sql
-- Audit log for authorization events
CREATE TABLE public.auth_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  account_id UUID REFERENCES public.accounts(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  granted BOOLEAN NOT NULL,
  reason TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to log authorization events
CREATE OR REPLACE FUNCTION public.log_auth_event(
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id TEXT DEFAULT NULL,
  p_granted BOOLEAN DEFAULT TRUE,
  p_reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.auth_audit_log (
    user_id, action, resource_type, resource_id, granted, reason
  )
  VALUES (
    auth.uid(), p_action, p_resource_type, p_resource_id, p_granted, p_reason
  );
END;
$$;
```

### 4. Error Handling

- Never expose sensitive information in error messages
- Log authorization failures for security monitoring
- Provide user-friendly error messages

```tsx
export class AuthorizationError extends Error {
  constructor(message = 'Access denied') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export function handleAuthorizationError(error: unknown) {
  if (error instanceof AuthorizationError) {
    // Log for security monitoring
    console.error('Authorization denied:', error.message);

    // Return generic message to user
    return 'You do not have permission to perform this action';
  }

  return 'An unexpected error occurred';
}
```

This authorization system provides comprehensive security through multiple layers of protection while maintaining the flexibility needed for a modern SaaS application with complex user and content management requirements.
