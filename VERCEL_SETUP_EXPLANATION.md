# Vercel Configuration Explanation

## Current Setup Analysis

### Issues Fixed
1. **Missing Dependency**: Added `react-resizable-panels` to `packages/ui/package.json` to fix build error
2. **Inconsistent Structure**: Moved root `vercel.json` to `apps/payload/vercel.json` for consistency

### Solution Applied

#### apps/payload/vercel.json (For Payload project)
```json
{
  "buildCommand": "cd ../.. && turbo run build --filter=payload"
}
```
- Builds only the payload app and its dependencies
- Produces the correct artifacts for Payload CMS
- Now consistently located in the app directory

#### apps/web/vercel.json (For Web project)
```json
{
  "buildCommand": "cd ../.. && turbo run build --filter=web",
  "devCommand": "cd ../.. && turbo run dev --filter=web", 
  "installCommand": "cd ../.. && pnpm install",
  "outputDirectory": ".next"
}
```

### Why This Works

1. **Dependency Resolution**: 
   - Added `react-resizable-panels` to UI package where resizable components are defined
   - Resolves the import error in `editor-panel.tsx`

2. **Consistent Structure**: 
   - Both vercel.json files are now in their respective app directories
   - `apps/web/vercel.json` for web project
   - `apps/payload/vercel.json` for payload project

3. **Separate Build Commands**: Each Vercel project now builds only its respective app
   - Web project: `--filter=web` → produces `.next/` with `routes-manifest.json`
   - Payload project: `--filter=payload` → produces payload build artifacts

4. **Turborepo Integration**: 
   - `cd ../..` navigates to repo root where `turbo.json` exists
   - `--filter=` ensures only the target app builds (with dependencies)
   - Leverages Turborepo's build optimization and caching

5. **Vercel Project Isolation**:
   - Each Vercel project looks for vercel.json in its configured root directory
   - Web project uses `apps/web/vercel.json`
   - Payload project uses `apps/payload/vercel.json`

### Next Steps

1. **Install Dependencies**: Run `pnpm install` to install the new `react-resizable-panels` dependency
2. **Deploy both projects**: Both should now build successfully with consistent configurations
3. **Environment variables**: Ensure each project has its required env vars in Vercel dashboard

### Troubleshooting

If either project still fails:
- Check Vercel project settings → Root Directory is set correctly:
  - Web project: `apps/web`
  - Payload project: `apps/payload`
- Verify build logs show the correct `turbo run build --filter=` command
- Ensure dependencies are properly installed in the workspace

### File Structure Summary

```
/
├── apps/
│   ├── web/
│   │   └── vercel.json          # Web project config
│   └── payload/
│       └── vercel.json          # Payload project config
└── packages/
    └── ui/
        └── package.json         # Now includes react-resizable-panels
```

The key insight: **Consistent structure with app-specific configurations!**