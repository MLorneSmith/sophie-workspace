# @kit/admin API Reference

Complete API documentation for the @kit/admin package.

## Table of Contents

- [Functions](#functions)
  - [isSuperAdmin](#issuperadmin)
  - [adminAction](#adminaction)
- [Server Actions](#server-actions)
  - [banUserAction](#banuseraction)
  - [reactivateUserAction](#reactivateuseraction)
  - [impersonateUserAction](#impersonateuseraction)
  - [deleteUserAction](#deleteuseraction)
  - [deleteAccountAction](#deleteaccountaction)
  - [createUserAction](#createuseraction)
  - [resetPasswordAction](#resetpasswordaction)
- [Components](#components)
  - [AdminGuard](#adminguard)
  - [AdminDashboard](#admindashboard)
  - [Dialog Components](#dialog-components)
  - [Table Components](#table-components)
- [Types](#types)

## Functions

### isSuperAdmin

Checks if the current authenticated user has super-admin privileges.

```typescript
function isSuperAdmin(client: SupabaseClient<Database>): Promise<boolean>
```

#### isSuperAdmin Parameters

- `client: SupabaseClient<Database>` - An initialized Supabase client with an authenticated session

#### isSuperAdmin Returns

`Promise<boolean>` - True if the user is a super-admin, false otherwise

#### isSuperAdmin Example

```typescript
import { isSuperAdmin } from '@kit/admin';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

const client = getSupabaseServerClient();
const isAdmin = await isSuperAdmin(client);

if (!isAdmin) {
  throw new Error('Unauthorized: Admin access required');
}
```

### adminAction

Higher-order function that wraps a server action to enforce super-admin access control.

```typescript
function adminAction<Args, Response>(
  fn: (params: Args) => Response
): (params: Args) => Promise<Response>
```

#### Type Parameters

- `Args` - The type of arguments the wrapped function accepts
- `Response` - The return type of the wrapped function

#### adminAction Parameters

- `fn: (params: Args) => Response` - The server action function to protect

#### adminAction Returns

An async function that checks admin status before executing

#### adminAction Example

```typescript
import { adminAction } from '@kit/admin';

const myAdminAction = adminAction(async (params: { id: string }) => {
  // This only runs if user is super-admin
  console.log('Admin action for:', params.id);
  return { success: true };
});
```

## Server Actions

All server actions are pre-wrapped with admin authentication and logging.

### banUserAction

Bans a user from the system, preventing login and access.

```typescript
banUserAction(params: BanUserParams): Promise<AdminActionResult>
```

#### banUserAction Parameters

```typescript
interface BanUserParams {
  userId: string; // UUID of user to ban
}
```

#### banUserAction Returns

```typescript
interface AdminActionResult {
  success: boolean;
}
```

### reactivateUserAction

Reactivates a previously banned user.

```typescript
reactivateUserAction(params: ReactivateUserParams): Promise<AdminActionResult>
```

#### reactivateUserAction Parameters

```typescript
interface ReactivateUserParams {
  userId: string; // UUID of user to reactivate
}
```

### impersonateUserAction

Impersonates a user for debugging purposes.

```typescript
impersonateUserAction(params: ImpersonateUserParams): Promise<Object>
```

#### impersonateUserAction Parameters

```typescript
interface ImpersonateUserParams {
  userId: string; // UUID of user to impersonate
}
```

#### Security Note

This action is logged for audit purposes and should only be used for legitimate support needs.

### deleteUserAction

Permanently deletes a user account.

```typescript
deleteUserAction(params: DeleteUserParams): Promise<void>
```

#### deleteUserAction Parameters

```typescript
interface DeleteUserParams {
  userId: string; // UUID of user to delete
}
```

#### deleteUserAction Behavior

- Permanently deletes user and all associated data
- Redirects to `/admin/accounts` on success
- **Warning**: This action is irreversible

### deleteAccountAction

Permanently deletes an entire account (team or personal).

```typescript
deleteAccountAction(params: DeleteAccountParams): Promise<void>
```

#### deleteAccountAction Parameters

```typescript
interface DeleteAccountParams {
  accountId: string; // UUID of account to delete
}
```

#### deleteAccountAction Behavior

- Deletes account and all associated data
- Redirects to `/admin/accounts` on success
- **Warning**: This action is irreversible

### createUserAction

Creates a new user account.

```typescript
createUserAction(params: CreateUserParams): Promise<CreateUserResult>
```

#### createUserAction Parameters

```typescript
interface CreateUserParams {
  email: string;        // User's email address
  password: string;     // User's password
  emailConfirm: boolean; // Auto-confirm email if true
}
```

#### createUserAction Returns

```typescript
interface CreateUserResult {
  success: boolean;
  user: {
    id: string;
    email?: string;
    created_at?: string;
  };
}
```

### resetPasswordAction

Sends a password reset email to a user.

```typescript
resetPasswordAction(params: ResetPasswordParams): Promise<Object>
```

#### resetPasswordAction Parameters

```typescript
interface ResetPasswordParams {
  userId: string; // UUID of user
}
```

## Components

### AdminGuard

Higher-order component for protecting routes with admin authentication.

```typescript
function AdminGuard<P>(Component: React.ComponentType<P>): React.ComponentType<P>
```

#### AdminGuard Usage

```typescript
// Protect a page
export default AdminGuard(function AdminPage() {
  return <div>Admin only content</div>;
});

// Protect a layout
export default AdminGuard(function AdminLayout({ children }) {
  return <div>{children}</div>;
});
```

#### AdminGuard Behavior

- Checks if user is super-admin on server-side
- Returns 404 (not found) for non-admin users
- Renders component for admin users

### AdminDashboard

Displays admin metrics and statistics.

```typescript
function AdminDashboard(): Promise<JSX.Element>
```

#### Displays

- Total user accounts
- Team accounts count
- Paying customers
- Active trials

#### AdminDashboard Usage

```typescript
import { AdminDashboard } from '@kit/admin/components/admin-dashboard';

export default async function DashboardPage() {
  return <AdminDashboard />;
}
```

### Dialog Components

Modal dialogs for user management operations.

#### AdminBanUserDialog

Dialog for banning a user.

```typescript
import { AdminBanUserDialog } from '@kit/admin/components/admin-ban-user-dialog';
```

#### AdminReactivateUserDialog

Dialog for reactivating a banned user.

```typescript
import { AdminReactivateUserDialog } from '@kit/admin/components/admin-reactivate-user-dialog';
```

#### AdminDeleteUserDialog

Dialog for permanently deleting a user.

```typescript
import { AdminDeleteUserDialog } from '@kit/admin/components/admin-delete-user-dialog';
```

#### AdminResetPasswordDialog

Dialog for resetting a user's password.

```typescript
import { AdminResetPasswordDialog } from '@kit/admin/components/admin-reset-password-dialog';
```

#### AdminDeleteAccountDialog

Dialog for deleting an entire account.

```typescript
import { AdminDeleteAccountDialog } from '@kit/admin/components/admin-delete-account-dialog';
```

### Table Components

Data table components for displaying admin information.

#### AdminMembersTable

Displays account members in a table format.

```typescript
import { AdminMembersTable } from '@kit/admin/components/admin-members-table';
```

#### AdminMembershipsTable

Displays user memberships across accounts.

```typescript
import { AdminMembershipsTable } from '@kit/admin/components/admin-memberships-table';
```

## Types

### Core Types

```typescript
// Supabase client with database schema
type AdminSupabaseClient = SupabaseClient<Database>;

// Generic admin action type
type AdminAction<TParams, TResult> = (params: TParams) => Promise<TResult>;

// Component props for admin components
interface AdminComponentProps {
  children?: React.ReactNode;
}

// HOC component type
type AdminGuardComponent<P = {}> = React.ComponentType<P>;
```

### Parameter Types

```typescript
interface BanUserParams {
  userId: string;
}

interface ReactivateUserParams {
  userId: string;
}

interface ImpersonateUserParams {
  userId: string;
}

interface DeleteUserParams {
  userId: string;
}

interface DeleteAccountParams {
  accountId: string;
}

interface CreateUserParams {
  email: string;
  password: string;
  emailConfirm: boolean;
}

interface ResetPasswordParams {
  userId: string;
}
```

### Result Types

```typescript
interface AdminActionResult {
  success: boolean;
}

interface CreateUserResult extends AdminActionResult {
  user: {
    id: string;
    email?: string;
    created_at?: string;
  };
}

interface AdminDashboardData {
  accounts: number;
  teamAccounts: number;
  subscriptions: number;
  trials: number;
}
```

## Error Handling

All admin actions follow these error handling patterns:

1. **Authentication Errors**: Return 404 (not found) to hide admin routes
2. **Validation Errors**: Throw with descriptive error messages
3. **Database Errors**: Log and throw with sanitized messages
4. **Audit Logging**: All actions are logged for security audit

## Security Considerations

1. **Server-Side Only**: All admin checks happen on the server
2. **404 Strategy**: Non-admins get 404 instead of 403 to hide admin routes
3. **Audit Trail**: All actions are logged with structured logging
4. **No Client Exposure**: Admin logic never reaches client-side code
5. **RPC Requirements**: Requires `is_super_admin` database function
