# PowerShell script to reset the database and run all migrations

Write-Host "Resetting Supabase database and running Web app migrations..." -ForegroundColor Cyan
cd apps/web
pnpm run supabase:reset
supabase migration up
cd ../..

Write-Host "Running Payload migrations..." -ForegroundColor Cyan
cd apps/payload

# Run all migrations using the updated index.ts file
Write-Host "  Running all migrations..." -ForegroundColor Yellow
pnpm payload migrate

cd ../..

# Run content migrations with fixed scripts
Write-Host "Running content migrations..." -ForegroundColor Cyan
cd packages/content-migrations

Write-Host "  Running fixed migration scripts..." -ForegroundColor Yellow
pnpm run migrate:all:direct:fixed

Write-Host "  Repairing all relationships..." -ForegroundColor Yellow
pnpm run repair:all-relationships

cd ..

Write-Host "All migrations completed!" -ForegroundColor Green
Write-Host "Admin user created with email: michael@slideheroes.com" -ForegroundColor Green
