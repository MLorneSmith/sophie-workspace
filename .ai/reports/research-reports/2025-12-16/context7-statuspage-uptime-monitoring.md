# Context7 Research: Statuspage and Uptime Monitoring Solutions

**Date**: 2025-12-16
**Agent**: context7-expert
**Libraries Researched**: Uptime Kuma, Upptime, OpenStatus, OneUptime, Checkmate, Better Stack

## Query Summary

Researched open-source self-hosted statuspage and uptime monitoring solutions to evaluate build vs. buy decisions for SlideHeroes.

---

## Key Findings

### 1. Uptime Kuma (69,051 stars) - RECOMMENDED
- Most popular self-hosted monitoring solution
- 20+ monitor types, 90+ notification integrations
- Easy Docker deployment (2-4 hours setup)
- SQLite/PostgreSQL/MySQL support
- Public status pages with custom domains
- SSL certificate monitoring
- Real-time WebSocket updates

### 2. Upptime (16,069 stars) - ZERO COST
- GitHub Actions powered (no infrastructure)
- Status page on GitHub Pages
- Automatic incident creation via Issues
- Setup: 1-2 hours

### 3. OpenStatus (7,110 stars) - MODERN STACK
- Next.js/TypeScript
- Edge monitoring (Vercel Edge, Cloudflare Workers)
- OpenTelemetry integration
- React components for embedding
- Complex self-hosting requirements

### 4. OneUptime (5,685 stars) - ENTERPRISE
- Full observability platform (logs, metrics, traces)
- Kubernetes native deployment
- Heavy resource requirements
- Apache 2.0 license

### 5. Checkmate (8,105 stars) - SIMPLE
- Clean modern UI
- Good for internal networks
- Custom CA certificate support
- MongoDB/Redis backend

### 6. Better Stack (SaaS)
- Playwright-based synthetic monitoring
- Zero infrastructure management
- Paid service with free tier

---

## Health Check Patterns

### Next.js Health Endpoint

```typescript
// app/api/health/route.ts
export async function GET() {
  const checks = { database: { status: "fail" } };
  try {
    const client = getSupabaseServerClient();
    const { error } = await client.from("accounts").select("id").limit(1);
    checks.database = { status: error ? "fail" : "pass" };
  } catch (e) {
    checks.database = { status: "fail", message: e.message };
  }
  const healthy = Object.values(checks).every(c => c.status === "pass");
  return Response.json({
    status: healthy ? "healthy" : "unhealthy",
    checks,
    timestamp: new Date().toISOString()
  }, { status: healthy ? 200 : 503 });
}
```

### Supabase Health API

```
GET /v1/projects/{ref}/health

Response: {
  "auth": { "status": "ACTIVE_HEALTHY" },
  "database": { "status": "ACTIVE_HEALTHY" },
  "storage": { "status": "ACTIVE_HEALTHY" }
}
```

---

## Build vs Buy Analysis

### Custom Implementation Effort

| Component | Effort | Complexity |
|-----------|--------|------------|
| Health endpoints | 4-8 hours | Low |
| Basic status page UI | 8-16 hours | Medium |
| Multi-region monitoring | 16-24 hours | High |
| Notification system | 8-16 hours | Medium |
| Incident management | 16-24 hours | High |
| **Total Custom Build** | **60-100 hours** | High |

### Self-Hosted Comparison

| Tool | Setup | Maintenance | Best For |
|------|-------|-------------|----------|
| Uptime Kuma | 2-4h | Low | Small-medium teams |
| Upptime | 1-2h | Very Low | GitHub-native teams |
| OpenStatus | 4-8h | Medium | Modern stack teams |
| OneUptime | 8-16h | High | Full observability |
| Checkmate | 2-4h | Low | Internal networks |

---

## Recommendations for SlideHeroes

### MVP (8-10 hours total)

1. **Implement health endpoints** (4 hours)
   - `/api/health` for Next.js app
   - Database connectivity check

2. **Deploy Uptime Kuma** (2-4 hours)
   - Docker on existing infrastructure
   - Configure notifications

3. **Use built-in status page** (2 hours)
   - Custom domain: status.slideheroes.com

### Future Enhancements

- Upptime for zero-cost public status (GitHub Pages)
- Better Stack/Checkly for Playwright synthetic monitoring
- Custom status page if specific branding needed

---

## Key Takeaways

1. **Uptime Kuma is the best self-hosted option** - mature, feature-rich, low maintenance
2. **Upptime ideal for zero-cost monitoring** with minimal setup
3. **Health endpoints are essential** regardless of monitoring solution
4. **Start self-hosted, consider managed services** as needs grow
5. **Build custom only if** specific needs justify 60-100+ hours

---

## Sources

- Uptime Kuma via Context7 (louislam/uptime-kuma)
- Upptime via Context7 (upptime/upptime)
- OpenStatus via Context7 (openstatushq/openstatus)
- OneUptime via Context7 (oneuptime/oneuptime)
- Checkmate via Context7 (bluewave-labs/checkmate)
- Better Stack via Context7 (websites/betterstack_uptime)
- Next.js via Context7 (vercel/next.js)
- Supabase via Context7 (supabase/supabase)
