# Authentication Patterns

## Overview

SlideHeroes uses MakerKit's authentication system built on Supabase Auth, providing enterprise-grade security with CSRF protection, multi-factor authentication, and comprehensive session management.

## Authentication Flow

### Client-Side Authentication

Use the Supabase client from MakerKit for authentication operations:

```tsx
import { useSupabase } from '@kit/supabase/hooks/use-supabase';
import { useMutation } from '@tanstack/react-query';

// Sign in with email and password
function useSignIn() {
  const supabase = useSupabase();
  
  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      return data;
    },
  });
}

// Sign up with email and password
function useSignUp() {
  const supabase = useSupabase();
  
  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (error) throw error;
      return data;
    },
  });
}
```

### Server-Side Authentication

Use the server client and `requireUser` for protected server components and actions:

```tsx
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { requireUser } from '@kit/supabase/require-user';
import { redirect } from 'next/navigation';

// Protected server component
export async function ProtectedPage() {
  const client = getSupabaseServerClient();
  const auth = await requireUser(client);
  
  if (!auth.data) {
    redirect(auth.redirectTo);
  }
  
  const user = auth.data;
  
  // User is authenticated, continue with page logic
  return <div>Welcome {user.email}</div>;
}

// Protected server action with enhanceAction
import { enhanceAction } from '@kit/next/actions';
import { z } from 'zod';

export const updateProfileAction = enhanceAction(
  async (data, user) => {
    // user is automatically injected and verified
    const client = getSupabaseServerClient();
    
    const { error } = await client
      .from('profiles')
      .update(data)
      .eq('id', user.id);
      
    if (error) throw error;
    return { success: true };
  },
  {
    schema: z.object({
      displayName: z.string().min(1).max(50),
      bio: z.string().max(500).optional(),
    }),
    auth: true, // Requires authentication (default)
  }
);
```

## Authentication Provider

The AuthProvider component manages authentication state and monitoring integration:

```tsx
// apps/web/components/auth-provider.tsx
'use client';

import { useCallback } from 'react';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { useMonitoring } from '@kit/monitoring/hooks';
import { useAppEvents } from '@kit/shared/events';
import { useAuthChangeListener } from '@kit/supabase/hooks/use-auth-change-listener';
import pathsConfig from '~/config/paths.config';

export function AuthProvider(props: React.PropsWithChildren) {
  const { emit } = useAppEvents();
  const monitoring = useMonitoring();

  const onEvent = useCallback(
    (event: AuthChangeEvent, session: Session | null) => {
      const userId = session?.user.id;
      const email = session?.user.email ?? '';

      switch (event) {
        case 'INITIAL_SESSION':
        case 'SIGNED_IN':
          if (userId) {
            emit({ type: 'user.signedIn', payload: { userId, email } });
            monitoring.identifyUser({ id: userId, email });
          }
          break;

        case 'USER_UPDATED':
          emit({ type: 'user.updated', payload: { userId: userId!, email } });
          break;
      }
    },
    [emit, monitoring],
  );

  useAuthChangeListener({
    appHomePath: pathsConfig.app.home,
    onEvent,
  });

  return props.children;
}
```

## Middleware Protection

The middleware handles authentication, CSRF protection, and route-specific logic:

```tsx
// apps/web/middleware.ts
import type { NextRequest } from 'next/server';
import { NextResponse, URLPattern } from 'next/server';
import { CsrfError, createCsrfProtect } from '@edge-csrf/nextjs';
import { isSuperAdmin } from '@kit/admin';
import { checkRequiresMultiFactorAuthentication } from '@kit/supabase/check-requires-mfa';
import { createMiddlewareClient } from '@kit/supabase/middleware-client';
import appConfig from '~/config/app.config';
import pathsConfig from '~/config/paths.config';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Apply CSRF protection
  const csrfResponse = await withCsrfMiddleware(request, response);
  
  // Handle route-specific patterns
  const patterns = [
    {
      pattern: new URLPattern({ pathname: '/admin/*?' }),
      handler: adminMiddleware,
    },
    {
      pattern: new URLPattern({ pathname: '/home/*?' }),
      handler: protectedRouteMiddleware,
    },
    {
      pattern: new URLPattern({ pathname: '/auth/*?' }),
      handler: authRouteMiddleware,
    },
  ];
  
  // Apply pattern handlers
  for (const { pattern, handler } of patterns) {
    if (pattern.exec(request.url)) {
      const result = await handler(request, csrfResponse);
      if (result) return result;
    }
  }
  
  return csrfResponse;
}

async function protectedRouteMiddleware(request: NextRequest, response: NextResponse) {
  const supabase = createMiddlewareClient(request, response);
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    const signInUrl = new URL(pathsConfig.auth.signIn, request.url);
    signInUrl.searchParams.set('next', request.nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }
  
  // Check MFA requirements
  const requiresMfa = await checkRequiresMultiFactorAuthentication(supabase);
  if (requiresMfa) {
    return NextResponse.redirect(new URL(pathsConfig.auth.verifyMfa, request.url));
  }
  
  // Check onboarding status
  if (!user.user_metadata.onboarded) {
    return NextResponse.redirect(new URL('/onboarding', request.url));
  }
  
  return response;
}
```

## OAuth Integration

Configure OAuth providers in auth.config.ts and implement sign-in:

