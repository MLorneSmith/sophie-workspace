---
# Identity
id: "auth-implementation"
title: "Authentication Implementation Patterns"
version: "1.0.0"
category: "implementation"

# Discovery
description: "Detailed code examples and implementation patterns for authentication"
tags: ["authentication", "code-examples", "implementation", "patterns"]

# Relationships
dependencies: ["auth-overview"]
cross_references:
  - id: "auth-overview"
    type: "parent"
    description: "Main authentication overview"

# Maintenance
created: "2025-09-13"
last_updated: "2025-09-13"
author: "create-context"
---

# Authentication Implementation Patterns

## Sign-In Implementation

### Email/Password Sign-In
```typescript
import { useSignInWithEmailPassword } from '@kit/supabase/hooks/use-sign-in-with-email-password';
import { useCaptchaToken } from '@kit/auth/captcha/client';

export function PasswordSignInContainer({ onSignIn }) {
  const { captchaToken, resetCaptchaToken } = useCaptchaToken();
  const signInMutation = useSignInWithEmailPassword();

  const onSubmit = async (credentials) => {
    try {
      const data = await signInMutation.mutateAsync({
        ...credentials,
        options: { captchaToken }
      });

      if (onSignIn) {
        await onSignIn(data?.user?.id);
      }
    } finally {
      resetCaptchaToken();
    }
  };

  return <PasswordSignInForm onSubmit={onSubmit} />;
}
```

### OAuth Provider Sign-In
```typescript
import { useSignInWithProvider } from '@kit/supabase/hooks/use-sign-in-with-provider';

// OAuth scopes configuration
const OAUTH_SCOPES = {
  azure: "email",
  keycloak: "openid",
  google: "email profile",
  github: "user:email",
};

function OAuthButtons() {
  const signInWithProvider = useSignInWithProvider();

  const signIn = (provider: string) => {
    signInWithProvider({
      provider,
      options: {
        scopes: OAUTH_SCOPES[provider],
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
  };

  return (
    <>
      <button onClick={() => signIn('google')}>Sign in with Google</button>
      <button onClick={() => signIn('github')}>Sign in with GitHub</button>
    </>
  );
}
```

### Magic Link Sign-In
```typescript
import { useSignInWithOtp } from '@kit/supabase/hooks/use-sign-in-with-otp';

function MagicLinkAuth() {
  const signInWithOtp = useSignInWithOtp();

  const sendMagicLink = async (email: string) => {
    await signInWithOtp.mutateAsync({
      email,
      options: { shouldCreateUser: true }
    });
  };

  return <EmailForm onSubmit={sendMagicLink} />;
}
```

## Server-Side Authentication

### Protected Page Implementation
```typescript
// app/dashboard/[account]/page.tsx
import { requireUser } from '@kit/supabase/require-user';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { redirect } from 'next/navigation';

export default async function DashboardPage({ params }) {
  const client = getSupabaseServerClient();
  const auth = await requireUser(client);

  if (auth.error) {
    redirect(auth.redirectTo);
  }

  // Fetch user's team data with RLS
  const { data: teamData } = await client
    .from('accounts')
    .select('*')
    .eq('id', params.account)
    .single();

  return <Dashboard user={auth.data} team={teamData} />;
}
```

### Server Action with Authentication
```typescript
// app/actions/create-post.ts
import { enhanceAction } from '@packages/next/src/actions';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { z } from 'zod';

const CreatePostSchema = z.object({
  title: z.string().min(1).max(100),
  content: z.string().min(1),
  accountId: z.string().uuid()
});

export const createPostAction = enhanceAction(
  async (params, user) => {
    const client = getSupabaseServerClient();

    // User is guaranteed to be authenticated
    const { data, error } = await client
      .from('posts')
      .insert({
        title: params.title,
        content: params.content,
        user_id: user.id,
        account_id: params.accountId
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  },
  {
    auth: true,  // Requires authentication
    schema: CreatePostSchema
  }
);
```

### Server Action with CAPTCHA
```typescript
export const publicContactAction = enhanceAction(
  async (params) => {
    // CAPTCHA is automatically verified before this runs
    const { data, error } = await sendEmail({
      to: 'support@example.com',
      subject: params.subject,
      body: params.message
    });

    return { success: !error };
  },
  {
    auth: false,    // Public action
    captcha: true,  // Requires CAPTCHA
    schema: ContactFormSchema
  }
);
```

## MFA Implementation

