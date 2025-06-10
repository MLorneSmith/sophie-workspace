# UI Engineer Session Template

## Pre-Session Context Loading

### Essential Reading Order

1. Load UI Engineer role: `/read .claude/roles/ui-engineer.md`
2. Review project standards: `/read CLAUDE.md`
3. Load story context: `/read .claude/build/contexts/stories/story-{{ID}}/context.md`
4. Review technical notes: `/read .claude/build/contexts/stories/story-{{ID}}/technical-notes.md`
5. Check progress: `/read .claude/build/contexts/stories/story-{{ID}}/progress.md`

### SlideHeroes UI Patterns

Review existing UI implementations:

- Component library: `/read packages/ui/src/`
- App layouts: `/read apps/web/app/home/(user)/`
- Canvas components: `/read apps/web/app/home/(user)/ai/canvas/_components/`
- Editor components: `/read apps/web/app/home/(user)/editor/_components/`

## UI Development Standards for SlideHeroes

### Component Architecture

- **Server Components** preferred over Client Components
- **Shadcn/ui** component library as foundation
- **Tailwind CSS** for styling with custom theme
- **TypeScript** with proper typing (no `any` types)
- **Accessibility-first** development approach

### Implementation Patterns

```typescript
// Server Component Pattern (Preferred)
interface ComponentProps {
  data: DataType;
  className?: string;
}

function ComponentName({ data, className }: ComponentProps) {
  return (
    <div className={cn("default-styles", className)}>
      {/* Component content */}
    </div>
  );
}

// Client Component Pattern (When Needed)
'use client';

function InteractiveComponent() {
  const [state, setState] = useState();

  return (
    <div>
      {/* Interactive content */}
    </div>
  );
}
```

### SlideHeroes Design System

- **Colors**: Custom theme in `styles/theme.css`
- **Typography**: Font system in `lib/fonts.ts`
- **Components**: Shadcn/ui components in `packages/ui/src/`
- **Icons**: Lucide React icons
- **Spacing**: Tailwind spacing scale
- **Responsive**: Mobile-first responsive design

### Common UI Patterns in SlideHeroes

- **Modal dialogs**: Shadcn Dialog component
- **Form handling**: react-hook-form with Zod validation
- **Data tables**: ShadcnDataTable component
- **Loading states**: Suspense boundaries with loading.tsx
- **Error boundaries**: error.tsx files for error handling

## Session Checklist

### Context Loading

- [ ] UI Engineer role loaded and understood
- [ ] Project standards (CLAUDE.md) reviewed
- [ ] Story context fully loaded
- [ ] Technical notes and progress reviewed
- [ ] Existing UI patterns understood
- [ ] Design system components reviewed

### Implementation Readiness

- [ ] Story requirements clearly understood
- [ ] UI/UX acceptance criteria identified
- [ ] Component hierarchy planned
- [ ] Responsive design approach defined
- [ ] Accessibility requirements understood
- [ ] Performance considerations planned
- [ ] Test strategy defined

### Quality Standards

- [ ] TypeScript typing without `any`
- [ ] Tailwind CSS with design system
- [ ] Accessible components (ARIA, keyboard nav)
- [ ] Responsive design implementation
- [ ] Performance optimizations
- [ ] Component reusability considered
- [ ] Error state handling planned

## Development Focus Areas

### Component Development

- Building reusable, accessible components
- Implementing responsive design patterns
- Creating intuitive user interactions
- Optimizing component performance
- Following design system guidelines

### SlideHeroes UI Integration

- Canvas system user interface
- Editor interface enhancements
- Dashboard and navigation components
- Form and input components
- Data visualization components

### User Experience

- Intuitive navigation and workflows
- Loading states and progress indicators
- Error handling and user feedback
- Mobile-responsive design
- Accessibility compliance

## Common UI Tasks

- Building interactive components
- Implementing responsive layouts
- Creating form interfaces
- Developing data visualization
- Optimizing user experience flows
- Implementing design system components

## SlideHeroes Specific Considerations

- **Canvas Interface**: Complex drag-and-drop interactions
- **Editor Interface**: Rich text editing and formatting
- **AI Features**: Loading states for AI operations
- **Presentation Flow**: Multi-step workflows
- **Dashboard**: Data-heavy interfaces with good UX