```tsx
// config/auth.config.ts
export default {
  providers: {
    password: true,
    magicLink: false,
    oAuth: ['google'], // Add more providers as needed
  },
  captchaTokenSiteKey: process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY,
  displayTermsCheckbox: true,
};

// OAuth sign-in component
function OAuthSignIn() {
  const supabase = useSupabase();
  const [isPending, startTransition] = useTransition();
  
  const signInWithGoogle = () => {
    startTransition(async () => {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      
      if (error) {
        console.error('OAuth error:', error);
      }
    });
  };
  
  return (
    <Button onClick={signInWithGoogle} disabled={isPending}>
      <GoogleIcon className="mr-2" />
      Continue with Google
    </Button>
  );
}
```

## Multi-Factor Authentication

SlideHeroes supports TOTP-based MFA with automatic verification flow:

```tsx
// MFA enrollment
async function enrollMFA() {
  const supabase = useSupabase();
  
  // Enroll TOTP factor
  const { data: factor, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName: 'Authenticator App',
  });
  
  if (error) throw error;
  
  // Display QR code for user to scan
  return {
    qrCode: factor.totp.qr_code,
    secret: factor.totp.secret,
    factorId: factor.id,
  };
}

// MFA verification during sign-in
function MFAVerificationForm({ factorId }: { factorId: string }) {
  const supabase = useSupabase();
  const [code, setCode] = useState('');
  
  const verifyMFA = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { data, error } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code,
    });
    
    if (error) {
      console.error('MFA verification failed:', error);
      return;
    }
    
    // Redirect to app after successful verification
    window.location.href = pathsConfig.app.home;
  };
  
  return (
    <form onSubmit={verifyMFA}>
      <VerificationCodeInput
        value={code}
        onChange={setCode}
        length={6}
      />
      <Button type="submit">Verify</Button>
    </form>
  );
}
```

## Session Management

Handle session persistence and refresh:

```tsx
import { useEffect } from 'react';
import { useSupabase } from '@kit/supabase/hooks/use-supabase';
import { useRouter } from 'next/navigation';

export function useSessionManager() {
  const supabase = useSupabase();
  const router = useRouter();
  
  useEffect(() => {
    // Handle session refresh
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed successfully');
        }
        
        if (event === 'SIGNED_OUT') {
          // Clear any local state
          router.push('/');
        }
      }
    );
    
    // Check session on mount
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error || !session) {
        console.error('Session error:', error);
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router]);
}
```

## Password Reset Flow

Implement secure password reset with email verification:

```tsx
// Request password reset
export const requestPasswordResetAction = enhanceAction(
  async ({ email }) => {
    const supabase = getSupabaseServerClient();
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/update-password`,
    });
    
    if (error) throw error;
    
    return { success: true };
  },
  {
    schema: z.object({
      email: z.string().email(),
    }),
    auth: false, // Allow unauthenticated access
  }
);

// Update password after email verification
export const updatePasswordAction = enhanceAction(
  async ({ password }, user) => {
    const supabase = getSupabaseServerClient();
    
    const { error } = await supabase.auth.updateUser({
      password,
    });
    
    if (error) throw error;
    
    return { success: true };
  },
  {
    schema: z.object({
      password: z.string().min(8).regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain uppercase, lowercase, and number'
      ),
    }),
  }
);
```

## Security Best Practices

### 1. CSRF Protection
All mutating requests are protected with CSRF tokens:
```tsx
const csrfProtect = createCsrfProtect({
  cookie: {
    secure: appConfig.production,
    name: 'csrfSecret',
  },
  ignoreMethods: isServerAction(request) ? ['POST'] : ['GET', 'HEAD', 'OPTIONS'],
});
```

### 2. Secure Headers
Enable strict CSP headers in production:
```bash
ENABLE_STRICT_CSP=true
```

### 3. Session Security
- Sessions are stored in secure, HTTP-only cookies
- Automatic token refresh before expiration
- Server-side session validation on all protected routes

### 4. Rate Limiting
Implement rate limiting for authentication endpoints:
```tsx
// Using upstash/ratelimit with Redis
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '1 m'), // 5 requests per minute
});

export async function rateLimitAuth(identifier: string) {
  const { success } = await ratelimit.limit(identifier);
  if (!success) {
    throw new Error('Too many authentication attempts');
  }
}
```

### 5. Audit Logging
Log authentication events for security monitoring:
```tsx
export async function logAuthEvent(event: {
  type: 'sign_in' | 'sign_out' | 'password_reset' | 'mfa_verified';
  userId?: string;
  email?: string;
  ip?: string;
  userAgent?: string;
}) {
  const supabase = getSupabaseServerClient();
  
  await supabase.from('auth_logs').insert({
    event_type: event.type,
    user_id: event.userId,
    email: event.email,
    ip_address: event.ip,
    user_agent: event.userAgent,
    created_at: new Date().toISOString(),
  });
}
```

### 6. Input Validation
All authentication inputs are validated with Zod schemas:
```tsx
const signInSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(8),
  captchaToken: z.string().optional(),
});

const signUpSchema = signInSchema.extend({
  confirmPassword: z.string(),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});
```

## Error Handling

Handle authentication errors gracefully:

```tsx
export class AuthenticationError extends Error {
  constructor(message = 'You must be authenticated to access this resource') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class MultiFactorAuthError extends Error {
  constructor(message = 'Multi-factor authentication required') {
    super(message);
    this.name = 'MultiFactorAuthError';
  }
}

// Error boundary for auth errors
export function AuthErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={(error) => {
        if (error instanceof AuthenticationError) {
          return <SignInPrompt />;
        }
        if (error instanceof MultiFactorAuthError) {
          return <MFAPrompt />;
        }
        return <GenericError error={error} />;
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
```