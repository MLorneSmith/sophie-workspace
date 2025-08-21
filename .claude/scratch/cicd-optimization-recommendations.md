# CI/CD Pipeline Optimization Recommendations

## Current Issues
1. Deploy to Dev workflow taking 8-13 minutes
2. Build failures due to TypeScript errors (now fixed)
3. Remote cache not enabled (signature key missing)

## Immediate Optimizations

### 1. Enable Turbo Remote Cache (HIGH IMPACT)
**Problem**: Warning about missing `TURBO_REMOTE_CACHE_SIGNATURE_KEY`
**Solution**: Add secret to GitHub repository
```bash
# Generate a signature key
openssl rand -base64 32

# Add to GitHub secrets as TURBO_REMOTE_CACHE_SIGNATURE_KEY
```
**Impact**: 50-70% faster builds on cache hits

### 2. Parallelize Deploy Jobs
**Current**: Sequential deployment of Web and Payload
**Optimization**: These can run in parallel since they're independent
```yaml
deploy-web:
  needs: [build]  # Remove dependency on each other
deploy-payload:
  needs: [build]  # Run simultaneously
```
**Impact**: Save 2-3 minutes per deployment

### 3. Optimize Runner Sizes
**Current**: Using 8cpu runners for all jobs
**Optimization**:
- Build: Keep 8cpu (CPU intensive)
- Deploy: Reduce to 4cpu (mostly I/O)
- Check-skip: Reduce to 2cpu (lightweight)
**Impact**: Faster runner allocation, cost savings

### 4. Implement Smart Caching
**Add caching for**:
- Playwright browsers (save 1-2 min)
- Vercel CLI cache
- Next.js cache between builds

### 5. Skip Redundant Steps
**Current**: E2E smoke tests commented out but still allocating runner
**Solution**: Remove or properly implement
**Impact**: Save runner allocation time

## Medium-term Optimizations

### 1. Implement Build Matrix
Split builds by package:
- Web app build
- Payload CMS build
- Packages build
Run in parallel, merge artifacts

### 2. Use Vercel Build API
Instead of building in GitHub Actions, use Vercel's build infrastructure:
```yaml
- name: Trigger Vercel Build
  uses: vercel/action@v25
  with:
    vercel-args: '--prod=false'
```

### 3. Implement Incremental Builds
Use Turbo's ability to skip unchanged packages:
```json
{
  "pipeline": {
    "build": {
      "outputs": ["dist/**", ".next/**"],
      "inputs": ["src/**", "package.json"]
    }
  }
}
```

## Performance Metrics to Track
1. Total pipeline time
2. Build cache hit rate
3. Time per job
4. Runner wait time
5. Deployment success rate

## Recommended Implementation Order
1. Add TURBO_REMOTE_CACHE_SIGNATURE_KEY (immediate)
2. Parallelize deploy jobs (quick win)
3. Optimize runner sizes (cost effective)
4. Implement proper caching (reliability)
5. Consider Vercel Build API (long-term)