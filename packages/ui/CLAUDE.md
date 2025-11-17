# UI Components & Styling Instructions

This file contains instructions for working with UI components, styling, and forms.

## Core UI Library

Import from `packages/ui/src/`:

```tsx
// Shadcn components
import { Button } from '@kit/ui/button';
import { Card } from '@kit/ui/card';
// Makerkit components
import { If } from '@kit/ui/if';
import { ProfileAvatar } from '@kit/ui/profile-avatar';
import { toast } from '@kit/ui/sonner';
import { Trans } from '@kit/ui/trans';
```text

## Using Shadcn CLI

The shadcn/ui CLI enables quick addition of new components to the library. Components are source code (not npm packages), giving you full control over customization.

### Quick Start

**Add a component**:
```bash
# From project root
pnpm --filter @kit/ui ui:add button

# Or from packages/ui directory
cd packages/ui && npx shadcn@latest add button
```

**Search available components**:

```bash
pnpm --filter @kit/ui ui:search -q "form"
```

**List installed components**:

```bash
pnpm --filter @kit/ui ui:list
```

### Complete Workflow

1. **Search** for component: `pnpm --filter @kit/ui ui:search -q "toggle"`
2. **Preview** code: `npx shadcn@latest view toggle` (optional)
3. **Add** component: `cd packages/ui && npx shadcn@latest add toggle -y`
4. **Update exports** in `packages/ui/package.json`:

   ```json
   {
     "exports": {
       "./toggle": "./src/shadcn/toggle.tsx"
     }
   }
   ```

5. **Test import**: Verify `import { Toggle } from '@kit/ui/toggle'` works
6. **Commit**: `git add packages/ui && git commit -m "feat(ui): add toggle component"`

### Registry Components

Access 500+ community components from specialized registries:

```bash
# Search registry
npx shadcn@latest search @magicui

# View component code
npx shadcn@latest view @magicui/animated-button

# Install from registry
cd packages/ui && npx shadcn@latest add @magicui/animated-button
```

**Featured Registries**:

- **@magicui** - Animated components with Framer Motion
- **@aceternity** - Modern UI with 3D effects
- **@shadcnblocks** - Pre-built page sections and blocks

### Documentation

For complete CLI reference, see: `.ai/ai_docs/tool-docs/shadcn-cli.md`

Topics covered:

- All CLI commands (`init`, `add`, `search`, `view`, `build`)
- Registry directory system
- Monorepo workflows
- Configuration reference
- Troubleshooting guide

## Styling Guidelines

- Use **Tailwind CSS v4** with semantic classes
- Prefer Shadcn-ui classes like `bg-background`, `text-muted-foreground`
- Use `cn()` utility from `@kit/ui/cn` for class merging

```tsx
import { cn } from '@kit/ui/cn';

function MyComponent({ className }) {
  return (
    <div className={cn('bg-background text-foreground', className)}>
      Content
    </div>
  );
}
```text

### Conditional Rendering

Use the `If` component from `packages/ui/src/makerkit/if.tsx`:

```tsx
import { If } from '@kit/ui/if';

<If condition={isLoading} fallback={<Content />}>
  <Spinner />
</If>

// With type inference
<If condition={error}>
  {(err) => <ErrorMessage error={err} />}
</If>
```text

### Testing Attributes

```tsx
<button data-test="submit-button">Submit</button>
<div data-test="user-profile" data-user-id={user.id}>Profile</div>
```text

## Forms with React Hook Form & Zod

```typescript
// 1. Schema in separate file
export const CreateNoteSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
});

// 2. Client component with form
'use client';
const form = useForm({
  resolver: zodResolver(CreateNoteSchema),
});

const onSubmit = (data) => {
  startTransition(async () => {
    await toast.promise(createNoteAction(data), {
      loading: 'Creating...',
      success: 'Created!',
      error: 'Failed!',
    }).unwrap();
  });
};
```text

### Guidelines

