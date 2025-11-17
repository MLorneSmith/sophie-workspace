# Responsive Design

## Mobile-First Approach

Our application follows a mobile-first approach to responsive design. This means we start by designing and coding for mobile devices first, then progressively enhance the experience for larger screens.

```tsx
// Mobile-first approach example
<div className="/* Base padding for all devices */ /* Increased padding for medium screens */ /* Further increased for large screens */ p-4 md:p-6 lg:p-8">
  Content
</div>
```

### Real-World Example: Dashboard Layout

```tsx
// From apps/web/app/home/[account]/_components/dashboard-demo-charts.tsx
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
      <DollarSign className="text-muted-foreground h-4 w-4" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">$45,231.89</div>
      <p className="text-muted-foreground text-xs">+20.1% from last month</p>
    </CardContent>
  </Card>
  {/* More cards... */}
</div>
```

## Breakpoints

We use Tailwind CSS's standard breakpoints:

| Breakpoint | Screen Width | CSS                          |
| ---------- | ------------ | ---------------------------- |
| `sm`       | 640px        | `@media (min-width: 640px)`  |
| `md`       | 768px        | `@media (min-width: 768px)`  |
| `lg`       | 1024px       | `@media (min-width: 1024px)` |
| `xl`       | 1280px       | `@media (min-width: 1280px)` |
| `2xl`      | 1536px       | `@media (min-width: 1536px)` |

## Layout Patterns

### Responsive Grid

Use CSS Grid for complex layouts that need to adapt across different screen sizes:

```tsx
<div className="/* Single column on mobile */ /* Two columns on small screens */ /* Three columns on large screens */ grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
  {items.map((item) => (
    <Card key={item.id} item={item} />
  ))}
</div>
```

### Responsive Flexbox

Use Flexbox for simpler layouts and components:

```tsx
<div className="/* Stack vertically on mobile */ /* Arrange horizontally on medium screens */ flex flex-col items-center justify-between gap-4 md:flex-row">
  <div>Left content</div>
  <div>Right content</div>
</div>
```

### Container

Use the container utility for consistent max-width constraints:

```tsx
<div className="container mx-auto px-4">
  Content with consistent max-width and padding
</div>
```

## Responsive Typography

Scale typography based on screen size:

```tsx
<h1 className="/* Base size for mobile */ /* Larger on medium screens */ /* Even larger on large screens */ text-2xl font-bold md:text-3xl lg:text-4xl">
  Responsive Heading
</h1>
```

## Responsive Spacing

Adjust spacing based on screen size:

```tsx
<section className="/* Base vertical margin */ /* Increased on medium screens */ /* Further increased on large screens */ my-6 md:my-8 lg:my-12">
  Content with responsive spacing
</section>
```

## Responsive Visibility

Show or hide elements based on screen size:

```tsx
<div>
  {/* Only visible on mobile */}
  <button className="md:hidden">Menu</button>

  {/* Hidden on mobile, visible on medium screens and up */}
  <nav className="hidden md:block">Navigation links</nav>
</div>
```

## Responsive Images

Use responsive images with appropriate sizing:

```tsx
<Image
  src="/hero-image.jpg"
  alt="Hero image"
  width={1200}
  height={600}
  className="aspect-[16/9] h-auto w-full object-cover"
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  priority
/>
```

## Component-Specific Patterns

### Responsive Navigation

Real example from the project's mobile navigation:

```tsx
// From packages/ui/src/makerkit/mobile-navigation-menu.tsx
function MobileNavigationDropdown({
  links,
}: {
  links: {
    path: string;
    label: string;
  }[];
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={'w-full'}>
        <div
          className={
            'Button dark:ring-dark-700 w-full justify-start ring-2 ring-gray-100'
          }
        >
          <span
            className={
              'ButtonNormal flex w-full items-center justify-between space-x-2'
            }
          >
            <span>
              <Trans i18nKey={currentPathName} defaults={currentPathName} />
            </span>
            <ChevronDown className={'h-5'} />
          </span>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent>{items}</DropdownMenuContent>
    </DropdownMenu>
  );
}
```

Site header with responsive account section:

