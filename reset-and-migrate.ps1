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

cd ..

Write-Host "All migrations completed!" -ForegroundColor Green
Write-Host "You need to create a user account on first login to the Payload CMS admin panel." -ForegroundColor Green