### Check MFA Requirement
```typescript
import { checkRequiresMultiFactorAuthentication } from '@kit/supabase/check-requires-mfa';

async function protectedAction(client: SupabaseClient) {
  const requiresMfa = await checkRequiresMultiFactorAuthentication(client);

  if (requiresMfa) {
    redirect('/auth/verify?next=' + encodeURIComponent(currentPath));
  }

  // Proceed with protected action
}
```

### MFA Verification Flow
```typescript
// app/auth/verify/page.tsx
export default function MFAVerificationPage() {
  const [code, setCode] = useState('');
  const client = useSupabase();

  const handleVerify = async () => {
    // Use challengeAndVerify for combined operation
    const { error } = await client.auth.mfa.challengeAndVerify({
      factorId: factorId,
      code: code,
    });

    if (!error) {
      router.push(searchParams.get('next') || '/dashboard');
    }
  };

  return <MFACodeInput value={code} onChange={setCode} onSubmit={handleVerify} />;
}
```

## Team Context Implementation

### Access Team Context in Components
```typescript
import { useTeamAccountWorkspace } from '@kit/team-accounts/hooks';

function TeamAdminPanel() {
  const { account, role, permissions } = useTeamAccountWorkspace();

  // Role-based UI
  if (role === 'member') {
    return <MemberView account={account} />;
  }

  if (role === 'admin' || role === 'owner') {
    return <AdminView account={account} canDelete={role === 'owner'} />;
  }

  return <Unauthorized />;
}
```

### Server-Side Team Authorization
```typescript
export const updateTeamSettingsAction = enhanceAction(
  async (params, user) => {
    const client = getSupabaseServerClient();

    // Check user's role in the team
    const { data: membership } = await client
      .from('accounts_memberships')
      .select('account_role')
      .eq('account_id', params.accountId)
      .eq('user_id', user.id)
      .single();

    if (!membership || membership.account_role === 'member') {
      throw new Error('Insufficient permissions');
    }

    // Update team settings
    const { error } = await client
      .from('accounts')
      .update(params.settings)
      .eq('id', params.accountId);

    if (error) throw error;

    return { success: true };
  },
  {
    schema: UpdateTeamSettingsSchema
  }
);
```

## Middleware Chain

### Core Middleware Implementation
```typescript
// apps/web/middleware.ts
import { createMiddlewareClient } from "@kit/supabase/middleware-client";

export async function middleware(request: NextRequest) {
  // 1. Secure headers (CSP, HSTS, etc.)
  const secureHeaders = await createResponseWithSecureHeaders();

  // 2. Request ID for tracing
  setRequestId(request);

  // 3. CSRF protection (except for server actions)
  const csrfResponse = await withCsrfMiddleware(request, response);

  // 4. Route-specific pattern handlers
  const handlePattern = matchUrlPattern(request.url);
  if (handlePattern) {
    return await handlePattern(request, csrfResponse);
  }

  return csrfResponse;
}
```

### Route Protection Patterns
```typescript
// Protected route handler example
{
  pattern: new URLPattern({ pathname: "/home/*?" }),
  handler: async (req, res) => {
    const { data } = await getUser(req, res);

    // Redirect if not authenticated
    if (!data?.claims) {
      return NextResponse.redirect(`/auth/sign-in?next=${next}`);
    }

    // Check onboarding status
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user?.user_metadata?.onboarded) {
      return NextResponse.redirect("/onboarding");
    }

    // Check MFA requirements
    if (await checkRequiresMultiFactorAuthentication(supabase)) {
      return NextResponse.redirect("/auth/verify");
    }
  }
}
```

## Session Management

### Sign Out Implementation
```typescript
import { useSignOut } from '@kit/supabase/hooks/use-sign-out';

function UserMenu() {
  const signOut = useSignOut();

  const handleSignOut = async () => {
    await signOut.mutateAsync();
    router.push('/');
  };

  return (
    <button onClick={handleSignOut}>
      Sign Out
    </button>
  );
}
```

### Session Refresh Pattern
```typescript
import { useAuthChangeListener } from '@kit/supabase/hooks/use-auth-change-listener';

function AppLayout({ children }) {
  // Automatically handles session refresh
  useAuthChangeListener({
    onSignedIn: (user) => {
      console.log('User signed in:', user.id);
    },
    onSignedOut: () => {
      router.push('/auth/sign-in');
    },
    onTokenRefreshed: () => {
      console.log('Session refreshed');
    }
  });

  return <>{children}</>;
}
```