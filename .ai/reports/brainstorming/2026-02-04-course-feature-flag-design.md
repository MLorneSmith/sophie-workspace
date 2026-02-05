# Course Feature Flag - Spec Input

**Date:** 2026-02-04
**Status:** Ready for `/alpha:spec`

## Summary

A feature flag system to hide all course-related UI and navigation during alpha testing, allowing testers to focus on the slide deck agentic workflow. Includes an admin toggle for runtime control without redeployment.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Flag Scope | Single `enable_courses` flag | Simpler for alpha - course and assessment are related content |
| Default Value | Disabled (`false`) | Safe for alpha testing - explicitly opt-in to show courses |
| Direct URL Behavior | Redirect to /home | Friendlier UX than 404 for bookmarked links |
| Marketing Footer | Hide course link | Consistent experience for alpha testers |
| Marketing Homepage | No changes | Aspirational content that doesn't affect testing focus |
| Toggle Location | New `/admin/settings` page | Scalable for future flags |
| Override Behavior | Database > Environment | Runtime control without redeployment |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Feature Flag Flow                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   Environment Variable          Database Config              │
│   NEXT_PUBLIC_ENABLE_COURSES    public.config.enable_courses │
│            │                           │                     │
│            └───────────┬───────────────┘                     │
│                        ▼                                     │
│              ┌─────────────────┐                             │
│              │  DB value set?  │                             │
│              └────────┬────────┘                             │
│                  yes/  \no                                   │
│                   ▼     ▼                                    │
│              Use DB   Use Env                                │
│                   \    /                                     │
│                    ▼  ▼                                      │
│              featureFlagsConfig.enableCourses                │
│                        │                                     │
│         ┌──────────────┼──────────────┐                      │
│         ▼              ▼              ▼                      │
│    Navigation      Routes        Footer                      │
│    (sidebar)    (redirect)     (hide link)                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Files to Create/Modify

| File | Change |
|------|--------|
| `apps/web/supabase/schemas/02-config.sql` | Add `enable_courses` column |
| `apps/web/config/feature-flags.config.ts` | Add flag with DB override logic |
| `apps/web/config/personal-account-navigation.config.tsx` | Conditional nav items |
| `apps/web/app/home/(user)/course/layout.tsx` | Create with redirect logic |
| `apps/web/app/home/(user)/assessment/layout.tsx` | Create with redirect logic |
| `apps/web/app/(marketing)/_components/site-footer.tsx` | Conditional course link |
| `apps/web/app/admin/settings/page.tsx` | New admin settings page |
| `apps/web/app/admin/_components/admin-sidebar.tsx` | Add Settings nav item |
| `.env.example` | Add `NEXT_PUBLIC_ENABLE_COURSES` |

## Spec Input

Copy the text below and run: `/alpha:spec Course Feature Flag`

---

```
Course Feature Flag

Hide all course-related UI and navigation during alpha testing to focus testers on the slide deck agentic workflow. Provides runtime control via admin toggle.

KEY CAPABILITIES:
1. Single feature flag (enable_courses) - Controls visibility of both course and assessment features with a single toggle, defaulting to disabled for alpha safety
2. Navigation hiding - Removes Course and Assessment links from personal account sidebar, mobile navigation, top menu, and marketing footer when flag is disabled
3. Route protection with redirect - Direct URL access to /home/course/* or /home/assessment/* redirects to /home dashboard (not 404) for friendlier UX
4. Admin settings page - New /admin/settings page with Feature Flags section containing toggle switch for runtime control
5. Database override pattern - Environment variable (NEXT_PUBLIC_ENABLE_COURSES) sets default, but database value (public.config.enable_courses) takes precedence when set, enabling runtime changes without redeployment

INTEGRATION POINTS:
- Extends existing public.config table (apps/web/supabase/schemas/02-config.sql)
- Follows existing feature flag pattern in feature-flags.config.ts
- Uses AdminGuard pattern for settings page protection
- Leverages Switch component from @kit/ui/switch for toggle UI

DATA MODEL:
- public.config.enable_courses (boolean, nullable) - null means use env var default
- Server action to update config value (admin only)

USER FLOW:
1. Alpha tester logs in → Course/Assessment links not visible in navigation
2. Tester tries direct URL /home/course → Redirected to /home dashboard
3. Admin visits /admin/settings → Sees Feature Flags section with enable_courses toggle
4. Admin toggles switch → Database updated, change takes effect immediately

CONSTRAINTS:
- Marketing homepage content unchanged (training sections remain as aspirational content)
- Only affects personal account navigation (course is not in team accounts)
- Flag default is false (disabled) for alpha safety

OUT OF SCOPE:
- Separate flags for course vs assessment (single flag suffices for alpha)
- Custom "Coming Soon" page (redirect is sufficient)
- Audit logging of flag changes (can add in v2)
- Conditional marketing homepage content
```

---

## Next Step

Run:
```bash
/alpha:spec Course Feature Flag
```

The spec command will interview you for remaining details (risks, personas, success metrics) and conduct research on the codebase and any external dependencies.
