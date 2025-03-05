# Payload CMS and Supabase Authentication Integration - Revised Plan

## 1. Issue Overview

Our application architecture consists of two main components:

1. **Makerkit Next.js App** - Uses Supabase for authentication and database
2. **Payload CMS** - Provides content management capabilities

We're encountering authentication issues when the Next.js app tries to interact with Payload CMS, specifically:

- Users authenticated via Supabase in the Next.js app are not recognized by Payload CMS
- API calls from the Next.js app to Payload CMS result in "You are not allowed to perform this action" errors
- We need a consistent, extensible approach to handle authentication between these systems

This issue affects multiple features including our survey system, and will impact any future collections or features that require authenticated access to Payload CMS data.

## 2. Analysis of Available Approaches

After researching Payload CMS's authentication and access control systems, we've identified several potential approaches:

### Approach 1: Custom Authentication Strategy (Complex Version)

Implement a comprehensive custom authentication strategy in Payload that validates Supabase JWT tokens using both local JWT verification and Supabase API verification, with detailed error handling and development bypass options.

### Approach 2: Custom Authentication Strategy (Simplified Version)

Implement a minimal custom authentication strategy in Payload that validates Supabase tokens using only the Supabase API, with basic error handling.

### Approach 3: Middleware Proxy Layer

Create a middleware layer in the Next.js app that proxies requests to Payload CMS, adding the necessary authentication context.

### Approach 4: Shared JWT Secret

Configure Payload and Supabase to use the same JWT secret, allowing Payload to directly validate Supabase tokens.

### Approach 5: Synchronize Users Between Systems

Maintain synchronized user records in both Supabase and Payload, creating/updating Payload users whenever Supabase users change.

### Approach 6: Auth.js Integration

Use the `payload-authjs` plugin to integrate Auth.js (formerly NextAuth.js) with Payload CMS, and configure Auth.js to work with Supabase.

## 3. Chosen Approach: Custom Authentication Strategy (Simplified Version)

After evaluating the options, we've chosen the **Simplified Custom Authentication Strategy** approach as it provides the best balance of simplicity, security, and maintainability.

### Implementation Overview

```typescript
// In Payload config
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export default buildConfig({
  // ...
  auth: {
    strategies: [
      {
        name: 'supabase',
        strategy: async ({ headers }) => {
          const token = headers.get('authorization')?.split(' ')[1];
          if (!token) return null;

          try {
            const { data, error } = await supabase.auth.getUser(token);
            if (error) return null;

            return {
              id: data.user.id,
              email: data.user.email,
            };
          } catch (error) {
            return null;
          }
        },
      },
    ],
  },
});
```

### Next.js Integration

```typescript
// Helper function for making Payload requests
export async function callPayload(endpoint, options = {}) {
  const supabase = getSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return fetch(`${process.env.PAYLOAD_URL}/api/${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      'Content-Type': 'application/json',
      Authorization: session ? `Bearer ${session.access_token}` : '',
    },
  }).then((res) => res.json());
}
```

## 4. Advantages and Disadvantages

### Advantages of the Simplified Approach

1. **Lower Complexity**: Significantly fewer lines of code and conceptual simplicity make it easier to implement and maintain.

2. **Fewer Dependencies**: No need for the `jsonwebtoken` package, as it relies solely on Supabase's `auth.getUser()` method.

3. **Easier Troubleshooting**: With fewer moving parts, it's easier to diagnose problems when they occur.

4. **Faster Implementation**: Can be set up in minutes rather than hours.

5. **Reduced Risk of Configuration Errors**: Fewer environment variables to manage (no need for `SUPABASE_JWT_SECRET`).

### Disadvantages of the Simplified Approach

1. **Less Efficient Token Validation**: Every authentication check makes a network call to Supabase's API instead of doing local JWT verification first, which could be slightly slower.

2. **Limited User Information**: Only basic user details (id and email) are passed to Payload, which might be insufficient for complex access control rules that depend on user roles or other attributes.

3. **No Detailed Error Logging**: Minimal error handling means less visibility into authentication problems.

4. **No Development Bypass Mode**: Lacks the development testing mode that would make local development easier.

5. **Potentially Higher Supabase API Usage**: More calls to `auth.getUser()` could impact API usage limits.

## 5. Implementation Steps

1. **Environment Configuration**:

   - Ensure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are available in Payload's environment

2. **Payload Configuration**:

   - Add the custom authentication strategy to Payload's config
   - Update access control in relevant collections to use the authenticated user

3. **Next.js Integration**:

   - Create a helper function to make authenticated requests to Payload
   - Update existing API calls to use this helper

4. **Collection Access Control**:
   - Update the Survey collections to use the authenticated user for access control:

```typescript
// Example for SurveyResponses collection
export const SurveyResponses: CollectionConfig = {
  // ...
  access: {
    // Default read/update access - users can only access their own responses
    read: ({ req }) => {
      // Admin users can read all responses
      if (req.user?.email?.endsWith('@slideheroes.com')) return true;

      // Regular users can only see their own responses
      return {
        userId: { equals: req.user?.id },
      };
    },
    update: ({ req }) => {
      if (req.user?.email?.endsWith('@slideheroes.com')) return true;
      return {
        userId: { equals: req.user?.id },
      };
    },
    // Only authenticated users can create responses
    create: ({ req }) => Boolean(req.user),
    // Only admins can delete
    delete: ({ req }) => req.user?.email?.endsWith('@slideheroes.com'),
  },
  // ...
};
```

5. **Testing**:
   - Test authentication with various user scenarios
   - Verify access control rules are properly enforced

## 6. Potential Future Enhancements

If we encounter limitations with the simplified approach, we can progressively enhance it with:

1. **Local JWT Verification**:

   ```typescript
   // Add local JWT verification for performance
   const decodedToken = jwt.verify(token, process.env.SUPABASE_JWT_SECRET);
   if (!decodedToken) return null;
   ```

2. **Enhanced User Object**:

   ```typescript
   // Include more user properties for advanced access control
   return {
     id: data.user.id,
     email: data.user.email,
     roles: data.user.app_metadata?.roles || [],
     // Add other properties as needed
   };
   ```

3. **Detailed Error Logging**:

   ```typescript
   // Add comprehensive error logging
   console.error('Authentication error:', {
     message: error.message,
     userId: decodedToken?.sub,
     timestamp: new Date().toISOString(),
   });
   ```

4. **Development Bypass Mode**:

   ```typescript
   // Add development testing mode
   if (process.env.NODE_ENV === 'development' && process.env.BYPASS_AUTH === 'true') {
     console.warn('⚠️ AUTH BYPASS ENABLED - Only use in development!');
     return {
       id: 'dev-user',
       email: 'dev@example.com',
       roles: ['admin'],
     };
   }
   ```

5. **Token Caching**:

   ```typescript
   // Implement token caching to reduce Supabase API calls
   const cachedUser = tokenCache.get(token);
   if (cachedUser) return cachedUser;

   // Verify with Supabase and cache the result
   const { data, error } = await supabase.auth.getUser(token);
   if (!error) {
     tokenCache.set(token, {
       id: data.user.id,
       email: data.user.email,
     }, 60 * 5); // Cache for 5 minutes
   }
   ```

## 7. Conclusion

The simplified custom authentication strategy provides a clean, maintainable solution for integrating Payload CMS with Supabase authentication. It addresses the immediate authentication issues while remaining simple enough to implement quickly.

By starting with this approach and progressively enhancing it as needed, we can balance immediate needs with long-term maintainability, adding complexity only when justified by specific requirements.
