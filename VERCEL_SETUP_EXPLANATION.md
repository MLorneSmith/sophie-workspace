# Vercel Configuration Explanation

## Current Setup Analysis

### Problem Identified
- **Web project failing**: Looking for `.next/routes-manifest.json` but not finding it
- **Payload project succeeding**: Using root `vercel.json` with `--filter=payload`
- **Missing configuration**: Web project had no vercel.json file

### Solution Applied

#### Root vercel.json (Keep as is - for Payload project)
```json
{
  "buildCommand": "cd ../.. && turbo run build --filter=payload"
}
```
- ✅ **Don't change this** - it's working for your payload project
- Builds only the payload app and its dependencies
- Produces the correct artifacts for Payload CMS

#### New: apps/web/vercel.json (For Web project)
```json
{
  "buildCommand": "cd ../.. && turbo run build --filter=web",
  "devCommand": "cd ../.. && turbo run dev --filter=web", 
  "installCommand": "cd ../.. && pnpm install",
  "outputDirectory": ".next"
}
```

### Why This Works

1. **Separate Build Commands**: Each Vercel project now builds only its respective app
   - Web project: `--filter=web` → produces `.next/` with `routes-manifest.json`
   - Payload project: `--filter=payload` → produces payload build artifacts

2. **Turborepo Integration**: 
   - `cd ../..` navigates to repo root where `turbo.json` exists
   - `--filter=` ensures only the target app builds (with dependencies)
   - Leverages Turborepo's build optimization and caching

3. **Vercel Project Isolation**:
   - Each Vercel project looks for vercel.json in its configured root directory
   - Web project uses `apps/web/vercel.json`
   - Payload project uses root `vercel.json`

### Next Steps

1. **Deploy web project**: The new vercel.json should resolve the routes-manifest.json error
2. **Verify payload project**: Should continue working with existing root configuration
3. **Environment variables**: Ensure each project has its required env vars in Vercel dashboard

### Troubleshooting

If web project still fails:
- Check Vercel project settings → Root Directory is set to `apps/web`
- Verify build logs show `turbo run build --filter=web` command
- Ensure `.next/routes-manifest.json` appears in build output

The key insight: **Keep payload config unchanged, add web-specific config!**