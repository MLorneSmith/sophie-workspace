# Service Patterns

## MakerKit Service Architecture

Our application follows a functional service pattern rather than class-based services. Business logic is organized into feature packages and server actions.

```
/
├── packages/
│   ├── features/            # Feature-specific business logic
│   │   ├── accounts/        # Personal account management
│   │   ├── team-accounts/   # Team workspace functionality
│   │   ├── auth/           # Authentication flows
│   │   └── admin/          # Admin panel features
│   ├── ai-gateway/         # AI service integration
│   ├── cms/               # Content management abstractions
│   ├── billing/           # Payment processing
│   └── supabase/          # Database client utilities
```

## Service Pattern Types

### 1. Feature Services

Feature services contain domain-specific business logic:

```tsx
// packages/features/team-accounts/server/services/create-team-account.service.ts
export async function createTeamAccount(params: {
  name: string;
  userId: string;
}) {
  const supabase = getSupabaseServerClient();
  
  const { data, error } = await supabase
    .from('accounts')
    .insert({
      name: params.name,
      type: 'team',
      created_by: params.userId,
    })
    .select()
    .single()
    .throwOnError();

  if (error) throw error;
  return data;
}
```

### 2. Server Actions

Server actions handle form submissions and user interactions:

```tsx
// packages/features/team-accounts/server/actions/create-team-account-server-actions.ts
'use server';

import { enhanceAction } from '@kit/next/actions';
import { createTeamSchema } from '../schema/create-team.schema';
import { createTeamAccount } from '../services/create-team-account.service';

export const createTeamAccountAction = enhanceAction(
  async (data, user) => {
    return createTeamAccount({
      name: data.name,
      userId: user.id,
    });
  },
  {
    schema: createTeamSchema,
  }
);
```

### 3. Integration Services

Integration services handle external API communication:

```tsx
// apps/web/lib/certificates/certificate-service.ts
export async function generateCertificate(params: {
  userId: string;
  courseId: string;
  fullName: string;
}) {
  const pdfCoApiKey = process.env.PDF_CO_API_KEY;
  
  // External API integration
  const response = await fetch('https://api.pdf.co/v1/pdf/edit/add', {
    method: 'POST',
    headers: {
      'x-api-key': pdfCoApiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(formData),
  });
  
  // Store result in Supabase
  const supabase = getSupabaseServerClient();
  // ... implementation
}
```

### 4. API Functions

API functions provide data access patterns:

```tsx
// packages/features/team-accounts/server/api.ts
import { getSupabaseServerClient } from '@kit/supabase/server-client';

export async function getTeamAccounts(userId: string) {
  const supabase = getSupabaseServerClient();
  
  return supabase
    .from('accounts_memberships')
    .select(`
      account:accounts(*)
    `)
    .eq('user_id', userId)
    .throwOnError();
}
```

## Implementation Patterns

### Functional Composition

Services are composed using functional patterns:

```tsx
// Compose multiple services
export async function completeTeamSetup(params: {
  teamData: TeamData;
  userId: string;
}) {
  // Create team account
  const team = await createTeamAccount(params.teamData, params.userId);
  
  // Send welcome email
  await sendTeamWelcomeEmail(team.id, params.userId);
  
  // Initialize billing
  await initializeTeamBilling(team.id);
  
  return team;
}
```

### Error Handling

Use consistent error handling with proper typing:

```tsx
import { redirect } from 'next/navigation';

export async function requireTeamAccess(teamId: string, userId: string) {
  const { data, error } = await getTeamMembership(teamId, userId);
  
  if (error || !data) {
    redirect('/teams');
  }
  
  return data;
}
```

### Data Validation

Use Zod schemas for validation at service boundaries:

```tsx
import { z } from 'zod';

const createTeamSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().optional(),
});

export type CreateTeamData = z.infer<typeof createTeamSchema>;

export async function createTeamAccount(data: CreateTeamData) {
  // Validation happens in enhanceAction wrapper
  // Service function receives validated data
}
```

## Database Access Patterns

### Server Components

Direct database access in server components:

```tsx
// app/teams/page.tsx
import { getSupabaseServerClient } from '@kit/supabase/server-client';

export default async function TeamsPage() {
  const supabase = getSupabaseServerClient();
  
  const { data: teams } = await supabase
    .from('accounts')
    .select('*')
    .eq('type', 'team');
  
  return <TeamsList teams={teams} />;
}
```

### Client Components

Use React Query for client-side data fetching:

```tsx
// components/teams-list.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { getTeamAccounts } from '../server/api';

export function TeamsList() {
  const { data: teams, isLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: () => getTeamAccounts(),
  });
  
  if (isLoading) return <LoadingSpinner />;
  
  return (
    <div>
      {teams?.map(team => (
        <TeamCard key={team.id} team={team} />
      ))}
    </div>
  );
}
```

## Testing Patterns

### Service Function Testing

Test service functions with mocked dependencies:

```tsx
// __tests__/create-team-account.test.ts
import { vi } from 'vitest';
import { createTeamAccount } from '../services/create-team-account.service';

vi.mock('@kit/supabase/server-client', () => ({
  getSupabaseServerClient: () => mockSupabaseClient,
}));

describe('createTeamAccount', () => {
  it('should create a team account', async () => {
    const mockInsert = vi.fn().mockReturnValue({
      select: () => ({
        single: () => ({
          throwOnError: () => ({ data: mockTeam, error: null }),
        }),
      }),
    });
    
    mockSupabaseClient.from.mockReturnValue({ insert: mockInsert });
    
    const result = await createTeamAccount({
      name: 'Test Team',
      userId: 'user-123',
    });
    
    expect(result).toEqual(mockTeam);
  });
});
```

### Server Action Testing

Test server actions with proper mocking:

```tsx
// __tests__/create-team-action.test.ts
import { createTeamAccountAction } from '../actions/create-team-account-server-actions';

describe('createTeamAccountAction', () => {
  it('should handle team creation', async () => {
    const mockUser = { id: 'user-123' };
    const teamData = { name: 'Test Team' };
    
    const result = await createTeamAccountAction(teamData, mockUser);
    
    expect(result).toBeDefined();
  });
});
```

## Key Principles

1. **Functional over Object-Oriented** - Use functions rather than classes
2. **Server-First** - Business logic runs on the server
3. **Type Safety** - Use TypeScript and Zod for validation
4. **Separation of Concerns** - Features are self-contained packages
5. **Testability** - Functions are easily mocked and tested
6. **Error Boundaries** - Proper error handling at each layer