```tsx
// From apps/web/app/(marketing)/_components/site-header-account-section.tsx
<div className="flex items-center gap-4">
  {/* Mobile menu trigger - visible only on small screens */}
  <Sheet>
    <SheetTrigger asChild>
      <Button variant="ghost" size="icon" className="md:hidden">
        <Menu className="h-5 w-5" />
      </Button>
    </SheetTrigger>
    <SheetContent side="right">{/* Mobile navigation content */}</SheetContent>
  </Sheet>

  {/* Desktop navigation - hidden on mobile */}
  <nav className="hidden items-center gap-6 md:flex">
    {/* Navigation items */}
  </nav>
</div>
```

### Responsive Cards

```tsx
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
  {cards.map((card) => (
    <div
      key={card.id}
      className="flex flex-col gap-2 rounded-lg bg-white p-4 shadow"
    >
      <h3 className="text-lg font-medium">{card.title}</h3>
      <p className="text-gray-600">{card.description}</p>
    </div>
  ))}
</div>
```

### Responsive Forms

Real example from the onboarding form:

```tsx
// From apps/web/app/onboarding/_components/onboarding-form.tsx
<MultiStepFormStep name="Step 2">
  <div className="space-y-4">
    <h2 className="text-lg font-semibold">Company Information</h2>

    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <FormField
        control={form.control}
        name="companyName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Company Name</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="companySize"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Company Size</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>{/* Options */}</SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  </div>
</MultiStepFormStep>
```

### Responsive Kanban Board

```tsx
// From apps/web/app/home/(user)/kanban/_components/kanban-board.tsx
<div className="flex h-full flex-col gap-4 lg:flex-row">
  {columns.map((column) => (
    <div
      key={column.id}
      className="bg-muted/50 min-h-[200px] flex-1 rounded-lg p-4 lg:min-h-[600px]"
    >
      <h3 className="mb-4 font-semibold">{column.title}</h3>
      {/* Column content */}
    </div>
  ))}
</div>
```

## Testing Responsive Designs

1. **Browser DevTools**: Use browser developer tools to test different screen sizes
2. **Real Devices**: Test on actual mobile devices when possible
3. **Responsive Testing Tools**: Use tools like Responsively App for multi-device testing
4. **Automated Testing**: Include viewport size variations in your automated tests

## Best Practices

1. **Start Mobile-First**: Always design and implement for mobile first
2. **Use Relative Units**: Prefer relative units (rem, em, %) over fixed units (px)
3. **Test Across Breakpoints**: Test thoroughly at each breakpoint
4. **Consider Touch Interactions**: Ensure touch targets are at least 44×44 pixels
5. **Optimize Images**: Use responsive images with appropriate sizes
6. **Maintain Content Priority**: Keep important content accessible across all devices
7. **Use Feature Queries**: Use `@supports` for progressive enhancement
8. **Consider Performance**: Optimize performance especially for mobile devices

## Project-Specific Responsive Patterns

### Responsive Modals/Sheets

Use Sheet component for mobile, Dialog for desktop:

```tsx
// Mobile: Full-screen sheet
<Sheet>
  <SheetTrigger asChild>
    <Button className="md:hidden">Open Mobile Menu</Button>
  </SheetTrigger>
  <SheetContent side="right" className="w-full sm:max-w-md">
    {/* Mobile content */}
  </SheetContent>
</Sheet>

// Desktop: Centered dialog
<Dialog>
  <DialogTrigger asChild>
    <Button className="hidden md:inline-flex">Open Dialog</Button>
  </DialogTrigger>
  <DialogContent className="sm:max-w-[425px]">
    {/* Desktop content */}
  </DialogContent>
</Dialog>
```

### Responsive Tables

For data tables, use horizontal scroll on mobile:

```tsx
<div className="w-full overflow-auto">
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead className="w-[100px]">Name</TableHead>
        <TableHead className="hidden sm:table-cell">Status</TableHead>
        <TableHead className="hidden md:table-cell">Date</TableHead>
        <TableHead className="text-right">Amount</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>{/* Table rows */}</TableBody>
  </Table>
</div>
```

### Responsive Loading States

```tsx
// Skeleton loader that adapts to screen size
<div className="space-y-4">
  <Skeleton className="h-4 w-full md:w-3/4" />
  <Skeleton className="h-4 w-full md:w-1/2" />
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
    <Skeleton className="h-20" />
    <Skeleton className="hidden h-20 md:block" />
  </div>
</div>
```