- Place Zod resolver outside so it can be reused with Server Actions
- Never add generics to `useForm`, use Zod resolver to infer types instead
- Never use `watch()` instead use hook `useWatch`
- Add `FormDescription` (optionally) and always add `FormMessage` to display errors

### Form Examples

- Contact form: `apps/web/app/(marketing)/contact/_components/contact-form.tsx`
- Verify OTP form: `packages/otp/src/components/verify-otp-form.tsx`

## Internationalization

Always use `Trans` component from `packages/ui/src/makerkit/trans.tsx`:

```tsx
import { Trans } from '@kit/ui/trans';

<Trans
  i18nKey="user:welcomeMessage"
  values={{ name: user.name }}
/>

// With HTML elements
<Trans
  i18nKey="terms:agreement"
  components={{
    TermsLink: <a href="/terms" className="underline" />,
  }}
/>
```text

## Toast Notifications

Use the `toast` utility from `@kit/ui/sonner`:

```tsx
import { toast } from '@kit/ui/sonner';

// Simple toast
toast.success('Success message');
toast.error('Error message');

// Promise-based toast
await toast.promise(asyncFunction(), {
  loading: 'Processing...',
  success: 'Done!',
  error: 'Failed!',
});
```text

## Common Component Patterns

### Loading States

```tsx
import { Spinner } from '@kit/ui/spinner';

<If condition={isLoading} fallback={<Content />}>
  <Spinner className="h-4 w-4" />
</If>
```text

### Error Handling

```tsx
import { Alert, AlertDescription, AlertTitle } from '@kit/ui/alert';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';

<If condition={Boolean(error)}>
  <Alert variant="destructive">
    <ExclamationTriangleIcon className="h-4 w-4" />
    <AlertTitle>Error</AlertTitle>
    <AlertDescription>{error}</AlertDescription>
  </Alert>
</If>
```text

### Button Patterns

```tsx
import { Button } from '@kit/ui/button';

// Loading button
<Button disabled={isPending}>
  {isPending ? (
    <>
      <Spinner className="mr-2 h-4 w-4" />
      Loading...
    </>
  ) : (
    'Submit'
  )}
</Button>

// Variants
<Button variant="default">Default</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Cancel</Button>
<Button variant="ghost">Ghost</Button>
```text

### Card Layouts

```tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@kit/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description</CardDescription>
  </CardHeader>
  <CardContent>
    Card content goes here
  </CardContent>
</Card>
```text

## Form Components

### Input Fields

```tsx
import { Input } from '@kit/ui/input';
import { Label } from '@kit/ui/label';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@kit/ui/form';

<FormField
  name="title"
  control={form.control}
  render={({ field }) => (
    <FormItem>
      <FormLabel>Title</FormLabel>
      <FormControl>
        <Input placeholder="Enter title" {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```text

### Select Components

```tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@kit/ui/select';

<FormField
  name="category"
  control={form.control}
  render={({ field }) => (
    <FormItem>
      <FormLabel>Category</FormLabel>
      <Select onValueChange={field.onChange} defaultValue={field.value}>
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          <SelectItem value="option1">Option 1</SelectItem>
          <SelectItem value="option2">Option 2</SelectItem>
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  )}
/>
```text

## Accessibility Guidelines

- Always include proper ARIA labels
- Use semantic HTML elements
- Ensure proper keyboard navigation

```tsx
<button
  aria-label="Close modal"
  aria-describedby="modal-description"
  onClick={onClose}
>
  <X className="h-4 w-4" />
</button>
```text

## Dark Mode Support

The UI components automatically support dark mode through CSS variables. Use semantic color classes:

```tsx
// Good - semantic colors
<div className="bg-background text-foreground border-border">
  <p className="text-muted-foreground">Secondary text</p>
</div>

// Avoid - hardcoded colors
<div className="bg-white text-black border-gray-200">
  <p className="text-gray-500">Secondary text</p>
</div>
```text
