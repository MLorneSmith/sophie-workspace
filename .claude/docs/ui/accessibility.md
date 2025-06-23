# Accessibility

## Overview

Our application follows the Web Content Accessibility Guidelines (WCAG) 2.1 AA standards. This ensures our application is accessible to a wide range of users, including those with disabilities.

## Technology Stack

- **Next.js 15 & React 19**: Latest versions with improved accessibility features
- **ShadcnUI Components**: Built on Radix UI primitives with built-in ARIA support
- **React Hook Form**: Accessible form handling with automatic ARIA attributes
- **Zod Validation**: Schema validation with accessible error messages
- **Trans Component**: Internationalization support for all user-facing text

## Key Principles

### 1. Perceivable

Information and user interface components must be presentable to users in ways they can perceive.

#### Text Alternatives

Provide text alternatives for non-text content:

```tsx
// Good: Image with alt text
<Image 
  src="/logo.png" 
  alt="Company Logo" 
  width={200} 
  height={50} 
/>

// Good: Decorative image with empty alt
<Image 
  src="/decorative-pattern.png" 
  alt="" 
  role="presentation" 
  width={500} 
  height={300} 
/>
```

#### Time-Based Media

Provide alternatives for time-based media:

```tsx
<video controls>
  <source src="/video.mp4" type="video/mp4" />
  <track 
    kind="captions" 
    src="/captions.vtt" 
    srcLang="en" 
    label="English" 
    default 
  />
  <track 
    kind="descriptions" 
    src="/descriptions.vtt" 
    srcLang="en" 
    label="English Descriptions" 
  />
</video>
```

#### Adaptable Content

Create content that can be presented in different ways without losing information:

```tsx
// Use semantic HTML
<article>
  <h1>Article Title</h1>
  <p>First paragraph...</p>
  <h2>Section Heading</h2>
  <p>More content...</p>
</article>
```

#### Distinguishable Content

Make it easier for users to see and hear content:

```tsx
// Ensure sufficient color contrast
<p className="
  text-gray-900  /* High contrast against white background */
  dark:text-gray-50  /* High contrast against dark background */
">
  Important text content
</p>

// Don't rely on color alone
<div className="
  border-l-4 
  border-red-500 
  pl-4 
  bg-red-50 
  dark:bg-red-900/20
">
  <p className="flex items-center">
    <AlertIcon className="mr-2" />
    <span>Error message</span>
  </p>
</div>
```

### 2. Operable

User interface components and navigation must be operable.

#### Keyboard Accessible

Make all functionality available from a keyboard:

```tsx
// Ensure custom components are keyboard accessible
const CustomButton = React.forwardRef<
  HTMLButtonElement, 
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ children, ...props }, ref) => (
  <button
    ref={ref}
    {...props}
  >
    {children}
  </button>
));
```

#### Enough Time

Provide users enough time to read and use content:

```tsx
// Allow users to control time limits
function TimedContent() {
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [isPaused, setIsPaused] = useState(false);
  
  // Implementation...
  
  return (
    <div>
      <div>Time remaining: {timeRemaining}s</div>
      <button onClick={() => setIsPaused(!isPaused)}>
        {isPaused ? 'Resume' : 'Pause'}
      </button>
      <button onClick={() => setTimeRemaining(timeRemaining + 60)}>
        Add 60 seconds
      </button>
      {/* Content */}
    </div>
  );
}
```

#### Seizures and Physical Reactions

Do not design content in a way that is known to cause seizures or physical reactions:

```tsx
// Avoid rapid flashing content
// If animation is necessary, ensure it doesn't flash more than 3 times per second
const SafeAnimation = () => (
  <div className="
    animate-pulse 
    duration-1000  /* Slow animation */
  ">
    Content
  </div>
);
```

#### Navigable

Provide ways to help users navigate, find content, and determine where they are:

```tsx
// Use proper heading structure
<main>
  <h1>Page Title</h1>
  <section>
    <h2>Section Title</h2>
    <p>Content...</p>
    <h3>Subsection Title</h3>
    <p>More content...</p>
  </section>
</main>

// Provide skip links
<a 
  href="#main-content" 
  className="
    sr-only 
    focus:not-sr-only 
    focus:absolute 
    focus:top-4 
    focus:left-4 
    focus:z-50 
    focus:p-4 
    focus:bg-white 
    focus:shadow-lg
  "
>
  Skip to main content
</a>
```

### 3. Understandable

Information and the operation of the user interface must be understandable.

#### Readable

Make text content readable and understandable:

```tsx
// Specify language
<html lang="en">
  {/* Page content */}
</html>

// Specify language changes
<p>
  The French word for hello is <span lang="fr">bonjour</span>.
</p>
```

#### Predictable

Make web pages appear and operate in predictable ways:

