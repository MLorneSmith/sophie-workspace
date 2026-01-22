# Chore: Implement Cookie Consent Banner for GDPR Compliance

## Chore Description

Implement a cookie consent banner for GDPR compliance. The banner must:
- Display on all pages for users in EU regions
- Allow users to accept/reject non-essential cookies
- Respect PostHog analytics tracking preferences
- Match the existing SlideHeroes design system (Tailwind CSS, Shadcn UI)
- Be dismissible and store user preference in localStorage
- Support dark/light theme matching
- Integrate with existing analytics provider to respect consent

This is critical for EU users (GDPR Article 7 & 21) and complements the recently configured PostHog EU analytics integration.

## Relevant Files

### Existing Legal/Policy Pages
- `apps/web/app/(marketing)/(legal)/privacy-policy/page.tsx` - Placeholder privacy policy (needs updating)
- `apps/web/app/(marketing)/(legal)/cookie-policy/page.tsx` - Placeholder cookie policy (needs updating)
- `apps/web/app/(marketing)/(legal)/terms-of-service/page.tsx` - Existing ToS page

**Relevance**: Cookie policy page should document which cookies are used, including PostHog and Supabase auth cookies.

### Layout & Provider Structure
- `apps/web/app/(marketing)/layout.tsx` - Marketing site layout with SiteHeader/SiteFooter
- `apps/web/components/root-providers.tsx` - Root provider wrapping entire app (ThemeProvider, AuthProvider, AnalyticsProvider, etc.)
- `apps/web/app/layout.tsx` - Main app layout (if exists, for global cookie banner)

**Relevance**: Cookie banner should be added to root providers so it appears on all pages. Need to respect ThemeProvider for dark/light mode matching.

### Design System Components
- `apps/web/app/(marketing)/_components/site-page-header.tsx` - Existing page header pattern with Tailwind classes
- `apps/web/app/(marketing)/_components/site-footer.tsx` - Existing footer pattern
- `apps/web/components/analytics-provider.tsx` - Existing analytics tracking setup with app events

**Relevance**: Study existing design patterns (typography, spacing, colors, dark mode) to ensure consistency. Cookie banner should integrate with analytics provider to skip PostHog tracking until consent given.

### Configuration
- `apps/web/config/app.config.ts` - App configuration (theme colors, branding)
- `apps/web/lib/i18n/i18n.settings.ts` - Internationalization settings (if exists)

**Relevance**: Theme colors and i18n support for banner text/labels.

### New Files to Create
- `apps/web/components/cookie-consent-banner.tsx` - Main cookie consent component (client component)
- `apps/web/lib/hooks/use-cookie-consent.ts` - Hook for managing cookie consent state (localStorage)
- `apps/web/lib/utils/geo-location.ts` - Utility to detect EU region (optional, or use IP from PostHog)
- `apps/web/lib/i18n/cookie-consent.translations.ts` - Cookie consent banner translations
- `public/locales/[lang]/cookie-consent.json` - Translation files for multiple languages

**Note**: Translation files only needed if i18n support is enabled. Check `i18n.settings.ts` for language support.

## Impact Analysis

### Scope
- **UI Impact**: Adds a dismissible banner/modal to all pages
- **Analytics Impact**: Modifies analytics tracking to respect user consent
- **Storage Impact**: Uses localStorage to persist user cookie preferences
- **Localization**: Needs translation keys for supported languages
- **Performance**: Minimal (lightweight component, no external dependencies beyond existing stack)

### User-Facing Changes
- New cookie consent banner on first visit
- Users can opt-in/out of non-essential cookies
- Banner appears on marketing pages and app (depending on implementation scope)

### Dependencies Affected
- `@kit/analytics` - Will respect cookie consent before tracking with PostHog
- `next-themes` - Cookie banner should match current theme
- `@kit/i18n` - Banner text should be internationalized
- **PostHog**: Analytics tracking pauses until consent given
- **Supabase Auth**: Auth cookies always required (essential), no consent needed

### Risk Assessment
- **Low Risk**: Isolated component, no breaking changes
  - Component is self-contained
  - Uses existing UI patterns from site (Tailwind, Shadcn colors)
  - localStorage is well-supported and reliable
  - PostHog already installed and configured
  - No database migrations required
