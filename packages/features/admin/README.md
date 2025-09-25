# @kit/admin

Admin dashboard and super-admin functionality for managing users, accounts, and system administration tasks.

## Installation

```bash
pnpm add @kit/admin
```

## Features

- 🛡️ **Super-Admin Access Control**: Secure role-based access for administrative functions
- 📊 **Admin Dashboard**: Real-time metrics and analytics display
- 👥 **User Management**: Complete user lifecycle management (create, ban, reactivate, delete)
- 🏢 **Account Management**: Team account administration and deletion
- 🔐 **Password Management**: Reset user passwords with secure email verification
- 👤 **User Impersonation**: Debug user issues by impersonating their account
- 🎯 **Server Actions**: Pre-built, secure server actions for all admin operations
- 🔒 **Component Guards**: HOC for protecting admin-only routes

## Usage

### Components

#### AdminGuard

A higher-order component that protects routes by ensuring only super-admins can access them.
Non-admin users receive a 404 response.

```typescript
import { AdminGuard } from '@kit/admin/components/admin-guard';

// Protect a page component
export default AdminGuard(function AdminOnlyPage() {
  return (
    <div>
      <h1>Admin Only Content</h1>
      {/* Your admin interface */}
    </div>
  );
});

// Protect a layout
export default AdminGuard(function AdminLayout({ children }) {
  return (
    <div>
      <AdminSidebar />
      {children}
    </div>
  );
});
```

#### AdminDashboard

A pre-built dashboard component that displays key metrics including user counts, team accounts,
paying customers, and active trials.

```typescript
import { AdminDashboard } from '@kit/admin/components/admin-dashboard';

export default async function AdminPage() {
  return (
    <div>
      <h1>Admin Overview</h1>
      <AdminDashboard />
    </div>
  );
}
```

#### User Management Components

```typescript
// Dialog components for user operations
import { AdminBanUserDialog } from '@kit/admin/components/admin-ban-user-dialog';
import { AdminReactivateUserDialog } from '@kit/admin/components/admin-reactivate-user-dialog';
import { AdminDeleteUserDialog } from '@kit/admin/components/admin-delete-user-dialog';
import { AdminResetPasswordDialog } from '@kit/admin/components/admin-reset-password-dialog';

// Table components for displaying data
import { AdminMembersTable } from '@kit/admin/components/admin-members-table';
import { AdminMembershipsTable } from '@kit/admin/components/admin-memberships-table';

// Account management
import { AdminDeleteAccountDialog } from '@kit/admin/components/admin-delete-account-dialog';
```

### Server Functions

#### isSuperAdmin

Check if the current authenticated user has super-admin privileges.

```typescript
import { isSuperAdmin } from '@kit/admin';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

export async function checkAdminStatus() {
  const client = getSupabaseServerClient();
  const isAdmin = await isSuperAdmin(client);
  
  if (!isAdmin) {
    throw new Error('Unauthorized: Admin access required');
  }
  
  return isAdmin;
}
```

### Server Actions

All server actions are wrapped with admin authentication checks and proper logging.

#### User Management Actions

```typescript
import {
  banUserAction,
  reactivateUserAction,
  deleteUserAction,
  createUserAction,
  resetPasswordAction,
  impersonateUserAction,
} from '@kit/admin/server-actions';

// Ban a user
await banUserAction({ userId: 'user-uuid' });

// Reactivate a banned user
await reactivateUserAction({ userId: 'user-uuid' });

// Delete a user permanently
await deleteUserAction({ userId: 'user-uuid' });

// Create a new user
await createUserAction({
  email: 'user@example.com',
  password: 'secure-password',
  emailConfirm: true, // Auto-confirm email
});

// Send password reset email
await resetPasswordAction({ userId: 'user-uuid' });

// Impersonate a user (for debugging)
const impersonationData = await impersonateUserAction({ userId: 'user-uuid' });
```

#### Account Management Actions

```typescript
import { deleteAccountAction } from '@kit/admin/server-actions';

// Delete an entire account (team or personal)
await deleteAccountAction({ accountId: 'account-uuid' });
```

### Utility Functions

#### adminAction Wrapper

Wrap any server action to ensure it can only be executed by super-admins.

```typescript
import { adminAction } from '@kit/admin/utils/admin-action';

// Create a custom admin-only action
const customAdminAction = adminAction(async (params) => {
  // This code will only run if the user is a super-admin
  // Non-admins receive a 404 response
  
  console.log('Executing admin action with:', params);
  // Your admin logic here
  
  return { success: true };
});
```

## API Reference

### Component Reference

| Component | Description | Props |
|-----------|-------------|-------|
| `AdminGuard` | HOC for protecting routes | `Component: React.ComponentType` |
| `AdminDashboard` | Metrics dashboard display | None (async component) |
| `AdminBanUserDialog` | Modal for banning users | User management props |
| `AdminReactivateUserDialog` | Modal for reactivating users | User management props |
| `AdminDeleteUserDialog` | Modal for deleting users | User management props |
| `AdminResetPasswordDialog` | Modal for password reset | User management props |
| `AdminMembersTable` | Table of account members | Member data props |
| `AdminMembershipsTable` | Table of user memberships | Membership data props |
| `AdminDeleteAccountDialog` | Modal for account deletion | Account management props |