```tsx
// Consistent navigation
<header>
  <nav aria-label="Main Navigation">
    {/* Same navigation structure across pages */}
  </nav>
</header>

// Warn about context changes
<button
  onClick={handleSubmit}
  aria-haspopup="dialog"
>
  Submit
</button>
```

#### Input Assistance

Help users avoid and correct mistakes with our form components:

##### Project Form Pattern with React Hook Form

```tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Trans } from '@kit/ui/trans';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@kit/ui/form';
import { Input } from '@kit/ui/input';
import { Button } from '@kit/ui/button';

const formSchema = z.object({
  email: z.string().email({
    message: 'Please enter a valid email address',
  }),
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters',
  }),
});

function AccessibleForm() {
  const form = useForm({
    resolver: zodResolver(formSchema),
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <Trans i18nKey="form.email.label" defaults="Email" />
              </FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  type="email"
                  placeholder="name@example.com"
                />
              </FormControl>
              <FormDescription>
                <Trans 
                  i18nKey="form.email.description" 
                  defaults="We'll never share your email" 
                />
              </FormDescription>
              <FormMessage />
              {/* FormMessage automatically handles aria-describedby */}
            </FormItem>
          )}
        />
        
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? (
            <Trans i18nKey="form.submitting" defaults="Submitting..." />
          ) : (
            <Trans i18nKey="form.submit" defaults="Submit" />
          )}
        </Button>
      </form>
    </Form>
  );
}
```

The ShadcnUI Form components automatically handle:

- `aria-invalid` when there are errors
- `aria-describedby` linking error messages
- Proper label associations
- Focus management

### 4. Robust

Content must be robust enough that it can be interpreted by a wide variety of user agents, including assistive technologies.

#### Compatible

Maximize compatibility with current and future user agents, including assistive technologies:

```tsx
// Use ARIA attributes appropriately
<button
  aria-pressed={isActive}
  onClick={toggleActive}
>
  {isActive ? 'Active' : 'Inactive'}
</button>

// Use semantic HTML when possible
<nav aria-label="Main Navigation">
  <ul>
    <li><a href="/">Home</a></li>
    <li><a href="/about">About</a></li>
    <li><a href="/contact">Contact</a></li>
  </ul>
</nav>
```

## Common Components

### Buttons

```tsx
<button
  type="button"
  onClick={handleClick}
  disabled={isDisabled}
  aria-busy={isLoading}
  className="
    px-4 
    py-2 
    bg-primary 
    text-white 
    rounded 
    focus:outline-none 
    focus:ring-2 
    focus:ring-primary-500 
    focus:ring-offset-2
    disabled:opacity-50
    disabled:cursor-not-allowed
  "
>
  {isLoading ? 'Loading...' : 'Click Me'}
</button>
```

### Form Inputs

```tsx
<div className="space-y-2">
  <label 
    htmlFor="name"
    className="block font-medium text-gray-700"
  >
    Name
  </label>
  <input
    id="name"
    name="name"
    type="text"
    required
    aria-required="true"
    aria-invalid={errors.name ? "true" : "false"}
    aria-describedby={errors.name ? "name-error" : undefined}
    className="
      w-full 
      px-3 
      py-2 
      border 
      border-gray-300 
      rounded-md 
      shadow-sm 
      focus:outline-none 
      focus:ring-primary-500 
      focus:border-primary-500
    "
  />
  {errors.name && (
    <p id="name-error" className="text-red-500 text-sm">
      {errors.name.message}
    </p>
  )}
</div>
```

### Modals

```tsx
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
  className="fixed inset-0 z-50 overflow-y-auto"
>
  <div className="flex min-h-screen items-center justify-center p-4">
    {/* Backdrop */}
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" 
      aria-hidden="true"
      onClick={closeModal}
    ></div>
    
    {/* Modal content */}
    <div className="
      relative 
      bg-white 
      rounded-lg 
      shadow-xl 
      max-w-md 
      w-full 
      p-6
    ">
      <h2 id="modal-title" className="text-xl font-semibold">
        Modal Title
      </h2>
      <div id="modal-description" className="mt-2">
        <p>Modal content goes here.</p>
      </div>
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={closeModal}
          className="px-4 py-2 bg-gray-200 rounded"
        >
          Close
        </button>
      </div>
    </div>
  </div>
</div>
```

### Tabs

