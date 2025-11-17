# The `<Activity>` Component

## Overview

The `<Activity>` component is a React 19.2 feature that controls the visibility of a component tree while **preserving its internal state**. This is a fundamental shift from traditional conditional rendering patterns.

## Key Difference from Ternary Operators

### Traditional Pattern (Unmounts on Hide)

```tsx
{isActive && <ExpensiveComponent />}
// When isActive becomes false, component unmounts and loses all state
```

### Activity Pattern (Preserves State)

```tsx
<Activity mode={isActive ? 'visible' : 'hidden'}>
  <ExpensiveComponent />
</Activity>
// When isActive becomes false, component stays mounted but hidden
```

## When to Use `<Activity>`

### 1. Pre-rendering Content for Instant Navigation

Pre-render components users are likely to navigate to, providing instant transitions:

```tsx
function TabContainer({ activeTab }: { activeTab: string }) {
  return (
    <>
      <Activity mode={activeTab === 'profile' ? 'visible' : 'hidden'}>
        <ProfileTab />
      </Activity>

      <Activity mode={activeTab === 'settings' ? 'visible' : 'hidden'}>
        <SettingsTab />
      </Activity>

      <Activity mode={activeTab === 'billing' ? 'visible' : 'hidden'}>
        <BillingTab />
      </Activity>
    </>
  );
}
```

**Benefits:**

- Zero loading delay when switching tabs
- All tabs are already rendered and ready
- Smooth user experience

### 2. Preserving Form State When Hidden

Prevent data loss when temporarily hiding forms:

```tsx
function MultiStepForm({ currentStep }: { currentStep: number }) {
  return (
    <>
      <Activity mode={currentStep === 1 ? 'visible' : 'hidden'}>
        <PersonalInfoForm />
      </Activity>

      <Activity mode={currentStep === 2 ? 'visible' : 'hidden'}>
        <AddressForm />
      </Activity>

      <Activity mode={currentStep === 3 ? 'visible' : 'hidden'}>
        <PaymentForm />
      </Activity>
    </>
  );
}
```

**Benefits:**

- User can navigate back/forward without losing form data
- Each step maintains its own state (form values, validation errors)
- Better UX than clearing forms on navigation

### 3. Modal/Dialog State Preservation

Keep complex UI state when toggling visibility:

```tsx
function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsModalOpen(true)}>Open Editor</button>

      <Activity mode={isModalOpen ? 'visible' : 'hidden'}>
        <RichTextEditor
          // Editor state (cursor position, undo history, etc.) preserved
          onClose={() => setIsModalOpen(false)}
        />
      </Activity>
    </>
  );
}
```

## When NOT to Use `<Activity>`

### ❌ Don't Use for Truly Conditional Content

If component should only exist in certain conditions:

```tsx
// ❌ Bad - Component will always render, wasting resources
<Activity mode={user.isPremium ? 'visible' : 'hidden'}>
  <PremiumFeatures />
</Activity>

// ✅ Good - Component only renders when needed
{user.isPremium && <PremiumFeatures />}
```

### ❌ Don't Use for Content That Doesn't Need State Preservation

If losing state is acceptable or even desired:

```tsx
// ❌ Bad - Unnecessarily keeps component mounted
<Activity mode={showSearch ? 'visible' : 'hidden'}>
  <SearchBox />
</Activity>

// ✅ Good - Search results don't need to persist when closed
{showSearch && <SearchBox />}
```

## Performance Considerations

### Memory Usage

- `<Activity mode="hidden">` keeps components in memory
- Useful for frequently toggled UI (tabs, modals)
- Avoid for rarely accessed content

### Initial Render Cost

- All `<Activity>` children render immediately
- Pre-rendering 3-5 tabs is typically fine
- Pre-rendering 50+ tabs would hurt initial load

## MakerKit Usage Patterns

In the SlideHeroes codebase, `<Activity>` is useful for:

1. **Multi-tab interfaces** in account settings, project dashboards
2. **Wizard flows** where users move between steps
3. **Expandable panels** that should remember scroll position
4. **Side panels** that slide in/out frequently

## API Reference

```tsx
type ActivityMode = 'visible' | 'hidden';

interface ActivityProps {
  mode: ActivityMode;
  children: React.ReactNode;
}

// Usage
<Activity mode={condition ? 'visible' : 'hidden'}>
  {/* Component tree */}
</Activity>
```

## Migration Pattern

### Before (React 18)

```tsx
function Tabs({ active }: { active: string }) {
  return (
    <div>
      {active === 'tab1' && <Tab1 />}
      {active === 'tab2' && <Tab2 />}
      {active === 'tab3' && <Tab3 />}
    </div>
  );
}
```

### After (React 19.2)

```tsx
function Tabs({ active }: { active: string }) {
  return (
    <div>
      <Activity mode={active === 'tab1' ? 'visible' : 'hidden'}>
        <Tab1 />
      </Activity>
      <Activity mode={active === 'tab2' ? 'visible' : 'hidden'}>
        <Tab2 />
      </Activity>
      <Activity mode={active === 'tab3' ? 'visible' : 'hidden'}>
        <Tab3 />
      </Activity>
    </div>
  );
}
```

## Decision Tree

```
Need to conditionally show/hide a component?
│
├─ Does it need to preserve state when hidden?
│  ├─ Yes → Use <Activity>
│  └─ No → Use conditional rendering (&&)
│
├─ Will users frequently toggle between views?
│  ├─ Yes → Use <Activity> for instant transitions
│  └─ No → Use conditional rendering to save memory
│
└─ Is initial render performance critical?
   ├─ Yes → Use conditional rendering
   └─ No → Use <Activity> for better UX
```