### Server Function Reference

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `isSuperAdmin` | `client: SupabaseClient` | `Promise<boolean>` | Check super-admin status |

### Server Action Reference

| Action | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `banUserAction` | `{ userId: string }` | `{ success: boolean }` | Ban a user |
| `reactivateUserAction` | `{ userId: string }` | `{ success: boolean }` | Reactivate user |
| `deleteUserAction` | `{ userId: string }` | Redirect to /admin/accounts | Delete user |
| `createUserAction` | `{ email, password, emailConfirm }` | `{ success, user }` | Create new user |
| `resetPasswordAction` | `{ userId: string }` | Reset result | Send reset email |
| `impersonateUserAction` | `{ userId: string }` | Impersonation data | Impersonate user |
| `deleteAccountAction` | `{ accountId: string }` | Redirect to /admin/accounts | Delete account |

## Configuration

### Environment Variables

No specific environment variables are required for this package. It uses the standard Supabase configuration from `@kit/supabase`.

### Database Requirements

The package relies on the following RPC function in your Supabase database:

```sql
-- Required RPC function
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean AS $$
BEGIN
  -- Your super-admin check logic
  -- Example: Check if user has super_admin role
  RETURN EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Security Considerations

1. **404 Response Strategy**: The package returns 404 errors instead of 403 to avoid revealing admin route
   existence to unauthorized users.

2. **Server-Side Only**: All admin checks happen server-side using Server Components and Server Actions.

3. **Audit Logging**: All admin actions are automatically logged with structured logging for audit trails.

4. **No Client Exposure**: Admin functionality is never exposed to client-side code.

## Common Patterns

### Creating an Admin Layout

```typescript
// app/admin/layout.tsx
import { AdminGuard } from '@kit/admin/components/admin-guard';

export default AdminGuard(function AdminLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <div className="admin-layout">
      <nav>
        {/* Admin navigation */}
      </nav>
      <main>{children}</main>
    </div>
  );
});
```

### Building a User Management Page

```typescript
// app/admin/users/page.tsx
import { AdminGuard } from '@kit/admin/components/admin-guard';
import { AdminMembersTable } from '@kit/admin/components/admin-members-table';

export default AdminGuard(async function UsersPage() {
  // Fetch user data
  const users = await fetchUsers();
  
  return (
    <div>
      <h1>User Management</h1>
      <AdminMembersTable data={users} />
    </div>
  );
});
```

### Custom Admin Action with Validation

```typescript
import { adminAction } from '@kit/admin/utils/admin-action';
import { enhanceAction } from '@kit/next/actions';
import { z } from 'zod';

const MyAdminActionSchema = z.object({
  targetId: z.string().uuid(),
  action: z.enum(['approve', 'reject']),
});

export const myCustomAdminAction = adminAction(
  enhanceAction(
    async ({ targetId, action }) => {
      // Your admin logic here
      console.log(`Admin performing ${action} on ${targetId}`);
      
      return { success: true };
    },
    {
      schema: MyAdminActionSchema,
    }
  )
);
```

## Troubleshooting

### Common Issues

#### "Not Found" Error When Accessing Admin Routes

**Cause**: User doesn't have super-admin privileges.

**Solution**: Verify the user has the correct role in your database and that the `is_super_admin` RPC
function returns `true` for their user ID.

#### Server Actions Not Working

**Cause**: Missing or incorrectly configured RPC function.

**Solution**: Ensure the `is_super_admin` function exists in your Supabase database and has the correct permissions.

```sql
-- Check if function exists
SELECT * FROM pg_proc WHERE proname = 'is_super_admin';

-- Test the function
SELECT is_super_admin();
```

#### TypeScript Errors with Imports

**Cause**: Path aliases not properly configured.

**Solution**: Ensure your `tsconfig.json` includes the correct path mappings:

```json
{
  "compilerOptions": {
    "paths": {
      "@kit/admin": ["packages/features/admin/src/index.ts"],
      "@kit/admin/*": ["packages/features/admin/src/*"]
    }
  }
}
```

## Migration Guide

If you're migrating from a custom admin implementation:

1. **Replace Custom Auth Checks**: Replace manual super-admin checks with `isSuperAdmin()` function
2. **Update Route Protection**: Replace custom middleware with `AdminGuard` HOC
3. **Migrate Server Actions**: Wrap existing admin actions with `adminAction()` utility
4. **Update Database**: Ensure the `is_super_admin` RPC function matches your role system

## Support

For issues, questions, or contributions, please refer to the main project repository.

## License

This package is part of the @kit monorepo and follows the same license as the parent project.