- **Minimal Dependencies**: Only uses existing packages
- **No Breaking Changes**: Backwards compatible with existing features

### Backward Compatibility
- Existing code continues to work unchanged
- Analytics continue working (with consent for new users)
- No API changes or deprecations needed
- Old users without stored preference will see banner on first visit

## Pre-Chore Checklist
Before starting implementation:
- [ ] Create feature branch: `chore/cookie-consent-gdpr`
- [ ] Review PostHog setup to ensure consent tracking is possible
- [ ] Confirm supported languages for i18n
- [ ] Decide scope: marketing-only or entire app?
- [ ] Review existing Shadcn/UI components available (Dialog, Button, Alert, etc.)
- [ ] Verify localStorage API is available and working
- [ ] Check if geo-location detection is needed (EU vs non-EU users)

## Documentation Updates Required
- **Legal**: Update `/apps/web/app/(marketing)/(legal)/cookie-policy/page.tsx` with:
  - Specific list of cookies used (PostHog, Supabase, etc.)
  - Cookie purposes and retention periods
  - Link to cookie preferences
- **Privacy Policy**: Update to mention cookie consent and analytics opt-out
- **CLAUDE.md**: Add section on cookie consent implementation for future developers
- **README.md**: Document the new cookie consent feature in setup instructions
- **Code Comments**: Document cookie consent hook and component

## Rollback Plan

If issues occur:
1. **Disable Banner**: Remove CookieConsentBanner from root providers
2. **Revert localStorage**: Clear `window.localStorage.getItem('cookie-consent')`
3. **Resume Analytics**: Analytics provider will default to enabled if no preference stored
4. **Git Rollback**: `git revert <commit-hash>`

No database migrations or external service changes, so rollback is safe and simple.

## Step by Step Tasks

### 1. Research & Planning Phase

- [ ] **Review EU GDPR Requirements**
  - Understand required consent types (analytics, marketing, functional, essential)
  - Verify PostHog's privacy/GDPR documentation
  - Confirm Supabase auth cookies are "essential" (no consent needed)

- [ ] **Audit Existing Cookies**
  - List all cookies set by PostHog
  - List all cookies set by Supabase
  - List any other third-party cookies (themes, auth, etc.)
  - Document retention periods for each

- [ ] **Design System Review**
  - Document existing color palette (light/dark mode)
  - Identify Shadcn/UI components for banner (Dialog, Button, Checkbox, etc.)
  - Review typography and spacing patterns in `site-page-header.tsx`

### 2. Component Development Phase

- [ ] **Create Cookie Consent Hook** (`apps/web/lib/hooks/use-cookie-consent.ts`)
  - Manage localStorage for consent state: `{ analytics: boolean, marketing: boolean }`
  - Provide functions: `grantConsent()`, `denyConsent()`, `getConsent()`, `resetConsent()`
  - Auto-detect if user is in EU region (check PostHog IP or use library)
  - Return loading state for initial render

- [ ] **Create Cookie Consent Component** (`apps/web/components/cookie-consent-banner.tsx`)
  - Use Shadcn/UI components (Dialog or Alert for presentation)
  - Display only for EU users (or based on flag)
  - Include toggle switches for analytics and marketing
  - Match dark/light theme using `next-themes`
  - Show link to privacy/cookie policy pages
  - Store consent choice in localStorage on accept/deny
  - Dismiss on background click or close button

- [ ] **Create Translation Support**
  - Add i18n keys: `cookie-consent.title`, `cookie-consent.description`, `cookie-consent.analytics`, etc.
  - Create translation files for all supported languages
  - Use existing `@kit/i18n` patterns from codebase

### 3. Integration Phase

- [ ] **Integrate with Analytics Provider**
  - Modify `@kit/analytics` to check consent before sending PostHog events
  - Update `AnalyticsProvider` component to respect consent
  - Add consent check to PostHog initialization
  - Ensure page views aren't tracked until consent given

- [ ] **Add Banner to Root Providers**
  - Import CookieConsentBanner in `root-providers.tsx` or `layout.tsx`
  - Place banner at app root level so it appears on all pages
  - Ensure it renders after all other providers
  - Test banner appears on marketing pages and authenticated pages

