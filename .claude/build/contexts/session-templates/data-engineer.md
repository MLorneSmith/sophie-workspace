# Data Engineer Session Template

## Pre-Session Context Loading

### Essential Reading Order

1. Load Data Engineer role: `/read .claude/roles/data-engineer.md`
2. Review project standards: `/read CLAUDE.md`
3. Load story context: `/read .claude/build/contexts/stories/story-{{ID}}/context.md`
4. Review technical notes: `/read .claude/build/contexts/stories/story-{{ID}}/technical-notes.md`
5. Check progress: `/read .claude/build/contexts/stories/story-{{ID}}/progress.md`

### SlideHeroes Data Patterns

Review existing data implementations:

- Database schema: `/read packages/supabase/src/schema/`
- Server actions: `/read apps/web/app/home/(user)/*/actions/`
- Authentication: `/read apps/web/lib/auth/`
- RLS policies: `/read apps/web/supabase/tests/`

## Data Development Standards for SlideHeroes

### Database Architecture

- **Supabase** as primary database with PostgreSQL
- **Row Level Security (RLS)** for all data access
- **Zod schemas** for data validation
- **TypeScript types** generated from database schema
- **Server actions** for data mutations

### Implementation Patterns

```typescript
// Server Action Pattern
export const dataAction = enhanceAction(
  async (data, user) => {
    // Validate input
    const validatedData = schema.parse(data);

    // Get Supabase client
    const supabase = getSupabaseServerClient();

    // Database operation with RLS
    const { data: result, error } = await supabase
      .from('table_name')
      .insert(validatedData)
      .select();

    if (error) {
      throw new Error('Database operation failed');
    }

    return { success: true, data: result };
  },
  { schema: inputSchema },
);

// Query Pattern
async function getDataForUser(userId: string) {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from('table_name')
    .select('*')
    .eq('user_id', userId)
    .throwOnError();

  return data;
}
```

### SlideHeroes Data Models

Key entities in the system:

- **Users**: Authentication and profile data
- **Organizations**: Team and account management
- **Presentations**: Canvas and slide data
- **Courses**: Learning content and progress
- **AI Usage**: Tracking and billing data
- **Kanban**: Project management data

### RLS Security Patterns

- **User isolation**: Users can only access their own data
- **Organization access**: Team members access shared resources
- **Role-based access**: Different permissions for different roles
- **Service role**: Limited use for system operations only

## Session Checklist

### Context Loading

- [ ] Data Engineer role loaded and understood
- [ ] Project standards (CLAUDE.md) reviewed
- [ ] Story context fully loaded
- [ ] Technical notes and progress reviewed
- [ ] Existing data patterns understood
- [ ] Database schema reviewed

### Implementation Readiness

- [ ] Story requirements clearly understood
- [ ] Data model changes identified
- [ ] Schema migrations planned
- [ ] RLS policies defined
- [ ] API endpoints planned
- [ ] Validation schemas designed
- [ ] Test strategy defined

### Quality Standards

- [ ] RLS policies for all data access
- [ ] Zod validation for all inputs
- [ ] Proper TypeScript typing
- [ ] Error handling and user feedback
- [ ] Performance considerations
- [ ] Security audit completed
- [ ] Database migration tested

## Development Focus Areas

### Database Development

- Schema design and migrations
- RLS policy implementation
- Query optimization
- Data validation and integrity
- Performance monitoring

### SlideHeroes Data Integration

- User and organization management
- Presentation and canvas data
- Course progress tracking
- AI usage analytics
- Kanban project data

### API Development

- Server action implementation
- Data access patterns
- Authentication integration
- Error handling strategies
- Performance optimization

## Common Data Tasks

- Building data access layers
- Implementing authentication flows
- Creating database schemas
- Writing RLS policies
- Optimizing database queries
- Implementing data validation
- Creating migration scripts

## SlideHeroes Specific Considerations

- **Multi-tenancy**: Organization-based data isolation
- **AI Data**: Usage tracking and billing calculations
- **Content Management**: Integration with Payload CMS
- **Real-time Features**: Supabase real-time subscriptions
- **Analytics**: User behavior and feature usage tracking
- **Performance**: Efficient queries for large datasets

## Security Requirements

- **Never bypass RLS** - Use user context for all queries
- **Validate all inputs** - Use Zod schemas consistently
- **Audit data access** - Log sensitive operations
- **Encrypt sensitive data** - Follow data protection standards
- **Test security policies** - Comprehensive RLS testing