```tsx
<div>
  <div role="tablist" aria-label="Content tabs">
    {tabs.map((tab, index) => (
      <button
        key={tab.id}
        role="tab"
        id={`tab-${tab.id}`}
        aria-selected={activeTab === tab.id}
        aria-controls={`panel-${tab.id}`}
        tabIndex={activeTab === tab.id ? 0 : -1}
        onClick={() => setActiveTab(tab.id)}
        className={`
          px-4 
          py-2 
          ${activeTab === tab.id 
            ? 'bg-primary text-white' 
            : 'bg-gray-100 text-gray-700'}
        `}
      >
        {tab.label}
      </button>
    ))}
  </div>
  
  {tabs.map((tab) => (
    <div
      key={tab.id}
      role="tabpanel"
      id={`panel-${tab.id}`}
      aria-labelledby={`tab-${tab.id}`}
      hidden={activeTab !== tab.id}
      tabIndex={0}
      className="p-4 border rounded-b"
    >
      {tab.content}
    </div>
  ))}
</div>
```

## Internationalization and Accessibility

### Using the Trans Component

All user-facing text should use the `Trans` component for internationalization:

```tsx
import { Trans } from '@kit/ui/trans';

// Basic usage
<Trans i18nKey="welcome.message" defaults="Welcome to our application" />

// With variables
<Trans 
  i18nKey="user.greeting" 
  defaults="Hello, {name}!" 
  values={{ name: userName }}
/>

// In form labels
<FormLabel>
  <Trans i18nKey="form.email.label" defaults="Email Address" />
</FormLabel>

// In ARIA labels
<button
  aria-label={t('button.close.aria', 'Close dialog')}
  onClick={handleClose}
>
  <X className="h-4 w-4" />
</button>
```

### Language Attributes

Ensure proper language attributes:

```tsx
// Document language
<html lang={locale}>

// Content in different language
<blockquote lang="fr">
  <p>C'est la vie!</p>
</blockquote>
```

## Project-Specific Accessibility Patterns

### Accessible Loading States

```tsx
// Loading spinner with screen reader announcement
<div role="status" aria-live="polite">
  <Spinner className="h-4 w-4" />
  <span className="sr-only">
    <Trans i18nKey="loading" defaults="Loading..." />
  </span>
</div>
```

### Accessible Toast Notifications

```tsx
// Using the toast system with proper ARIA
import { toast } from '@kit/ui/sonner';

// Success toast
toast.success(
  <Trans i18nKey="toast.success" defaults="Operation completed successfully" />
);

// Error toast with action
toast.error(
  <Trans i18nKey="toast.error" defaults="Something went wrong" />,
  {
    action: {
      label: <Trans i18nKey="toast.retry" defaults="Retry" />,
      onClick: () => handleRetry(),
    },
  }
);
```

### Accessible Data Tables

```tsx
import { DataTable } from '@kit/ui/data-table';

// Table with proper headers and captions
<DataTable
  columns={columns}
  data={data}
  caption={
    <Trans 
      i18nKey="table.users.caption" 
      defaults="List of registered users" 
    />
  }
/>
```

## Testing Accessibility

### Automated Testing

Use Vitest with testing-library for component testing:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';

describe('AccessibleButton', () => {
  it('should be keyboard accessible', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    
    render(
      <Button onClick={handleClick}>
        <Trans i18nKey="button.submit" defaults="Submit" />
      </Button>
    );
    
    const button = screen.getByRole('button', { name: /submit/i });
    
    // Tab to button
    await user.tab();
    expect(button).toHaveFocus();
    
    // Activate with Enter
    await user.keyboard('{Enter}');
    expect(handleClick).toHaveBeenCalled();
  });
});
```

### Manual Testing Checklist

1. **Keyboard Navigation**:
   - Can navigate with Tab/Shift+Tab
   - Can activate with Enter/Space
   - Focus indicators are visible
   - No keyboard traps

2. **Screen Reader Testing**:
   - All interactive elements have accessible names
   - Form fields have associated labels
   - Error messages are announced
   - Dynamic content updates are announced

3. **Visual Testing**:
   - 200% zoom doesn't break layout
   - Color contrast passes WCAG AA (4.5:1 for normal text, 3:1 for large text)
   - Information isn't conveyed by color alone

4. **Motion and Animation**:
   - Animations respect `prefers-reduced-motion`
   - No flashing content that could trigger seizures

### Browser DevTools

Use built-in accessibility tools:

```bash
# Chrome DevTools
1. Open DevTools (F12)
2. Go to "Lighthouse" tab
3. Run accessibility audit

# Firefox Accessibility Inspector
1. Open DevTools (F12)
2. Go to "Accessibility" tab
3. Check for issues
```

## Best Practices Summary

1. **Use Semantic HTML**: Prefer semantic elements over generic divs
2. **Provide Text Alternatives**: Alt text for images, labels for inputs
3. **Ensure Keyboard Access**: All interactive elements must be keyboard accessible
4. **Use ARIA Wisely**: Only when semantic HTML isn't sufficient
5. **Test Early and Often**: Include accessibility in your development workflow
6. **Use Project Components**: Our UI components have accessibility built-in
7. **Internationalize Everything**: Use Trans component for all user-facing text