- [ ] **Test with PostHog Dashboard**
  - Verify events are not sent before consent
  - Verify events are sent after consent granted
  - Check event payload includes consent flag
  - Confirm in PostHog dashboard that tracking respects preferences

### 4. Documentation Phase

- [ ] **Update Legal Pages**
  - Complete `/apps/web/app/(marketing)/(legal)/cookie-policy/page.tsx` with full content
  - Update `/apps/web/app/(marketing)/(legal)/privacy-policy/page.tsx` with consent info
  - Link to cookie preferences/revoke section

- [ ] **Update CLAUDE.md**
  - Document cookie consent implementation approach
  - Explain localStorage structure for preferences
  - Note how to modify banner display conditions

- [ ] **Code Documentation**
  - Add JSDoc comments to `use-cookie-consent` hook
  - Document component props and behavior
  - Add examples of how to use the hook

### 5. Testing Phase

- [ ] **Manual Testing**
  - Test banner appears on first visit
  - Test banner disappears after dismissal
  - Test dark/light mode toggle affects banner styling
  - Test localStorage persistence (reload page, preference saved)
  - Test analytics disabled until consent given
  - Test analytics enabled after consent granted
  - Test across browsers (Chrome, Firefox, Safari)

- [ ] **Internationalization Testing**
  - Test banner text in all supported languages
  - Verify translations load correctly
  - Test language switching works

- [ ] **GDPR Compliance Check**
  - Verify banner shows to EU users only (or based on config)
  - Verify "Accept All" vs granular consent options
  - Verify user can revoke consent easily
  - Verify no tracking happens before explicit consent
  - Test analytics opt-out link functionality

### 6. Validation Phase

Run these commands to validate the chore is complete with zero regressions.

## Validation Commands

Execute every command to validate the chore is complete with zero regressions.

```bash
# Type checking - ensure no TypeScript errors
pnpm typecheck

# Linting - check code quality
pnpm lint

# Format - verify code formatting
pnpm format

# Unit tests (if added)
pnpm test:unit

# Build the application
pnpm build

# Run E2E tests to ensure no regressions
pnpm test:e2e

# Verify PostHog events are tracked correctly
# Manual verification in PostHog dashboard:
# 1. Go to PostHog project
# 2. Check Events tab
# 3. Verify new events with consent flag are arriving
# 4. Test from incognito window (fresh user, should see banner)

# Check browser console for any errors
# Open DevTools → Console → Reload → Verify no console errors

# Verify localStorage persistence
# In DevTools → Application → Local Storage → Verify cookie-consent key exists
```

## Notes

### Design Consistency
The banner should follow SlideHeroes design patterns:
- Use Tailwind CSS classes from existing components (see `site-page-header.tsx` for reference)
- Match color palette: light theme white/gray, dark theme #0a0a0a background
- Use existing typography hierarchy
- Spacing should align with container max-width and padding

### GDPR Compliance Considerations
- **Explicit Consent**: Don't pre-check boxes (must be explicit opt-in)
- **Granular Control**: Allow users to select which types of cookies to allow
- **Easy Withdrawal**: Provide easy way to change preferences later
- **No Tracking Before Consent**: PostHog should not send events until consent given
- **Data Retention**: Respect GDPR 30/90-day data retention limits

### EU Detection Strategy
- Option 1: Use Vercel's geolocation headers (free, built-in)
- Option 2: Use PostHog's IP-based geolocation
- Option 3: Use user preference flag (let them choose)
- **Recommendation**: Start with Option 1 (Vercel headers) for simplicity

### LocalStorage Structure
```javascript
// Example cookie preference storage
{
  "cookie-consent": {
    "version": 1,
    "timestamp": 1705516800000,  // When consent was given
    "preferences": {
      "analytics": true,          // PostHog tracking
      "marketing": false,         // Marketing cookies (future)
    },
    "eu_user": true               // Was detected as EU user
  }
}
```

### Future Enhancements
- Add cookie preference management page (users can change settings)
- Add support for other cookie types (marketing, social media)
- Add banner animation/transition effects
- Add accessibility improvements (keyboard navigation, screen reader support)
- Integrate with CookieBot or OneTrust for enterprise needs
- Add analytics to track consent rates and preferences
