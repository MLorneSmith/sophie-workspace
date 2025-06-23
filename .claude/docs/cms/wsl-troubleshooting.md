# WSL Troubleshooting for Content Migration

## Common WSL-Specific Issues

When running content migrations in Windows Subsystem for Linux (WSL), you may encounter specific issues related to the WSL environment. This document covers troubleshooting for WSL-specific problems.

### File Watching Issues

**Symptoms:**

- File watching not working properly
- Changes not being detected
- Slow response to file changes

**Solutions:**

1. Use the WSL-optimized startup script:

   ```bash
   ./apps/payload/start-wsl.sh
   ```

2. Set WSL-specific environment variables:

   ```bash
   export WATCHPACK_POLLING=true
   export CHOKIDAR_USEPOLLING=true
   export CHOKIDAR_INTERVAL=3000
   ```

3. For Next.js applications, disable features that slow down on WSL:

   ```bash
   export NEXT_DISABLE_SWC_WASM=1
   export NEXT_DISABLE_MINIFICATION=1
   ```

### Performance Issues

**Symptoms:**

- Extremely slow migration process
- High CPU usage
- Memory issues

**Solutions:**

1. Use the WSL-optimized migration script:

   ```powershell
   ./scripts/wsl/reset-and-migrate-wsl.ps1
   ```

2. Increase WSL memory allocation in `.wslconfig`:

   ```
   [wsl2]
   memory=8GB
   processors=4
   ```

3. Run migrations in smaller batches:

   ```powershell
   ./scripts/remote-migration/content/migrate-content-progressive.ps1 -SkipPosts -SkipDocumentation -SkipCourses
   ```

### Path Issues

**Symptoms:**

- File not found errors
- Path resolution problems
- Cross-filesystem issues

**Solutions:**

1. Use WSL-compatible paths:

   ```powershell
   $wslPath = wsl wslpath -a $windowsPath
   ```

2. For PowerShell scripts, use the WSL path converter:

   ```powershell
   function Convert-ToWslPath {
     param (
       [string]$WindowsPath
     )

     $wslPath = (wsl wslpath -a $WindowsPath).Trim()
     return $wslPath
   }
   ```

3. For persistent issues, run the path fix script:

   ```powershell
   ./scripts/wsl/fix-wsl-paths.ps1
   ```

### Database Connection Issues

**Symptoms:**

- Connection refused errors
- Timeout when connecting to PostgreSQL
- Authentication failures

**Solutions:**

1. Use localhost instead of 127.0.0.1:

   ```
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres
   ```

2. Check if PostgreSQL is running in WSL:

   ```bash
   sudo service postgresql status
   ```

3. For Supabase, use the WSL-specific connection:

   ```bash
   npx supabase start --wsl
   ```

## WSL-Specific Commands

### Starting Payload in WSL

Use the WSL-optimized startup script:

```bash
./apps/payload/start-wsl.sh
```

This script sets the necessary environment variables for optimal performance in WSL.

### Running Migrations in WSL

Use the WSL-specific migration script:

```powershell
./scripts/wsl/reset-and-migrate-wsl.ps1
```

This script includes WSL-specific optimizations and path handling.

### Fixing WSL Path Issues

Run the WSL path fix script:

```powershell
./scripts/wsl/fix-wsl-paths.ps1
```

This script corrects path issues in configuration files.

## Best Practices for WSL

1. **Use WSL 2**: Ensure you're using WSL 2 for better performance
2. **Store Files in Linux Filesystem**: Keep project files in the Linux filesystem for better performance
3. **Use WSL-Specific Scripts**: Use the provided WSL-specific scripts for better compatibility
4. **Increase Resource Allocation**: Allocate more memory and CPU to WSL for better performance
5. **Use Docker in WSL**: Run Docker in WSL mode for better integration
6. **Update WSL**: Keep WSL updated to the latest version
7. **Use VS Code Remote WSL**: Use VS Code's Remote WSL extension for better integration
